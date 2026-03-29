import type { SceneElement } from "./scene.js";

export interface BoundingBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface Position {
	id: string;
	x: number;
	y: number;
}

/** Average character-width ratio for estimating text width from fontSize. */
const TEXT_WIDTH_RATIO = 0.6;

/** Line-height multiplier for estimating text height from fontSize. */
const TEXT_HEIGHT_RATIO = 1.2;

/**
 * Compute the bounding box of a scene element from its stored props.
 * For text, width is estimated from character count and fontSize.
 * For paths, dimensions are not estimable and return 0.
 */
export function getBounds(element: SceneElement): BoundingBox {
	const props = element.props;
	const x = asNumber(props["x"], 0);
	const y = asNumber(props["y"], 0);

	switch (element.type) {
		case "rect":
		case "html":
		case "image":
		case "group":
			return {
				x,
				y,
				width: asNumber(props["width"], 80),
				height: asNumber(props["height"], 80),
			};

		case "circle": {
			const radius = asNumber(props["radius"], 40);
			return { x, y, width: radius * 2, height: radius * 2 };
		}

		case "text": {
			const fontSize = asNumber(props["fontSize"], 16);
			const text = typeof props["text"] === "string" ? props["text"] : "";
			return {
				x,
				y,
				width: text.length * fontSize * TEXT_WIDTH_RATIO,
				height: fontSize * TEXT_HEIGHT_RATIO,
			};
		}

		case "line": {
			const x1 = asNumber(props["x1"], 0);
			const y1 = asNumber(props["y1"], 0);
			const x2 = asNumber(props["x2"], 0);
			const y2 = asNumber(props["y2"], 0);
			return {
				x: Math.min(x1, x2),
				y: Math.min(y1, y2),
				width: Math.abs(x2 - x1),
				height: Math.abs(y2 - y1),
			};
		}

		case "path":
			return { x: 0, y: 0, width: 0, height: 0 };
	}
}

export type Axis = "x" | "y";
export type Anchor = "start" | "center" | "end";
export type RelativePosition = "above" | "below" | "left" | "right";

/**
 * Compute new positions to align elements along an axis.
 * Does not modify scene state — returns the computed positions.
 */
export function computeAlign(
	elements: SceneElement[],
	axis: Axis,
	anchor: Anchor,
	referenceElement?: SceneElement,
): Position[] {
	const boxes = elements.map((el) => ({ element: el, bounds: getBounds(el) }));

	// Determine target coordinate from reference or average
	let target: number;
	if (referenceElement) {
		const refBounds = getBounds(referenceElement);
		target = anchorCoordinate(refBounds, axis, anchor);
	} else {
		const sum = boxes.reduce(
			(acc, { bounds }) => acc + anchorCoordinate(bounds, axis, anchor),
			0,
		);
		target = sum / boxes.length;
	}

	return boxes.map(({ element, bounds }) => {
		const current = anchorCoordinate(bounds, axis, anchor);
		const delta = target - current;

		if (element.type === "line") {
			return applyLineDelta(element, axis, delta);
		}

		const newX =
			axis === "x" ? asNumber(element.props["x"], 0) + delta : bounds.x;
		const newY =
			axis === "y" ? asNumber(element.props["y"], 0) + delta : bounds.y;
		return { id: element.id, x: Math.round(newX), y: Math.round(newY) };
	});
}

/**
 * Compute new positions to distribute elements evenly along an axis.
 * Elements are sorted by their current position on the axis.
 */
export function computeDistribute(
	elements: SceneElement[],
	axis: Axis,
	start?: number,
	end?: number,
	gap?: number,
): Position[] {
	if (elements.length < 2) {
		return elements.map((el) => ({
			id: el.id,
			x: asNumber(el.props["x"], 0),
			y: asNumber(el.props["y"], 0),
		}));
	}

	const items = elements
		.map((el) => ({ element: el, bounds: getBounds(el) }))
		.sort((a, b) => {
			const aPos = axis === "x" ? a.bounds.x : a.bounds.y;
			const bPos = axis === "x" ? b.bounds.x : b.bounds.y;
			return aPos - bPos;
		});

	const sizeKey = axis === "x" ? "width" : "height";
	const firstItem = items[0] as (typeof items)[number];
	const lastItem = items[items.length - 1] as (typeof items)[number];

	if (gap !== undefined) {
		// Fixed gap: start from first element's current position
		let cursor = axis === "x" ? firstItem.bounds.x : firstItem.bounds.y;
		return items.map(({ element, bounds }) => {
			const pos = cursor;
			cursor += bounds[sizeKey] + gap;

			if (element.type === "line") {
				const currentPos = axis === "x" ? bounds.x : bounds.y;
				return applyLineDelta(element, axis, pos - currentPos);
			}

			return {
				id: element.id,
				x: axis === "x" ? Math.round(pos) : bounds.x,
				y: axis === "y" ? Math.round(pos) : bounds.y,
			};
		});
	}

	// Even distribution between start and end
	const totalSize = items.reduce((sum, { bounds }) => sum + bounds[sizeKey], 0);
	const resolvedStart =
		start ?? (axis === "x" ? firstItem.bounds.x : firstItem.bounds.y);
	const resolvedEnd =
		end ??
		(axis === "x"
			? lastItem.bounds.x + lastItem.bounds[sizeKey]
			: lastItem.bounds.y + lastItem.bounds[sizeKey]);

	const availableSpace = resolvedEnd - resolvedStart - totalSize;
	const spacing = availableSpace / (items.length - 1);

	let cursor = resolvedStart;
	return items.map(({ element, bounds }) => {
		const pos = cursor;
		cursor += bounds[sizeKey] + spacing;

		if (element.type === "line") {
			const currentPos = axis === "x" ? bounds.x : bounds.y;
			return applyLineDelta(element, axis, pos - currentPos);
		}

		return {
			id: element.id,
			x: axis === "x" ? Math.round(pos) : bounds.x,
			y: axis === "y" ? Math.round(pos) : bounds.y,
		};
	});
}

