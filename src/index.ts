/**
 * GLM Image Summary Extension
 *
 * When using non-vision GLM models (glm-4.6, glm-4.7, glm-4.7-flash), this
 * extension intercepts image reads and sends them to glm-4.6v for detailed
 * analysis using a subprocess with specialized prompts.
 *
 * Usage:
 *   pi -e npm:pi-glm-image-summary --provider zai --model glm-4.7
 *
 * The extension will:
 * 1. Detect when a non-vision GLM model is being used
 * 2. Check if the file being read is an image
 * 3. Call pi subprocess with glm-4.6v to analyze the image
 * 4. Return the categorized analysis to the current model
 */

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { BorderedLoader, createReadTool } from "@mariozechner/pi-coding-agent";
import { extractTextFromPiOutput, isImageFile, needsVisionProxy, VISION_MODEL, VISION_PROVIDER } from "./utils.js";

// Embedded skill prompt for GLM-4.6v
const ANALYSIS_PROMPT = `You are analyzing an image. Follow these steps:

## Step 1: Classify

First, identify what type of image this is and state your classification:

**Category**: [one of: ui-screenshot, code-screenshot, error-screenshot, diagram, chart, general]

Categories:
- ui-screenshot — Web or mobile interface (buttons, forms, navigation, dashboard)
- code-screenshot — Source code visible in editor or terminal
- error-screenshot — Error message, stack trace, terminal error, build failure
- diagram — Architecture, flowchart, UML, ER, sequence diagram, system design
- chart — Data visualization (bar chart, line graph, pie chart, dashboard metrics)
- general — Photo, logo, illustration, or anything else

## Step 2: Analyze

Based on your classification, provide the appropriate analysis:

### For ui-screenshot:
- Describe the layout structure (sidebar, header, main content, footer)
- List all visible UI components (buttons, forms, cards, tables, navigation)
- Note the color scheme and visual style
- Extract all visible text (labels, buttons, headings, data values)
- Identify interactive elements and their likely functionality

### For code-screenshot:
- Identify the programming language
- Extract the complete code with 100% accuracy
- Preserve exact indentation and formatting
- Include line numbers if visible
- Note any imports, function definitions, or key patterns
- Output the code in a properly formatted code block

### For error-screenshot:
- Identify the error type (syntax, runtime, build, network, etc.)
- Extract the exact error message
- Analyze the stack trace if present (file paths, line numbers, function names)
- Identify the root cause
- Suggest a fix with code examples if applicable

### For diagram:
- Identify the diagram type (architecture, flowchart, UML, ER, sequence, etc.)
- List all components/nodes shown
- Describe relationships and connections between elements
- Explain the data flow or structure depicted
- Note any labels, protocols, or annotations

### For chart:
- Identify the chart type (bar, line, pie, scatter, combination, etc.)
- Extract the title, axis labels, and legend
- Describe the data ranges and values
- Identify trends, patterns, or anomalies
- Summarize the key insights from the data

### For general:
- Describe the primary subject
- List all visible objects and elements
- Note colors, composition, and style
- Describe the mood or context
- Highlight notable or interesting features

## Output Format

Always start your response with:

**Category**: [category-name]

Then provide your detailed analysis using the appropriate template above.`;

interface AnalyzeImageOptions {
	absolutePath: string;
	signal?: AbortSignal;
}

async function analyzeImage({ absolutePath, signal }: AnalyzeImageOptions): Promise<string> {
	return new Promise((resolvePromise, reject) => {
		const args = [
			`@${absolutePath}`,
			"--provider",
			VISION_PROVIDER,
			"--model",
			VISION_MODEL,
			"--print",
			"--json",
			"--no-extensions",
			"-p",
			ANALYSIS_PROMPT,
		];

		const child = spawn("pi", args, {
			stdio: ["ignore", "pipe", "pipe"],
			env: process.env,
		});

		let stdout = "";
		let stderr = "";

		child.stdout.on("data", (data: Buffer) => {
			stdout += data.toString();
		});

		child.stderr.on("data", (data: Buffer) => {
			stderr += data.toString();
		});

		child.on("error", (err: Error) => {
			reject(err);
		});

		child.on("close", (code: number | null) => {
			if (code !== 0) {
				reject(new Error(`pi subprocess failed (${code}): ${stderr}`));
			} else {
				resolvePromise(extractTextFromPiOutput(stdout.trim()));
			}
		});

		if (signal) {
			const onAbort = () => {
				child.kill();
				reject(new Error("Operation aborted"));
			};
			signal.addEventListener("abort", onAbort, { once: true });
			child.on("close", () => {
				signal.removeEventListener("abort", onAbort);
			});
		}
	});
}

export default function (pi: ExtensionAPI) {
	const localRead = createReadTool(process.cwd());

	// Override the read tool to intercept image reads for non-vision models
	pi.registerTool({
		...localRead,
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const { path } = params;
			const absolutePath = resolve(ctx.cwd, path);

			// Check if we need to proxy through vision model
			if (!needsVisionProxy(ctx.model?.id) || !isImageFile(absolutePath)) {
				return localRead.execute(toolCallId, params, signal, onUpdate);
			}

			// Analyze image with vision model
			onUpdate?.({
				content: [{ type: "text", text: `[Analyzing image with ${VISION_MODEL}...]` }],
				details: {},
			});

			try {
				const summaryText = await analyzeImage({ absolutePath, signal });

				if (signal?.aborted) {
					throw new Error("Operation aborted");
				}

				const result = {
					content: [{ type: "text" as const, text: `[Image analyzed with ${VISION_MODEL}]\n\n${summaryText}` }],
					details: {},
				};

				onUpdate?.(result);
				return result;
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				throw new Error(`Image analysis failed: ${message}`);
			}
		},
	});

	// Command for manual image analysis
	pi.registerCommand("analyze-image", {
		description: `Analyze an image file using ${VISION_MODEL}`,
		handler: async (args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("analyze-image requires interactive mode", "error");
				return;
			}

			const imagePath = args.trim();
			if (!imagePath) {
				ctx.ui.notify("Usage: /analyze-image <path-to-image>", "error");
				return;
			}

			const absolutePath = resolve(ctx.cwd, imagePath);

			if (!isImageFile(absolutePath)) {
				ctx.ui.notify("Not a supported image file", "error");
				return;
			}

			const result = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
				const loader = new BorderedLoader(tui, theme, `Analyzing ${imagePath}...`);
				loader.onAbort = () => done(null);

				analyzeImage({ absolutePath, signal: loader.signal })
					.then((text) => done(text))
					.catch((err) => {
						ctx.ui.notify(`Analysis failed: ${err.message}`, "error");
						done(null);
					});

				return loader;
			});

			if (result === null) {
				ctx.ui.notify("Cancelled", "info");
				return;
			}

			await ctx.ui.editor("Image Analysis", result);
		},
	});
}
