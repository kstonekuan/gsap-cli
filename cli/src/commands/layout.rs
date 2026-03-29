use crate::ipc::send_command;
use crate::protocol::{Command, LayoutAnchor, LayoutAxis, RelativePosition};

pub fn align(ids: String, axis: String, anchor: String, reference: Option<String>) {
    let ids: Vec<String> = ids.split(',').map(|s| s.trim().to_string()).collect();
    let axis = LayoutAxis::parse(&axis).unwrap_or_else(|e| {
        eprintln!("{e}");
        std::process::exit(1);
    });
    let anchor = LayoutAnchor::parse(&anchor).unwrap_or_else(|e| {
        eprintln!("{e}");
        std::process::exit(1);
    });
    let response = send_command(&Command::LayoutAlign {
        ids,
        axis,
        anchor,
        reference,
    });
    print_positions_response(response);
}

pub fn distribute(
    ids: String,
    axis: String,
    start: Option<f64>,
    end: Option<f64>,
    gap: Option<f64>,
) {
    let ids: Vec<String> = ids.split(',').map(|s| s.trim().to_string()).collect();
    let axis = LayoutAxis::parse(&axis).unwrap_or_else(|e| {
        eprintln!("{e}");
        std::process::exit(1);
    });
    let response = send_command(&Command::LayoutDistribute {
        ids,
        axis,
        start,
        end,
        gap,
    });
    print_positions_response(response);
}

pub fn relative(id: String, to: String, position: String, align: Option<String>, gap: Option<f64>) {
    let position = RelativePosition::parse(&position).unwrap_or_else(|e| {
        eprintln!("{e}");
        std::process::exit(1);
    });
    let align = align.map(|a| {
        LayoutAnchor::parse(&a).unwrap_or_else(|e| {
            eprintln!("{e}");
            std::process::exit(1);
        })
    });
    let response = send_command(&Command::LayoutRelative {
        id,
        to,
        position,
        align,
        gap,
    });
    print_positions_response(response);
}

pub fn get_bounds(id: String) {
    match send_command(&Command::LayoutGetBounds { id }) {
        Ok(response) => {
            if response.ok {
                if let Some(bounds) = response.extra.get("bounds")
                    && let Some(bounds_obj) = bounds.as_object()
                {
                    let x = bounds_obj
                        .get("x")
                        .and_then(serde_json::Value::as_f64)
                        .unwrap_or(0.0);
                    let y = bounds_obj
                        .get("y")
                        .and_then(serde_json::Value::as_f64)
                        .unwrap_or(0.0);
                    let w = bounds_obj
                        .get("width")
                        .and_then(serde_json::Value::as_f64)
                        .unwrap_or(0.0);
                    let h = bounds_obj
                        .get("height")
                        .and_then(serde_json::Value::as_f64)
                        .unwrap_or(0.0);
                    println!("x={x} y={y} width={w} height={h}");
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

fn print_positions_response(result: Result<crate::protocol::Response, String>) {
    match result {
        Ok(response) => {
            if response.ok {
                if let Some(positions) = response.extra.get("positions")
                    && let Some(positions_array) = positions.as_array()
                {
                    for pos in positions_array {
                        let id = pos.get("id").and_then(|v| v.as_str()).unwrap_or("?");
                        let x = pos
                            .get("x")
                            .and_then(serde_json::Value::as_f64)
                            .unwrap_or(0.0);
                        let y = pos
                            .get("y")
                            .and_then(serde_json::Value::as_f64)
                            .unwrap_or(0.0);
                        println!("{id}: x={x} y={y}");
                    }
                } else {
                    println!("ok");
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
