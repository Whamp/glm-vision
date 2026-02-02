/**
 * GLM Image Summary Extension
 *
 * When using non-vision GLM models (glm-4.6, glm-4.7, glm-4.7-flash), this
 * extension intercepts image reads and sends them to glm-4.6v for detailed
 * analysis using a subprocess. This provides better image understanding since
 * glm-4.6v has stronger vision capabilities.
 *
 * Usage:
 *   pi -e npm:pi-glm-image-summary --provider zai --model glm-4.7
 *
 * The extension will:
 * 1. Detect when a non-vision GLM model is being used
 * 2. Check if the file being read is an image
 * 3. Call pi subprocess with glm-4.6v to analyze the image
 * 4. Return the summary text to the current model
 */

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { BorderedLoader, createReadTool } from "@mariozechner/pi-coding-agent";

// Configuration
const VISION_PROVIDER = "zai";
const VISION_MODEL = "glm-4.6v";
const NON_VISION_MODELS = ["glm-4.6", "glm-4.7", "glm-4.7-flash"];
const SUPPORTED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

const SUMMARY_PROMPT = `Please analyze this image comprehensively. Extract ALL information from the image including:

1. **Overall Description**: What type of content is this? (screenshot, diagram, document, photograph, UI, code, etc.)
2. **Text Content**: ALL visible text in the image, preserving structure and formatting. Include labels, buttons, error messages, file paths, code snippets, etc. Be exhaustive.
3. **Visual Elements**: Colors, layout, components, icons, graphical elements
4. **Technical Details**: For code, UI, diagrams - include exact values, class names, IDs, parameters, configurations
5. **Contextual Information**: Window titles, terminal prompts, file names, timestamps, status indicators
6. **Structure**: How elements are organized, relationships between components
7. **Actionable Information**: Any visible commands, settings, configurations, or parameters that could be useful

Format your response clearly with sections and bullet points. Be extremely thorough - the user needs to understand everything visible in this image to perform their task.`;

// Types for pi JSON output
interface PiMessage {
	role: string;
	content?: PiContentBlock[];
}

interface PiContentBlock {
	type: string;
	text?: string;
}

interface PiJsonOutput {
	messages?: PiMessage[];
}

function isImageFile(path: string): boolean {
	const ext = path.split(".").pop()?.toLowerCase();
	return ext !== undefined && SUPPORTED_IMAGE_EXTENSIONS.includes(ext);
}

function extractTextFromPiOutput(output: string): string {
	try {
		const json: PiJsonOutput = JSON.parse(output);
		if (json.messages && Array.isArray(json.messages)) {
			const assistantMsg = json.messages.findLast((m: PiMessage) => m.role === "assistant");
			if (assistantMsg?.content) {
				return assistantMsg.content
					.filter((c: PiContentBlock) => c.type === "text")
					.map((c: PiContentBlock) => c.text ?? "")
					.join("\n");
			}
		}
	} catch {
		// Not JSON, return as-is
	}
	return output;
}

interface AnalyzeImageOptions {
	absolutePath: string;
	signal?: AbortSignal;
}

async function analyzeImage({ absolutePath, signal }: AnalyzeImageOptions): Promise<string> {
	return new Promise((resolve, reject) => {
		const args = [
			`@${absolutePath}`,
			"--provider",
			VISION_PROVIDER,
			"--model",
			VISION_MODEL,
			"-p",
			SUMMARY_PROMPT,
			"--json",
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
				resolve(extractTextFromPiOutput(stdout.trim()));
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
			const needsVisionProxy = ctx.model?.id && NON_VISION_MODELS.includes(ctx.model.id);
			if (!needsVisionProxy || !isImageFile(absolutePath)) {
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
