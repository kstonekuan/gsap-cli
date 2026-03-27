export interface SceneElement {
	id: string;
	type: "rect" | "circle" | "text";
	props: Record<string, unknown>;
}

export interface SerializableSceneElement {
	id: string;
	type: "rect" | "circle" | "text";
	props: Record<string, unknown>;
}

/** Strip GSAP internal keys (prefixed with _) from props so the element is JSON-serializable */
function toSerializableElement(
	element: SceneElement,
): SerializableSceneElement {
	const cleanProps: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(element.props)) {
		if (!key.startsWith("_") && typeof value !== "object") {
			cleanProps[key] = value;
		} else if (!key.startsWith("_") && value === null) {
			cleanProps[key] = value;
		} else if (!key.startsWith("_")) {
			// Skip complex objects that GSAP may have injected
			try {
				JSON.stringify(value);
				cleanProps[key] = value;
			} catch {
				// Non-serializable — skip
			}
		}
	}
	return { id: element.id, type: element.type, props: cleanProps };
}

export class Scene {
	private elements = new Map<string, SceneElement>();

	add(
		id: string,
		type: SceneElement["type"],
		props?: Record<string, unknown>,
	): SceneElement {
		if (this.elements.has(id)) {
			throw new Error(`Element "${id}" already exists`);
		}
		const element: SceneElement = {
			id,
			type,
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
		this.elements.delete(id);
	}

	get(id: string): SceneElement | undefined {
		return this.elements.get(id);
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
