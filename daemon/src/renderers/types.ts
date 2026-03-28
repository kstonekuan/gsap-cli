import type { Scene } from "../scene.js";

export interface Renderer {
	start(): Promise<void>;
	stop(): Promise<void>;
	onSceneChange(scene: Scene): void;
	forwardCommand(command: unknown): void;
}
