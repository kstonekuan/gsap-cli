declare module "terminal-kit" {
	interface Terminal {
		width: number;
		height: number;
		hideCursor(): Terminal;
		showCursor(): Terminal;
		clear(): Terminal;
		fullscreen(enable: boolean): Terminal;
		moveTo(x: number, y: number, ...args: unknown[]): Terminal;
		styleReset(): Terminal;
		bgDefaultColor(): Terminal;
		defaultColor(): Terminal;
		color(color: string | number, text: string): Terminal;
		bgColor(color: string | number, text: string): Terminal;
		(text: string): Terminal;
	}

	interface ScreenBufferPutOptions {
		x?: number;
		y?: number;
		attr?: number | Record<string, unknown>;
		wrap?: boolean;
		dx?: number;
		dy?: number;
	}

	interface ScreenBufferConstructorOptions {
		dst: Terminal;
		width: number;
		height: number;
	}

	interface ScreenBuffer {
		fill(options: {
			char?: string;
			attr?: number | Record<string, unknown>;
		}): void;
		put(options: ScreenBufferPutOptions, text: string): void;
		draw(options?: { delta?: boolean }): void;
	}

	interface ScreenBufferConstructor {
		new (options: ScreenBufferConstructorOptions): ScreenBuffer;
	}

	const terminal: Terminal;
	const ScreenBuffer: ScreenBufferConstructor;
}
