use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "gsap-cli", about = "Agent-driven GSAP animation CLI")]
pub struct Cli {
    #[command(subcommand)]
    pub command: CliCommand,
}

#[derive(Subcommand)]
pub enum CliCommand {
    /// Check daemon connectivity and status
    Status,

    /// Clear all elements and animations
    Clear,

    /// Manage scene elements
    #[command(subcommand)]
    Element(ElementCommand),

    /// Create GSAP animations
    Animate {
        /// Tween type: to, from, or fromTo
        tween_type: String,

        /// Target element ID, comma-separated IDs, or * for all
        target: String,

        /// Animation properties as JSON
        #[arg(long)]
        props: String,

        /// From properties (required for fromTo)
        #[arg(long)]
        from_props: Option<String>,

        /// Duration in seconds
        #[arg(long)]
        duration: Option<f64>,

        /// Easing function
        #[arg(long)]
        ease: Option<String>,

        /// Stagger delay between elements (seconds)
        #[arg(long)]
        stagger: Option<f64>,

        /// Number of times to repeat (-1 for infinite)
        #[arg(long, allow_hyphen_values = true)]
        repeat: Option<i32>,

        /// Reverse on alternate repeats
        #[arg(long)]
        yoyo: bool,

        /// Delay before starting (seconds)
        #[arg(long)]
        delay: Option<f64>,

        /// Delay between repeats (seconds)
        #[arg(long)]
        repeat_delay: Option<f64>,

        /// Block until animation completes
        #[arg(long)]
        wait: bool,
    },

    /// Instantly set GSAP properties (rotation, scale, transformOrigin, etc.)
    Set {
        /// Target element ID, comma-separated IDs, or * for all
        target: String,

        /// Properties as JSON
        #[arg(long)]
        props: String,
    },

    /// Query animation status
    #[command(name = "animate-status")]
    AnimateStatus {
        /// Tween ID (e.g., `tween_1`)
        id: String,
    },

    /// Kill all animations on a target
    #[command(name = "animate-kill")]
    AnimateKill {
        /// Target element ID, comma-separated IDs, or * for all
        target: String,
    },

    /// Animate an element along an SVG path
    #[command(name = "motion-path")]
    MotionPath {
        /// Target element ID
        target: String,

        /// SVG path data (d attribute)
        #[arg(long)]
        path: String,

        /// Auto-rotate element to match path direction
        #[arg(long)]
        auto_rotate: bool,

        /// Duration in seconds
        #[arg(long)]
        duration: Option<f64>,

        /// Easing function
        #[arg(long)]
        ease: Option<String>,

        /// Number of times to repeat (-1 for infinite)
        #[arg(long, allow_hyphen_values = true)]
        repeat: Option<i32>,

        /// Reverse on alternate repeats
        #[arg(long)]
        yoyo: bool,

        /// Delay before starting (seconds)
        #[arg(long)]
        delay: Option<f64>,

        /// Block until animation completes
        #[arg(long)]
        wait: bool,
    },

    /// Manage GSAP timelines
    #[command(subcommand)]
    Timeline(TimelineCommand),

    /// Text animation effects
    #[command(subcommand)]
    Text(TextCommand),

    /// Control the camera (pan, zoom, rotate)
    #[command(subcommand)]
    Camera(CameraCommand),

    /// Export or import scenes
    #[command(subcommand)]
    Scene(SceneCommand),

    /// Layout and alignment tools
    #[command(subcommand)]
    Layout(LayoutCommand),

    /// Send multiple commands in a single batch (JSON array, CLI commands, or file)
    Batch {
        /// Read batch from a file instead of stdin
        #[arg(long)]
        file: Option<String>,

        /// Stop executing on the first command that fails
        #[arg(long)]
        stop_on_error: bool,

        /// Suppress per-command output (just print ok/error)
        #[arg(long, short)]
        quiet: bool,
    },

    /// STDIN streaming mode (JSON per line)
    Pipe,

    /// Capture a screenshot of the current scene
    Screenshot {
        /// Output file path
        #[arg(long)]
        output: String,
    },
}

#[derive(Subcommand)]
pub enum ElementCommand {
    /// Add an element to the scene
    Add {
        /// Element ID
        id: String,

        /// Element type (rect, circle, text, image, html, line, group)
        #[arg(long, rename_all = "verbatim")]
        r#type: String,

        /// Parent element ID (for grouping)
        #[arg(long)]
        parent: Option<String>,

        /// Initial properties as JSON
        #[arg(long)]
        props: Option<String>,
    },

    /// Remove an element from the scene
    Remove {
        /// Element ID
        id: String,
    },

    /// Set properties on an element
    Set {
        /// Element ID
        id: String,

        /// Properties as JSON
        #[arg(long)]
        props: String,
    },

    /// List all elements in the scene
    List,

    /// Get properties of a specific element
    Get {
        /// Element ID
        id: String,

        /// Output as JSON
        #[arg(long)]
        json: bool,
    },

    /// Clone an existing element
    Clone {
        /// Source element ID to clone from
        source: String,

        /// New element ID
        id: String,

        /// Override properties as JSON
        #[arg(long)]
        props: Option<String>,
    },
}

#[derive(Subcommand)]
pub enum TimelineCommand {
    /// Create a new timeline
    Create {
        /// Timeline name
        name: String,

        /// Default tween properties as JSON
        #[arg(long)]
        defaults: Option<String>,

        /// Repeat count (-1 for infinite)
        #[arg(long, allow_hyphen_values = true)]
        repeat: Option<f64>,

        /// Reverse on alternate repeats
        #[arg(long)]
        yoyo: bool,
    },

