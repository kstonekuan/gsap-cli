mod commands;
mod ipc;
mod protocol;

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "gsap-cli", about = "Agent-driven GSAP animation CLI")]
struct Cli {
    #[command(subcommand)]
    command: CliCommand,
}

#[derive(Subcommand)]
enum CliCommand {
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

    /// Send multiple commands in a single batch (JSON array from stdin)
    Batch,

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
enum ElementCommand {
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
enum TimelineCommand {
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
enum TextCommand {
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
enum CameraCommand {
    /// Set camera position instantly
    Set {
        /// Camera X offset
        #[arg(long)]
        x: Option<f64>,

        /// Camera Y offset
        #[arg(long)]
        y: Option<f64>,

        /// Zoom level (1.0 = default)
        #[arg(long)]
        zoom: Option<f64>,

        /// Rotation in degrees
        #[arg(long)]
        rotation: Option<f64>,
    },

    /// Animate camera to position
    Animate {
        /// Camera X offset
        #[arg(long)]
        x: Option<f64>,

        /// Camera Y offset
        #[arg(long)]
        y: Option<f64>,

        /// Zoom level (1.0 = default)
        #[arg(long)]
        zoom: Option<f64>,

        /// Rotation in degrees
        #[arg(long)]
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

#[allow(clippy::too_many_lines)]
fn main() {
    let cli = Cli::parse();

    match cli.command {
        CliCommand::Status => commands::status::run(),
        CliCommand::Clear => commands::clear::run(),
        CliCommand::Element(element_command) => match element_command {
            ElementCommand::Add {
                id,
                r#type,
                parent,
                props,
            } => commands::element::add(id, r#type, parent, props),
            ElementCommand::Remove { id } => commands::element::remove(id),
            ElementCommand::Set { id, props } => commands::element::set(id, props),
            ElementCommand::List => commands::element::list(),
            ElementCommand::Clone { source, id, props } => {
                commands::element::clone(source, id, props);
            }
        },
        CliCommand::Set { target, props } => commands::gsap_set::run(target, props),
        CliCommand::Animate {
            tween_type,
            target,
            props,
            from_props,
            duration,
            ease,
            stagger,
            repeat,
            yoyo,
            delay,
            repeat_delay,
            wait,
        } => commands::animate::run(
            tween_type,
            target,
            props,
            from_props,
            duration,
            ease,
            stagger,
            repeat,
            yoyo,
            delay,
            repeat_delay,
            wait,
        ),
        CliCommand::AnimateStatus { id } => commands::animate::status(id),
        CliCommand::AnimateKill { target } => commands::animate::kill(target),
        CliCommand::MotionPath {
            target,
            path,
            auto_rotate,
            duration,
            ease,
            repeat,
            yoyo,
            delay,
            wait,
        } => commands::animate::motion_path(
            target,
            path,
            auto_rotate,
            duration,
            ease,
            repeat,
            yoyo,
            delay,
            wait,
        ),
        CliCommand::Timeline(timeline_command) => match timeline_command {
            TimelineCommand::Create {
                name,
                defaults,
                repeat,
                yoyo,
            } => {
                commands::timeline::create(name, defaults, repeat, yoyo);
            }
            TimelineCommand::Add {
                name,
                tween_type,
                target,
                props,
                from_props,
                position,
                stagger,
            } => commands::timeline::add(
                name, tween_type, target, props, from_props, position, stagger,
            ),
            TimelineCommand::Play { name, wait } => commands::timeline::play(name, wait),
            TimelineCommand::Pause { name } => commands::timeline::pause(name),
            TimelineCommand::Reverse { name } => commands::timeline::reverse(name),
            TimelineCommand::Seek { name, position } => commands::timeline::seek(name, position),
            TimelineCommand::Label {
                name,
                label,
                position,
            } => {
                commands::timeline::label(name, label, position);
            }
        },
        CliCommand::Text(text_command) => match text_command {
            TextCommand::Typewriter {
                target,
                text,
                duration,
                ease,
                cursor,
                wait,
            } => commands::text::typewriter(target, text, duration, ease, cursor, wait),
            TextCommand::Scramble {
                target,
                text,
                duration,
                chars,
                wait,
            } => commands::text::scramble(target, text, duration, chars, wait),
        },
        CliCommand::Camera(camera_command) => match camera_command {
            CameraCommand::Set {
                x,
                y,
                zoom,
                rotation,
            } => commands::camera::set(x, y, zoom, rotation),
            CameraCommand::Animate {
                x,
                y,
                zoom,
                rotation,
                duration,
                ease,
                wait,
            } => commands::camera::animate(x, y, zoom, rotation, duration, ease, wait),
        },
        CliCommand::Batch => commands::batch::run(),
        CliCommand::Pipe => commands::pipe::run(),
        CliCommand::Screenshot { output } => commands::screenshot::run(output),
    }
}
