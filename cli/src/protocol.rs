use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Converts a CLI boolean flag to an optional protocol field.
/// Protocol uses `Option<bool>` with `skip_serializing_if` so false flags
/// are omitted from the wire format entirely.
pub fn flag_to_option(flag: bool) -> Option<bool> {
    if flag { Some(true) } else { None }
}

/// Tween type — finite set of GSAP animation directions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TweenType {
    #[serde(rename = "to")]
    To,
    #[serde(rename = "from")]
    From,
    #[serde(rename = "fromTo")]
    FromTo,
}

impl TweenType {
    pub fn parse(input: &str) -> Result<Self, String> {
        match input {
            "to" => Ok(Self::To),
            "from" => Ok(Self::From),
            "fromTo" => Ok(Self::FromTo),
            other => Err(format!(
                "Unknown tween type: {other}. Use to, from, or fromTo"
            )),
        }
    }
}

/// Animation control fields shared across animate commands.
/// Flattened into Command variants via `#[serde(flatten)]`.
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct AnimationControls {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ease: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stagger: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repeat: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub yoyo: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delay: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "repeatDelay")]
    pub repeat_delay: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wait: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "cmd", rename_all = "snake_case")]
pub enum Command {
    Status,

    #[serde(rename = "element.add")]
    ElementAdd {
        id: String,
        #[serde(rename = "type")]
        element_type: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        parent: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        props: Option<Value>,
    },

    #[serde(rename = "element.remove")]
    ElementRemove {
        id: String,
    },

    #[serde(rename = "element.set")]
    ElementSet {
        id: String,
        props: Value,
    },

    #[serde(rename = "animate.to")]
    AnimateTo {
        target: String,
        props: Value,
        #[serde(flatten)]
        controls: AnimationControls,
    },

    #[serde(rename = "animate.from")]
    AnimateFrom {
        target: String,
        props: Value,
        #[serde(flatten)]
        controls: AnimationControls,
    },

    #[serde(rename = "animate.fromTo")]
    AnimateFromTo {
        target: String,
        from_props: Value,
        to_props: Value,
        #[serde(flatten)]
        controls: AnimationControls,
    },

    #[serde(rename = "animate.status")]
    AnimateStatus {
        id: String,
    },

    #[serde(rename = "animate.motionPath")]
    AnimateMotionPath {
        target: String,
        path: String,
        #[serde(skip_serializing_if = "Option::is_none", rename = "autoRotate")]
        auto_rotate: Option<bool>,
        #[serde(skip_serializing_if = "Option::is_none", rename = "alignOrigin")]
        align_origin: Option<Vec<f64>>,
        #[serde(skip_serializing_if = "Option::is_none")]
        start: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        end: Option<f64>,
        #[serde(flatten)]
        controls: AnimationControls,
    },

    #[serde(rename = "timeline.create")]
    TimelineCreate {
        name: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        defaults: Option<Value>,
    },

    #[serde(rename = "timeline.add")]
    TimelineAdd {
        name: String,
        tween_type: TweenType,
        target: String,
        props: Value,
        #[serde(skip_serializing_if = "Option::is_none")]
        from_props: Option<Value>,
        #[serde(skip_serializing_if = "Option::is_none")]
        position: Option<String>,
    },

    #[serde(rename = "timeline.play")]
    TimelinePlay {
        name: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        wait: Option<bool>,
    },

    #[serde(rename = "timeline.pause")]
    TimelinePause {
        name: String,
    },

    #[serde(rename = "timeline.reverse")]
    TimelineReverse {
        name: String,
    },

    #[serde(rename = "timeline.seek")]
    TimelineSeek {
        name: String,
        position: String,
    },

    #[serde(rename = "timeline.label")]
    TimelineLabel {
        name: String,
        label: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        position: Option<String>,
    },

    #[serde(rename = "text.typewriter")]
    TextTypewriter {
        target: String,
        text: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        duration: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        ease: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        cursor: Option<bool>,
        #[serde(skip_serializing_if = "Option::is_none")]
        wait: Option<bool>,
    },

    #[serde(rename = "text.scramble")]
    TextScramble {
        target: String,
        text: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        duration: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        chars: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        wait: Option<bool>,
    },

    #[serde(rename = "camera.set")]
    CameraSet {
        #[serde(skip_serializing_if = "Option::is_none")]
        x: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        y: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        zoom: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        rotation: Option<f64>,
    },

    #[serde(rename = "camera.animate")]
    CameraAnimate {
        #[serde(skip_serializing_if = "Option::is_none")]
        x: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        y: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        zoom: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        rotation: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        duration: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        ease: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        wait: Option<bool>,
    },

    Screenshot {
        output: String,
    },
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Response {
    pub ok: bool,
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    pub error: Option<String>,
    #[serde(default)]
    pub mode: Option<String>,
    #[serde(default)]
    pub elements: Option<u64>,
    #[serde(default)]
    pub tweens: Option<u64>,
    #[serde(default)]
    pub timelines: Option<u64>,
    #[serde(default)]
    pub uptime: Option<f64>,
    #[serde(default)]
    pub active: Option<bool>,
    #[serde(default)]
    pub progress: Option<f64>,
    #[serde(flatten)]
    pub extra: serde_json::Map<String, Value>,
}

/// Shared response handling for command results.
pub fn print_response(response: &Response) {
    if response.ok {
        if let Some(id) = &response.id {
            println!("{id}");
        } else {
            println!("ok");
        }
    } else {
        eprintln!("Error: {}", response.error.as_deref().unwrap_or_default());
        std::process::exit(1);
    }
}

/// Send a command and print the standard response.
pub fn send_and_print(command: &Command) {
    match crate::ipc::send_command(command) {
        Ok(response) => print_response(&response),
        Err(e) => {
            eprintln!("{e}");
            std::process::exit(1);
        }
    }
}
