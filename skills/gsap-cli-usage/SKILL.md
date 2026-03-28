---
name: gsap-cli-usage
description: How to use the gsap-cli tool to create and animate scenes from the command line. Use this skill whenever the user asks you to animate something, create a visual scene, drive GSAP animations via CLI, or when you need to use gsap-cli commands. Also use when the user mentions gsap-cli, gsap-daemon, browser animations, or wants to build animated stories/demos.
---

# gsap-cli Usage Guide

This skill teaches you how to use `gsap-cli` to create elements and animate them in real time, rendered in the browser.

## Architecture

```
You (the agent) run CLI commands
  → gsap-cli (Rust binary) sends JSON over Unix socket
    → gsap-daemon (Bun process in separate terminal) manages the scene
      → Browser renderer displays the animation
```

The user starts the daemon manually. You only use the CLI binary.

## Before You Start

Always check if the daemon is running first:

```bash
gsap-cli status
```

If you get "Cannot connect to daemon", tell the user to start the daemon:
```bash
bun daemon/src/index.ts --port 3000
```

The CLI binary is at `cli/target/release/gsap-cli`. If the binary isn't built, tell the user to run `cd cli && cargo build --release`.


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
A text label. Positioned by its **top-left corner** — you must manually offset `x` to visually center text.
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
A container for nesting child elements. Children are positioned relative to the group.
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

These properties can be animated with `gsap-cli animate` or timeline tweens:

| Property | Description | Notes |
|----------|------------|-------|
| `x` | Horizontal position (px) | Transform-based, smooth |
| `y` | Vertical position (px) | Transform-based, smooth |
| `rotation` | Rotation in degrees | e.g., 360 for full spin |
| `scale` | Uniform scale factor | Browser mode only; stripped on daemon side |
| `opacity` | Transparency (0-1) | Great for fade in/out |
| `width` | Element width (px) | Rect/image/html only |
| `height` | Element height (px) | Rect/image/html only |
| `fontSize` | Text size (px) | Text only |
| `fill` | Color (hex string) | Maps to backgroundColor (rect/circle) or color (text) |
| `radius` | Circle radius (px) | Circle only |
| `x1`, `y1`, `x2`, `y2` | Line endpoints | Line only (SVG attributes) |
| `stroke` | Stroke color | Line/path only |
| `strokeWidth` | Stroke width | Line/path only |

Note: `scale`, `scaleX`, `scaleY` work in the browser renderer via GSAP's native transform handling, but the daemon-side scene graph doesn't track them. Use them in browser mode only.

## Commands

### Check Status
```bash
gsap-cli status
```

### Create Elements
```bash
gsap-cli element add <id> --type rect|circle|text|line|path|image|html|group [--parent <group-id>] [--props '<json>']
gsap-cli element set <id> --props '<json>'
gsap-cli element remove <id>
```

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
- `--stagger <seconds>` — delay between each element when targeting multiple
- `--repeat <n>` — repeat count (`--repeat -1` for infinite)
- `--yoyo` — reverse on alternate repeats (great with `--repeat`)
- `--delay <seconds>` — delay before starting
- `--repeat-delay <seconds>` — delay between repeats
- `--wait` — block until animation completes

Defaults: duration=1 second, ease="power2.out"

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
# Create a paused timeline with optional defaults
gsap-cli timeline create <name> [--defaults '{"duration":0.8,"ease":"power2.out"}']

# Add tweens to the timeline
gsap-cli timeline add <name> to|from|fromTo <target> --props '<json>' [--from-props '<json>'] [--position "<"]

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
# Typewriter — reveals text character by character
gsap-cli text typewriter <target> "<text>" [--duration 2] [--ease none] [--cursor]

# Scramble — reveals text through random characters
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

### Choreographed Intro Sequence
Build the full scene first (all elements at opacity 0), then animate everything in with a timeline:

