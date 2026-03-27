import gsap from "gsap";
import type { TweenType } from "./protocol/types.js";
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
			...structuredClone(props),
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
			...structuredClone(props),
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
		const tween = gsap.fromTo(element.props, structuredClone(fromProps), {
			...structuredClone(toProps),
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
		tweenType: TweenType,
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

		const clonedProps = structuredClone(props);

		switch (tweenType) {
			case "to":
				timeline.to(element.props, clonedProps, positionParam);
				break;
			case "from":
				timeline.from(element.props, clonedProps, positionParam);
				break;
			case "fromTo":
				// fromTo requires separate from/to props which the timeline.add command doesn't support yet
				throw new Error(
					"fromTo in timelines is not yet supported via this command",
				);
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
