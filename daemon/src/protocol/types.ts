export interface SuccessResponse {
	ok: true;
	id?: string;
	mode?: string;
	elements?: number;
	tweens?: number;
	timelines?: number;
	uptime?: number;
}

export interface ErrorResponse {
	ok: false;
	error: string;
}

export type Response = SuccessResponse | ErrorResponse;

export type CommandType =
	| "status"
	| "element.add"
	| "element.remove"
	| "element.set"
	| "animate.to"
	| "animate.from"
	| "animate.fromTo"
	| "timeline.create"
	| "timeline.add"
	| "timeline.play"
	| "timeline.pause"
	| "timeline.reverse"
	| "timeline.seek"
	| "screenshot";

export interface BaseCommand {
	cmd: CommandType;
}

export interface StatusCommand extends BaseCommand {
	cmd: "status";
}

export interface ElementAddCommand extends BaseCommand {
	cmd: "element.add";
	id: string;
	type: "rect" | "circle" | "text";
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

export interface AnimateToCommand extends BaseCommand {
	cmd: "animate.to";
	target: string;
	props: Record<string, unknown>;
	duration?: number;
	ease?: string;
}

export interface AnimateFromCommand extends BaseCommand {
	cmd: "animate.from";
	target: string;
	props: Record<string, unknown>;
	duration?: number;
	ease?: string;
}

export interface AnimateFromToCommand extends BaseCommand {
	cmd: "animate.fromTo";
	target: string;
	from_props: Record<string, unknown>;
	to_props: Record<string, unknown>;
	duration?: number;
	ease?: string;
}

export interface TimelineCreateCommand extends BaseCommand {
	cmd: "timeline.create";
	name: string;
	defaults?: Record<string, unknown>;
}

export interface TimelineAddCommand extends BaseCommand {
	cmd: "timeline.add";
	name: string;
	tween_type: string;
	target: string;
	props: Record<string, unknown>;
	position?: string;
}

export interface TimelinePlayCommand extends BaseCommand {
	cmd: "timeline.play";
	name: string;
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

export interface ScreenshotCommand extends BaseCommand {
	cmd: "screenshot";
	output: string;
}

export type Command =
	| StatusCommand
	| ElementAddCommand
	| ElementRemoveCommand
	| ElementSetCommand
	| AnimateToCommand
	| AnimateFromCommand
	| AnimateFromToCommand
	| TimelineCreateCommand
	| TimelineAddCommand
	| TimelinePlayCommand
	| TimelinePauseCommand
	| TimelineReverseCommand
	| TimelineSeekCommand
	| ScreenshotCommand;