    /// Add a tween to a timeline
    Add {
        /// Timeline name
        name: String,

        /// Tween type (to, from, fromTo)
        tween_type: String,

        /// Target element ID
        target: String,

        /// Animation properties as JSON (to-props for fromTo)
        #[arg(long)]
        props: String,

        /// From properties as JSON (required for fromTo)
        #[arg(long)]
        from_props: Option<String>,

        /// Timeline position parameter
        #[arg(long)]
        position: Option<String>,

        /// Stagger delay between elements (seconds)
        #[arg(long)]
        stagger: Option<f64>,
    },

    /// Play a timeline
    Play {
        /// Timeline name
        name: String,

        /// Block until timeline completes
        #[arg(long)]
        wait: bool,
    },

    /// Pause a timeline
    Pause {
        /// Timeline name
        name: String,
    },

    /// Reverse a timeline
    Reverse {
        /// Timeline name
        name: String,
    },

    /// Seek to a position in a timeline
    Seek {
        /// Timeline name
        name: String,

        /// Position to seek to
        position: String,
    },

    /// Add a label to a timeline
    Label {
        /// Timeline name
        name: String,

        /// Label name
        label: String,

        /// Timeline position for the label
        #[arg(long)]
        position: Option<String>,
    },
}

#[derive(Subcommand)]
pub enum TextCommand {
    /// Typewriter effect — reveal text character by character
    Typewriter {
        /// Target text element ID
        target: String,

        /// Text to reveal
        text: String,

        /// Duration in seconds (default: text.length * 0.05)
        #[arg(long)]
        duration: Option<f64>,

        /// Easing function
        #[arg(long)]
        ease: Option<String>,

        /// Show blinking cursor during typing
        #[arg(long)]
        cursor: bool,

        /// Block until animation completes
        #[arg(long)]
        wait: bool,
    },

    /// Scramble effect — randomize characters before settling
    Scramble {
        /// Target text element ID
        target: String,

        /// Final text to reveal
        text: String,

        /// Duration in seconds
        #[arg(long)]
        duration: Option<f64>,

        /// Characters to use for scrambling
        #[arg(long)]
        chars: Option<String>,

        /// Block until animation completes
        #[arg(long)]
        wait: bool,
    },
}

#[derive(Subcommand)]
pub enum CameraCommand {
    /// Set camera position instantly
    #[command(allow_hyphen_values = true)]
    Set {
        /// Camera X offset
        #[arg(long, allow_hyphen_values = true)]
        x: Option<f64>,

        /// Camera Y offset
        #[arg(long, allow_hyphen_values = true)]
        y: Option<f64>,

        /// Zoom level (1.0 = default)
        #[arg(long)]
        zoom: Option<f64>,

        /// Rotation in degrees
        #[arg(long, allow_hyphen_values = true)]
        rotation: Option<f64>,
    },

    /// Animate camera to position
    #[command(allow_hyphen_values = true)]
    Animate {
        /// Camera X offset
        #[arg(long, allow_hyphen_values = true)]
        x: Option<f64>,

        /// Camera Y offset
        #[arg(long, allow_hyphen_values = true)]
        y: Option<f64>,

        /// Zoom level (1.0 = default)
        #[arg(long)]
        zoom: Option<f64>,

        /// Rotation in degrees
        #[arg(long, allow_hyphen_values = true)]
        rotation: Option<f64>,

        /// Duration in seconds
        #[arg(long)]
        duration: Option<f64>,

        /// Easing function
        #[arg(long)]
        ease: Option<String>,

        /// Block until animation completes
        #[arg(long)]
        wait: bool,
    },
}

#[derive(Subcommand)]
pub enum SceneCommand {
    /// Export the current scene to a JSON file
    Export {
        /// Output file path
        #[arg(long)]
        output: String,
    },

    /// Import a scene from a JSON file (replaces current scene)
    Import {
        /// Input file path
        #[arg(long)]
        input: String,
    },
}

#[derive(Subcommand)]
pub enum LayoutCommand {
    /// Align elements along an axis
    Align {
        /// Comma-separated element IDs
        ids: String,

        /// Axis to align on (x or y)
        #[arg(long)]
        axis: String,

        /// Anchor point: start, center, or end
        #[arg(long)]
        anchor: String,

        /// Reference element ID to align to
        #[arg(long)]
        reference: Option<String>,
    },

    /// Distribute elements evenly along an axis
    Distribute {
        /// Comma-separated element IDs
        ids: String,

        /// Axis to distribute on (x or y)
        #[arg(long)]
        axis: String,

        /// Start coordinate
        #[arg(long, allow_hyphen_values = true)]
        start: Option<f64>,

        /// End coordinate
        #[arg(long)]
        end: Option<f64>,

        /// Fixed gap between elements (alternative to start/end)
        #[arg(long)]
        gap: Option<f64>,
    },

    /// Position an element relative to another
    Relative {
        /// Element ID to position
        id: String,

        /// Reference element ID
        #[arg(long)]
        to: String,

        /// Position relative to reference: above, below, left, right
        #[arg(long)]
        position: String,

        /// Cross-axis alignment: start, center, end (default: center)
        #[arg(long)]
        align: Option<String>,

        /// Gap between elements in pixels (default: 0)
        #[arg(long)]
        gap: Option<f64>,
    },

    /// Get the computed bounding box of an element
    #[command(name = "get-bounds")]
    GetBounds {
        /// Element ID
        id: String,
    },
}
