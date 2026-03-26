use crate::ipc::send_command;
use crate::protocol::Command;

pub fn run() {
    match send_command(&Command::Status) {
        Ok(response) => {
            if response.ok {
                println!("Daemon is running");
                if let Some(mode) = &response.mode {
                    println!("  Mode: {mode}");
                }
                if let Some(elements) = response.elements {
                    println!("  Elements: {elements}");
                }
                if let Some(tweens) = response.tweens {
                    println!("  Active tweens: {tweens}");
                }
                if let Some(timelines) = response.timelines {
                    println!("  Timelines: {timelines}");
                }
                if let Some(uptime) = response.uptime {
                    println!("  Uptime: {uptime:.1}s");
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
