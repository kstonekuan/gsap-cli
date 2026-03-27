import { cpSync, rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });

const result = await Bun.build({
	entrypoints: ["src/index.ts"],
	outdir: "dist",
	target: "bun",
	format: "esm",
	sourcemap: "linked",
});

if (!result.success) {
	console.error("Build failed:");
	for (const log of result.logs) {
		console.error(log);
	}
	process.exit(1);
}

cpSync("src/renderers/browser", "dist/browser", { recursive: true });

console.log("Build complete: dist/index.js + dist/browser/");
