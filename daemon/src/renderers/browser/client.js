/* global gsap, MotionPathPlugin */

gsap.registerPlugin(MotionPathPlugin);

const scene = document.getElementById("scene");
const statusElement = document.getElementById("status");
const elements = new Map();

// SVG overlay for line elements
const svgOverlay = document.createElementNS(
	"http://www.w3.org/2000/svg",
	"svg",
);
svgOverlay.setAttribute("id", "svg-overlay");
svgOverlay.style.cssText =
	"position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;";
scene.appendChild(svgOverlay);

// --- Element creation by type ---

function createDomForType(type, id) {
	switch (type) {
		case "image": {
			const img = document.createElement("img");
			img.id = `el-${id}`;
			img.classList.add("element", "element-image");
			img.draggable = false;
			return img;
		}
		case "line": {
			const line = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"line",
			);
			line.id = `el-${id}`;
			line.classList.add("element-line");
			return line;
		}
		case "path": {
			const path = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"path",
			);
			path.id = `el-${id}`;
			path.classList.add("element-path");
			return path;
		}
		default: {
			const div = document.createElement("div");
			div.id = `el-${id}`;
			div.classList.add("element", `element-${type}`);
			return div;
		}
	}
}

function getParentContainer(parentId) {
	if (!parentId) return scene;
	const parentEntry = elements.get(parentId);
	return parentEntry ? parentEntry.dom : scene;
}

function createOrUpdateElement(data) {
	let entry = elements.get(data.id);

	if (!entry) {
		const dom = createDomForType(data.type, data.id);
		const isSvgElement = data.type === "line" || data.type === "path";
		const container = isSvgElement
			? svgOverlay
			: getParentContainer(data.parent);
		container.appendChild(dom);
		entry = { dom, type: data.type, parent: data.parent, props: {} };
		elements.set(data.id, entry);
	}

	Object.assign(entry.props, data.props);
	applyProps(entry.dom, data.type, entry.props);
}

function removeElement(id) {
	const entry = elements.get(id);
	if (entry) {
		// Remove children first
		for (const [childId, child] of elements) {
			if (child.parent === id) {
				removeElement(childId);
			}
		}
		entry.dom.remove();
		elements.delete(id);
	}
}

// --- Property application ---

// GSAP transform props — handled by GSAP natively, not as CSS
const GSAP_TRANSFORM_PROPS = new Set([
	"x",
	"y",
	"rotation",
	"scale",
	"scaleX",
	"scaleY",
	"skewX",
	"skewY",
	"transformOrigin",
	"xPercent",
	"yPercent",
]);

// Props that are element-specific content, not CSS
const CONTENT_PROPS = new Set([
	"text",
	"src",
	"alt",
	"innerHTML",
	"x1",
	"y1",
	"x2",
	"y2",
	"d",
]);

// Props that need px units when set as CSS
const PX_PROPS = new Set([
	"width",
	"height",
	"fontSize",
	"borderRadius",
	"padding",
	"margin",
	"top",
	"left",
	"right",
	"bottom",
	"gap",
	"borderWidth",
	"outlineWidth",
	"letterSpacing",
]);

