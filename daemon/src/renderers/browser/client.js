/* global gsap */

const scene = document.getElementById("scene");
const statusElement = document.getElementById("status");
const elements = new Map();

function createOrUpdateElement(data) {
	let element = elements.get(data.id);

	if (!element) {
		element = document.createElement("div");
		element.id = `el-${data.id}`;
		element.classList.add("element", `element-${data.type}`);
		scene.appendChild(element);
		elements.set(data.id, { dom: element, type: data.type, props: {} });
	}

	const entry = elements.get(data.id);
	Object.assign(entry.props, data.props);
	applyProps(element, data.type, entry.props);
}

function removeElement(id) {
	const entry = elements.get(id);
	if (entry) {
		entry.dom.remove();
		elements.delete(id);
	}
}

function applyProps(dom, type, props) {
	const x = Number(props.x) || 0;
	const y = Number(props.y) || 0;
	const opacity = props.opacity !== undefined ? Number(props.opacity) : 1;
	const rotation = Number(props.rotation) || 0;
	const scale = props.scale !== undefined ? Number(props.scale) : 1;

	dom.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
	dom.style.opacity = opacity;

	if (type === "rect") {
		dom.style.width = `${Number(props.width) || 80}px`;
		dom.style.height = `${Number(props.height) || 80}px`;
		dom.style.backgroundColor = props.fill || "#00ff88";
	} else if (type === "circle") {
		const radius = Number(props.radius) || 40;
		dom.style.width = `${radius * 2}px`;
		dom.style.height = `${radius * 2}px`;
		dom.style.backgroundColor = props.fill || "#00ff88";
	} else if (type === "text") {
		dom.textContent = props.text || "";
		dom.style.fontSize = `${Number(props.fontSize) || 16}px`;
		dom.style.color = props.fill || "#ffffff";
	}
}

function handleCommand(command) {
	switch (command.cmd) {
		case "element.add":
			createOrUpdateElement({
				id: command.id,
				type: command.type,
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

		case "animate.to": {
			const entry = elements.get(command.target);
			if (entry) {
				gsap.to(entry.dom, {
					...propsToGsap(command.props),
					duration: command.duration || 1,
					ease: command.ease || "power2.out",
				});
			}
			break;
		}

		case "animate.from": {
			const entry = elements.get(command.target);
			if (entry) {
				gsap.from(entry.dom, {
					...propsToGsap(command.props),
					duration: command.duration || 1,
					ease: command.ease || "power2.out",
				});
			}
			break;
		}

		case "animate.fromTo": {
			const entry = elements.get(command.target);
			if (entry) {
				gsap.fromTo(entry.dom, propsToGsap(command.from_props), {
					...propsToGsap(command.to_props),
					duration: command.duration || 1,
					ease: command.ease || "power2.out",
				});
			}
			break;
		}

		case "timeline.create": {
			const timeline = gsap.timeline({
				paused: true,
				defaults: command.defaults || {},
			});
			window.__timelines = window.__timelines || {};
			window.__timelines[command.name] = timeline;
			break;
		}

		case "timeline.add": {
			const tl = window.__timelines?.[command.name];
			const entry = elements.get(command.target);
			if (tl && entry) {
				const position = command.position || "+=0";
				if (command.tween_type === "to") {
					tl.to(entry.dom, propsToGsap(command.props), position);
				} else if (command.tween_type === "from") {
					tl.from(entry.dom, propsToGsap(command.props), position);
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
	}
}

function propsToGsap(props) {
	const result = {};
	for (const [key, value] of Object.entries(props)) {
		switch (key) {
			case "x":
			case "y":
			case "rotation":
			case "scale":
			case "scaleX":
			case "scaleY":
			case "opacity":
				result[key] = value;
				break;
			case "width":
			case "height":
				result[key] = `${value}px`;
				break;
			case "fill":
				result.backgroundColor = value;
				break;
			case "fontSize":
				result.fontSize = `${value}px`;
				break;
			default:
				result[key] = value;
		}
	}
	return result;
}

function handleSceneSync(data) {
	// Remove elements not in sync
	const syncIds = new Set(data.elements.map((e) => e.id));
	for (const [id] of elements) {
		if (!syncIds.has(id)) {
			removeElement(id);
		}
	}
	// Create/update all elements
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

// WebSocket connection
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
