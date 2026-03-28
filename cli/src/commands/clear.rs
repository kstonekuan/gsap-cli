use crate::protocol::{Command, send_and_print};

pub fn run() {
    send_and_print(&Command::SceneClear);
}