```bash
# 1. Create all elements (invisible)
gsap-cli element add bg --type rect --props '{"x":0,"y":0,"width":1200,"height":800,"fill":"#0a0a1a"}'
gsap-cli element add title --type text --props '{"x":368,"y":260,"text":"GSAP CLI","fontSize":96,"fill":"#ffffff","opacity":0,"fontFamily":"monospace"}'
gsap-cli element add subtitle --type text --props '{"x":312,"y":380,"text":"AI-Driven Animation Engine","fontSize":28,"fill":"#00ff88","opacity":0,"fontFamily":"monospace"}'
gsap-cli element add accent-left --type rect --props '{"x":368,"y":305,"width":0,"height":3,"fill":"#ff0088"}'
gsap-cli element add accent-right --type rect --props '{"x":832,"y":305,"width":0,"height":3,"fill":"#00aaff"}'
gsap-cli element add orb1 --type circle --props '{"x":150,"y":300,"radius":12,"fill":"#ff0088","opacity":0}'
gsap-cli element add orb2 --type circle --props '{"x":1050,"y":300,"radius":10,"fill":"#00aaff","opacity":0}'
gsap-cli element add box1 --type rect --props '{"x":100,"y":520,"width":260,"height":130,"fill":"#1a1a3a","opacity":0,"borderRadius":12}'
gsap-cli element add box2 --type rect --props '{"x":420,"y":520,"width":260,"height":130,"fill":"#1a1a3a","opacity":0,"borderRadius":12}'
gsap-cli element add box3 --type rect --props '{"x":740,"y":520,"width":260,"height":130,"fill":"#1a1a3a","opacity":0,"borderRadius":12}'
gsap-cli element add label1 --type text --props '{"x":165,"y":575,"text":"Timelines","fontSize":18,"fill":"#00ff88","opacity":0,"fontFamily":"monospace"}'
gsap-cli element add label2 --type text --props '{"x":475,"y":575,"text":"Motion Paths","fontSize":18,"fill":"#00aaff","opacity":0,"fontFamily":"monospace"}'
gsap-cli element add label3 --type text --props '{"x":810,"y":575,"text":"Camera FX","fontSize":18,"fill":"#ffaa00","opacity":0,"fontFamily":"monospace"}'

# 2. Choreograph with a timeline
gsap-cli timeline create show --defaults '{"duration":0.8,"ease":"power3.out"}'
gsap-cli timeline add show fromTo title --from-props '{"opacity":0,"y":290}' --props '{"opacity":1,"y":260}' --position "0"
gsap-cli timeline add show to accent-left --props '{"width":250,"x":118}' --position "0.4"
gsap-cli timeline add show to accent-right --props '{"width":250}' --position "0.4"
gsap-cli timeline add show to subtitle --props '{"opacity":1}' --position "0.9"
gsap-cli timeline add show fromTo orb1 --from-props '{"opacity":0,"scale":0}' --props '{"opacity":0.8,"scale":1}' --position "1.3"
gsap-cli timeline add show fromTo orb2 --from-props '{"opacity":0,"scale":0}' --props '{"opacity":0.8,"scale":1}' --position "1.4"
gsap-cli timeline add show fromTo box1 --from-props '{"opacity":0,"y":570}' --props '{"opacity":1,"y":520}' --position "1.8"
gsap-cli timeline add show fromTo box2 --from-props '{"opacity":0,"y":570}' --props '{"opacity":1,"y":520}' --position "1.95"
gsap-cli timeline add show fromTo box3 --from-props '{"opacity":0,"y":570}' --props '{"opacity":1,"y":520}' --position "2.1"
gsap-cli timeline add show to label1 --props '{"opacity":1}' --position "2.2"
gsap-cli timeline add show to label2 --props '{"opacity":1}' --position "2.35"
gsap-cli timeline add show to label3 --props '{"opacity":1}' --position "2.5"
gsap-cli timeline play show --wait

# 3. Add ambient looping animations after intro completes
gsap-cli animate to orb1 --props '{"y":270,"x":170}' --duration 3 --ease "sine.inOut" --yoyo --repeat -1
gsap-cli animate to orb2 --props '{"y":270,"x":1030}' --duration 4 --ease "sine.inOut" --yoyo --repeat -1
gsap-cli animate to accent-left --props '{"opacity":0.4}' --duration 2 --ease "sine.inOut" --yoyo --repeat -1
gsap-cli animate to accent-right --props '{"opacity":0.4}' --duration 2.5 --ease "sine.inOut" --yoyo --repeat -1

# 4. Text scramble effect
gsap-cli text scramble subtitle "AI-Driven Animation Engine" --duration 2 --chars "01!@#%"
```

