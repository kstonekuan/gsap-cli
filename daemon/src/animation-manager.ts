import gsap from "gsap";
import type { Scene } from "./scene.js";

let tweenCounter = 0;
let timelineCounter = 0;

export class AnimationManager {
	private activeTweens = new Map<string, gsap.core.Tween>();
	private timelines = new Map<string, gsap.core.Timeline>();
	private scene: Scene;

	constructor(scene: Scene) {
		this.scene = scene;
	}

	animateTo(
		target: string,
		props: Record<string, unknown>,
		duration?: number,
		ease?: string,
	): string {
		const element = this.scene.get(target);
		if (!element) {
			throw new Error(`Element "${target}" not found`);
		}

		const id = `tween_${++tweenCounter}`;
		const tween = gsap.to(element.props, {
			...props,
			duration: duration ?? 1,
			ease: ease ?? "power2.out",
			onComplete: () => {
				this.activeTweens.delete(id);
			},
		});
		this.activeTweens.set(id, tween);
		return id;
	}

	animateFrom(
		target: string,
		props: Record<string, unknown>,
		duration?: number,
		ease?: string,
	): string {
		const element = this.scene.get(target);
		if (!element) {
			throw new Error(`Element "${target}" not found`);
		}

		const id = `tween_${++tweenCounter}`;
		const tween = gsap.from(element.props, {
			...props,
			duration: duration ?? 1,
			ease: ease ?? "power2.out",
			onComplete: () => {
				this.activeTweens.delete(id);
			},
		});
		this.activeTweens.set(id, tween);
		return id;
	}

	animateFromTo(
		target: string,
		fromProps: Record<string, unknown>,
		toProps: Record<string, unknown>,
		duration?: number,
		ease?: string,
	): string {
		const element = this.scene.get(target);
		if (!element) {
			throw new Error(`Element "${target}" not found`);
		}

		const id = `tween_${++tweenCounter}`;
		const tween = gsap.fromTo(element.props, fromProps, {
			...toProps,
			duration: duration ?? 1,
			ease: ease ?? "power2.out",
			onComplete: () => {
				this.activeTweens.delete(id);
			},
		});
		this.activeTweens.set(id, tween);
		return id;
	}

	createTimeline(name: string, defaults?: Record<string, unknown>): string {
		if (this.timelines.has(name)) {
			throw new Error(`Timeline "${name}" already exists`);
		}
		const id = `timeline_${++timelineCounter}`;
		const timeline = gsap.timeline({
			paused: true,
			defaults: defaults ?? {},
		});
		this.timelines.set(name, timeline);
		return id;
	}

	addToTimeline(
		name: string,
		tweenType: string,
		target: string,
		props: Record<string, unknown>,
		position?: string,
	): string {
		const timeline = this.timelines.get(name);
		if (!timeline) {
			throw new Error(`Timeline "${name}" not found`);
		}
		const element = this.scene.get(target);
		if (!element) {
			throw new Error(`Element "${target}" not found`);
		}

		const id = `tween_${++tweenCounter}`;
		const positionParam = position ?? "+=0";

		switch (tweenType) {
			case "to":
				timeline.to(element.props, props, positionParam);
				break;
			case "from":
				timeline.from(element.props, props, positionParam);
				break;
			case "fromTo":
				throw new Error(
					"fromTo in timelines is not yet supported via this command",
				);
			default:
				throw new Error(`Unknown tween type: ${tweenType}`);
		}

		return id;
	}

	playTimeline(name: string): void {
		const timeline = this.getTimeline(name);
		timeline.play();
	}

	pauseTimeline(name: string): void {
		const timeline = this.getTimeline(name);
		timeline.pause();
	}

	reverseTimeline(name: string): void {
		const timeline = this.getTimeline(name);
		timeline.reverse();
	}

	seekTimeline(name: string, position: string): void {
		const timeline = this.getTimeline(name);
		// Position can be a number (seconds) or label
		const numericPosition = Number(position);
		if (!Number.isNaN(numericPosition)) {
			timeline.seek(numericPosition);
		} else {
			timeline.seek(position);
		}
	}

	activeTweenCount(): number {
		return this.activeTweens.size;
	}

	timelineCount(): number {
		return this.timelines.size;
	}

	private getTimeline(name: string): gsap.core.Timeline {
		const timeline = this.timelines.get(name);
		if (!timeline) {
			throw new Error(`Timeline "${name}" not found`);
		}
		return timeline;
	}
}
