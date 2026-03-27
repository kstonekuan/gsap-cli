use serde_json::Value;

use crate::protocol::{Command, TweenType, flag_to_option, send_and_print};

pub fn create(name: String, defaults: Option<String>) {
    let defaults: Option<Value> = defaults.map(|d| {
        serde_json::from_str(&d).unwrap_or_else(|e| {
            eprintln!("Invalid JSON for --defaults: {e}");
            std::process::exit(1);
        })
    });
    send_and_print(&Command::TimelineCreate { name, defaults });
}

pub fn add(
    name: String,
    tween_type: String,
    target: String,
    props: String,
    from_props: Option<String>,
    position: Option<String>,
) {
    let tween_type = TweenType::parse(&tween_type).unwrap_or_else(|e| {
        eprintln!("{e}");
        std::process::exit(1);
    });
    let props: Value = serde_json::from_str(&props).unwrap_or_else(|e| {
        eprintln!("Invalid JSON for --props: {e}");
        std::process::exit(1);
    });
    let from_props: Option<Value> = from_props.map(|fp| {
        serde_json::from_str(&fp).unwrap_or_else(|e| {
            eprintln!("Invalid JSON for --from-props: {e}");
            std::process::exit(1);
        })
    });
    send_and_print(&Command::TimelineAdd {
        name,
        tween_type,
        target,
        props,
        from_props,
        position,
    });
}

pub fn play(name: String, wait: bool) {
    send_and_print(&Command::TimelinePlay {
        name,
        wait: flag_to_option(wait),
    });
}

pub fn pause(name: String) {
    send_and_print(&Command::TimelinePause { name });
}

pub fn reverse(name: String) {
    send_and_print(&Command::TimelineReverse { name });
}

pub fn seek(name: String, position: String) {
    send_and_print(&Command::TimelineSeek { name, position });
}

pub fn label(name: String, label: String, position: Option<String>) {
    send_and_print(&Command::TimelineLabel {
        name,
        label,
        position,
    });
}