function applyProps(dom, type, props) {
	// Common transform props — applied via inline style for scene tick sync
	const x = Number(props.x) || 0;
	const y = Number(props.y) || 0;
	const opacity = props.opacity !== undefined ? Number(props.opacity) : 1;
	const rotation = Number(props.rotation) || 0;
	const scaleVal = props.scale !== undefined ? Number(props.scale) : 1;

	// Handle path elements (SVG)
	if (type === "path") {
		if (props.d) dom.setAttribute("d", props.d);
		dom.setAttribute("stroke", props.stroke || "#ffffff");
		dom.setAttribute("stroke-width", Number(props.strokeWidth) || 2);
		dom.setAttribute("fill", props.fill || "none");
		dom.setAttribute("opacity", opacity);
		if (props.strokeDasharray)
			dom.setAttribute("stroke-dasharray", props.strokeDasharray);
		if (props.strokeDashoffset !== undefined)
			dom.setAttribute("stroke-dashoffset", props.strokeDashoffset);
		if (props.strokeLinecap)
			dom.setAttribute("stroke-linecap", props.strokeLinecap);
		if (props.strokeLinejoin)
			dom.setAttribute("stroke-linejoin", props.strokeLinejoin);
		return;
	}

	// Handle line elements (SVG)
	if (type === "line") {
		dom.setAttribute("x1", Number(props.x1) || 0);
		dom.setAttribute("y1", Number(props.y1) || 0);
		dom.setAttribute("x2", Number(props.x2) || 0);
		dom.setAttribute("y2", Number(props.y2) || 0);
		dom.setAttribute("stroke", props.stroke || "#ffffff");
		dom.setAttribute("stroke-width", Number(props.strokeWidth) || 2);
		dom.setAttribute("opacity", opacity);
		if (props.strokeDasharray)
			dom.setAttribute("stroke-dasharray", props.strokeDasharray);
		if (props.strokeDashoffset)
			dom.setAttribute("stroke-dashoffset", props.strokeDashoffset);
		return;
	}

	dom.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scaleVal})`;
	dom.style.opacity = opacity;

	// Type-specific content
	switch (type) {
		case "rect":
			dom.style.width = `${Number(props.width) || 80}px`;
			dom.style.height = `${Number(props.height) || 80}px`;
			if (props.fill) dom.style.backgroundColor = props.fill;
			break;
		case "circle": {
			const radius = Number(props.radius) || 40;
			dom.style.width = `${radius * 2}px`;
			dom.style.height = `${radius * 2}px`;
			if (props.fill) dom.style.backgroundColor = props.fill;
			break;
		}
		case "text":
			dom.textContent = props.text || "";
			dom.style.fontSize = `${Number(props.fontSize) || 16}px`;
			if (props.fill) dom.style.color = props.fill;
			break;
		case "image":
			if (props.src) dom.src = props.src;
			if (props.alt) dom.alt = props.alt;
			if (props.width) dom.style.width = `${Number(props.width)}px`;
			if (props.height) dom.style.height = `${Number(props.height)}px`;
			break;
		case "html":
			if (props.innerHTML !== undefined) dom.innerHTML = props.innerHTML;
			if (props.width) dom.style.width = `${Number(props.width)}px`;
			if (props.height) dom.style.height = `${Number(props.height)}px`;
			break;
		case "group":
			if (props.width) dom.style.width = `${Number(props.width)}px`;
			if (props.height) dom.style.height = `${Number(props.height)}px`;
			break;
	}

	// CSS passthrough — apply any remaining props as CSS styles
	for (const [key, value] of Object.entries(props)) {
		if (GSAP_TRANSFORM_PROPS.has(key)) continue;
		if (CONTENT_PROPS.has(key)) continue;
		if (key === "fill" || key === "opacity" || key === "radius") continue;
		if (key === "width" || key === "height" || key === "fontSize") continue;

		// Convert camelCase CSS props
		if (PX_PROPS.has(key) && typeof value === "number") {
			dom.style[key] = `${value}px`;
		} else if (typeof value === "string" || typeof value === "number") {
			dom.style[key] = String(value);
		}
	}
}

// --- Camera state ---

const camera = { x: 0, y: 0, zoom: 1, rotation: 0 };

function applyCameraTransform() {
	scene.style.transformOrigin = "center center";
	scene.style.transform = `translate(${-camera.x}px, ${-camera.y}px) scale(${camera.zoom}) rotate(${camera.rotation}deg)`;
}

// --- Animation control extraction ---

function extractAnimationControls(command) {
	const controls = {
		duration: command.duration || 1,
		ease: command.ease || "power2.out",
	};
	if (command.stagger) controls.stagger = command.stagger;
	if (command.repeat !== undefined) controls.repeat = command.repeat;
	if (command.yoyo !== undefined) controls.yoyo = command.yoyo;
	if (command.delay !== undefined) controls.delay = command.delay;
	if (command.repeatDelay !== undefined)
		controls.repeatDelay = command.repeatDelay;
	return controls;
}

// --- Command handling ---

function handleCommand(command) {
	switch (command.cmd) {
		case "scene.clear":
			gsap.killTweensOf("*");
			for (const [id] of elements) {
				const entry = elements.get(id);
				if (entry) entry.dom.remove();
			}
			elements.clear();
			if (window.__timelines) {
				for (const tl of Object.values(window.__timelines)) {
					tl.kill();
				}
				window.__timelines = {};
			}
			break;

		case "element.add":
			createOrUpdateElement({
				id: command.id,
				type: command.type,
				parent: command.parent,
				props: command.props || {},
			});
			break;

		case "element.remove":
			removeElement(command.id);
			break;

		case "element.set": {
			const entry = elements.get(command.id);
			if (entry) {
				Object.assign(entry.props, command.props);
				applyProps(entry.dom, entry.type, entry.props);
			}
			break;
		}

		case "gsap.set": {
			const targets = resolveTargets(command.target);
			if (targets.length > 0) {
				gsap.set(
					targets.length === 1 ? targets[0] : targets,
					propsToGsap(command.props),
				);
			}
			break;
		}

		case "animate.kill": {
			const targets = resolveTargets(command.target);
			for (const target of targets) {
				gsap.killTweensOf(target);
			}
			break;
		}

		case "animate.to": {
			const targets = resolveTargets(command.target);
			if (targets.length > 0) {
				const gsapProps = {
					...propsToGsap(command.props),
					...extractAnimationControls(command),
				};
				gsap.to(targets.length === 1 ? targets[0] : targets, gsapProps);
			}
			break;
		}

		case "animate.from": {
			const targets = resolveTargets(command.target);
			if (targets.length > 0) {
				const gsapProps = {
					...propsToGsap(command.props),
					...extractAnimationControls(command),
				};
				gsap.from(targets.length === 1 ? targets[0] : targets, gsapProps);
			}
			break;
		}

		case "animate.fromTo": {
			const targets = resolveTargets(command.target);
			if (targets.length > 0) {
				const toProps = {
					...propsToGsap(command.to_props),
					...extractAnimationControls(command),
				};
				gsap.fromTo(
					targets.length === 1 ? targets[0] : targets,
					propsToGsap(command.from_props),
					toProps,
				);
			}
			break;
		}

		case "animate.motionPath": {
			const targets = resolveTargets(command.target);
			if (targets.length > 0) {
				const motionPathConfig = { path: command.path };
				if (command.autoRotate !== undefined)
					motionPathConfig.autoRotate = command.autoRotate;
				if (command.alignOrigin !== undefined)
					motionPathConfig.alignOrigin = command.alignOrigin;
				if (command.start !== undefined) motionPathConfig.start = command.start;
				if (command.end !== undefined) motionPathConfig.end = command.end;

				const gsapProps = {
					motionPath: motionPathConfig,
					...extractAnimationControls(command),
				};
				gsap.to(targets.length === 1 ? targets[0] : targets, gsapProps);
			}
			break;
		}

		case "timeline.create": {
			const timelineVars = {
				paused: true,
				defaults: command.defaults || {},
			};
			if (command.repeat !== undefined) timelineVars.repeat = command.repeat;
			if (command.yoyo !== undefined) timelineVars.yoyo = command.yoyo;
			const timeline = gsap.timeline(timelineVars);
			window.__timelines = window.__timelines || {};
			window.__timelines[command.name] = timeline;
			break;
		}

		case "timeline.add": {
			const tl = window.__timelines?.[command.name];
			const targets = resolveTargets(command.target);
			if (tl && targets.length > 0) {
				const position = command.position || "+=0";
				const target = targets.length === 1 ? targets[0] : targets;
				const toGsap = propsToGsap(command.props);
				if (command.stagger) toGsap.stagger = command.stagger;
				if (command.tween_type === "to") {
					tl.to(target, toGsap, position);
				} else if (command.tween_type === "from") {
					tl.from(target, toGsap, position);
				} else if (command.tween_type === "fromTo" && command.from_props) {
					tl.fromTo(target, propsToGsap(command.from_props), toGsap, position);
				}
			}
			break;
		}

		case "timeline.play":
			window.__timelines?.[command.name]?.play();
			break;

		case "timeline.pause":
			window.__timelines?.[command.name]?.pause();
			break;

		case "timeline.reverse":
			window.__timelines?.[command.name]?.reverse();
			break;

		case "timeline.seek": {
			const tl = window.__timelines?.[command.name];
			if (tl) {
				const pos = Number(command.position);
				tl.seek(Number.isNaN(pos) ? command.position : pos);
			}
			break;
		}

		case "timeline.label": {
			const tl = window.__timelines?.[command.name];
			if (tl) {
				tl.addLabel(command.label, command.position || "+=0");
			}
			break;
		}

		case "text.typewriter": {
			const entry = elements.get(command.target);
			if (entry) {
				const text = command.text;
				const proxy = { length: 0 };
				const cursorSpan = command.cursor
					? '<span class="typewriter-cursor">|</span>'
					: "";
				gsap.to(proxy, {
					length: text.length,
					duration: command.duration || text.length * 0.05,
					ease: command.ease || "none",
					onUpdate: () => {
						const revealed = text.slice(0, Math.round(proxy.length));
						if (command.cursor) {
							entry.dom.innerHTML = revealed + cursorSpan;
						} else {
							entry.dom.textContent = revealed;
						}
					},
					onComplete: () => {
						entry.dom.textContent = text;
					},
				});
			}
			break;
		}

		case "text.scramble": {
			const entry = elements.get(command.target);
			if (entry) {
				const text = command.text;
				const chars =
					command.chars ||
					"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
				const proxy = { progress: 0 };
				gsap.to(proxy, {
					progress: 1,
					duration: command.duration || 1,
					ease: "none",
					onUpdate: () => {
						const revealedCount = Math.floor(proxy.progress * text.length);
						let result = text.slice(0, revealedCount);
						for (let i = revealedCount; i < text.length; i++) {
							result += chars[Math.floor(Math.random() * chars.length)];
						}
						entry.dom.textContent = result;
					},
					onComplete: () => {
						entry.dom.textContent = text;
					},
				});
			}
			break;
		}

		case "camera.set": {
			if (command.x !== undefined) camera.x = command.x;
			if (command.y !== undefined) camera.y = command.y;
			if (command.zoom !== undefined) camera.zoom = command.zoom;
			if (command.rotation !== undefined) camera.rotation = command.rotation;
			applyCameraTransform();
			break;
		}

		case "camera.animate": {
			const cameraTarget = {};
			if (command.x !== undefined) cameraTarget.x = command.x;
			if (command.y !== undefined) cameraTarget.y = command.y;
			if (command.zoom !== undefined) cameraTarget.zoom = command.zoom;
			if (command.rotation !== undefined)
				cameraTarget.rotation = command.rotation;
			gsap.to(camera, {
				...cameraTarget,
				duration: command.duration || 1,
				ease: command.ease || "power2.out",
				onUpdate: applyCameraTransform,
			});
			break;
		}
	}
}

// --- Helpers ---

/** Resolve target string to DOM elements. Supports single id, comma-separated, or * for all. */
function resolveTargets(target) {
	if (target === "*") {
		return [...elements.values()].map((e) => e.dom);
	}
	if (target.includes(",")) {
		return target
			.split(",")
			.map((id) => elements.get(id.trim()))
			.filter(Boolean)
			.map((e) => e.dom);
	}
	const entry = elements.get(target);
	return entry ? [entry.dom] : [];
}

function propsToGsap(props) {
	const result = {};
	for (const [key, value] of Object.entries(props)) {
		switch (key) {
			// GSAP native transform props — pass through directly
			case "x":
			case "y":
			case "rotation":
			case "scale":
			case "scaleX":
			case "scaleY":
			case "skewX":
			case "skewY":
			case "opacity":
			case "transformOrigin":
			case "xPercent":
			case "yPercent":
			case "motionPath":
				result[key] = value;
				break;
			// Dimension props — add px
			case "width":
			case "height":
				result[key] = typeof value === "number" ? `${value}px` : value;
				break;
			// Color mapping
			case "fill":
				result.backgroundColor = value;
				break;
			case "fontSize":
				result.fontSize = typeof value === "number" ? `${value}px` : value;
				break;
			// SVG line props
			case "x1":
			case "y1":
			case "x2":
			case "y2":
			case "strokeWidth":
				result.attr = result.attr || {};
				result.attr[key === "strokeWidth" ? "stroke-width" : key] = value;
				break;
			case "stroke":
				result.attr = result.attr || {};
				result.attr.stroke = value;
				break;
			case "d":
			case "strokeDasharray":
			case "strokeDashoffset":
			case "strokeLinecap":
			case "strokeLinejoin":
				result.attr = result.attr || {};
				result.attr[
					key === "strokeDasharray"
						? "stroke-dasharray"
						: key === "strokeDashoffset"
							? "stroke-dashoffset"
							: key === "strokeLinecap"
								? "stroke-linecap"
								: key === "strokeLinejoin"
									? "stroke-linejoin"
									: key
				] = value;
				break;
			// CSS passthrough — borderRadius, boxShadow, filter, background, clipPath, etc.
			default:
				if (PX_PROPS.has(key) && typeof value === "number") {
					result[key] = `${value}px`;
				} else {
					result[key] = value;
				}
		}
	}
	return result;
}

// --- Scene sync ---

function handleSceneSync(data) {
	const syncIds = new Set(data.elements.map((e) => e.id));
	for (const [id] of elements) {
		if (!syncIds.has(id)) {
			removeElement(id);
		}
	}
	for (const el of data.elements) {
		createOrUpdateElement(el);
	}
}

function handleSceneTick(data) {
	for (const el of data.elements) {
		const entry = elements.get(el.id);
		if (entry) {
			Object.assign(entry.props, el.props);
			applyProps(entry.dom, entry.type, entry.props);
		}
	}
}

// --- WebSocket connection ---

function connect() {
	const protocol = location.protocol === "https:" ? "wss:" : "ws:";
	const ws = new WebSocket(`${protocol}//${location.host}`);

	ws.onopen = () => {
		statusElement.textContent = "connected";
		statusElement.className = "connected";
		console.log("[gsap-cli] Connected");
	};

	ws.onclose = () => {
		statusElement.textContent = "disconnected";
		statusElement.className = "disconnected";
		console.log("[gsap-cli] Disconnected, reconnecting...");
		setTimeout(connect, 1000);
	};

	ws.onerror = () => {
		ws.close();
	};

	ws.onmessage = (event) => {
		try {
			const message = JSON.parse(event.data);
			switch (message.type) {
				case "command":
					handleCommand(message.command);
					break;
				case "scene.sync":
					handleSceneSync(message);
					break;
				case "scene.tick":
					handleSceneTick(message);
					break;
			}
		} catch (error) {
			console.error("[gsap-cli] Message parse error:", error);
		}
	};
}

connect();
