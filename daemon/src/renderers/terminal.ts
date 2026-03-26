import terminalKit from "terminal-kit";
import type { Scene, SceneElement } from "../scene.js";
import type { Renderer } from "./types.js";

const term = terminalKit.terminal;

export class TerminalRenderer implements Renderer {
	private running = false;
	private screenBuffer: terminalKit.ScreenBuffer | null = null;

	async start(): Promise<void> {
		this.running = true;
		term.hideCursor();
		term.clear();
		term.fullscreen(true);

		const width =
			Number.isFinite(term.width) && term.width > 0 ? term.width : 80;
		const height =
			Number.isFinite(term.height) && term.height > 0 ? term.height : 24;

		this.screenBuffer = new terminalKit.ScreenBuffer({
			dst: term,
			width,
			height,
		});

		console.log("[terminal renderer] Started");
	}

	async stop(): Promise<void> {
		this.running = false;
		term.fullscreen(false);
		term.showCursor();
		term.clear();
	}

	onSceneChange(_scene: Scene): void {
		// Scene changes will be picked up on the next tick
	}

	onTick(scene: Scene): void {
		if (!this.running || !this.screenBuffer) return;

		const elements = scene.getAll();
		this.render(elements);
	}

	private render(elements: SceneElement[]): void {
		const screenBuffer = this.screenBuffer;
		if (!screenBuffer) return;

		screenBuffer.fill({ char: " " });

		for (const element of elements) {
			const x = Math.round(Number(element.props["x"]) || 0);
			const y = Math.round(Number(element.props["y"]) || 0);
			const opacity = Number(element.props["opacity"]) ?? 1;

			if (opacity <= 0) continue;

			const rawFill = element.props["fill"];
			const fill = typeof rawFill === "string" ? rawFill : undefined;

			switch (element.type) {
				case "rect":
					this.renderRect(screenBuffer, x, y, element.props, fill);
					break;
				case "circle":
					this.renderCircle(screenBuffer, x, y, element.props, fill);
					break;
				case "text":
					this.renderText(screenBuffer, x, y, element.props, fill);
					break;
			}
		}

		screenBuffer.draw({ delta: true });
	}

	private renderRect(
		screenBuffer: terminalKit.ScreenBuffer,
		x: number,
		y: number,
		props: Record<string, unknown>,
		fill?: string,
	): void {
		const width = Math.round(Number(props["width"]) || 4);
		const height = Math.round(Number(props["height"]) || 2);
		const rawChar = props["char"];
		const char = typeof rawChar === "string" ? rawChar : "█";

		const attr = fill ? { color: fill } : {};

		for (let dy = 0; dy < height; dy++) {
			for (let dx = 0; dx < width; dx++) {
				screenBuffer.put({ x: x + dx, y: y + dy, attr }, char);
			}
		}
	}

	private renderCircle(
		screenBuffer: terminalKit.ScreenBuffer,
		centerX: number,
		centerY: number,
		props: Record<string, unknown>,
		fill?: string,
	): void {
		const radius = Math.round(Number(props["radius"]) || 3);
		const rawChar = props["char"];
		const char = typeof rawChar === "string" ? rawChar : "●";

		const attr = fill ? { color: fill } : {};

		for (let dy = -radius; dy <= radius; dy++) {
			for (let dx = -radius; dx <= radius; dx++) {
				if (dx * dx + dy * dy <= radius * radius) {
					screenBuffer.put({ x: centerX + dx, y: centerY + dy, attr }, char);
				}
			}
		}
	}

	private renderText(
		screenBuffer: terminalKit.ScreenBuffer,
		x: number,
		y: number,
		props: Record<string, unknown>,
		fill?: string,
	): void {
		const text = String(props["text"] ?? "");
		const attr = fill ? { color: fill } : {};

		screenBuffer.put({ x, y, attr }, text);
	}
}
