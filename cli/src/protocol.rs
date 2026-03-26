use serde::{Deserialize, Serialize};
use serde_json::Value;

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
        #[serde(skip_serializing_if = "Option::is_none")]
        duration: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        ease: Option<String>,
    },

    #[serde(rename = "animate.from")]
    AnimateFrom {
        target: String,
        props: Value,
        #[serde(skip_serializing_if = "Option::is_none")]
        duration: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        ease: Option<String>,
    },

    #[serde(rename = "animate.fromTo")]
    AnimateFromTo {
        target: String,
        from_props: Value,
        to_props: Value,
        #[serde(skip_serializing_if = "Option::is_none")]
        duration: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        ease: Option<String>,
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
        tween_type: String,
        target: String,
        props: Value,
        #[serde(skip_serializing_if = "Option::is_none")]
        position: Option<String>,
    },

    #[serde(rename = "timeline.play")]
    TimelinePlay {
        name: String,
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
    #[serde(flatten)]
    pub extra: serde_json::Map<String, Value>,
}
