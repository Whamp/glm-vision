/**
 * Integration tests for GLM Image Summary Extension
 *
 * These tests actually spawn pi with glm-4.6v and verify real image analysis.
 * They are slow and consume API credits, so run them purposefully:
 *
 *   npm run test:integration
 *
 * Prerequisites:
 * - ZAI_API_KEY environment variable set
 * - Sample images in test-fixtures/ directory (see README)
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { extractTextFromPiOutput } from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = resolvePath(__dirname, "../test-fixtures");

// Embedded analysis prompt (same as in index.ts)
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

// Expected categories for each test image
const TEST_IMAGES: Record<string, { file: string; expectedCategory: string; keywords: string[] }> = {
	"ui-screenshot": {
		file: "ui-screenshot.png",
		expectedCategory: "ui-screenshot",
		keywords: ["dashboard", "sidebar", "users", "revenue", "analytics", "search", "traffic", "activity"],
	},
	"code-screenshot": {
		file: "code-screenshot.png",
		expectedCategory: "code-screenshot",
		keywords: ["import", "interface", "async", "function", "await", "try", "catch", "typescript"],
	},
	"error-screenshot": {
		file: "error-screenshot.png",
		expectedCategory: "error-screenshot",
		keywords: ["typeerror", "undefined", "map", "processdata", "stack", "webpack", "npm", "build"],
	},
	diagram: {
		file: "diagram.png",
		expectedCategory: "diagram",
		keywords: ["gateway", "service", "database", "rest", "grpc", "queue", "auth", "user"],
	},
	chart: {
		file: "chart.png",
		expectedCategory: "chart",
		keywords: ["revenue", "monthly", "2025", "bar", "trend", "thousands", "jan", "dec"],
	},
	general: {
		file: "general.png",
		expectedCategory: "general",
		keywords: ["desk", "laptop", "workspace", "plant", "mug", "books", "notebook", "wooden"],
	},
};

/**
 * Spawn pi with glm-4.6v to analyze an image
 */
async function analyzeImageWithPi(imagePath: string, useStructuredPrompt = false): Promise<string> {
	return new Promise((resolvePromise, reject) => {
		const args = [
			`@${imagePath}`,
			"--provider",
			"zai",
			"--model",
			"glm-4.6v",
			"-p",
			useStructuredPrompt ? ANALYSIS_PROMPT : "Analyze this image comprehensively.",
			"--json",
			"--print",
			"--no-extensions",
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

		child.on("error", reject);

		child.on("close", (code) => {
			if (code !== 0) {
				reject(new Error(`pi failed (${code}): ${stderr}`));
			} else {
				resolvePromise(extractTextFromPiOutput(stdout.trim()));
			}
		});
	});
}

/**
 * Extract category from response
 */
function extractCategory(response: string): string | null {
	// Match **Category**: value or Category: value
	const match = response.match(/\*?\*?Category\*?\*?:\s*(\S+)/i);
	return match ? match[1].toLowerCase().replace(/[^a-z-]/g, "") : null;
}

/**
 * Check if response contains expected keywords
 */
function containsKeywords(response: string, keywords: string[]): boolean {
	const lowerResponse = response.toLowerCase();
	return keywords.some((kw) => lowerResponse.includes(kw.toLowerCase()));
}

describe("Integration: Generic prompt (baseline)", () => {
	beforeAll(() => {
		if (!process.env.ZAI_API_KEY) {
			throw new Error("ZAI_API_KEY environment variable required for integration tests");
		}
	});

	for (const [category, config] of Object.entries(TEST_IMAGES)) {
		const imagePath = resolvePath(FIXTURES_DIR, config.file);

		it.skipIf(!existsSync(imagePath))(`analyzes ${category} image and returns relevant content`, async () => {
			const response = await analyzeImageWithPi(imagePath, false);

			expect(response.length).toBeGreaterThan(100);
			expect(containsKeywords(response, config.keywords)).toBe(true);

			// Log for manual inspection
			console.log(`\n=== ${category} ===`);
			console.log(`Response length: ${response.length}`);
			console.log(`First 500 chars: ${response.slice(0, 500)}...`);
		});
	}
});

describe("Integration: Structured prompt (with classification)", () => {
	beforeAll(() => {
		if (!process.env.ZAI_API_KEY) {
			throw new Error("ZAI_API_KEY environment variable required for integration tests");
		}
	});

	for (const [category, config] of Object.entries(TEST_IMAGES)) {
		const imagePath = resolvePath(FIXTURES_DIR, config.file);

		it.skipIf(!existsSync(imagePath))(
			`correctly classifies ${category} image and provides specialized analysis`,
			async () => {
				const response = await analyzeImageWithPi(imagePath, true);

				// Verify category is stated
				const detectedCategory = extractCategory(response);
				console.log(`\n=== ${category} (structured) ===`);
				console.log(`Detected category: ${detectedCategory}`);
				console.log(`Expected category: ${config.expectedCategory}`);
				console.log(`Response length: ${response.length}`);
				console.log(`First 500 chars: ${response.slice(0, 500)}...`);

				// Basic assertions
				expect(response.length).toBeGreaterThan(100);
				expect(containsKeywords(response, config.keywords)).toBe(true);

				// Category should be detected
				expect(detectedCategory).not.toBeNull();

				// Category should match expected
				expect(detectedCategory).toBe(config.expectedCategory);
			},
		);
	}
});
