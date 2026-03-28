# gsap-cli

A CLI tool that lets an AI agent (like Claude Code) autonomously drive [GSAP](https://gsap.com/) animations in real time. The agent issues shell commands; the user sees animations render live in the browser.

## Architecture

```
Agent (Claude Code)
  |  shell commands
  v
CLI binary (gsap-cli, Rust)
  |  Unix domain socket IPC (/tmp/gsap-cli.sock)
  v
Daemon (gsap-daemon, TypeScript/Bun)
  |  manages scene graph + forwards commands
  v
Browser renderer
```

- **CLI**: Single static Rust binary (~1ms startup). Sends commands over Unix socket.
- **Daemon**: Bun process running in a separate terminal. Manages the scene graph, GSAP tweens/timelines, and the browser renderer.
- **Browser**: GSAP runs natively in the browser via WebSocket relay — full animation fidelity without pushing 60fps data over the wire.

## Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Bun](https://bun.sh/) >= 1.0

## Quick Start

### Build

```bash
# Build the CLI
cd cli && cargo build --release

# Build the daemon
cd daemon && bun install && bun run build
```

### Run

```bash
# Terminal 1: Start the daemon
bun daemon/src/index.ts --port 3000

# Terminal 2: Send commands
gsap-cli status
gsap-cli element add box --type rect --props '{"x":100,"y":200,"width":80,"height":80,"fill":"#00ff88"}'
gsap-cli animate to box --props '{"x":400,"rotation":360}' --duration 1 --ease power2.out
```

The CLI binary is at `cli/target/release/gsap-cli`.

## CLI Commands

### Status

```bash
gsap-cli status
```

### Elements

```bash
gsap-cli element add <id> --type rect|circle|text|line|path|image|html|group [--parent <group-id>] [--props '{}']
gsap-cli element remove <id>
gsap-cli element set <id> --props '{}'
```

### Animation

```bash
gsap-cli animate to|from|fromTo <target> --props '{}' [--from-props '{}'] \
  [--duration 1] [--ease power2.out] [--stagger 0.1] \
  [--repeat -1] [--yoyo] [--delay 0] [--repeat-delay 0] [--wait]
```

Target can be a single ID, comma-separated IDs (`box1,box2`), or `*` for all elements.

### Animation Status

```bash
gsap-cli animate-status <tween-id>
```

### Motion Path

Animate an element along an SVG path:

```bash
gsap-cli motion-path <target> --path "M0,0 C100,-100 200,100 300,0" \
  [--auto-rotate] [--duration 2] [--ease power2.inOut] \
  [--repeat -1] [--yoyo] [--delay 0] [--wait]
```

### Timelines

```bash
gsap-cli timeline create <name> [--defaults '{}']
gsap-cli timeline add <name> to|from|fromTo <target> --props '{}' [--from-props '{}'] [--position "<"]
gsap-cli timeline play <name> [--wait]
gsap-cli timeline pause <name>
gsap-cli timeline reverse <name>
gsap-cli timeline seek <name> <position>
gsap-cli timeline label <name> <label> [--position "<"]
```

### Text Effects

```bash
gsap-cli text typewriter <target> "<text>" [--duration 2] [--ease none] [--cursor] [--wait]
gsap-cli text scramble <target> "<text>" [--duration 1.5] [--chars "01!@#%"] [--wait]
```

### Camera Control

```bash
gsap-cli camera set [--x 100] [--y 50] [--zoom 1.5] [--rotation 5]
gsap-cli camera animate [--x 100] [--y 50] [--zoom 1.5] [--rotation 5] [--duration 2] [--ease power2.inOut] [--wait]
```

### Pipe Mode

Stream JSON commands via stdin for agent integration:

```bash
gsap-cli pipe
```

Reads one JSON command per line from stdin, sends each to the daemon, and writes JSON responses to stdout.

### Screenshot

Capture the current browser frame (requires [Playwright](https://playwright.dev/)):

```bash
gsap-cli screenshot --output /tmp/frame.png
```

## Agent Usage Example

```bash
# User starts daemon in another terminal:
# bun daemon/src/index.ts

gsap-cli element add box --type rect --props '{"x":100,"y":200,"width":80,"height":80,"fill":"#00ff88"}'
gsap-cli element add title --type text --props '{"x":400,"y":50,"text":"Hello","fontSize":48,"fill":"#fff"}'
gsap-cli timeline create intro --defaults '{"duration":0.8,"ease":"power2.out"}'
gsap-cli timeline add intro to title --props '{"y":80,"opacity":1}' --position "0"
gsap-cli timeline add intro to box --props '{"x":350,"rotation":360}' --position "<0.2"
gsap-cli timeline play intro
gsap-cli screenshot --output /tmp/frame.png
# Agent reads screenshot, decides next animation...
```

## IPC Protocol

Unix domain socket at `/tmp/gsap-cli.sock`. Newline-delimited JSON.

**Request**:
```json
{"cmd": "animate.to", "target": "box1", "props": {"x": 200}, "duration": 1, "ease": "power2.out"}
```

**Response**:
```json
{"ok": true, "id": "tween_3"}
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for code quality tools and style guidelines.


