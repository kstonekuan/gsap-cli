export type { Anchor, Axis, RelativePosition } from "../layout.js";

import type { Anchor, Axis, RelativePosition } from "../layout.js";

export interface SuccessResponse {
	ok: true;
	id?: string;
	elements?: number;
	tweens?: number;
	timelines?: number;
	uptime?: number;
	active?: boolean;
	progress?: number;
	list?: Array<{
		id: string;
		type: string;
		parent?: string;
		props: Record<string, unknown>;
	}>;
	results?: Response[];
	props?: Record<string, unknown>;
	type?: string;
	parent?: string;
	scene?: Array<{
		id: string;
		type: string;
		parent?: string;
		props: Record<string, unknown>;
	}>;
	positions?: Array<{ id: string; x: number; y: number }>;
	bounds?: { x: number; y: number; width: number; height: number };
}

export interface ErrorResponse {
	ok: false;
	error: string;
}

export type Response = SuccessResponse | ErrorResponse;

export type CommandType =
	| "batch"
	| "status"
	| "scene.clear"
	| "scene.export"
	| "scene.import"
	| "layout.align"
	| "layout.distribute"
	| "layout.relative"
	| "layout.getBounds"
	| "element.add"
	| "element.remove"
	| "element.set"
	| "element.list"
	| "element.get"
	| "element.clone"
	| "gsap.set"
	| "animate.to"
	| "animate.from"
	| "animate.fromTo"
	| "animate.status"
	| "animate.kill"
	| "animate.motionPath"
	| "timeline.create"
	| "timeline.add"
	| "timeline.play"
	| "timeline.pause"
	| "timeline.reverse"
	| "timeline.seek"
	| "timeline.label"
	| "text.typewriter"
	| "text.scramble"
	| "camera.set"
	| "camera.animate"
	| "screenshot";

export interface BaseCommand {
	cmd: CommandType;
}

export interface BatchCommand extends BaseCommand {
	cmd: "batch";
	commands: Array<Record<string, unknown>>;
}

export interface StatusCommand extends BaseCommand {
	cmd: "status";
}

export type ElementType =
	| "rect"
	| "circle"
	| "text"
	| "image"
	| "html"
	| "line"
	| "group"
	| "path";

export interface ElementAddCommand extends BaseCommand {
	cmd: "element.add";
	id: string;
	type: ElementType;
	parent?: string;
	props?: Record<string, unknown>;
}

export interface ElementRemoveCommand extends BaseCommand {
	cmd: "element.remove";
	id: string;
}

export interface ElementSetCommand extends BaseCommand {
	cmd: "element.set";
	id: string;
	props: Record<string, unknown>;
}

export interface ElementListCommand extends BaseCommand {
	cmd: "element.list";
}

export interface ElementGetCommand extends BaseCommand {
	cmd: "element.get";
	id: string;
}

export interface ElementCloneCommand extends BaseCommand {
	cmd: "element.clone";
	source: string;
	id: string;
	props?: Record<string, unknown>;
}

export interface GsapSetCommand extends BaseCommand {
	cmd: "gsap.set";
	target: string;
	props: Record<string, unknown>;
}

export interface AnimateKillCommand extends BaseCommand {
	cmd: "animate.kill";
	target: string;
}

export interface AnimationControlFields {
	duration?: number;
	ease?: string;
	stagger?: number;
	repeat?: number;
	yoyo?: boolean;
	delay?: number;
	repeatDelay?: number;
	wait?: boolean;
}

export interface AnimateToCommand extends BaseCommand, AnimationControlFields {
	cmd: "animate.to";
	target: string;
	props: Record<string, unknown>;
}

export interface AnimateFromCommand
	extends BaseCommand,
		AnimationControlFields {
	cmd: "animate.from";
	target: string;
	props: Record<string, unknown>;
}

export interface AnimateFromToCommand
	extends BaseCommand,
		AnimationControlFields {
	cmd: "animate.fromTo";
	target: string;
	from_props: Record<string, unknown>;
	to_props: Record<string, unknown>;
}

export interface AnimateStatusCommand extends BaseCommand {
	cmd: "animate.status";
	id: string;
}

export interface AnimateMotionPathCommand
	extends BaseCommand,
		AnimationControlFields {
	cmd: "animate.motionPath";
	target: string;
	path: string;
	autoRotate?: boolean;
	alignOrigin?: number[];
	start?: number;
	end?: number;
}

