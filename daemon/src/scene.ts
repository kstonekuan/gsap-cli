import type { ElementType } from "./protocol/types.js";

export interface SceneElement {
	id: string;
	type: ElementType;
	parent?: string;
	props: Record<string, unknown>;
}

export interface SerializableSceneElement {
	id: string;
	type: ElementType;
	parent?: string;
	props: Record<string, unknown>;
}

/** Strip GSAP internal keys (prefixed with _) from props so the element is JSON-serializable.
 *  Props are user-set primitives (string, number, boolean, null) — no need for
 *  expensive JSON.stringify checks. */
function toSerializableElement(
	element: SceneElement,
): SerializableSceneElement {
	const cleanProps: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(element.props)) {
		if (key.startsWith("_")) continue;
		const valueType = typeof value;
		if (
			value === null ||
			valueType === "string" ||
			valueType === "number" ||
			valueType === "boolean"
		) {
			cleanProps[key] = value;
		}
	}
	const result: SerializableSceneElement = {
		id: element.id,
		type: element.type,
		props: cleanProps,
	};
	if (element.parent) {
		result.parent = element.parent;
	}
	return result;
}

export class Scene {
	private elements = new Map<string, SceneElement>();

	add(
		id: string,
		type: ElementType,
		props?: Record<string, unknown>,
		parent?: string,
	): SceneElement {
		if (this.elements.has(id)) {
			throw new Error(`Element "${id}" already exists`);
		}
		if (parent && !this.elements.has(parent)) {
			throw new Error(`Parent element "${parent}" not found`);
		}
		const element: SceneElement = {
			id,
			type,
			parent,
			props: {
				x: 0,
				y: 0,
				opacity: 1,
				...(props ?? {}),
			},
		};
		this.elements.set(id, element);
		return element;
	}

	remove(id: string): void {
		if (!this.elements.has(id)) {
			throw new Error(`Element "${id}" not found`);
		}
		// Also remove children of this element
		for (const [childId, child] of this.elements) {
			if (child.parent === id) {
				this.elements.delete(childId);
			}
		}
		this.elements.delete(id);
	}

	get(id: string): SceneElement | undefined {
		return this.elements.get(id);
	}

	/** Get all elements matching a target pattern (id, comma-separated ids, or * for all) */
	getByTarget(target: string): SceneElement[] {
		if (target === "*") {
			return [...this.elements.values()];
		}
		if (target.includes(",")) {
			return target
				.split(",")
				.map((id) => this.elements.get(id.trim()))
				.filter((el): el is SceneElement => el !== undefined);
		}
		const element = this.elements.get(target);
		return element ? [element] : [];
	}

	set(id: string, props: Record<string, unknown>): SceneElement {
		const element = this.elements.get(id);
		if (!element) {
			throw new Error(`Element "${id}" not found`);
		}
		Object.assign(element.props, props);
		return element;
	}

	getAll(): SceneElement[] {
		return [...this.elements.values()];
	}

	/** Returns all elements with GSAP internals stripped — safe for JSON.stringify */
	getAllSerializable(): SerializableSceneElement[] {
		return [...this.elements.values()].map(toSerializableElement);
	}

	size(): number {
		return this.elements.size;
	}
}
