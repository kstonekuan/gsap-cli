use std::io::{BufRead, BufReader, Write};
use std::os::unix::net::UnixStream;

use crate::protocol::{Command, Response};

const SOCKET_PATH: &str = "/tmp/gsap-cli.sock";

pub fn connect() -> Result<UnixStream, String> {
    UnixStream::connect(SOCKET_PATH)
        .map_err(|e| format!("Cannot connect to daemon at {SOCKET_PATH}: {e}"))
}

pub fn send_on_stream(
    stream: &mut UnixStream,
    reader: &mut BufReader<&UnixStream>,
    command: &Command,
) -> Result<Response, String> {
    let mut payload =
        serde_json::to_string(command).map_err(|e| format!("Serialization error: {e}"))?;
    payload.push('\n');

    stream
        .write_all(payload.as_bytes())
        .map_err(|e| format!("Failed to send command: {e}"))?;

    let mut response_line = String::new();
    reader
        .read_line(&mut response_line)
        .map_err(|e| format!("Failed to read response: {e}"))?;

    if response_line.is_empty() {
        return Err("Daemon closed connection without responding".to_string());
    }

    serde_json::from_str(&response_line).map_err(|e| format!("Invalid response: {e}"))
}

pub fn send_command(command: &Command) -> Result<Response, String> {
    let mut stream = connect()?;
    let reader_stream = stream
        .try_clone()
        .map_err(|e| format!("Clone error: {e}"))?;
    let mut reader = BufReader::new(&reader_stream);
    send_on_stream(&mut stream, &mut reader, command)
}
