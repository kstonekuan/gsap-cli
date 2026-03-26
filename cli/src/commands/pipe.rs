use std::io::{self, BufRead, Write};

use crate::ipc::send_command;
use crate::protocol::Command;

pub fn run() {
    let stdin = io::stdin();
    let mut stdout = io::stdout();

    for line in stdin.lock().lines() {
        let line = match line {
            Ok(l) => l,
            Err(e) => {
                eprintln!("Read error: {e}");
                break;
            }
        };

        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        // Parse as a raw Command JSON — the daemon accepts the same wire format
        let command: Command = match serde_json::from_str(trimmed) {
            Ok(cmd) => cmd,
            Err(e) => {
                let error_response =
                    serde_json::json!({"ok": false, "error": format!("Invalid JSON: {e}")});
                let _ = writeln!(stdout, "{error_response}");
                let _ = stdout.flush();
                continue;
            }
        };

        match send_command(&command) {
            Ok(response) => {
                let json = serde_json::to_string(&response).unwrap_or_else(|_| {
                    r#"{"ok":false,"error":"serialization error"}"#.to_string()
                });
                let _ = writeln!(stdout, "{json}");
            }
            Err(e) => {
                let error_response = serde_json::json!({"ok": false, "error": e});
                let _ = writeln!(stdout, "{error_response}");
            }
        }
        let _ = stdout.flush();
    }
}
