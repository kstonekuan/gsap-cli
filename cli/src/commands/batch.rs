use std::io::{self, Read};

use serde_json::Value;

use crate::protocol::{Command, send_and_print};

pub fn run() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap_or_else(|e| {
        eprintln!("Failed to read stdin: {e}");
        std::process::exit(1);
    });

    let commands: Vec<Value> = serde_json::from_str(input.trim()).unwrap_or_else(|e| {
        eprintln!("Invalid JSON array: {e}");
        std::process::exit(1);
    });

    send_and_print(&Command::Batch { commands });
}
