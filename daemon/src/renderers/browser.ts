import { exec } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import fastify from "fastify";
import { type WebSocket, WebSocketServer } from "ws";
import type { Scene } from "../scene.js";
import type { Renderer } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export class BrowserRenderer implements Renderer {
	private port: number;
	private app = fastify();
	private webSocketServer: WebSocketServer | null = null;
	private clients = new Set<WebSocket>();
	private pendingCommands: unknown[] = [];

	constructor(port = 3000) {
		this.port = port;
	}

	async start(): Promise<void> {
		const browserDir = join(__dirname, "browser");

		this.app.get("/", (_request, reply) => {
			reply
				.type("text/html")
				.send(readFileSync(join(browserDir, "index.html"), "utf-8"));
		});

		this.app.get("/client.js", (_request, reply) => {
			reply
				.type("application/javascript")
				.send(readFileSync(join(browserDir, "client.js"), "utf-8"));
		});

		this.app.get("/styles.css", (_request, reply) => {
			reply
				.type("text/css")
				.send(readFileSync(join(browserDir, "styles.css"), "utf-8"));
		});

		// Get the underlying Node http server after listen
		await this.app.listen({ port: this.port, host: "0.0.0.0" });

		const httpServer = this.app.server;
		this.webSocketServer = new WebSocketServer({ server: httpServer });

		this.webSocketServer.on("connection", (ws) => {
			this.clients.add(ws);
			console.log(
				`[browser renderer] Client connected (total: ${this.clients.size})`,
			);

			// Send any pending commands to new client
			for (const cmd of this.pendingCommands) {
				ws.send(JSON.stringify(cmd));
			}

			ws.on("close", () => {
				this.clients.delete(ws);
				console.log(
					`[browser renderer] Client disconnected (total: ${this.clients.size})`,
				);
			});
		});

		const url = `http://localhost:${this.port}`;
		console.log(`[browser renderer] Serving at ${url}`);

		// Auto-open browser
		openBrowser(url);
	}

	async stop(): Promise<void> {
		for (const client of this.clients) {
			client.close();
		}
		this.clients.clear();
		await this.app.close();
	}

	onSceneChange(scene: Scene): void {
		const syncCommand = {
			type: "scene.sync",
			elements: scene.getAll(),
		};
		this.broadcast(syncCommand);
	}

	onTick(scene: Scene): void {
		const tickCommand = {
			type: "scene.tick",
			elements: scene.getAll(),
		};
		this.broadcast(tickCommand);
	}

	/** Forward a raw command to browser clients for native GSAP execution */
	forwardCommand(command: unknown): void {
		const forwardMessage = {
			type: "command",
			command,
		};
		this.pendingCommands.push(forwardMessage);
		this.broadcast(forwardMessage);
	}

	private broadcast(data: unknown): void {
		const message = JSON.stringify(data);
		for (const client of this.clients) {
			if (client.readyState === 1) {
				// WebSocket.OPEN
				client.send(message);
			}
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

	exec(`${command} ${url}`, (error) => {
		if (error) {
			console.log(
				`[browser renderer] Could not auto-open browser. Visit ${url} manually.`,
			);
		}
	});
}
