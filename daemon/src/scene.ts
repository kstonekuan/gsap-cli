export interface SceneElement {
	id: string;
	type: "rect" | "circle" | "text";
	props: Record<string, unknown>;
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

	size(): number {
		return this.elements.size;
	}
}
