use crate::protocol::{Command, flag_to_option, send_and_print};

pub fn set(x: Option<f64>, y: Option<f64>, zoom: Option<f64>, rotation: Option<f64>) {
    send_and_print(&Command::CameraSet {
        x,
        y,
        zoom,
        rotation,
    });
}

#[allow(clippy::too_many_arguments)]
pub fn animate(
    x: Option<f64>,
    y: Option<f64>,
    zoom: Option<f64>,
    rotation: Option<f64>,
    duration: Option<f64>,
    ease: Option<String>,
    wait: bool,
) {
    send_and_print(&Command::CameraAnimate {
        x,
        y,
        zoom,
        rotation,
        duration,
        ease,
        wait: flag_to_option(wait),
    });
}
