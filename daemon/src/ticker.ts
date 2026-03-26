import gsap from "gsap";
import type { Renderer } from "./renderers/types.js";
import type { Scene } from "./scene.js";

const TARGET_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

export function startTicker(scene: Scene, renderer: Renderer): () => void {
	let lastRenderTime = 0;

	const onTick = () => {
		const now = Date.now();
		if (now - lastRenderTime >= FRAME_INTERVAL_MS) {
			lastRenderTime = now;
			renderer.onTick(scene);
		}
	};

	gsap.ticker.add(onTick);

	return () => {
		gsap.ticker.remove(onTick);
	};
}
