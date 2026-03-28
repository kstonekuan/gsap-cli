use std::io::{self, BufRead, BufReader, Write};

use crate::ipc;
use crate::protocol::Command;

pub fn run() {
    let mut stream = ipc::connect().unwrap_or_else(|e| {
        eprintln!("{e}");
        std::process::exit(1);
    });
    let reader_stream = stream.try_clone().unwrap_or_else(|e| {
        eprintln!("Failed to clone stream: {e}");
        std::process::exit(1);
    });
    let mut reader = BufReader::new(&reader_stream);

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

        match ipc::send_on_stream(&mut stream, &mut reader, &command) {
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