### Ambient Looping Animations
Use `--yoyo --repeat -1` with `sine.inOut` for smooth floating/pulsing:
```bash
# Floating element
gsap-cli animate to orb --props '{"y":270,"x":170}' --duration 3 --ease "sine.inOut" --yoyo --repeat -1

# Pulsing opacity
gsap-cli animate to glow --props '{"opacity":0.4}' --duration 2 --ease "sine.inOut" --yoyo --repeat -1

# Staggered delay for multiple elements
gsap-cli animate to orb1 --props '{"y":250}' --duration 3 --ease "sine.inOut" --yoyo --repeat -1
gsap-cli animate to orb2 --props '{"y":250}' --duration 3 --ease "sine.inOut" --yoyo --repeat -1 --delay 0.5
gsap-cli animate to orb3 --props '{"y":250}' --duration 3 --ease "sine.inOut" --yoyo --repeat -1 --delay 1
```

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
Create background elements first, foreground elements last. Elements render in creation order (z-order = creation order).

```bash
# Background
gsap-cli element add sky --type rect --props '{"x":0,"y":0,"width":1200,"height":700,"fill":"#0a0a2e"}'
gsap-cli element add ground --type rect --props '{"x":0,"y":500,"width":1200,"height":200,"fill":"#1a1a3e"}'

# Midground
gsap-cli element add building --type rect --props '{"x":200,"y":300,"width":80,"height":200,"fill":"#151530"}'

# Foreground
gsap-cli element add hero --type circle --props '{"x":100,"y":450,"radius":20,"fill":"#ffcc00"}'
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
- Monospace font: ~0.6 × fontSize per character
- Example: "GSAP CLI" (8 chars) at fontSize 96 ≈ 461px wide → to center at x=600, use `x = 600 - 230 = 370`

### Circles use `radius`, not `width`/`height`
```bash
# WRONG — will be ignored
gsap-cli element add dot --type circle --props '{"x":100,"y":100,"width":40,"height":40}'

# CORRECT
gsap-cli element add dot --type circle --props '{"x":100,"y":100,"radius":20}'
```

### Negative numbers in flags
The `--repeat` flag accepts negative values directly — both forms work:
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
- `rect` / `circle` → `backgroundColor`
- `text` → `color`
- `line` / `path` → uses SVG `fill` attribute (for paths; lines use `stroke`)

### Colors must be hex format
Use `"#ff6b6b"`, not CSS names like `"red"` or `"tomato"`.

### Browser viewport size varies
The browser canvas size depends on the user's browser window. Design for ~1200×700 as a baseline, but don't assume exact dimensions.

## Tips

- Always run `gsap-cli status` first to verify the daemon is connected
- Use single quotes around JSON props to avoid shell escaping issues
- Build the full scene first (elements at opacity 0), then animate them in — this prevents visual pop-in
- Use `--wait` on `timeline play` to block until animations complete before starting the next phase
- Use `fromTo` when you need precise control over both start and end states
- Overlap timeline tweens with position `"<0.2"` for polished, staggered entrances
- `sine.inOut` is the best ease for looping/ambient animations
- For batch element creation, run multiple commands in a single Bash call separated by newlines