export interface TimelineCreateCommand extends BaseCommand {
	cmd: "timeline.create";
	name: string;
	defaults?: Record<string, unknown>;
	repeat?: number;
	yoyo?: boolean;
}

export type TweenType = "to" | "from" | "fromTo";

export interface TimelineAddCommand extends BaseCommand {
	cmd: "timeline.add";
	name: string;
	tween_type: TweenType;
	target: string;
	props: Record<string, unknown>;
	from_props?: Record<string, unknown>;
	position?: string;
	stagger?: number;
}

export interface TimelinePlayCommand extends BaseCommand {
	cmd: "timeline.play";
	name: string;
	wait?: boolean;
}

export interface TimelinePauseCommand extends BaseCommand {
	cmd: "timeline.pause";
	name: string;
}

export interface TimelineReverseCommand extends BaseCommand {
	cmd: "timeline.reverse";
	name: string;
}

export interface TimelineSeekCommand extends BaseCommand {
	cmd: "timeline.seek";
	name: string;
	position: string;
}

export interface TimelineLabelCommand extends BaseCommand {
	cmd: "timeline.label";
	name: string;
	label: string;
	position?: string;
}

export interface TextTypewriterCommand extends BaseCommand {
	cmd: "text.typewriter";
	target: string;
	text: string;
	duration?: number;
	ease?: string;
	cursor?: boolean;
	wait?: boolean;
}

export interface TextScrambleCommand extends BaseCommand {
	cmd: "text.scramble";
	target: string;
	text: string;
	duration?: number;
	chars?: string;
	wait?: boolean;
}

export interface CameraSetCommand extends BaseCommand {
	cmd: "camera.set";
	x?: number;
	y?: number;
	zoom?: number;
	rotation?: number;
}

export interface CameraAnimateCommand extends BaseCommand {
	cmd: "camera.animate";
	x?: number;
	y?: number;
	zoom?: number;
	rotation?: number;
	duration?: number;
	ease?: string;
	wait?: boolean;
}

export interface SceneClearCommand extends BaseCommand {
	cmd: "scene.clear";
}

export interface LayoutAlignCommand extends BaseCommand {
	cmd: "layout.align";
	ids: string[];
	axis: Axis;
	anchor: Anchor;
	reference?: string;
}

export interface LayoutDistributeCommand extends BaseCommand {
	cmd: "layout.distribute";
	ids: string[];
	axis: Axis;
	start?: number;
	end?: number;
	gap?: number;
}

export interface LayoutRelativeCommand extends BaseCommand {
	cmd: "layout.relative";
	id: string;
	to: string;
	position: RelativePosition;
	align?: Anchor;
	gap?: number;
}

export interface LayoutGetBoundsCommand extends BaseCommand {
	cmd: "layout.getBounds";
	id: string;
}

export interface SceneExportCommand extends BaseCommand {
	cmd: "scene.export";
}

export interface SceneImportCommand extends BaseCommand {
	cmd: "scene.import";
	elements: Array<{
		id: string;
		type: ElementType;
		parent?: string;
		props?: Record<string, unknown>;
	}>;
}

export interface ScreenshotCommand extends BaseCommand {
	cmd: "screenshot";
	output: string;
}

export type Command =
	| BatchCommand
	| StatusCommand
	| SceneClearCommand
	| ElementAddCommand
	| ElementRemoveCommand
	| ElementSetCommand
	| ElementListCommand
	| ElementGetCommand
	| ElementCloneCommand
	| GsapSetCommand
	| AnimateToCommand
	| AnimateKillCommand
	| AnimateFromCommand
	| AnimateFromToCommand
	| AnimateStatusCommand
	| AnimateMotionPathCommand
	| TimelineCreateCommand
	| TimelineAddCommand
	| TimelinePlayCommand
	| TimelinePauseCommand
	| TimelineReverseCommand
	| TimelineSeekCommand
	| TimelineLabelCommand
	| TextTypewriterCommand
	| TextScrambleCommand
	| CameraSetCommand
	| CameraAnimateCommand
	| ScreenshotCommand
	| SceneExportCommand
	| SceneImportCommand
	| LayoutAlignCommand
	| LayoutDistributeCommand
	| LayoutRelativeCommand
	| LayoutGetBoundsCommand;
