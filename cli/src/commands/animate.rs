use serde_json::Value;

use crate::ipc::send_command;
use crate::protocol::Command;

pub fn run(
    tween_type: String,
    target: String,
    props: String,
    from_props: Option<String>,
    duration: Option<f64>,
    ease: Option<String>,
) {
    let props: Value = parse_json(&props, "--props");

    let command = match tween_type.as_str() {
        "to" => Command::AnimateTo {
            target,
            props,
            duration,
            ease,
        },
        "from" => Command::AnimateFrom {
            target,
            props,
            duration,
            ease,
        },
        "fromTo" => {
            let from_props = from_props.unwrap_or_else(|| {
                eprintln!("Error: fromTo requires --from-props");
                std::process::exit(1);
            });
            let from_props = parse_json(&from_props, "--from-props");
            Command::AnimateFromTo {
                target,
                from_props,
                to_props: props,
                duration,
                ease,
            }
        }
        other => {
            eprintln!("Unknown tween type: {other}. Use to, from, or fromTo");
            std::process::exit(1);
        }
    };

    match send_command(&command) {
        Ok(response) => {
            if response.ok {
                if let Some(id) = &response.id {
                    println!("{id}");
                } else {
                    println!("ok");
                }
            } else {
                eprintln!("Error: {}", response.error.unwrap_or_default());
                std::process::exit(1);
            }
        }
        Err(e) => {
            eprintln!("{e}");
            std::process::exit(1);
        }
    }
}

fn parse_json(input: &str, label: &str) -> Value {
    serde_json::from_str(input).unwrap_or_else(|e| {
        eprintln!("Invalid JSON for {label}: {e}");
        std::process::exit(1);
    })
}
