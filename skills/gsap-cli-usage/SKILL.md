---
name: gsap-cli-usage
description: How to use the gsap-cli tool to create and animate scenes from the command line. Use this skill whenever the user asks you to animate something, create a visual scene, drive GSAP animations via CLI, or when you need to use gsap-cli commands. Also use when the user mentions gsap-cli, gsap-daemon, browser animations, or wants to build animated stories/demos.
---

# gsap-cli Usage Guide

This skill teaches you how to use `gsap-cli` to create elements and animate them in real time, rendered in the browser.

## Architecture

```
You (the agent) run CLI commands
  -> gsap-cli (Rust binary) sends JSON over Unix socket
    -> gsap-daemon (Bun process in separate terminal) manages the scene
      -> Browser renderer displays the animation via GSAP natively
```

The user starts the daemon manually. You only use the CLI binary.

## Before You Start

Always check if the daemon is running first:

```bash
gsap-cli status
```

If you get "Cannot connect to daemon", tell the user to start the daemon with `--watch` so it auto-reloads on code changes:
```bash
bun --watch daemon/src/index.ts --port 3000
```

The CLI binary is at `cli/target/release/gsap-cli`. If the binary isn't built, tell the user to run `cd cli && cargo build --release`.

## Performance: Use Batch Mode

Each `gsap-cli` invocation spawns a process and opens a socket connection. For scene setup with many elements, **use batch mode** to send all commands in a single connection. Batch accepts two formats:

**JSON format** (traditional):
```bash
echo '[
  {"cmd":"element.add","id":"bg","type":"rect","props":{"x":0,"y":0,"width":1200,"height":700,"fill":"#0a0a1a"}},
  {"cmd":"element.add","id":"title","type":"text","props":{"x":400,"y":300,"text":"Hello","fontSize":64,"fill":"#ffffff","opacity":0}},
  {"cmd":"element.add","id":"box1","type":"rect","props":{"x":100,"y":500,"width":200,"height":100,"fill":"#1a1a3a","opacity":0}},
  {"cmd":"element.add","id":"box2","type":"rect","props":{"x":500,"y":500,"width":200,"height":100,"fill":"#1a1a3a","opacity":0}},
  {"cmd":"gsap.set","target":"box1,box2","props":{"transformOrigin":"50% 100%"}}
]' | gsap-cli batch
```

