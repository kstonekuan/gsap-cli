import type { Scene, SceneElement } from "../scene.js";
import type { Renderer } from "./types.js";

const ESC = "\x1b";
const CSI = `${ESC}[`;

const ANSI = {
	hideCursor: `${CSI}?25l`,
	showCursor: `${CSI}?25h`,
	clearScreen: `${CSI}2J`,
	enterAltScreen: `${CSI}?1049h`,
	leaveAltScreen: `${CSI}?1049l`,
	resetStyle: `${CSI}0m`,
	moveTo: (x: number, y: number) => `${CSI}${y + 1};${x + 1}H`,
	trueColorForeground: (r: number, g: number, b: number) =>
		`${CSI}38;2;${r};${g};${b}m`,
} as const;

function parseHexColor(
	hex: string,
): { r: number; g: number; b: number } | undefined {
	const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
	if (!match) return undefined;
	return {
		r: Number.parseInt(match[1] as string, 16),
		g: Number.parseInt(match[2] as string, 16),
		b: Number.parseInt(match[3] as string, 16),
	};
}

function colorSequence(fill: string | undefined): string {
	if (!fill) return "";
	const color = parseHexColor(fill);
	if (!color) return "";
	return ANSI.trueColorForeground(color.r, color.g, color.b);
}

export class TerminalRenderer implements Renderer {
	private running = false;
	private width = 80;
	private height = 24;

	async start(): Promise<void> {
		this.running = true;
		this.width = process.stdout.columns || 80;
		this.height = process.stdout.rows || 24;

		process.stdout.write(
			ANSI.enterAltScreen + ANSI.hideCursor + ANSI.clearScreen,
		);

		process.stdout.on("resize", () => {
			this.width = process.stdout.columns || 80;
			this.height = process.stdout.rows || 24;
		});

		console.log("[terminal renderer] Started");
	}

	async stop(): Promise<void> {
		this.running = false;
		process.stdout.write(
			ANSI.resetStyle + ANSI.showCursor + ANSI.leaveAltScreen,
		);
	}

	onSceneChange(_scene: Scene): void {
		// Scene changes will be picked up on the next tick
	}

	onTick(scene: Scene): void {
		if (!this.running) return;

		const elements = scene.getAll();
		this.render(elements);
	}

	private render(elements: SceneElement[]): void {
		// Build entire frame as a single string for one atomic write
		let frame = ANSI.clearScreen;

		for (const element of elements) {
			const x = Math.round(Number(element.props["x"]) || 0);
			const y = Math.round(Number(element.props["y"]) || 0);
			const opacity = Number(element.props["opacity"]) ?? 1;

			if (opacity <= 0) continue;

			const rawFill = element.props["fill"];
			const fill = typeof rawFill === "string" ? rawFill : undefined;

			switch (element.type) {
				case "rect":
					frame += this.renderRect(x, y, element.props, fill);
					break;
				case "circle":
					frame += this.renderCircle(x, y, element.props, fill);
					break;
				case "text":
					frame += this.renderText(x, y, element.props, fill);
					break;
			}
		}

		frame += ANSI.resetStyle;
		process.stdout.write(frame);
	}

	private renderRect(
		x: number,
		y: number,
		props: Record<string, unknown>,
		fill?: string,
	): string {
		const width = Math.round(Number(props["width"]) || 4);
		const height = Math.round(Number(props["height"]) || 2);
		const rawChar = props["char"];
		const char = typeof rawChar === "string" ? rawChar : "█";
		const color = colorSequence(fill);
		let output = color;

		for (let dy = 0; dy < height; dy++) {
			const drawY = y + dy;
			const drawX = x;
			if (drawY < 0 || drawY >= this.height || drawX >= this.width) continue;

			const visibleWidth = Math.min(width, this.width - drawX);
			if (visibleWidth <= 0) continue;

			output += ANSI.moveTo(drawX, drawY) + char.repeat(visibleWidth);
		}

		return output;
	}

	private renderCircle(
		centerX: number,
		centerY: number,
		props: Record<string, unknown>,
		fill?: string,
	): string {
		const radius = Math.round(Number(props["radius"]) || 3);
		const rawChar = props["char"];
		const char = typeof rawChar === "string" ? rawChar : "●";
		const color = colorSequence(fill);
		let output = color;

		for (let dy = -radius; dy <= radius; dy++) {
			for (let dx = -radius; dx <= radius; dx++) {
				if (dx * dx + dy * dy <= radius * radius) {
					const drawX = centerX + dx;
					const drawY = centerY + dy;
					if (
						drawX < 0 ||
						drawX >= this.width ||
						drawY < 0 ||
						drawY >= this.height
					)
						continue;

					output += ANSI.moveTo(drawX, drawY) + char;
				}
			}
		}

		return output;
	}

	private renderText(
		x: number,
		y: number,
		props: Record<string, unknown>,
		fill?: string,
	): string {
		const text = String(props["text"] ?? "");
		if (y < 0 || y >= this.height || x >= this.width) return "";

		const color = colorSequence(fill);
		const visibleText = text.slice(0, Math.max(0, this.width - x));

		return color + ANSI.moveTo(x, y) + visibleText;
	}
}
