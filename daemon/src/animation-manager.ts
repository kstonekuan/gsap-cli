import gsap from "gsap";
import type { AnimationControlFields, TweenType } from "./protocol/types.js";
import type { Scene } from "./scene.js";

let tweenCounter = 0;
let timelineCounter = 0;

/**
 * CSS transform properties that require GSAP's CSSPlugin (DOM elements).
 * The daemon animates plain objects for timing/completion tracking only —
 * these props are meaningless on plain objects and trigger GSAP warnings.
 * The browser renderer handles them natively.
 */
const CSS_TRANSFORM_PROPS = new Set([
	"rotation",
	"scale",
	"scaleX",
	"scaleY",
	"skewX",
	"skewY",
	"transformOrigin",
	"xPercent",
	"yPercent",
	"motionPath",
]);

function stripCssTransformProps(
	props: Record<string, unknown>,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(props)) {
		if (!CSS_TRANSFORM_PROPS.has(key)) {
			result[key] = value;
		}
	}
	return result;
}

function buildTweenVars(
	props: Record<string, unknown>,
	controls: AnimationControlFields,
	onComplete: () => void,
): gsap.TweenVars {
	return {
		...structuredClone(stripCssTransformProps(props)),
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
			structuredClone(stripCssTransformProps(fromProps)),
			buildTweenVars(toProps, controls, () => {
				this.activeTweens.delete(id);
			}),
		);
		this.activeTweens.set(id, tween);
		return id;
	}

	createTimeline(
		name: string,
		defaults?: Record<string, unknown>,
		repeat?: number,
		yoyo?: boolean,
	): string {
		if (this.timelines.has(name)) {
			throw new Error(`Timeline "${name}" already exists`);
		}
		const id = `timeline_${++timelineCounter}`;
		const timeline = gsap.timeline({
			paused: true,
			defaults: defaults ?? {},
			...(repeat !== undefined && { repeat }),
			...(yoyo !== undefined && { yoyo }),
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
		stagger?: number,
	): string {
		const timeline = this.timelines.get(name);
		if (!timeline) {
			throw new Error(`Timeline "${name}" not found`);
		}
		const elements = this.scene.getByTarget(target);
		if (elements.length === 0) {
			throw new Error(`No elements found for target "${target}"`);
		}
		const tweenTargets =
			elements.length === 1
				? // biome-ignore lint: length check guarantees element exists
					elements[0]!.props
				: elements.map((e) => e.props);

		const id = `tween_${++tweenCounter}`;
		const positionParam = position ?? "+=0";
		const staggerOpt = stagger !== undefined ? { stagger } : {};

		switch (tweenType) {
			case "to":
				timeline.to(
					tweenTargets,
					{
						...structuredClone(stripCssTransformProps(props)),
						...staggerOpt,
					},
					positionParam,
				);
				break;
			case "from":
				timeline.from(
					tweenTargets,
					{
						...structuredClone(stripCssTransformProps(props)),
						...staggerOpt,
					},
					positionParam,
				);
				break;
			case "fromTo": {
				if (!fromProps) {
					throw new Error("fromTo requires from_props to be specified");
				}
				timeline.fromTo(
					tweenTargets,
					structuredClone(stripCssTransformProps(fromProps)),
					{
						...structuredClone(stripCssTransformProps(props)),
						...staggerOpt,
					},
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

	killTarget(target: string): void {
		const elements = this.scene.getByTarget(target);
		const propSets = new Set(elements.map((e) => e.props));
		for (const [id, tween] of this.activeTweens) {
			const tweenTargets = tween.targets();
			for (const t of tweenTargets) {
				if (propSets.has(t as Record<string, unknown>)) {
					tween.kill();
					this.activeTweens.delete(id);
					break;
				}
			}
		}
	}

	killAll(): void {
		for (const tween of this.activeTweens.values()) {
			tween.kill();
		}
		this.activeTweens.clear();
		for (const timeline of this.timelines.values()) {
			timeline.kill();
		}
		this.timelines.clear();
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
