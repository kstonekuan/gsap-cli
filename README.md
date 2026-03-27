# gsap-cli

A CLI tool that lets an AI agent (like Claude Code) autonomously drive [GSAP](https://gsap.com/) animations in real time. The agent issues shell commands; the user sees animations render live in the terminal or browser.

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
Renderer (terminal or browser)
```

- **CLI**: Single static Rust binary (~1ms startup). Sends commands over Unix socket.
- **Daemon**: Bun process running in a separate terminal. Manages the scene graph, GSAP tweens/timelines, and renderers.
- **Browser mode**: GSAP runs natively in the browser via WebSocket relay — full animation fidelity without pushing 60fps data over the wire.
- **Terminal mode**: GSAP runs in Bun animating plain objects, rendered to the TTY at ~30fps via raw ANSI escape sequences.

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
bun daemon/src/index.ts --mode browser --port 3000
# or: bun daemon/src/index.ts --mode terminal

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
gsap-cli element add <id> --type rect|circle|text [--props '{}']
gsap-cli element remove <id>
gsap-cli element set <id> --props '{}'
```

### Animation

```bash
gsap-cli animate to|from|fromTo <target> --props '{}' [--duration 1] [--ease power2.out]
```

### Timelines

```bash
gsap-cli timeline create <name> [--defaults '{}']
gsap-cli timeline add <name> <tween-type> <target> --props '{}' [--position "<"]
gsap-cli timeline play|pause|reverse|seek <name>
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
# bun daemon/src/index.ts --mode browser

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

## Further Reading

- [spec.md](./spec.md) — full project specification and implementation phases
