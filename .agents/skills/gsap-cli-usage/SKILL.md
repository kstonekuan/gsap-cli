---
name: gsap-cli-usage
description: How to use the gsap-cli tool to create and animate scenes from the command line. Use this skill whenever the user asks you to animate something, create a visual scene, drive GSAP animations via CLI, or when you need to use gsap-cli commands. Also use when the user mentions gsap-cli, gsap-daemon, browser animations, or wants to build animated stories/demos.
---

# gsap-cli Usage Guide

This skill teaches you how to use `gsap-cli` to create elements and animate them in real time, rendered in a browser or terminal.

## Architecture

```
You (the agent) run CLI commands
  → gsap-cli (Rust binary) sends JSON over Unix socket
    → gsap-daemon (Bun process in separate terminal) manages the scene
      → Browser or terminal renderer displays the animation
```

The user starts the daemon manually. You only use the CLI binary.

## Before You Start

Always check if the daemon is running first:

```bash
gsap-cli status
```

If you get "Cannot connect to daemon", tell the user to start the daemon:
```bash
bun daemon/src/index.ts --mode browser --port 3000
```

The CLI binary is at `cli/target/release/gsap-cli`. If the binary isn't built, tell the user to run `cd cli && cargo build --release`.

## Element Types

There are three element types, each with specific props:

### rect
A colored rectangle.
```bash
gsap-cli element add mybox --type rect --props '{"x":100,"y":200,"width":80,"height":80,"fill":"#00ff88"}'
```
Props: `x`, `y`, `width` (default 80), `height` (default 80), `fill` (hex color, default "#00ff88"), `opacity` (0-1), `borderRadius`

### circle
A colored circle.
```bash
gsap-cli element add dot --type circle --props '{"x":300,"y":200,"radius":40,"fill":"#ff6b6b"}'
```
Props: `x`, `y`, `radius` (default 40), `fill` (hex color), `opacity`

### text
A text label.
```bash
gsap-cli element add title --type text --props '{"x":200,"y":50,"text":"Hello World","fontSize":32,"fill":"#ffffff"}'
```
Props: `x`, `y`, `text` (the string to display), `fontSize` (default 16), `fill` (text color), `fontWeight`, `opacity`

## Animatable Properties

These properties can be animated with `gsap-cli animate` or timeline tweens:

| Property | Description | Notes |
|----------|------------|-------|
| `x` | Horizontal position (px) | Transform-based, smooth |
| `y` | Vertical position (px) | Transform-based, smooth |
| `rotation` | Rotation in degrees | e.g., 360 for full spin |
| `opacity` | Transparency (0-1) | Great for fade in/out |
| `width` | Element width (px) | Rect only |
| `height` | Element height (px) | Rect only |
| `fontSize` | Text size (px) | Text only |
| `fill` | Color (hex string) | Maps to backgroundColor/color |
| `radius` | Circle radius (px) | Circle only |

Note: `scale`, `scaleX`, `scaleY` work in the browser renderer via GSAP's native transform handling, but the daemon-side scene graph doesn't track them. Use them in browser mode only.

## Commands

### Check Status
```bash
gsap-cli status
```

### Create Elements
```bash
gsap-cli element add <id> --type rect|circle|text [--props '<json>']
gsap-cli element set <id> --props '<json>'
gsap-cli element remove <id>
```

### Animate
```bash
# Animate TO target values
gsap-cli animate to <element-id> --props '<json>' [--duration 1] [--ease power2.out]

# Animate FROM starting values (element snaps to these, then animates to current)
gsap-cli animate from <element-id> --props '<json>' [--duration 1] [--ease power2.out]

# Animate FROM one set of values TO another
gsap-cli animate fromTo <element-id> --props '<to-json>' --from-props '<from-json>' [--duration 1] [--ease power2.out]
```

Defaults: duration=1 second, ease="power2.out"

### Timelines
Timelines let you sequence multiple animations with precise timing control.

```bash
# Create a paused timeline with optional defaults
gsap-cli timeline create <name> [--defaults '{"duration":0.8,"ease":"power2.out"}']

# Add tweens to the timeline
gsap-cli timeline add <name> to|from <element-id> --props '<json>' [--position "<"]

# Control playback
gsap-cli timeline play <name>
gsap-cli timeline pause <name>
gsap-cli timeline reverse <name>
gsap-cli timeline seek <name> <position>
```