/**
 * Compute new position for an element relative to a reference element.
 */
export function computeRelative(
	element: SceneElement,
	reference: SceneElement,
	position: RelativePosition,
	align: Anchor,
	gap: number,
): Position {
	const selfBounds = getBounds(element);
	const refBounds = getBounds(reference);

	let newX = selfBounds.x;
	let newY = selfBounds.y;

	// Primary axis positioning
	switch (position) {
		case "below":
			newY = refBounds.y + refBounds.height + gap;
			break;
		case "above":
			newY = refBounds.y - selfBounds.height - gap;
			break;
		case "right":
			newX = refBounds.x + refBounds.width + gap;
			break;
		case "left":
			newX = refBounds.x - selfBounds.width - gap;
			break;
	}

	// Cross-axis alignment
	if (position === "below" || position === "above") {
		switch (align) {
			case "start":
				newX = refBounds.x;
				break;
			case "center":
				newX = refBounds.x + refBounds.width / 2 - selfBounds.width / 2;
				break;
			case "end":
				newX = refBounds.x + refBounds.width - selfBounds.width;
				break;
		}
	} else {
		switch (align) {
			case "start":
				newY = refBounds.y;
				break;
			case "center":
				newY = refBounds.y + refBounds.height / 2 - selfBounds.height / 2;
				break;
			case "end":
				newY = refBounds.y + refBounds.height - selfBounds.height;
				break;
		}
	}

	if (element.type === "line") {
		const deltaX = newX - selfBounds.x;
		const deltaY = newY - selfBounds.y;
		return applyLineDeltaXY(element, deltaX, deltaY);
	}

	return { id: element.id, x: Math.round(newX), y: Math.round(newY) };
}

// ---- Helpers ----

function asNumber(value: unknown, fallback: number): number {
	return typeof value === "number" ? value : fallback;
}

/** Get the coordinate of a specific anchor point on a bounding box along an axis. */
function anchorCoordinate(
	bounds: BoundingBox,
	axis: Axis,
	anchor: Anchor,
): number {
	const pos = axis === "x" ? bounds.x : bounds.y;
	const size = axis === "x" ? bounds.width : bounds.height;
	switch (anchor) {
		case "start":
			return pos;
		case "center":
			return pos + size / 2;
		case "end":
			return pos + size;
	}
}

/** Shift a line element by delta on one axis, preserving its angle and length. */
function applyLineDelta(
	element: SceneElement,
	axis: Axis,
	delta: number,
): Position {
	// For lines, we return x/y as the min corner but also need to track
	// that the caller should set x1/y1/x2/y2 shifted by delta.
	// We encode the shifted line coords in the position as x/y of the new bounding box.
	const props = element.props;
	if (axis === "x") {
		const x1 = asNumber(props["x1"], 0) + delta;
		const x2 = asNumber(props["x2"], 0) + delta;
		return { id: element.id, x: Math.min(x1, x2), y: asNumber(props["y1"], 0) };
	}
	const y1 = asNumber(props["y1"], 0) + delta;
	const y2 = asNumber(props["y2"], 0) + delta;
	return { id: element.id, x: asNumber(props["x1"], 0), y: Math.min(y1, y2) };
}

/** Shift a line element by deltaX and deltaY. */
function applyLineDeltaXY(
	element: SceneElement,
	deltaX: number,
	deltaY: number,
): Position {
	const props = element.props;
	const x1 = asNumber(props["x1"], 0) + deltaX;
	const y1 = asNumber(props["y1"], 0) + deltaY;
	return { id: element.id, x: Math.round(x1), y: Math.round(y1) };
}
