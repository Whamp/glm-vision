import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/**/*.integration.test.ts"],
		testTimeout: 120000, // 2 minutes per test - API calls can be slow
	},
});
