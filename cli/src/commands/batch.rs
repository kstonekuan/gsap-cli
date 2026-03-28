use std::fs;
use std::io::{self, BufReader, Read};

use clap::Parser;
use serde_json::Value;

use crate::args::Cli;
use crate::convert::cli_command_to_protocol;
use crate::protocol::Command;

pub fn run(file: Option<String>, stop_on_error: bool, quiet: bool) {
    let input = if let Some(file_path) = file {
        fs::read_to_string(&file_path).unwrap_or_else(|e| {
            eprintln!("Failed to read file '{file_path}': {e}");
            std::process::exit(1);
        })
    } else {
        let mut buf = String::new();
        io::stdin().read_to_string(&mut buf).unwrap_or_else(|e| {
            eprintln!("Failed to read stdin: {e}");
            std::process::exit(1);
        });
        buf
    };

    let trimmed = input.trim();
    if trimmed.is_empty() {
        println!("Batch: 0 commands (nothing to do)");
        return;
    }

    // Auto-detect format: JSON array starts with '[', otherwise CLI commands (one per line)
    let commands = if trimmed.starts_with('[') {
        parse_json_batch(trimmed)
    } else {
        parse_cli_batch(trimmed)
    };

    if commands.is_empty() {
        println!("Batch: 0 commands (nothing to do)");
        return;
    }

    // Always use sequential mode for CLI-parsed commands (they're already Command objects)
    // For stop_on_error, we also need sequential
    run_sequential(&commands, stop_on_error, quiet);
}

/// Parse a JSON array of raw command objects into protocol Commands.
fn parse_json_batch(input: &str) -> Vec<Command> {
    let values: Vec<Value> = serde_json::from_str(input).unwrap_or_else(|e| {
        eprintln!("Invalid JSON array: {e}");
        std::process::exit(1);
    });

    values
        .into_iter()
        .enumerate()
        .map(|(index, value)| {
            serde_json::from_value(value).unwrap_or_else(|e| {
                eprintln!("[{}] Invalid command JSON: {e}", index + 1);
                std::process::exit(1);
            })
        })
        .collect()
}

/// Parse lines of CLI-style commands into protocol Commands.
/// Each non-empty, non-comment line is parsed as if it were `gsap-cli <args...>`.
fn parse_cli_batch(input: &str) -> Vec<Command> {
    let mut commands = Vec::new();

    for (line_number, line) in input.lines().enumerate() {
        let trimmed = line.trim();
        // Skip empty lines and comments
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }

        // Split the line into shell-like args, handling quotes
        let args = match shell_words::split(trimmed) {
            Ok(args) => args,
            Err(e) => {
                eprintln!("Line {}: failed to parse: {e}", line_number + 1);
                std::process::exit(1);
            }
        };

        // Prepend "gsap-cli" so clap can parse it (it expects the binary name first)
        let mut full_args = vec!["gsap-cli".to_string()];
        full_args.extend(args);

        let cli = match Cli::try_parse_from(&full_args) {
            Ok(cli) => cli,
            Err(e) => {
                eprintln!("Line {}: {e}", line_number + 1);
                std::process::exit(1);
            }
        };

        match cli_command_to_protocol(cli.command) {
            Ok(command) => commands.push(command),
            Err(e) => {
                eprintln!("Line {}: {e}", line_number + 1);
                std::process::exit(1);
            }
        }
    }

    commands
}

fn run_sequential(commands: &[Command], stop_on_error: bool, quiet: bool) {
    let total = commands.len();
    let mut succeeded = 0;
    let mut failed = 0;

    let mut stream = crate::ipc::connect().unwrap_or_else(|e| {
        eprintln!("{e}");
        std::process::exit(1);
    });
    let reader_stream = stream.try_clone().unwrap_or_else(|e| {
        eprintln!("Failed to clone stream: {e}");
        std::process::exit(1);
    });
    let mut reader = BufReader::new(&reader_stream);

    for (index, command) in commands.iter().enumerate() {
        match crate::ipc::send_on_stream(&mut stream, &mut reader, command) {
            Ok(response) => {
                if response.ok {
                    succeeded += 1;
                    if !quiet {
                        if let Some(id) = &response.id {
                            println!("[{}/{}] ok: {id}", index + 1, total);
                        } else {
                            println!("[{}/{}] ok", index + 1, total);
                        }
                    }
                } else {
                    failed += 1;
                    let error = response.error.as_deref().unwrap_or("unknown error");
                    eprintln!("[{}/{}] error: {error}", index + 1, total);
                    if stop_on_error {
                        eprintln!(
                            "Stopped: {succeeded} succeeded, {failed} failed, {} skipped",
                            total - index - 1
                        );
                        std::process::exit(1);
                    }
                }
            }
            Err(e) => {
                failed += 1;
                eprintln!("[{}/{}] error: {e}", index + 1, total);
                if stop_on_error {
                    eprintln!(
                        "Stopped: {succeeded} succeeded, {failed} failed, {} skipped",
                        total - index - 1
                    );
                    std::process::exit(1);
                }
            }
        }
    }

    if quiet {
        if failed > 0 {
            eprintln!("Batch: {succeeded} succeeded, {failed} failed (of {total})");
            std::process::exit(1);
        }
        println!("ok");
    } else {
        if failed > 0 {
            eprintln!("Batch: {succeeded} succeeded, {failed} failed (of {total})");
            std::process::exit(1);
        }
        println!("Batch: {succeeded}/{total} succeeded");
    }
}
