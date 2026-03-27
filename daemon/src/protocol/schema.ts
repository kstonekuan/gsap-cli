import { z } from "zod";

const propsSchema = z.record(z.string(), z.unknown());

const elementTypeSchema = z.enum([
	"rect",
	"circle",
	"text",
	"image",
	"html",
	"line",
	"group",
	"path",
]);

const statusCommandSchema = z.object({
	cmd: z.literal("status"),
});

const elementAddCommandSchema = z.object({
	cmd: z.literal("element.add"),
	id: z.string(),
	type: elementTypeSchema,
	parent: z.string().optional(),
	props: propsSchema.optional(),
});

const elementRemoveCommandSchema = z.object({
	cmd: z.literal("element.remove"),
	id: z.string(),
});

const elementSetCommandSchema = z.object({
	cmd: z.literal("element.set"),
	id: z.string(),
	props: propsSchema,
});

const animationControlSchema = {
	duration: z.number().optional(),
	ease: z.string().optional(),
	stagger: z.number().optional(),
	repeat: z.number().optional(),
	yoyo: z.boolean().optional(),
	delay: z.number().optional(),
	repeatDelay: z.number().optional(),
	wait: z.boolean().optional(),
};

const animateToCommandSchema = z.object({
	cmd: z.literal("animate.to"),
	target: z.string(),
	props: propsSchema,
	...animationControlSchema,
});

const animateFromCommandSchema = z.object({
	cmd: z.literal("animate.from"),
	target: z.string(),
	props: propsSchema,
	...animationControlSchema,
});

const animateFromToCommandSchema = z.object({
	cmd: z.literal("animate.fromTo"),
	target: z.string(),
	from_props: propsSchema,
	to_props: propsSchema,
	...animationControlSchema,
});

const timelineCreateCommandSchema = z.object({
	cmd: z.literal("timeline.create"),
	name: z.string(),
	defaults: propsSchema.optional(),
});

const timelineAddCommandSchema = z.object({
	cmd: z.literal("timeline.add"),
	name: z.string(),
	tween_type: z.enum(["to", "from", "fromTo"]),
	target: z.string(),
	props: propsSchema,
	from_props: propsSchema.optional(),
	position: z.string().optional(),
});

const animateStatusCommandSchema = z.object({
	cmd: z.literal("animate.status"),
	id: z.string(),
});

const animateMotionPathCommandSchema = z.object({
	cmd: z.literal("animate.motionPath"),
	target: z.string(),
	path: z.string(),
	autoRotate: z.boolean().optional(),
	alignOrigin: z.array(z.number()).optional(),
	start: z.number().optional(),
	end: z.number().optional(),
	...animationControlSchema,
});

const timelinePlayCommandSchema = z.object({
	cmd: z.literal("timeline.play"),
	name: z.string(),
	wait: z.boolean().optional(),
});

const timelinePauseCommandSchema = z.object({
	cmd: z.literal("timeline.pause"),
	name: z.string(),
});

const timelineReverseCommandSchema = z.object({
	cmd: z.literal("timeline.reverse"),
	name: z.string(),
});

const timelineSeekCommandSchema = z.object({
	cmd: z.literal("timeline.seek"),
	name: z.string(),
	position: z.string(),
});

const timelineLabelCommandSchema = z.object({
	cmd: z.literal("timeline.label"),
	name: z.string(),
	label: z.string(),
	position: z.string().optional(),
});

const textTypewriterCommandSchema = z.object({
	cmd: z.literal("text.typewriter"),
	target: z.string(),
	text: z.string(),
	duration: z.number().optional(),
	ease: z.string().optional(),
	cursor: z.boolean().optional(),
	wait: z.boolean().optional(),
});

const textScrambleCommandSchema = z.object({
	cmd: z.literal("text.scramble"),
	target: z.string(),
	text: z.string(),
	duration: z.number().optional(),
	chars: z.string().optional(),
	wait: z.boolean().optional(),
});

const cameraSetCommandSchema = z.object({
	cmd: z.literal("camera.set"),
	x: z.number().optional(),
	y: z.number().optional(),
	zoom: z.number().optional(),
	rotation: z.number().optional(),
});

const cameraAnimateCommandSchema = z.object({
	cmd: z.literal("camera.animate"),
	x: z.number().optional(),
	y: z.number().optional(),
	zoom: z.number().optional(),
	rotation: z.number().optional(),
	duration: z.number().optional(),
	ease: z.string().optional(),
	wait: z.boolean().optional(),
});

const screenshotCommandSchema = z.object({
	cmd: z.literal("screenshot"),
	output: z.string(),
});

export const commandSchema = z.discriminatedUnion("cmd", [
	statusCommandSchema,
	elementAddCommandSchema,
	elementRemoveCommandSchema,
	elementSetCommandSchema,
	animateToCommandSchema,
	animateFromCommandSchema,
	animateFromToCommandSchema,
	animateStatusCommandSchema,
	animateMotionPathCommandSchema,
	timelineCreateCommandSchema,
	timelineAddCommandSchema,
	timelinePlayCommandSchema,
	timelinePauseCommandSchema,
	timelineReverseCommandSchema,
	timelineSeekCommandSchema,
	timelineLabelCommandSchema,
	textTypewriterCommandSchema,
	textScrambleCommandSchema,
	cameraSetCommandSchema,
	cameraAnimateCommandSchema,
	screenshotCommandSchema,
]);

export type ValidatedCommand = z.infer<typeof commandSchema>;
