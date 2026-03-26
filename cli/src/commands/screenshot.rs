use crate::ipc::send_command;
use crate::protocol::Command;

pub fn run(output: String) {
    match send_command(&Command::Screenshot {
        output: output.clone(),
    }) {
        Ok(response) => {
            if response.ok {
                println!("Screenshot saved to {output}");
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
