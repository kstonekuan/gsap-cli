use serde_json::Value;

use crate::ipc::send_command;
use crate::protocol::Command;

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
    position: Option<String>,
) {
    let props: Value = serde_json::from_str(&props).unwrap_or_else(|e| {
        eprintln!("Invalid JSON for --props: {e}");
        std::process::exit(1);
    });
    send_and_print(&Command::TimelineAdd {
        name,
        tween_type,
        target,
        props,
        position,
    });
}

pub fn play(name: String) {
    send_and_print(&Command::TimelinePlay { name });
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

fn send_and_print(command: &Command) {
    match send_command(command) {
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
