import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Server, ServerWebSocket } from "bun";
import type { Scene } from "../scene.js";
import type { Renderer } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIME_TYPES: Record<string, string> = {
	"/": "text/html",
	"/client.js": "application/javascript",
	"/styles.css": "text/css",
};

const FILE_NAMES: Record<string, string> = {
	"/": "index.html",
	"/client.js": "client.js",
	"/styles.css": "styles.css",
};

export class BrowserRenderer implements Renderer {
	private port: number;
	private server: Server<undefined> | null = null;
	private clients = new Set<ServerWebSocket<undefined>>();
	private lastScene: Scene | null = null;

	constructor(port = 3000) {
		this.port = port;
	}

	async start(): Promise<void> {
		const browserDir = join(__dirname, "browser");
		const renderer = this;

		this.server = Bun.serve({
			port: this.port,
			hostname: "0.0.0.0",

			fetch(request, server) {
				const url = new URL(request.url);

				// Upgrade WebSocket requests
				if (server.upgrade(request)) {
					return undefined;
				}

				const mimeType = MIME_TYPES[url.pathname];
				const fileName = FILE_NAMES[url.pathname];

				if (mimeType && fileName) {
					const content = readFileSync(join(browserDir, fileName), "utf-8");
					return new Response(content, {
						headers: { "Content-Type": mimeType },
					});
				}

				return new Response("Not Found", { status: 404 });
			},

			websocket: {
				open(ws) {
					renderer.clients.add(ws);
					console.log(
						`[browser renderer] Client connected (total: ${renderer.clients.size})`,
					);

					// Send current scene state so the new client renders the existing scene
					if (renderer.lastScene) {
						ws.send(
							JSON.stringify({
								type: "scene.sync",
								elements: renderer.lastScene.getAllSerializable(),
							}),
						);
					}
				},
				close(ws) {
					renderer.clients.delete(ws);
					console.log(
						`[browser renderer] Client disconnected (total: ${renderer.clients.size})`,
					);
				},
				message() {
					// Browser clients don't send messages we need to handle
				},
			},
		});

		const url = `http://localhost:${this.port}`;
		console.log(`[browser renderer] Serving at ${url}`);

		openBrowser(url);
	}

	async stop(): Promise<void> {
		for (const client of this.clients) {
			client.close();
		}
		this.clients.clear();
		this.server?.stop();
	}

	onSceneChange(scene: Scene): void {
		this.lastScene = scene;
		const syncCommand = {
			type: "scene.sync",
			elements: scene.getAllSerializable(),
		};
		this.broadcast(syncCommand);
	}

	/** Forward a raw command to browser clients for native GSAP execution */
	forwardCommand(command: unknown): void {
		const forwardMessage = {
			type: "command",
			command,
		};
		this.broadcast(forwardMessage);
	}

	private broadcast(data: unknown): void {
		const message = JSON.stringify(data);
		for (const client of this.clients) {
			client.send(message);
		}
	}
}

function openBrowser(url: string): void {
	const platform = process.platform;
	const command =
		platform === "darwin"
			? "open"
			: platform === "win32"
				? "start"
				: "xdg-open";

	Bun.spawn([command, url], {
		stderr: "ignore",
		stdout: "ignore",
		onExit(_proc, exitCode) {
			if (exitCode !== 0) {
				console.log(
					`[browser renderer] Could not auto-open browser. Visit ${url} manually.`,
				);
			}
		},
	});
}
