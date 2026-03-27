use crate::protocol::{Command, flag_to_option, send_and_print};

pub fn typewriter(
    target: String,
    text: String,
    duration: Option<f64>,
    ease: Option<String>,
    cursor: bool,
    wait: bool,
) {
    send_and_print(&Command::TextTypewriter {
        target,
        text,
        duration,
        ease,
        cursor: flag_to_option(cursor),
        wait: flag_to_option(wait),
    });
}

pub fn scramble(
    target: String,
    text: String,
    duration: Option<f64>,
    chars: Option<String>,
    wait: bool,
) {
    send_and_print(&Command::TextScramble {
        target,
        text,
        duration,
        chars,
        wait: flag_to_option(wait),
    });
}
