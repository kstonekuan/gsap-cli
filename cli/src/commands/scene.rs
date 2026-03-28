use std::fs;

use serde_json::Value;

use crate::ipc::send_command;
use crate::protocol::Command;

pub fn export(output: String) {
    match send_command(&Command::SceneExport) {
        Ok(response) => {
            if response.ok {
                if let Some(scene) = response.extra.get("scene") {
                    let json =
                        serde_json::to_string_pretty(scene).unwrap_or_else(|_| "[]".to_string());
                    fs::write(&output, &json).unwrap_or_else(|e| {
                        eprintln!("Failed to write file '{output}': {e}");
                        std::process::exit(1);
                    });
                    let count = scene.as_array().map_or(0, Vec::len);
                    println!("Exported {count} elements to {output}");
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

pub fn import(input: String) {
    let content = fs::read_to_string(&input).unwrap_or_else(|e| {
        eprintln!("Failed to read file '{input}': {e}");
        std::process::exit(1);
    });

    let elements: Vec<Value> = serde_json::from_str(&content).unwrap_or_else(|e| {
        eprintln!("Invalid JSON in '{input}': {e}");
        std::process::exit(1);
    });

    let count = elements.len();
    let command = Command::SceneImport { elements };
    match send_command(&command) {
        Ok(response) => {
            if response.ok {
                println!("Imported {count} elements from {input}");
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
