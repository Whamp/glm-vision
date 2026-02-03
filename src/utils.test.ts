import { describe, expect, it } from "vitest";
import {
	extractTextFromPiOutput,
	isImageFile,
	NON_VISION_MODELS,
	needsVisionProxy,
	SUPPORTED_IMAGE_EXTENSIONS,
} from "./utils.js";

describe("isImageFile", () => {
	it("returns true for supported image extensions", () => {
		const testCases = ["photo.jpg", "photo.jpeg", "screenshot.png", "animation.gif", "modern.webp"];
		for (const path of testCases) {
			expect(isImageFile(path), `Expected ${path} to be recognized as image`).toBe(true);
		}
	});

	it("returns true for uppercase extensions", () => {
		expect(isImageFile("photo.JPG")).toBe(true);
		expect(isImageFile("photo.PNG")).toBe(true);
		expect(isImageFile("photo.JPEG")).toBe(true);
	});

	it("returns true for mixed case extensions", () => {
		expect(isImageFile("photo.JpG")).toBe(true);
		expect(isImageFile("photo.Png")).toBe(true);
	});

	it("returns false for non-image extensions", () => {
		const testCases = ["document.pdf", "script.ts", "data.json", "readme.md", "video.mp4", "audio.mp3"];
		for (const path of testCases) {
			expect(isImageFile(path), `Expected ${path} to NOT be recognized as image`).toBe(false);
		}
	});

	it("returns false for files without extension", () => {
		expect(isImageFile("Makefile")).toBe(false);
		expect(isImageFile("README")).toBe(false);
	});

	it("handles paths with directories", () => {
		expect(isImageFile("/home/user/photos/image.png")).toBe(true);
		expect(isImageFile("./relative/path/to/file.jpg")).toBe(true);
		expect(isImageFile("../parent/dir/doc.pdf")).toBe(false);
	});

	it("handles paths with dots in directory names", () => {
		expect(isImageFile("/path/to/.hidden/image.png")).toBe(true);
		expect(isImageFile("/path/to/v1.2.3/screenshot.jpg")).toBe(true);
	});

	it("handles empty string", () => {
		expect(isImageFile("")).toBe(false);
	});

	it("covers all documented supported extensions", () => {
		const expected = ["jpg", "jpeg", "png", "gif", "webp"];
		expect(SUPPORTED_IMAGE_EXTENSIONS).toEqual(expected);
	});
});

describe("needsVisionProxy", () => {
	it("returns true for non-vision GLM models", () => {
		expect(needsVisionProxy("glm-4.6")).toBe(true);
		expect(needsVisionProxy("glm-4.7")).toBe(true);
		expect(needsVisionProxy("glm-4.7-flash")).toBe(true);
	});

	it("returns false for vision models", () => {
		expect(needsVisionProxy("glm-4.6v")).toBe(false);
		expect(needsVisionProxy("glm-4.5v")).toBe(false);
	});

	it("returns false for non-GLM models", () => {
		expect(needsVisionProxy("claude-sonnet-4-20250514")).toBe(false);
		expect(needsVisionProxy("gpt-4o")).toBe(false);
		expect(needsVisionProxy("gemini-2.5-flash")).toBe(false);
	});

	it("returns false for undefined model", () => {
		expect(needsVisionProxy(undefined)).toBe(false);
	});

	it("covers all documented non-vision models", () => {
		const expected = ["glm-4.6", "glm-4.7", "glm-4.7-flash"];
		expect(NON_VISION_MODELS).toEqual(expected);
	});
});

describe("extractTextFromPiOutput", () => {
	it("extracts text from valid pi JSON output", () => {
		const jsonOutput = JSON.stringify({
			messages: [
				{ role: "user", content: [{ type: "text", text: "Analyze this image" }] },
				{ role: "assistant", content: [{ type: "text", text: "This is an analysis" }] },
			],
		});
		expect(extractTextFromPiOutput(jsonOutput)).toBe("This is an analysis");
	});

	it("joins multiple text blocks with newlines", () => {
		const jsonOutput = JSON.stringify({
			messages: [
				{
					role: "assistant",
					content: [
						{ type: "text", text: "First paragraph" },
						{ type: "text", text: "Second paragraph" },
					],
				},
			],
		});
		expect(extractTextFromPiOutput(jsonOutput)).toBe("First paragraph\nSecond paragraph");
	});

	it("filters out non-text content blocks", () => {
		const jsonOutput = JSON.stringify({
			messages: [
				{
					role: "assistant",
					content: [
						{ type: "text", text: "Text content" },
						{ type: "image", source: { type: "base64", data: "..." } },
						{ type: "text", text: "More text" },
					],
				},
			],
		});
		expect(extractTextFromPiOutput(jsonOutput)).toBe("Text content\nMore text");
	});

	it("returns last assistant message when multiple exist", () => {
		const jsonOutput = JSON.stringify({
			messages: [
				{ role: "assistant", content: [{ type: "text", text: "First response" }] },
				{ role: "user", content: [{ type: "text", text: "Follow up" }] },
				{ role: "assistant", content: [{ type: "text", text: "Final response" }] },
			],
		});
		expect(extractTextFromPiOutput(jsonOutput)).toBe("Final response");
	});

	it("returns raw output if not valid JSON", () => {
		const plainText = "This is plain text output";
		expect(extractTextFromPiOutput(plainText)).toBe(plainText);
	});

	it("returns raw output if JSON has no messages", () => {
		const jsonOutput = JSON.stringify({ someOtherField: "value" });
		expect(extractTextFromPiOutput(jsonOutput)).toBe(jsonOutput);
	});

	it("returns raw output if messages is empty", () => {
		const jsonOutput = JSON.stringify({ messages: [] });
		expect(extractTextFromPiOutput(jsonOutput)).toBe(jsonOutput);
	});

	it("returns raw output if no assistant message", () => {
		const jsonOutput = JSON.stringify({
			messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
		});
		expect(extractTextFromPiOutput(jsonOutput)).toBe(jsonOutput);
	});

	it("handles assistant message with no content", () => {
		const jsonOutput = JSON.stringify({
			messages: [{ role: "assistant" }],
		});
		expect(extractTextFromPiOutput(jsonOutput)).toBe(jsonOutput);
	});

	it("handles content blocks with missing text field", () => {
		const jsonOutput = JSON.stringify({
			messages: [
				{
					role: "assistant",
					content: [{ type: "text" }, { type: "text", text: "Valid text" }],
				},
			],
		});
		expect(extractTextFromPiOutput(jsonOutput)).toBe("\nValid text");
	});

	it("handles empty string input", () => {
		expect(extractTextFromPiOutput("")).toBe("");
	});
});