**CLI format** (same commands you'd type on the command line, from a file):
```bash
gsap-cli batch --file scene-setup.txt
```

Where `scene-setup.txt` contains:
```
# Background and elements
element add bg --type rect --props '{"x":0,"y":0,"width":1200,"height":700,"fill":"#0a0a1a"}'
element add title --type text --props '{"x":400,"y":300,"text":"Hello","fontSize":64,"fill":"#ffffff","opacity":0}'
element add box1 --type rect --props '{"x":100,"y":500,"width":200,"height":100,"fill":"#1a1a3a","opacity":0}'
element add box2 --type rect --props '{"x":500,"y":500,"width":200,"height":100,"fill":"#1a1a3a","opacity":0}'
set box1,box2 --props '{"transformOrigin":"50% 100%"}'
```

The format is auto-detected: if input starts with `[`, it's JSON; otherwise, CLI commands.

**When to batch:**
- Creating 3+ elements at once (scene setup)
- Setting initial GSAP properties on multiple elements (transformOrigin, scale)
- Any sequence of commands that don't need intermediate responses

**When NOT to batch:**
- Commands with `--wait` (need to block before next step)
- Interactive sequences where you need to read responses between steps
- Single commands (no benefit)

For individual shell commands, **combine multiple independent commands in a single Bash call** using `&&` or newlines to avoid multiple shell round-trips.

## Element Types

### rect
A colored rectangle. Positioned by its **top-left corner**.
```bash
gsap-cli element add mybox --type rect --props '{"x":100,"y":200,"width":80,"height":80,"fill":"#00ff88"}'
```
Props: `x`, `y`, `width` (default 80), `height` (default 80), `fill` (hex color), `opacity` (0-1), `borderRadius`

### circle
A colored circle. Uses `radius`, NOT `width`/`height`.
```bash
gsap-cli element add dot --type circle --props '{"x":300,"y":200,"radius":40,"fill":"#ff6b6b"}'
```
Props: `x`, `y`, `radius` (default 40), `fill` (hex color), `opacity`

### text
A text label. Positioned by its **top-left corner** -- you must manually offset `x` to visually center text.
```bash
gsap-cli element add title --type text --props '{"x":200,"y":50,"text":"Hello World","fontSize":32,"fill":"#ffffff","fontFamily":"monospace"}'
```
Props: `x`, `y`, `text` (the string to display), `fontSize` (default 16), `fill` (text color), `fontFamily`, `fontWeight`, `opacity`

### line (SVG)
An SVG line. Uses `x1/y1/x2/y2` and `stroke`, NOT `x/y/fill`.
```bash
gsap-cli element add divider --type line --props '{"x1":100,"y1":300,"x2":500,"y2":300,"stroke":"#ffffff","strokeWidth":2}'
```
Props: `x1`, `y1`, `x2`, `y2`, `stroke` (color), `strokeWidth`, `opacity`, `strokeDasharray`, `strokeDashoffset`

### path (SVG)
An SVG path element for complex shapes.
```bash
gsap-cli element add curve --type path --props '{"d":"M10 80 C 40 10, 65 10, 95 80","stroke":"#ff0088","strokeWidth":2,"fill":"none"}'
```
Props: `d` (SVG path data), `stroke`, `strokeWidth`, `fill`, `opacity`, `strokeDasharray`, `strokeDashoffset`, `strokeLinecap`, `strokeLinejoin`

### image
An image element.
```bash
gsap-cli element add logo --type image --props '{"x":100,"y":100,"src":"https://example.com/logo.png","width":200,"height":100}'
```
Props: `x`, `y`, `src`, `alt`, `width`, `height`, `opacity`

### group
A container for nesting child elements. Children are positioned relative to the group. Animating a group's `rotation` or `scale` affects all children -- useful for skeletal animation with joint pivots.
```bash
gsap-cli element add panel --type group --props '{"x":100,"y":100}'
gsap-cli element add label --type text --parent panel --props '{"x":10,"y":10,"text":"Inside group"}'
```
Props: `x`, `y`, `width`, `height`, `opacity`

### html
A raw HTML container.
```bash
gsap-cli element add widget --type html --props '{"x":100,"y":100,"innerHTML":"<em>styled</em>","width":200,"height":100}'
```
Props: `x`, `y`, `innerHTML`, `width`, `height`, `opacity`

## Animatable Properties

These properties can be animated with `gsap-cli animate`, `gsap-cli set`, or timeline tweens:

| Property | Description | Notes |
|----------|------------|-------|
| `x` | Horizontal position (px) | Transform-based, smooth |
| `y` | Vertical position (px) | Transform-based, smooth |
| `rotation` | Rotation in degrees | e.g., 360 for full spin |
| `scale` | Uniform scale factor | Use `gsap-cli set` for initial value |
| `scaleX`, `scaleY` | Axis-specific scale | Use `gsap-cli set` for initial value |
| `transformOrigin` | Pivot point for rotation/scale | e.g., `"50% 0%"`, `"0px 0px"` |
| `opacity` | Transparency (0-1) | Great for fade in/out |
| `width` | Element width (px) | Rect/image/html only |
| `height` | Element height (px) | Rect/image/html only |
| `fontSize` | Text size (px) | Text only |
| `fill` | Color (hex string) | Maps to backgroundColor (rect/circle) or color (text) |
| `radius` | Circle radius (px) | Circle only |
| `x1`, `y1`, `x2`, `y2` | Line endpoints | Line only (SVG attributes) |
| `stroke` | Stroke color | Line/path only |
| `strokeWidth` | Stroke width | Line/path only |

Note: `rotation`, `scale`, `transformOrigin` are GSAP transform properties. Use `gsap-cli set` (not `element set`) to set them instantly. `element set` only handles non-transform properties like `x`, `y`, `fill`, `text`.

## Commands

### Status
```bash
gsap-cli status
```

### Clear Scene
```bash
gsap-cli clear
```
Removes all elements and kills all tweens/timelines in one command.

### Elements
```bash
gsap-cli element add <id> --type rect|circle|text|line|path|image|html|group [--parent <group-id>] [--props '<json>']
gsap-cli element set <id> --props '<json>'
gsap-cli element remove <id>
gsap-cli element list
gsap-cli element get <id> [--json]
gsap-cli element clone <source-id> <new-id> [--props '<override-json>']
```

`element get` returns the current properties of an element. Use `--json` for machine-readable output. Useful for querying animated positions or checking element state.

`element clone` creates a copy of an existing element with optional property overrides. Useful for grids, particles, or repeated shapes.

### Instant GSAP Set
Instantly set any GSAP property (rotation, scale, transformOrigin, etc.) without animation:
```bash
gsap-cli set <target> --props '{"transformOrigin":"50% 0%","rotation":45,"scale":1.5}'
```
Use this instead of `element set` when you need to set GSAP transform properties. Target can be id, comma-separated, or `*`.

### Animate
```bash
# Animate TO target values
gsap-cli animate to <target> --props '<json>' [--duration 1] [--ease power2.out]

# Animate FROM starting values (element snaps to these, then animates to current)
gsap-cli animate from <target> --props '<json>' [--duration 1] [--ease power2.out]

# Animate FROM one set of values TO another
gsap-cli animate fromTo <target> --props '<to-json>' --from-props '<from-json>' [--duration 1] [--ease power2.out]
```

Target can be: a single element ID, comma-separated IDs (`box1,box2,box3`), or `*` for all elements.

Additional animate flags:
- `--stagger <seconds>` -- delay between each element when targeting multiple
- `--repeat <n>` -- repeat count (`--repeat -1` for infinite)
- `--yoyo` -- reverse on alternate repeats (great with `--repeat`)
- `--delay <seconds>` -- delay before starting
- `--repeat-delay <seconds>` -- delay between repeats
- `--wait` -- block until animation completes

Defaults: duration=1 second, ease="power2.out"

### Kill Animations
Stop all animations on a target:
```bash
gsap-cli animate-kill <target>
```
Target can be id, comma-separated, or `*` for all. Use before replacing animations or cleaning up looping tweens.

### Animation Status
Query the state of an active tween:
```bash
gsap-cli animate-status <tween-id>
```

### Motion Path
Animate an element along an SVG path (top-level command, not under `animate`):
```bash
gsap-cli motion-path <target> --path "M0,0 C100,-100 200,100 300,0" \
  [--auto-rotate] [--duration 2] [--ease power2.inOut] \
  [--repeat -1] [--yoyo] [--delay 0] [--wait]
```

### Timelines
Timelines let you sequence multiple animations with precise timing control.

```bash
# Create a paused timeline with optional defaults, repeat, yoyo
gsap-cli timeline create <name> [--defaults '{"duration":0.8,"ease":"power2.out"}'] [--repeat -1] [--yoyo]

# Add tweens to the timeline (target can be id, comma-separated, or *)
gsap-cli timeline add <name> to|from|fromTo <target> --props '<json>' [--from-props '<json>'] [--position "<"] [--stagger 0.1]

# Control playback
gsap-cli timeline play <name> [--wait]
gsap-cli timeline pause <name>
gsap-cli timeline reverse <name> [--wait]
gsap-cli timeline seek <name> <position>

# Add labels for named positions
gsap-cli timeline label <name> <label> [--position "<"]
```

### Timeline Position Parameter
The `--position` flag controls when a tween starts relative to others:

| Position | Meaning |
|----------|---------|
| `"0"` | At the very start of the timeline |
| `"+=0"` | After the previous tween ends (default) |
| `"+=0.5"` | 0.5s after the previous tween ends |
| `"-=0.3"` | 0.3s before the previous tween ends (overlap) |
| `"<"` | At the same time as the previous tween starts |
| `"<0.2"` | 0.2s after the previous tween starts |

### Text Effects
```bash
# Typewriter -- reveals text character by character
gsap-cli text typewriter <target> "<text>" [--duration 2] [--ease none] [--cursor]

# Scramble -- reveals text through random characters
gsap-cli text scramble <target> "<text>" [--duration 1.5] [--chars "01!@#%"]
```

### Camera Control
Pan, zoom, and rotate the entire scene:
```bash
# Set camera instantly
gsap-cli camera set [--x 100] [--y 50] [--zoom 1.5] [--rotation 5]

# Animate camera smoothly
gsap-cli camera animate [--x 100] [--y 50] [--zoom 1.5] [--rotation 5] [--duration 2] [--ease power2.inOut] [--wait]
```

### GSAP Easing
Common easing functions:
- `power1.out`, `power2.out`, `power3.out` (gentle to strong deceleration)
- `power1.in`, `power2.in` (gentle to strong acceleration)
- `power1.inOut`, `power2.inOut` (smooth both ends)
- `sine.inOut` (very smooth, great for looping/floating animations)
- `elastic.out`, `bounce.out`, `back.out` (expressive)
- `none` (linear)

### Scene Export / Import
Save and restore full scenes to/from JSON files:
```bash
gsap-cli scene export --output scene.json         # Export current scene
gsap-cli scene import --input scene.json           # Import scene (replaces current)
```

Useful for saving checkpoints during complex scene building, or restoring a known-good scene state.

### Batch Mode
Send multiple commands in a single batch. Accepts **JSON arrays** or **CLI commands** (one per line):

```bash
# JSON format (from stdin)
echo '<json-array>' | gsap-cli batch

# CLI format (from file, supports # comments and blank lines)
gsap-cli batch --file setup.txt
```

See "Performance: Use Batch Mode" section above for JSON examples.

CLI-format batch file example:
```
# Scene setup
element add bg --type rect --props '{"x":0,"y":0,"width":1200,"height":700,"fill":"#0a0a2e"}'
element add hero --type circle --props '{"x":600,"y":350,"radius":30,"fill":"#ffcc00"}'

# Start animation
animate to hero --props '{"y":300}' --duration 2 --ease sine.inOut --yoyo --repeat -1
```

Batch flags:
- `--file <path>` -- read from a file instead of stdin
- `--stop-on-error` -- halt on the first command that fails
- `-q/--quiet` -- suppress per-command output (just print ok/error summary)

Output shows per-command progress: `[1/5] ok: hero`, `[2/5] error: Element not found`.

### Pipe Mode
Stream JSON commands over a persistent connection (one per line, responses on stdout):
```bash
gsap-cli pipe
```

### Screenshot
Capture the current browser frame (requires Playwright):
```bash
gsap-cli screenshot --output /tmp/frame.png
```

## Patterns

### Batched Scene Setup
The most efficient way to build a scene -- batch all element creation and initial property setup.

**CLI-format batch file** (recommended -- easier to read and write):
```bash
gsap-cli batch --file scene.txt
```
Where `scene.txt` contains:
```
# Scene elements
element add bg --type rect --props '{"x":0,"y":0,"width":1200,"height":700,"fill":"#0a0a1a"}'
element add title --type text --props '{"x":368,"y":260,"text":"GSAP CLI","fontSize":96,"fill":"#ffffff","opacity":0,"fontFamily":"monospace"}'
element add subtitle --type text --props '{"x":312,"y":380,"text":"AI-Driven Animation Engine","fontSize":28,"fill":"#00ff88","opacity":0,"fontFamily":"monospace"}'
element add box1 --type rect --props '{"x":100,"y":520,"width":260,"height":130,"fill":"#1a1a3a","opacity":0,"borderRadius":12}'
element add box2 --type rect --props '{"x":420,"y":520,"width":260,"height":130,"fill":"#1a1a3a","opacity":0,"borderRadius":12}'
element add box3 --type rect --props '{"x":740,"y":520,"width":260,"height":130,"fill":"#1a1a3a","opacity":0,"borderRadius":12}'

# Timeline setup
timeline create show --defaults '{"duration":0.8,"ease":"power3.out"}'
timeline add show fromTo title --from-props '{"opacity":0,"y":290}' --props '{"opacity":1,"y":260}' --position "0"
timeline add show to subtitle --props '{"opacity":1}' --position "0.9"
timeline add show fromTo box1 --from-props '{"opacity":0,"y":570}' --props '{"opacity":1,"y":520}' --position "1.8"
timeline add show fromTo box2 --from-props '{"opacity":0,"y":570}' --props '{"opacity":1,"y":520}' --position "1.95"
timeline add show fromTo box3 --from-props '{"opacity":0,"y":570}' --props '{"opacity":1,"y":520}' --position "2.1"
```

Then play the timeline (needs `--wait` so it runs separately):
```bash
gsap-cli timeline play show --wait
```

**JSON-format batch** (alternative -- better for programmatic generation):
```bash
echo '[
  {"cmd":"element.add","id":"bg","type":"rect","props":{"x":0,"y":0,"width":1200,"height":700,"fill":"#0a0a1a"}},
  {"cmd":"element.add","id":"title","type":"text","props":{"x":368,"y":260,"text":"GSAP CLI","fontSize":96,"fill":"#ffffff","opacity":0,"fontFamily":"monospace"}},
  {"cmd":"element.add","id":"box1","type":"rect","props":{"x":100,"y":520,"width":260,"height":130,"fill":"#1a1a3a","opacity":0,"borderRadius":12}},
  {"cmd":"element.add","id":"box2","type":"rect","props":{"x":420,"y":520,"width":260,"height":130,"fill":"#1a1a3a","opacity":0,"borderRadius":12}},
  {"cmd":"element.add","id":"box3","type":"rect","props":{"x":740,"y":520,"width":260,"height":130,"fill":"#1a1a3a","opacity":0,"borderRadius":12}}
]' | gsap-cli batch
```

### Skeletal Animation with Joint Pivots
Use nested groups for skeletal animation. Each limb is a group with `transformOrigin` at the joint pivot, and child limbs inherit the parent's rotation:

```bash
# Create skeleton hierarchy
echo '[
  {"cmd":"element.add","id":"runner","type":"group","props":{"x":400,"y":380}},
  {"cmd":"element.add","id":"torso","type":"rect","parent":"runner","props":{"x":-10,"y":-75,"width":20,"height":65,"fill":"#4488dd","borderRadius":6}},
  {"cmd":"element.add","id":"head","type":"circle","parent":"runner","props":{"x":0,"y":-108,"radius":18,"fill":"#ffcc66"}},
  {"cmd":"element.add","id":"thigh-l","type":"group","parent":"runner","props":{"x":-8,"y":-12}},
  {"cmd":"element.add","id":"thigh-l-vis","type":"rect","parent":"thigh-l","props":{"x":0,"y":0,"width":13,"height":45,"fill":"#335599","borderRadius":4}},
  {"cmd":"element.add","id":"shin-l","type":"group","parent":"thigh-l","props":{"x":1,"y":42}},
  {"cmd":"element.add","id":"shin-l-vis","type":"rect","parent":"shin-l","props":{"x":0,"y":0,"width":11,"height":42,"fill":"#2d4a80","borderRadius":4}}
]' | gsap-cli batch

# Set joint pivot points (must use gsap.set for transformOrigin)
echo '[
  {"cmd":"gsap.set","target":"thigh-l","props":{"transformOrigin":"6px 0px"}},
  {"cmd":"gsap.set","target":"shin-l","props":{"transformOrigin":"5px 0px"}}
]' | gsap-cli batch

# Animate with rotation-based running cycle
gsap-cli timeline create stride --defaults '{"duration":0.14,"ease":"power1.inOut"}' --repeat -1
gsap-cli timeline add stride to thigh-l --props '{"rotation":-30}' --position "0"
gsap-cli timeline add stride to shin-l --props '{"rotation":5}' --position "0"
gsap-cli timeline add stride to thigh-l --props '{"rotation":35}' --position "0.14"
gsap-cli timeline add stride to shin-l --props '{"rotation":-45}' --position "0.14"
gsap-cli timeline play stride
```

### Ambient Looping Animations
Use `--yoyo --repeat -1` with `sine.inOut` for smooth floating/pulsing:
```bash
# Floating element
gsap-cli animate to orb --props '{"y":270,"x":170}' --duration 3 --ease "sine.inOut" --yoyo --repeat -1

# Pulsing opacity
gsap-cli animate to glow --props '{"opacity":0.4}' --duration 2 --ease "sine.inOut" --yoyo --repeat -1

# Kill a looping animation before replacing it
gsap-cli animate-kill orb
gsap-cli animate to orb --props '{"y":200}' --duration 1
```

### Cloning Elements
Duplicate elements with optional property overrides:
```bash
gsap-cli element add star --type circle --props '{"x":100,"y":100,"radius":3,"fill":"#ffffff","opacity":0.6}'
gsap-cli element clone star star2 --props '{"x":300,"y":150,"opacity":0.4}'
gsap-cli element clone star star3 --props '{"x":600,"y":80,"opacity":0.7}'
```

### Fade In Narration Text
```bash
gsap-cli element add narration --type text --props '{"x":200,"y":600,"text":"","fontSize":20,"fill":"#8888cc","opacity":0}'

# Show text
gsap-cli element set narration --props '{"text":"Once upon a time..."}'
gsap-cli animate to narration --props '{"opacity":1}' --duration 1.5 --ease power2.out

# Later, fade out and change
sleep 3
gsap-cli animate to narration --props '{"opacity":0}' --duration 1 --ease power2.in --wait
gsap-cli element set narration --props '{"text":"The end."}'
gsap-cli animate to narration --props '{"opacity":1}' --duration 1.5 --ease power2.out
```

### Building a Scene Layer by Layer
Create background elements first, foreground elements last. Elements render in creation order (z-order = creation order).

```bash
echo '[
  {"cmd":"element.add","id":"sky","type":"rect","props":{"x":0,"y":0,"width":1200,"height":700,"fill":"#0a0a2e"}},
  {"cmd":"element.add","id":"ground","type":"rect","props":{"x":0,"y":500,"width":1200,"height":200,"fill":"#1a1a3e"}},
  {"cmd":"element.add","id":"building","type":"rect","props":{"x":200,"y":300,"width":80,"height":200,"fill":"#151530"}},
  {"cmd":"element.add","id":"hero","type":"circle","props":{"x":100,"y":450,"radius":20,"fill":"#ffcc00"}}
]' | gsap-cli batch
```

### Camera Cinematic Effects
```bash
# Start zoomed in, then pull out to reveal the full scene
gsap-cli camera set --zoom 1.5 --x 200 --y 100
gsap-cli camera animate --zoom 1.0 --x 0 --y 0 --duration 3 --ease power2.inOut

# Dramatic zoom to a specific element
gsap-cli camera animate --zoom 2.0 --x 300 --y 200 --duration 1.5 --ease power3.out

# Slow rotation for style
gsap-cli camera animate --rotation 5 --duration 4 --ease sine.inOut
```

### Color Transitions
Animate `fill` to smoothly transition colors:
```bash
gsap-cli animate to sky --props '{"fill":"#4a2080"}' --duration 3 --ease power1.inOut
```

### Pacing with --wait and Sleep
Use `--wait` on timelines and individual animations to block until complete. Use `sleep` for pauses between beats:
```bash
# --wait blocks until the timeline finishes
gsap-cli timeline play intro --wait

# sleep adds a pause for the viewer
gsap-cli animate to hero --props '{"x":400}' --duration 2 --wait
sleep 0.5  # brief pause
gsap-cli animate to hero --props '{"y":200}' --duration 1 --wait
```

## Important Gotchas

### Positioning is top-left origin
ALL elements (rect, text, circle, image, group, html) are positioned by their **top-left corner** via CSS `translate(x, y)`. There is no auto-centering. To visually center text, estimate the text width and offset `x` accordingly:
- Monospace font: ~0.6 x fontSize per character
- Example: "GSAP CLI" (8 chars) at fontSize 96 ~ 461px wide -> to center at x=600, use `x = 600 - 230 = 370`

### Circles use `radius`, not `width`/`height`
```bash
# WRONG -- will be ignored
gsap-cli element add dot --type circle --props '{"x":100,"y":100,"width":40,"height":40}'

# CORRECT
gsap-cli element add dot --type circle --props '{"x":100,"y":100,"radius":20}'
```

### `element set` vs `gsap-cli set`
- `element set` -- updates non-transform props (x, y, fill, text, opacity, width, height)
- `gsap-cli set` -- sets ANY GSAP property including transforms (rotation, scale, transformOrigin)

Use `gsap-cli set` when you need rotation, scale, or transformOrigin. Use `element set` for changing text content, colors, or dimensions.

### Negative numbers in flags
The `--repeat` flag accepts negative values directly -- both forms work:
```bash
gsap-cli animate to box --props '{"y":100}' --repeat -1
gsap-cli animate to box --props '{"y":100}' --repeat=-1
```

### SVG lines use different props than rects
Lines use `x1/y1/x2/y2` and `stroke`, not `x/y` and `fill`:
```bash
# WRONG
gsap-cli element add line1 --type line --props '{"x":0,"y":100,"width":500,"fill":"#fff"}'

# CORRECT
gsap-cli element add line1 --type line --props '{"x1":0,"y1":100,"x2":500,"y2":100,"stroke":"#ffffff","strokeWidth":2}'
```

### `fill` maps to different CSS props by type
- `rect` / `circle` -> `backgroundColor`
- `text` -> `color`
- `line` / `path` -> uses SVG `fill` attribute (for paths; lines use `stroke`)

### Colors must be hex format
Use `"#ff6b6b"`, not CSS names like `"red"` or `"tomato"`.

### Browser viewport size varies
The browser canvas size depends on the user's browser window. Design for ~1200x700 as a baseline, but don't assume exact dimensions.

## Tips

- Always run `gsap-cli status` first to verify the daemon is connected
- **Batch element creation** -- use `gsap-cli batch` for 3+ elements to avoid per-command IPC overhead
- **CLI-style batch files** are easier to read and write than JSON -- use `gsap-cli batch --file setup.txt` with one CLI command per line
- Use single quotes around JSON props to avoid shell escaping issues
- Build the full scene first (elements at opacity 0), then animate them in -- this prevents visual pop-in
- Use `--wait` on `timeline play` to block until animations complete before starting the next phase
- Use `fromTo` when you need precise control over both start and end states
- Overlap timeline tweens with position `"<0.2"` for polished, staggered entrances
- `sine.inOut` is the best ease for looping/ambient animations
- Use `gsap-cli animate-kill` before replacing a looping animation on the same target
- Use `gsap-cli clear` to reset the scene between demos
- Use `element clone` to duplicate elements instead of re-specifying all props
- Use `gsap-cli set` (not `element set`) for transform properties like `transformOrigin` and `rotation`
- Use `element get <id>` to query current element properties (e.g., animated position)
- Use `scene export/import` to save and restore scene checkpoints
- Start the daemon with `bun --watch` so it auto-reloads when you change daemon source files
