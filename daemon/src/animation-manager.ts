import gsap from "gsap";
import type { AnimationControlFields, TweenType } from "./protocol/types.js";
import type { Scene } from "./scene.js";

let tweenCounter = 0;
let timelineCounter = 0;

function buildTweenVars(
	props: Record<string, unknown>,
	controls: AnimationControlFields,
	onComplete: () => void,
): gsap.TweenVars {
	return {
		...structuredClone(props),
		duration: controls.duration ?? 1,
		ease: controls.ease ?? "power2.out",
		stagger: controls.stagger ?? 0,
		...(controls.repeat !== undefined && { repeat: controls.repeat }),
		...(controls.yoyo !== undefined && { yoyo: controls.yoyo }),
		...(controls.delay !== undefined && { delay: controls.delay }),
		...(controls.repeatDelay !== undefined && {
			repeatDelay: controls.repeatDelay,
		}),
		onComplete,
	};
}

export class AnimationManager {
	private activeTweens = new Map<string, gsap.core.Tween>();
	private timelines = new Map<string, gsap.core.Timeline>();
	private scene: Scene;

	constructor(scene: Scene) {
		this.scene = scene;
	}

	private resolveTargets(
		target: string,
	): Record<string, unknown> | Record<string, unknown>[] {
		const elements = this.scene.getByTarget(target);
		if (elements.length === 0) {
			throw new Error(`No elements found for target "${target}"`);
		}
		if (elements.length === 1) {
			// biome-ignore lint: length check guarantees element exists
			return elements[0]!.props;
		}
		return elements.map((e) => e.props);
	}

	animateTo(
		target: string,
		props: Record<string, unknown>,
		controls: AnimationControlFields = {},
	): string {
		const targets = this.resolveTargets(target);
		const id = `tween_${++tweenCounter}`;
		const tween = gsap.to(
			targets,
			buildTweenVars(props, controls, () => {
				this.activeTweens.delete(id);
			}),
		);
		this.activeTweens.set(id, tween);
		return id;
	}

	animateFrom(
		target: string,
		props: Record<string, unknown>,
		controls: AnimationControlFields = {},
	): string {
		const targets = this.resolveTargets(target);
		const id = `tween_${++tweenCounter}`;
		const tween = gsap.from(
			targets,
			buildTweenVars(props, controls, () => {
				this.activeTweens.delete(id);
			}),
		);
		this.activeTweens.set(id, tween);
		return id;
	}

	animateFromTo(
		target: string,
		fromProps: Record<string, unknown>,
		toProps: Record<string, unknown>,
		controls: AnimationControlFields = {},
	): string {
		const targets = this.resolveTargets(target);
		const id = `tween_${++tweenCounter}`;
		const tween = gsap.fromTo(
			targets,
			structuredClone(fromProps),
			buildTweenVars(toProps, controls, () => {
				this.activeTweens.delete(id);
			}),
		);
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
		fromProps?: Record<string, unknown>,
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
				timeline.to(element.props, structuredClone(props), positionParam);
				break;
			case "from":
				timeline.from(element.props, structuredClone(props), positionParam);
				break;
			case "fromTo": {
				if (!fromProps) {
					throw new Error("fromTo requires from_props to be specified");
				}
				timeline.fromTo(
					element.props,
					structuredClone(fromProps),
					structuredClone(props),
					positionParam,
				);
				break;
			}
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

	typewriter(
		target: string,
		text: string,
		duration?: number,
		ease?: string,
	): { id: string; completionPromise: Promise<void> } {
		const element = this.scene.get(target);
		if (!element) {
			throw new Error(`Element "${target}" not found`);
		}

		const id = `tween_${++tweenCounter}`;
		const { promise: completionPromise, resolve: resolveCompletion } =
			Promise.withResolvers<void>();

		const proxy = { length: 0 };
		const tween = gsap.to(proxy, {
			length: text.length,
			duration: duration ?? text.length * 0.05,
			ease: ease ?? "none",
			onUpdate: () => {
				element.props["text"] = text.slice(0, Math.round(proxy.length));
			},
			onComplete: () => {
				element.props["text"] = text;
				this.activeTweens.delete(id);
				resolveCompletion();
			},
		});
		this.activeTweens.set(id, tween);
		return { id, completionPromise };
	}

	scramble(
		target: string,
		text: string,
		duration?: number,
		chars?: string,
	): { id: string; completionPromise: Promise<void> } {
		const element = this.scene.get(target);
		if (!element) {
			throw new Error(`Element "${target}" not found`);
		}

		const id = `tween_${++tweenCounter}`;
		const scrambleChars =
			chars ??
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
		const { promise: completionPromise, resolve: resolveCompletion } =
			Promise.withResolvers<void>();

		const proxy = { progress: 0 };
		const tween = gsap.to(proxy, {
			progress: 1,
			duration: duration ?? 1,
			ease: "none",
			onUpdate: () => {
				const revealedCount = Math.floor(proxy.progress * text.length);
				let result = text.slice(0, revealedCount);
				for (let i = revealedCount; i < text.length; i++) {
					result +=
						scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
				}
				element.props["text"] = result;
			},
			onComplete: () => {
				element.props["text"] = text;
				this.activeTweens.delete(id);
				resolveCompletion();
			},
		});
		this.activeTweens.set(id, tween);
		return { id, completionPromise };
	}

	addTimelineLabel(name: string, label: string, position?: string): void {
		const timeline = this.getTimeline(name);
		timeline.addLabel(label, position);
	}

	seekTimeline(name: string, position: string): void {
		const timeline = this.getTimeline(name);
		const numericPosition = Number(position);
		if (!Number.isNaN(numericPosition)) {
			timeline.seek(numericPosition);
		} else {
			timeline.seek(position);
		}
	}

	waitForTween(id: string): Promise<void> {
		const tween = this.activeTweens.get(id);
		if (!tween) {
			return Promise.resolve();
		}
		return new Promise((resolve) => {
			const existingOnComplete = tween.vars.onComplete;
			tween.vars.onComplete = () => {
				existingOnComplete?.();
				resolve();
			};
		});
	}

	waitForTimeline(name: string): Promise<void> {
		const timeline = this.getTimeline(name);
		return new Promise((resolve) => {
			timeline.eventCallback("onComplete", () => {
				resolve();
			});
		});
	}

	getTweenStatus(id: string): { active: boolean; progress: number } {
		const tween = this.activeTweens.get(id);
		if (!tween) {
			return { active: false, progress: 1 };
		}
		return { active: tween.isActive(), progress: tween.progress() };
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
