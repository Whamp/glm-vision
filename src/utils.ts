/**
 * Utility functions for GLM Image Summary Extension
 * Extracted for testability
 */

// Configuration
export const VISION_PROVIDER = "zai";
export const VISION_MODEL = "glm-4.6v";
export const NON_VISION_MODELS = ["glm-4.6", "glm-4.7", "glm-4.7-flash"];
export const SUPPORTED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

// Types for pi JSON output
export interface PiMessage {
	role: string;
	content?: PiContentBlock[];
}

export interface PiContentBlock {
	type: string;
	text?: string;
}

export interface PiJsonOutput {
	messages?: PiMessage[];
}

/**
 * Check if a file path points to a supported image file
 */
export function isImageFile(path: string): boolean {
	const ext = path.split(".").pop()?.toLowerCase();
	return ext !== undefined && SUPPORTED_IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Check if a model ID is a non-vision GLM model that needs vision proxy
 */
export function needsVisionProxy(modelId: string | undefined): boolean {
	return modelId !== undefined && NON_VISION_MODELS.includes(modelId);
}

/**
 * Extract text content from pi JSON output
 * Falls back to returning the raw output if not valid JSON
 */
export function extractTextFromPiOutput(output: string): string {
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
