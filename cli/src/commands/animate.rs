use serde_json::Value;

use crate::protocol::{AnimationControls, Command, TweenType, flag_to_option, send_and_print};

#[allow(clippy::too_many_arguments)]
pub fn run(
    tween_type: String,
    target: String,
    props: String,
    from_props: Option<String>,
    duration: Option<f64>,
    ease: Option<String>,
    stagger: Option<f64>,
    repeat: Option<i32>,
    yoyo: bool,
    delay: Option<f64>,
    repeat_delay: Option<f64>,
    wait: bool,
) {
    let tween_type = TweenType::parse(&tween_type).unwrap_or_else(|e| {
        eprintln!("{e}");
        std::process::exit(1);
    });
    let props: Value = parse_json(&props, "--props");
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

    let command = match tween_type {
        TweenType::To => Command::AnimateTo {
            target,
            props,
            controls,
        },
        TweenType::From => Command::AnimateFrom {
            target,
            props,
            controls,
        },
        TweenType::FromTo => {
            let from_props = from_props.unwrap_or_else(|| {
                eprintln!("Error: fromTo requires --from-props");
                std::process::exit(1);
            });
            let from_props = parse_json(&from_props, "--from-props");
            Command::AnimateFromTo {
                target,
                from_props,
                to_props: props,
                controls,
            }
        }
    };

    send_and_print(&command);
}

#[allow(clippy::too_many_arguments)]
pub fn motion_path(
    target: String,
    path: String,
    auto_rotate: bool,
    duration: Option<f64>,
    ease: Option<String>,
    repeat: Option<i32>,
    yoyo: bool,
    delay: Option<f64>,
    wait: bool,
) {
    send_and_print(&Command::AnimateMotionPath {
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
    });
}

pub fn status(id: String) {
    match crate::ipc::send_command(&Command::AnimateStatus { id }) {
        Ok(response) => {
            if response.ok {
                let active = response.active.unwrap_or(false);
                let progress = response.progress.unwrap_or(0.0);
                println!("active={active} progress={progress:.3}");
            } else {
                eprintln!("Error: {}", response.error.as_deref().unwrap_or_default());
                std::process::exit(1);
            }
        }
        Err(e) => {
            eprintln!("{e}");
            std::process::exit(1);
        }
    }
}

pub fn kill(target: String) {
    send_and_print(&Command::AnimateKill { target });
}

fn parse_json(input: &str, label: &str) -> Value {
    serde_json::from_str(input).unwrap_or_else(|e| {
        eprintln!("Invalid JSON for {label}: {e}");
        std::process::exit(1);
    })
}