### Timeline Position Parameter
The `--position` flag controls when a tween starts relative to others:

| Position | Meaning |
|----------|---------|
| `"0"` | At the very start of the timeline |
| `"+=0"` | After the previous tween ends (default) |
| `"+=0.5"` | 0.5s after the previous tween ends |
| `"<"` | At the same time as the previous tween |
| `"<0.2"` | 0.2s after the previous tween starts |

### GSAP Easing
Common easing functions:
- `power1.out`, `power2.out`, `power3.out` (gentle to strong deceleration)
- `power1.in`, `power2.in` (gentle to strong acceleration)
- `power1.inOut`, `power2.inOut` (smooth both ends)
- `elastic.out`, `bounce.out`, `back.out` (expressive)
- `none` (linear)

### Pipe Mode
For sending many commands efficiently:
```bash
gsap-cli pipe
```
Reads JSON commands from stdin (one per line), writes responses to stdout.

### Screenshot
Capture the current browser frame (requires Playwright):
```bash
gsap-cli screenshot --output /tmp/frame.png
```

## Patterns

### Fade In Narration Text
```bash
gsap-cli element add narration --type text --props '{"x":200,"y":600,"text":"","fontSize":20,"fill":"#8888cc","opacity":0}'

# Show text
gsap-cli element set narration --props '{"text":"Once upon a time..."}'
gsap-cli animate to narration --props '{"opacity":1}' --duration 1.5 --ease power2.out

# Later, fade out and change
sleep 3
gsap-cli animate to narration --props '{"opacity":0}' --duration 1 --ease power2.in
sleep 1.5
gsap-cli element set narration --props '{"text":"The end."}'
gsap-cli animate to narration --props '{"opacity":1}' --duration 1.5 --ease power2.out
```

### Building a Scene Layer by Layer
Create background elements first, foreground elements last. Elements render in creation order.

```bash
# Background
gsap-cli element add sky --type rect --props '{"x":0,"y":0,"width":1200,"height":700,"fill":"#0a0a2e"}'
gsap-cli element add ground --type rect --props '{"x":0,"y":500,"width":1200,"height":200,"fill":"#1a1a3e"}'

# Midground
gsap-cli element add building --type rect --props '{"x":200,"y":300,"width":80,"height":200,"fill":"#151530"}'

# Foreground
gsap-cli element add hero --type circle --props '{"x":100,"y":450,"radius":20,"fill":"#ffcc00"}'
```

### Sequenced Animation with Timelines
```bash
gsap-cli timeline create intro --defaults '{"duration":0.8,"ease":"power2.out"}'
gsap-cli timeline add intro to title --props '{"y":100,"opacity":1}' --position "0"
gsap-cli timeline add intro to box --props '{"x":350,"rotation":360}' --position "<0.2"
gsap-cli timeline add intro to dot --props '{"x":600}' --position "<0.3"
gsap-cli timeline play intro
```

### Color Transitions
Animate `fill` to smoothly transition colors:
```bash
gsap-cli animate to sky --props '{"fill":"#4a2080"}' --duration 3 --ease power1.inOut
```

### Pacing with Sleep
When telling a story or running a demo, use `sleep` between animation beats so the viewer has time to watch each animation complete:
```bash
gsap-cli animate to hero --props '{"x":400}' --duration 2
sleep 2.5  # Wait for animation + a beat
gsap-cli animate to hero --props '{"y":200}' --duration 1
sleep 1.5
```

## Tips

- Always run `gsap-cli status` first to verify the daemon is connected
- Use single quotes around JSON props on the command line to avoid shell escaping issues
- Chain independent commands with `&&` for reliability
- Store the CLI path in a variable for convenience: `CLI=/path/to/gsap-cli`
- For batch operations, use multiple commands in a single `&&` chain rather than separate calls
- When creating animated stories, build the full scene first, then animate in chapters
- Colors must be hex format (e.g., `"#ff6b6b"`), not CSS names
- The browser canvas is roughly 1200x700 by default (depends on browser window size)
- Elements are positioned from their top-left corner (rects) or center (circles)
