use serde_json::Value;

use crate::protocol::{Command, send_and_print};

pub fn run(target: String, props: String) {
    let props: Value = serde_json::from_str(&props).unwrap_or_else(|e| {
        eprintln!("Invalid JSON for --props: {e}");
        std::process::exit(1);
    });
    send_and_print(&Command::GsapSet { target, props });
}
