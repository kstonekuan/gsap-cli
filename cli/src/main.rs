mod args;
mod commands;
mod convert;
mod ipc;
mod protocol;

use args::{
    CameraCommand, Cli, CliCommand, ElementCommand, SceneCommand, TextCommand, TimelineCommand,
};
use clap::Parser;

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
            ElementCommand::Get { id, json } => commands::element::get(id, json),
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
        CliCommand::Scene(scene_command) => match scene_command {
            SceneCommand::Export { output } => commands::scene::export(output),
            SceneCommand::Import { input } => commands::scene::import(input),
        },
        CliCommand::Batch {
            file,
            stop_on_error,
            quiet,
        } => commands::batch::run(file, stop_on_error, quiet),
        CliCommand::Pipe => commands::pipe::run(),
        CliCommand::Screenshot { output } => commands::screenshot::run(output),
    }
}
