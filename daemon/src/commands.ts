import type { AnimationManager } from "./animation-manager.js";
import { commandSchema, type ValidatedCommand } from "./protocol/schema.js";
import type { AnimationControlFields, Response } from "./protocol/types.js";
import type { Renderer } from "./renderers/types.js";
import type { Scene } from "./scene.js";
import { captureScreenshot } from "./screenshot.js";

export interface CommandContext {
	scene: Scene;
	animationManager: AnimationManager;
	renderer: Renderer;
	port: number;
	startTime: number;
}

function extractAnimationControls(
	command: AnimationControlFields,
): AnimationControlFields {
	return {
		duration: command.duration,
		ease: command.ease,
		stagger: command.stagger,
		repeat: command.repeat,
		yoyo: command.yoyo,
		delay: command.delay,
		repeatDelay: command.repeatDelay,
	};
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

	const command: ValidatedCommand = parseResult.data;

	try {
		switch (command.cmd) {
			case "batch": {
				const results: Response[] = [];
				for (const subCommand of command.commands) {
					const result = await handleCommand(subCommand, context);
					results.push(result);
				}
				return { ok: true, results };
			}

			case "status":
				return {
					ok: true,
					elements: context.scene.size(),
					tweens: context.animationManager.activeTweenCount(),
					timelines: context.animationManager.timelineCount(),
					uptime: (Date.now() - context.startTime) / 1000,
				};

			case "scene.clear": {
				context.animationManager.killAll();
				context.scene.clear();
				context.renderer.forwardCommand(command);
				context.renderer.onSceneChange(context.scene);
				return { ok: true };
			}

			case "element.add": {
				context.scene.add(
					command.id,
					command.type,
					command.props,
					command.parent,
				);
				context.renderer.forwardCommand(command);
				context.renderer.onSceneChange(context.scene);
				return { ok: true, id: command.id };
			}

			case "element.remove": {
				context.scene.remove(command.id);
				context.renderer.forwardCommand(command);
				context.renderer.onSceneChange(context.scene);
				return { ok: true };
			}

			case "element.set": {
				context.scene.set(command.id, command.props);
				context.renderer.forwardCommand(command);
				context.renderer.onSceneChange(context.scene);
				return { ok: true };
			}

			case "element.list": {
				return {
					ok: true,
					list: context.scene.getAllSerializable(),
				};
			}

			case "element.get": {
				const element = context.scene.get(command.id);
				if (!element) {
					throw new Error(`Element "${command.id}" not found`);
				}
				const serializable = context.scene.getSerializable(command.id);
				return {
					ok: true,
					id: serializable.id,
					type: serializable.type,
					parent: serializable.parent,
					props: serializable.props,
				};
			}

			case "element.clone": {
				const cloned = context.scene.clone(
					command.source,
					command.id,
					command.props,
				);
				context.renderer.forwardCommand({
					cmd: "element.add",
					id: cloned.id,
					type: cloned.type,
					parent: cloned.parent,
					props: cloned.props,
				});
				context.renderer.onSceneChange(context.scene);
				return { ok: true, id: command.id };
			}

			case "gsap.set": {
				context.renderer.forwardCommand(command);
				return { ok: true };
			}

			case "animate.kill": {
				context.animationManager.killTarget(command.target);
				context.renderer.forwardCommand(command);
				return { ok: true };
			}

			case "animate.to": {
				const id = context.animationManager.animateTo(
					command.target,
					command.props,
					extractAnimationControls(command),
				);
				context.renderer.forwardCommand(command);
				if (command.wait) {
					await context.animationManager.waitForTween(id);
				}
				return { ok: true, id };
			}

			case "animate.from": {
				const id = context.animationManager.animateFrom(
					command.target,
					command.props,
					extractAnimationControls(command),
				);
				context.renderer.forwardCommand(command);
				if (command.wait) {
					await context.animationManager.waitForTween(id);
				}
				return { ok: true, id };
			}

			case "animate.fromTo": {
				const id = context.animationManager.animateFromTo(
					command.target,
					command.from_props,
					command.to_props,
					extractAnimationControls(command),
				);
				context.renderer.forwardCommand(command);
				if (command.wait) {
					await context.animationManager.waitForTween(id);
				}
				return { ok: true, id };
			}

			case "animate.status": {
				const status = context.animationManager.getTweenStatus(command.id);
				return {
					ok: true,
					active: status.active,
					progress: status.progress,
				};
			}

			case "animate.motionPath": {
				const motionPathConfig: Record<string, unknown> = {
					path: command.path,
				};
				if (command.autoRotate !== undefined)
					motionPathConfig["autoRotate"] = command.autoRotate;
				if (command.alignOrigin !== undefined)
					motionPathConfig["alignOrigin"] = command.alignOrigin;
				if (command.start !== undefined)
					motionPathConfig["start"] = command.start;
				if (command.end !== undefined) motionPathConfig["end"] = command.end;

				const id = context.animationManager.animateTo(
					command.target,
					{ motionPath: motionPathConfig },
					extractAnimationControls(command),
				);
				context.renderer.forwardCommand(command);
				if (command.wait) {
					await context.animationManager.waitForTween(id);
				}
				return { ok: true, id };
			}

			case "timeline.create": {
				const id = context.animationManager.createTimeline(
					command.name,
					command.defaults,
					command.repeat,
					command.yoyo,
				);
				context.renderer.forwardCommand(command);
				return { ok: true, id };
			}

			case "timeline.add": {
				const id = context.animationManager.addToTimeline(
					command.name,
					command.tween_type,
					command.target,
					command.props,
					command.from_props,
					command.position,
					command.stagger,
				);
				context.renderer.forwardCommand(command);
				return { ok: true, id };
			}

			case "timeline.play": {
				context.animationManager.playTimeline(command.name);
				context.renderer.forwardCommand(command);
				if (command.wait) {
					await context.animationManager.waitForTimeline(command.name);
				}
				return { ok: true };
			}

			case "timeline.pause": {
				context.animationManager.pauseTimeline(command.name);
				context.renderer.forwardCommand(command);
				return { ok: true };
			}

			case "timeline.reverse": {
				context.animationManager.reverseTimeline(command.name);
				context.renderer.forwardCommand(command);
				return { ok: true };
			}

			case "timeline.seek": {
				context.animationManager.seekTimeline(command.name, command.position);
				context.renderer.forwardCommand(command);
				return { ok: true };
			}

			case "timeline.label": {
				context.animationManager.addTimelineLabel(
					command.name,
					command.label,
					command.position,
				);
				context.renderer.forwardCommand(command);
				return { ok: true };
			}

			case "text.typewriter": {
				const result = context.animationManager.typewriter(
					command.target,
					command.text,
					command.duration,
					command.ease,
				);
				context.renderer.forwardCommand(command);
				if (command.wait) {
					await result.completionPromise;
				}
				return { ok: true, id: result.id };
			}

			case "text.scramble": {
				const result = context.animationManager.scramble(
					command.target,
					command.text,
					command.duration,
					command.chars,
				);
				context.renderer.forwardCommand(command);
				if (command.wait) {
					await result.completionPromise;
				}
				return { ok: true, id: result.id };
			}

			case "camera.set": {
				context.renderer.forwardCommand(command);
				return { ok: true };
			}

			case "camera.animate": {
				context.renderer.forwardCommand(command);
				return { ok: true };
			}

			case "scene.export": {
				return {
					ok: true,
					scene: context.scene.getAllSerializable(),
				};
			}

			case "scene.import": {
				// Kill all existing animations and clear the scene
				context.animationManager.killAll();
				context.scene.clear();
				context.renderer.forwardCommand({ cmd: "scene.clear" });

				// Add each element in order
				for (const element of command.elements) {
					context.scene.add(
						element.id,
						element.type,
						element.props,
						element.parent,
					);
					context.renderer.forwardCommand({
						cmd: "element.add",
						id: element.id,
						type: element.type,
						parent: element.parent,
						props: element.props,
					});
				}
				context.renderer.onSceneChange(context.scene);
				return { ok: true, elements: command.elements.length };
			}

			case "screenshot": {
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
