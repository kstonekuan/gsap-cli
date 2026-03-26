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

    /// Manage scene elements
    #[command(subcommand)]
    Element(ElementCommand),

    /// Create GSAP animations
    Animate {
        /// Tween type: to, from, or fromTo
        tween_type: String,

        /// Target element ID
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
    },

    /// Manage GSAP timelines
    #[command(subcommand)]
    Timeline(TimelineCommand),

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

        /// Element type (rect, circle, text)
        #[arg(long, rename_all = "verbatim")]
        r#type: String,

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
    },

    /// Add a tween to a timeline
    Add {
        /// Timeline name
        name: String,

        /// Tween type (to, from, fromTo)
        tween_type: String,

        /// Target element ID
        target: String,

        /// Animation properties as JSON
        #[arg(long)]
        props: String,

        /// Timeline position parameter
        #[arg(long)]
        position: Option<String>,
    },

    /// Play a timeline
    Play {
        /// Timeline name
        name: String,
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
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        CliCommand::Status => commands::status::run(),
        CliCommand::Element(element_command) => match element_command {
            ElementCommand::Add { id, r#type, props } => commands::element::add(id, r#type, props),
            ElementCommand::Remove { id } => commands::element::remove(id),
            ElementCommand::Set { id, props } => commands::element::set(id, props),
        },
        CliCommand::Animate {
            tween_type,
            target,
            props,
            from_props,
            duration,
            ease,
        } => commands::animate::run(tween_type, target, props, from_props, duration, ease),
        CliCommand::Timeline(timeline_command) => match timeline_command {
            TimelineCommand::Create { name, defaults } => {
                commands::timeline::create(name, defaults);
            }
            TimelineCommand::Add {
                name,
                tween_type,
                target,
                props,
                position,
            } => commands::timeline::add(name, tween_type, target, props, position),
            TimelineCommand::Play { name } => commands::timeline::play(name),
            TimelineCommand::Pause { name } => commands::timeline::pause(name),
            TimelineCommand::Reverse { name } => commands::timeline::reverse(name),
            TimelineCommand::Seek { name, position } => commands::timeline::seek(name, position),
        },
        CliCommand::Pipe => commands::pipe::run(),
        CliCommand::Screenshot { output } => commands::screenshot::run(output),
    }
}
