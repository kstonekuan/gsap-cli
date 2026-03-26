import { parseArgs } from "node:util";
import { AnimationManager } from "./animation-manager.js";
import type { CommandContext } from "./commands.js";
import { BrowserRenderer } from "./renderers/browser.js";
import { TerminalRenderer } from "./renderers/terminal.js";
import type { Renderer } from "./renderers/types.js";
import { Scene } from "./scene.js";
import { startSocketServer } from "./server.js";
import { startTicker } from "./ticker.js";

const { values } = parseArgs({
	options: {
		mode: {
			type: "string",
			default: "browser",
		},
		port: {
			type: "string",
			default: "3000",
		},
	},
});

const mode = values.mode ?? "browser";
const port = Number.parseInt(values.port ?? "3000", 10);

async function main() {
	console.log(`[gsap-daemon] Starting in ${mode} mode...`);

	const scene = new Scene();
	const animationManager = new AnimationManager(scene);

	let renderer: Renderer;

	switch (mode) {
		case "terminal":
			renderer = new TerminalRenderer();
			break;
		case "browser":
			renderer = new BrowserRenderer(port);
			break;
		default:
			console.error(`Unknown mode: ${mode}. Use "terminal" or "browser".`);
			process.exit(1);
	}

	await renderer.start();

	const context: CommandContext = {
		scene,
		animationManager,
		renderer,
		mode,
		port,
		startTime: Date.now(),
	};

	startSocketServer(context);
	const stopTicker = startTicker(scene, renderer);

	console.log("[gsap-daemon] Ready. Waiting for commands...");

	// Keep process alive
	process.on("SIGINT", async () => {
		console.log("\n[gsap-daemon] Shutting down...");
		stopTicker();
		await renderer.stop();
		process.exit(0);
	});
}

main().catch((error) => {
	console.error("[gsap-daemon] Fatal error:", error);
	process.exit(1);
});
