import { parseArgs } from "node:util";
import { AnimationManager } from "./animation-manager.js";
import type { CommandContext } from "./commands.js";
import { BrowserRenderer } from "./renderers/browser.js";
import { Scene } from "./scene.js";
import { startSocketServer } from "./server.js";

const { values } = parseArgs({
	options: {
		port: {
			type: "string",
			default: "3000",
		},
	},
});

const port = Number.parseInt(values.port ?? "3000", 10);

async function main() {
	console.log("[gsap-daemon] Starting...");

	const scene = new Scene();
	const animationManager = new AnimationManager(scene);
	const renderer = new BrowserRenderer(port);

	await renderer.start();

	const context: CommandContext = {
		scene,
		animationManager,
		renderer,
		port,
		startTime: Date.now(),
	};

	startSocketServer(context);

	console.log("[gsap-daemon] Ready. Waiting for commands...");

	process.on("SIGINT", async () => {
		console.log("\n[gsap-daemon] Shutting down...");
		await renderer.stop();
		process.exit(0);
	});
}

main().catch((error) => {
	console.error("[gsap-daemon] Fatal error:", error);
	process.exit(1);
});
