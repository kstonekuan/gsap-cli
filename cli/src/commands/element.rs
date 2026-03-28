use serde_json::Value;

use crate::ipc::send_command;
use crate::protocol::Command;

pub fn add(id: String, element_type: String, parent: Option<String>, props: Option<String>) {
    let props: Option<Value> = props.map(|p| {
        serde_json::from_str(&p).unwrap_or_else(|e| {
            eprintln!("Invalid JSON for --props: {e}");
            std::process::exit(1);
        })
    });

    let command = Command::ElementAdd {
        id,
        element_type,
        parent,
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

pub fn list() {
    match send_command(&Command::ElementList) {
        Ok(response) => {
            if response.ok {
                if let Some(list) = response.extra.get("list")
                    && let Some(elements) = list.as_array()
                {
                    if elements.is_empty() {
                        println!("(no elements)");
                    } else {
                        for el in elements {
                            let id = el.get("id").and_then(|v| v.as_str()).unwrap_or("?");
                            let el_type = el.get("type").and_then(|v| v.as_str()).unwrap_or("?");
                            let parent = el
                                .get("parent")
                                .and_then(|v| v.as_str())
                                .map(|p| format!(" (parent: {p})"))
                                .unwrap_or_default();
                            println!("{id} [{el_type}]{parent}");
                        }
                    }
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

pub fn clone(source: String, id: String, props: Option<String>) {
    let props: Option<Value> = props.map(|p| {
        serde_json::from_str(&p).unwrap_or_else(|e| {
            eprintln!("Invalid JSON for --props: {e}");
            std::process::exit(1);
        })
    });
    send_and_print(&Command::ElementClone { source, id, props });
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
