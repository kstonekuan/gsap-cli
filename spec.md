# gsap-cli: Agent-Driven Real-Time Animation CLI

## Context

The goal is to build a CLI tool that lets an AI agent (like Claude Code) autonomously drive GSAP animations in real time. The agent issues shell commands; the user sees animations render live.

## Architecture

Three-layer design:

```
Agent (Claude Code)
  |  shell commands
  v
CLI binary (gsap-cli, Rust)
  |  Unix domain socket IPC (/tmp/gsap-cli.sock)
  v
Daemon (gsap-daemon, foreground Node.js process)
  |  manages scene graph + forwards commands
  v
Renderer (terminal or browser)
```

The daemon runs in the **foreground** in a separate terminal. The user starts it manually; the agent does not manage it. The agent only uses the Rust CLI to send commands.

**Key insight**: In browser mode, GSAP runs *in the browser* (not Node.js). The daemon relays commands over WebSocket to a browser client that executes `gsap.to()` etc. natively. This gives full animation fidelity without pushing 60fps position data over the wire.

In terminal mode, GSAP runs in Node.js animating plain objects, and a terminal renderer rasterizes their properties to the TTY at ~30fps.

## Tech Stack

**CLI (Rust)**:
- `clap` for argument parsing (derive API)
- `serde` + `serde_json` for command serialization
- `std::os::unix::net::UnixStream` for IPC (no extra deps)
- Single static binary, ~1ms startup (vs ~50-100ms for Node.js)

**Daemon (TypeScript)**:
- pnpm, tsup (esbuild bundler)
- `zod` for command validation
- Node `net` module for Unix domain socket listener
- `terminal-kit` for terminal rendering
- `fastify` + `ws` for browser mode HTTP/WebSocket server
- `gsap` npm package
- `playwright` (optional) for screenshots

## Daemon

Started by the user in a separate terminal:

```
gsap-daemon --mode browser [--port 3000]
gsap-daemon --mode terminal
```

Runs in the foreground, logs to stdout. Listens on Unix socket at `/tmp/gsap-cli.sock`.

## CLI Commands

The agent only uses these commands:

```
gsap-cli status
gsap-cli element add <id> --type rect|circle|text [--props '{}']
gsap-cli element remove <id>
gsap-cli element set <id> --props '{}'
gsap-cli animate to|from|fromTo <target> --props '{}' [--duration 1] [--ease power2.out]
gsap-cli timeline create <name> [--defaults '{}']
gsap-cli timeline add <name> <tween-type> <target> --props '{}' [--position "<"]
gsap-cli timeline play|pause|reverse|seek <name>
gsap-cli pipe                          # STDIN streaming mode (JSON per line)
gsap-cli screenshot --output /tmp/frame.png
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

## File Structure

```
gsap-cli/
  cli/                                # Rust CLI binary
    Cargo.toml
    src/
      main.rs                        # Entry point, clap setup
      commands/
        mod.rs
        status.rs
        element.rs, animate.rs
        timeline.rs, pipe.rs, screenshot.rs
      ipc.rs                         # Unix socket client
      protocol.rs                    # Command/response types (mirrors daemon)

  daemon/                            # TypeScript daemon
    package.json
    tsconfig.json
    tsup.config.ts
    src/
      index.ts                       # Daemon entry point
      server.ts                      # Socket listener, lifecycle
      scene.ts                       # Scene graph (Map of element objects)
      commands.ts                    # Command router + handlers
      ticker.ts                      # GSAP ticker bridge to renderers
      animation-manager.ts           # Tween/timeline tracking + cleanup
      screenshot.ts                  # Playwright capture
      renderers/
        types.ts                     # Renderer interface
        terminal.ts                  # terminal-kit renderer
        browser.ts                   # fastify + ws server
        browser/
          index.html, client.ts, styles.css  # Browser-side GSAP client
      protocol/
        types.ts                     # Command/response types (shared)
        schema.ts                    # Zod validation schemas
```

## Implementation Phases

### Phase 1: Foundation
- Rust CLI: `Cargo.toml`, clap subcommands, serde protocol types, Unix socket IPC client
- Daemon: `package.json`, `tsconfig.json`, `tsup.config.ts`, biome config
- Shared protocol: JSON command/response format defined in both Rust (serde) and TS (zod)
- Daemon runs in foreground, listens on Unix socket
- CLI `status` command to check daemon connectivity
- Scene graph with element CRUD (`element add/remove/set`)

### Phase 2: Terminal Renderer
- `terminal-kit` based renderer mapping scene state to terminal cells
- Wire GSAP ticker in daemon to push scene state to renderer
- `animate to/from/fromTo` commands creating GSAP tweens on scene objects
- Animation manager for tracking active tweens

### Phase 3: Browser Renderer
- Fastify HTTP server serving bundled HTML/JS
- WebSocket bridge forwarding commands to browser
- Browser client with its own GSAP instance executing tweens natively
- Auto-open browser on daemon start in browser mode

### Phase 4: Timelines + Advanced Control
- `timeline create/add/play/pause/reverse/seek` commands
- Position parameter support (GSAP timeline position syntax)
- Named timelines with defaults

### Phase 5: Agent Integration
- `gsap-cli pipe` for STDIN streaming (JSON per line, responses on STDOUT)
- `gsap-cli screenshot` via Playwright for visual feedback loops
- Document the protocol for agent consumption

## Agent Usage Example

```bash
# User starts daemon in another terminal: gsap-daemon --mode browser
gsap-cli element add box --type rect --props '{"x":100,"y":200,"width":80,"height":80,"fill":"#00ff88"}'
gsap-cli element add title --type text --props '{"x":400,"y":50,"text":"Hello","fontSize":48,"fill":"#fff"}'
gsap-cli timeline create intro --defaults '{"duration":0.8,"ease":"power2.out"}'
gsap-cli timeline add intro to title --props '{"y":80,"opacity":1}' --position "0"
gsap-cli timeline add intro to box --props '{"x":350,"rotation":360}' --position "<0.2"
gsap-cli timeline play intro
gsap-cli screenshot --output /tmp/frame.png
# Agent reads screenshot, decides next animation...
```

## Verification

1. `gsap-daemon --mode terminal` in one terminal + CLI commands in another -> visible terminal animation
2. `gsap-daemon --mode browser` + same CLI commands -> browser animation with full GSAP fidelity
3. `gsap-cli pipe` accepts JSON commands on STDIN and returns responses
4. `gsap-cli screenshot` captures current browser frame
5. `cargo clippy --all-targets --all-features` and `cargo fmt` pass for CLI
6. `pnpm check` (biome) passes for daemon with no errors
7. End-to-end: script that starts daemon, creates scene, animates, screenshots, stops daemon
