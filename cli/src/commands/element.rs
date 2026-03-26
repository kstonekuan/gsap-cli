use serde_json::Value;

use crate::ipc::send_command;
use crate::protocol::Command;

pub fn add(id: String, element_type: String, props: Option<String>) {
    let props: Option<Value> = props.map(|p| {
        serde_json::from_str(&p).unwrap_or_else(|e| {
            eprintln!("Invalid JSON for --props: {e}");
            std::process::exit(1);
        })
    });

    let command = Command::ElementAdd {
        id,
        element_type,
        props,
    };
    send_and_print(&command);
}

pub fn remove(id: String) {
    send_and_print(&Command::ElementRemove { id });
}

pub fn set(id: String, props: String) {
    let props: Value = serde_json::from_str(&props).unwrap_or_else(|e| {
        eprintln!("Invalid JSON for --props: {e}");
        std::process::exit(1);
    });
    send_and_print(&Command::ElementSet { id, props });
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
