use serde_json::Value;

use crate::args::{
    CameraCommand, CliCommand, ElementCommand, SceneCommand, TextCommand, TimelineCommand,
};
use crate::protocol::{AnimationControls, Command, TweenType, flag_to_option};

fn parse_json(input: &str, label: &str) -> Result<Value, String> {
    serde_json::from_str(input).map_err(|e| format!("Invalid JSON for {label}: {e}"))
}

fn parse_optional_json(input: Option<&String>, label: &str) -> Result<Option<Value>, String> {
    match input {
        Some(s) => parse_json(s, label).map(Some),
        None => Ok(None),
    }
}

/// Convert a parsed `CliCommand` into a wire-format `Command`.
/// Returns `Err` for commands that don't map to a single protocol command
/// (e.g., batch, pipe, screenshot) or on JSON parse errors.
#[allow(clippy::too_many_lines)]
pub fn cli_command_to_protocol(cli_command: CliCommand) -> Result<Command, String> {
    match cli_command {
        CliCommand::Status => Ok(Command::Status),

        CliCommand::Clear => Ok(Command::SceneClear),

        CliCommand::Element(element_command) => match element_command {
            ElementCommand::Add {
                id,
                r#type,
                parent,
                props,
            } => {
                let props = parse_optional_json(props.as_ref(), "--props")?;
                Ok(Command::ElementAdd {
                    id,
                    element_type: r#type,
                    parent,
                    props,
                })
            }
            ElementCommand::Remove { id } => Ok(Command::ElementRemove { id }),
            ElementCommand::Set { id, props } => {
                let props = parse_json(&props, "--props")?;
                Ok(Command::ElementSet { id, props })
            }
            ElementCommand::List => Ok(Command::ElementList),
            ElementCommand::Get { id, .. } => Ok(Command::ElementGet { id }),
            ElementCommand::Clone { source, id, props } => {
                let props = parse_optional_json(props.as_ref(), "--props")?;
                Ok(Command::ElementClone { source, id, props })
            }
        },

        CliCommand::Set { target, props } => {
            let props = parse_json(&props, "--props")?;
            Ok(Command::GsapSet { target, props })
        }

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
        } => {
            let tween_type = TweenType::parse(&tween_type)?;
            let props = parse_json(&props, "--props")?;
            let controls = AnimationControls {
                duration,
                ease,
                stagger,
                repeat,
                yoyo: flag_to_option(yoyo),
                delay,
                repeat_delay,
                wait: flag_to_option(wait),
            };

            match tween_type {
                TweenType::To => Ok(Command::AnimateTo {
                    target,
                    props,
                    controls,
                }),
                TweenType::From => Ok(Command::AnimateFrom {
                    target,
                    props,
                    controls,
                }),
                TweenType::FromTo => {
                    let from_props =
                        from_props.ok_or_else(|| "fromTo requires --from-props".to_string())?;
                    let from_props = parse_json(&from_props, "--from-props")?;
                    Ok(Command::AnimateFromTo {
                        target,
                        from_props,
                        to_props: props,
                        controls,
                    })
                }
            }
        }

        CliCommand::AnimateStatus { id } => Ok(Command::AnimateStatus { id }),

        CliCommand::AnimateKill { target } => Ok(Command::AnimateKill { target }),

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
        } => Ok(Command::AnimateMotionPath {
            target,
            path,
            auto_rotate: flag_to_option(auto_rotate),
            align_origin: None,
            start: None,
            end: None,
            controls: AnimationControls {
                duration,
                ease,
                repeat,
                yoyo: flag_to_option(yoyo),
                delay,
                wait: flag_to_option(wait),
                ..AnimationControls::default()
            },
        }),

        CliCommand::Timeline(timeline_command) => match timeline_command {
            TimelineCommand::Create {
                name,
                defaults,
                repeat,
                yoyo,
            } => {
                let defaults = parse_optional_json(defaults.as_ref(), "--defaults")?;
                Ok(Command::TimelineCreate {
                    name,
                    defaults,
                    repeat,
                    yoyo: flag_to_option(yoyo),
                })
            }
            TimelineCommand::Add {
                name,
                tween_type,
                target,
                props,
                from_props,
                position,
                stagger,
            } => {
                let tween_type = TweenType::parse(&tween_type)?;
                let props = parse_json(&props, "--props")?;
                let from_props = parse_optional_json(from_props.as_ref(), "--from-props")?;
                Ok(Command::TimelineAdd {
                    name,
                    tween_type,
                    target,
                    props,
                    from_props,
                    position,
                    stagger,
                })
            }
            TimelineCommand::Play { name, wait } => Ok(Command::TimelinePlay {
                name,
                wait: flag_to_option(wait),
            }),
            TimelineCommand::Pause { name } => Ok(Command::TimelinePause { name }),
            TimelineCommand::Reverse { name } => Ok(Command::TimelineReverse { name }),
            TimelineCommand::Seek { name, position } => {
                Ok(Command::TimelineSeek { name, position })
            }
            TimelineCommand::Label {
                name,
                label,
                position,
            } => Ok(Command::TimelineLabel {
                name,
                label,
                position,
            }),
        },

        CliCommand::Text(text_command) => match text_command {
            TextCommand::Typewriter {
                target,
                text,
                duration,
                ease,
                cursor,
                wait,
            } => Ok(Command::TextTypewriter {
                target,
                text,
                duration,
                ease,
                cursor: flag_to_option(cursor),
                wait: flag_to_option(wait),
            }),
            TextCommand::Scramble {
                target,
                text,
                duration,
                chars,
                wait,
            } => Ok(Command::TextScramble {
                target,
                text,
                duration,
                chars,
                wait: flag_to_option(wait),
            }),
        },

        CliCommand::Camera(camera_command) => match camera_command {
            CameraCommand::Set {
                x,
                y,
                zoom,
                rotation,
            } => Ok(Command::CameraSet {
                x,
                y,
                zoom,
                rotation,
            }),
            CameraCommand::Animate {
                x,
                y,
                zoom,
                rotation,
                duration,
                ease,
                wait,
            } => Ok(Command::CameraAnimate {
                x,
                y,
                zoom,
                rotation,
                duration,
                ease,
                wait: flag_to_option(wait),
            }),
        },

        CliCommand::Scene(scene_command) => match scene_command {
            SceneCommand::Export { .. } => {
                Err("scene export cannot be used inside batch".to_string())
            }
            SceneCommand::Import { .. } => {
                Err("scene import cannot be used inside batch".to_string())
            }
        },

        CliCommand::Screenshot { output } => Ok(Command::Screenshot { output }),

        CliCommand::Batch { .. } => Err("batch cannot be nested inside batch".to_string()),

        CliCommand::Pipe => Err("pipe cannot be used inside batch".to_string()),
    }
}
