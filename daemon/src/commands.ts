import type { AnimationManager } from "./animation-manager.js";
import { commandSchema } from "./protocol/schema.js";
import type { Command, Response } from "./protocol/types.js";
import type { Renderer } from "./renderers/types.js";
import type { Scene } from "./scene.js";
import { captureScreenshot } from "./screenshot.js";

export interface CommandContext {
	scene: Scene;
	animationManager: AnimationManager;
	renderer: Renderer;
	mode: string;
	port: number;
	startTime: number;
}

export async function handleCommand(
	raw: unknown,
	context: CommandContext,
): Promise<Response> {
	const parseResult = commandSchema.safeParse(raw);
	if (!parseResult.success) {
		return {
			ok: false,
			error: `Invalid command: ${parseResult.error.message}`,
		};
	}

	const command = parseResult.data as Command;

	try {
		switch (command.cmd) {
			case "status":
				return {
					ok: true,
					mode: context.mode,
					elements: context.scene.size(),
					tweens: context.animationManager.activeTweenCount(),
					timelines: context.animationManager.timelineCount(),
					uptime: (Date.now() - context.startTime) / 1000,
				};

			case "element.add": {
				context.scene.add(command.id, command.type, command.props);
				context.renderer.onSceneChange(context.scene);
				context.renderer.forwardCommand?.(command);
				return { ok: true, id: command.id };
			}

			case "element.remove": {
				context.scene.remove(command.id);
				context.renderer.onSceneChange(context.scene);
				context.renderer.forwardCommand?.(command);
				return { ok: true };
			}

			case "element.set": {
				context.scene.set(command.id, command.props);
				context.renderer.onSceneChange(context.scene);
				context.renderer.forwardCommand?.(command);
				return { ok: true };
			}

			case "animate.to": {
				const id = context.animationManager.animateTo(
					command.target,
					command.props,
					command.duration,
					command.ease,
				);
				context.renderer.forwardCommand?.(command);
				return { ok: true, id };
			}

			case "animate.from": {
				const id = context.animationManager.animateFrom(
					command.target,
					command.props,
					command.duration,
					command.ease,
				);
				context.renderer.forwardCommand?.(command);
				return { ok: true, id };
			}

			case "animate.fromTo": {
				const id = context.animationManager.animateFromTo(
					command.target,
					command.from_props,
					command.to_props,
					command.duration,
					command.ease,
				);
				context.renderer.forwardCommand?.(command);
				return { ok: true, id };
			}

			case "timeline.create": {
				const id = context.animationManager.createTimeline(
					command.name,
					command.defaults,
				);
				context.renderer.forwardCommand?.(command);
				return { ok: true, id };
			}

			case "timeline.add": {
				const id = context.animationManager.addToTimeline(
					command.name,
					command.tween_type,
					command.target,
					command.props,
					command.position,
				);
				context.renderer.forwardCommand?.(command);
				return { ok: true, id };
			}

			case "timeline.play": {
				context.animationManager.playTimeline(command.name);
				context.renderer.forwardCommand?.(command);
				return { ok: true };
			}

			case "timeline.pause": {
				context.animationManager.pauseTimeline(command.name);
				context.renderer.forwardCommand?.(command);
				return { ok: true };
			}

			case "timeline.reverse": {
				context.animationManager.reverseTimeline(command.name);
				context.renderer.forwardCommand?.(command);
				return { ok: true };
			}

			case "timeline.seek": {
				context.animationManager.seekTimeline(command.name, command.position);
				context.renderer.forwardCommand?.(command);
				return { ok: true };
			}

			case "screenshot": {
				if (context.mode !== "browser") {
					return {
						ok: false,
						error: "Screenshot is only supported in browser mode",
					};
				}
				await captureScreenshot(context.port, command.output);
				return { ok: true };
			}
		}
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}
