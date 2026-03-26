import { cpSync } from "node:fs";
import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	target: "node22",
	outDir: "dist",
	clean: true,
	sourcemap: true,
	dts: false,
	banner: {
		js: "#!/usr/bin/env node",
	},
	onSuccess: async () => {
		// Copy browser static assets alongside the bundled output
		cpSync("src/renderers/browser", "dist/browser", { recursive: true });
	},
});
