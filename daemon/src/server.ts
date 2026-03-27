import { existsSync, unlinkSync } from "node:fs";
import { createServer, type Server, type Socket } from "node:net";
import { type CommandContext, handleCommand } from "./commands.js";

const SOCKET_PATH = "/tmp/gsap-cli.sock";

export function startSocketServer(context: CommandContext): Server {
	// Clean up stale socket
	if (existsSync(SOCKET_PATH)) {
		try {
			unlinkSync(SOCKET_PATH);
		} catch {
			// Ignore
		}
	}

	const server = createServer((socket: Socket) => {
		let buffer = "";

		socket.on("data", (data) => {
			buffer += data.toString();
			processBuffer(socket, buffer, context)
				.then((remaining) => {
					buffer = remaining;
				})
				.catch((error) => {
					console.error("[server] Unexpected error:", error);
					try {
						socket.write(
							`${JSON.stringify({ ok: false, error: "Internal server error" })}\n`,
						);
					} catch {
						// Socket may already be closed
					}
				});
		});

		socket.on("error", (error) => {
			console.error("[server] Socket error:", error.message);
		});
	});

	server.listen(SOCKET_PATH, () => {
		console.log(`[server] Listening on ${SOCKET_PATH}`);
	});

	// Cleanup on exit
	const cleanup = () => {
		try {
			server.close();
			if (existsSync(SOCKET_PATH)) {
				unlinkSync(SOCKET_PATH);
			}
		} catch {
			// Ignore cleanup errors
		}
	};

	process.on("SIGINT", () => {
		cleanup();
		process.exit(0);
	});
	process.on("SIGTERM", () => {
		cleanup();
		process.exit(0);
	});

	return server;
}

async function processBuffer(
	socket: Socket,
	initialBuffer: string,
	context: CommandContext,
): Promise<string> {
	let remaining = initialBuffer;
	let newlineIndex = remaining.indexOf("\n");
	while (newlineIndex !== -1) {
		const line = remaining.slice(0, newlineIndex).trim();
		remaining = remaining.slice(newlineIndex + 1);

		if (line.length > 0) {
			try {
				const parsed: unknown = JSON.parse(line);
				const response = await handleCommand(parsed, context);
				socket.write(`${JSON.stringify(response)}\n`);
			} catch {
				socket.write(
					`${JSON.stringify({ ok: false, error: "Invalid JSON" })}\n`,
				);
			}
		}

		newlineIndex = remaining.indexOf("\n");
	}
	return remaining;
}
