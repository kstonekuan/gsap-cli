import { z } from "zod";

const propsSchema = z.record(z.string(), z.unknown());

const statusCommandSchema = z.object({
	cmd: z.literal("status"),
});

const elementAddCommandSchema = z.object({
	cmd: z.literal("element.add"),
	id: z.string(),
	type: z.enum(["rect", "circle", "text"]),
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

const animateToCommandSchema = z.object({
	cmd: z.literal("animate.to"),
	target: z.string(),
	props: propsSchema,
	duration: z.number().optional(),
	ease: z.string().optional(),
});

const animateFromCommandSchema = z.object({
	cmd: z.literal("animate.from"),
	target: z.string(),
	props: propsSchema,
	duration: z.number().optional(),
	ease: z.string().optional(),
});

const animateFromToCommandSchema = z.object({
	cmd: z.literal("animate.fromTo"),
	target: z.string(),
	from_props: propsSchema,
	to_props: propsSchema,
	duration: z.number().optional(),
	ease: z.string().optional(),
});

const timelineCreateCommandSchema = z.object({
	cmd: z.literal("timeline.create"),
	name: z.string(),
	defaults: propsSchema.optional(),
});

const timelineAddCommandSchema = z.object({
	cmd: z.literal("timeline.add"),
	name: z.string(),
	tween_type: z.string(),
	target: z.string(),
	props: propsSchema,
	position: z.string().optional(),
});

const timelinePlayCommandSchema = z.object({
	cmd: z.literal("timeline.play"),
	name: z.string(),
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
	timelineCreateCommandSchema,
	timelineAddCommandSchema,
	timelinePlayCommandSchema,
	timelinePauseCommandSchema,
	timelineReverseCommandSchema,
	timelineSeekCommandSchema,
	screenshotCommandSchema,
]);

export type ValidatedCommand = z.infer<typeof commandSchema>;
