use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    time::{Duration, Instant},
};

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
};

use tauri_plugin_global_shortcut::{
    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
};
use tauri_plugin_opener::OpenerExt;

use futures_util::{SinkExt, StreamExt};
use rand::RngCore;
use tokio::net::TcpListener;
use tokio_tungstenite::{
    accept_hdr_async,
    tungstenite::{
        handshake::server::{ErrorResponse, Request, Response},
        http::StatusCode,
    },
};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Debug, Clone, Copy)]
enum InputIntent {
    StartSplitFinish,
    PauseResume,
    UndoSplit,
    SkipSplit,
    Reset,
}

impl InputIntent {
    fn as_str(self) -> &'static str {
        match self {
            Self::StartSplitFinish => "start_split_finish",
            Self::PauseResume => "pause_resume",
            Self::UndoSplit => "undo_split",
            Self::SkipSplit => "skip_split",
            Self::Reset => "reset",
        }
    }
}

#[derive(Debug, serde::Deserialize)]
#[serde(tag = "type", deny_unknown_fields)]
enum BrowserMessage {
    #[serde(rename = "configure_shortcuts")]
    ConfigureShortcuts {
        shortcuts: ShortcutConfiguration,
    },
}

#[derive(Debug, serde::Deserialize)]
#[serde(deny_unknown_fields)]
struct ShortcutConfiguration {
    start_split_finish: Option<String>,
    pause_resume: Option<String>,
    undo_split: Option<String>,
    skip_split: Option<String>,
    reset: Option<String>,
}

#[derive(Debug, Clone)]
struct ConfiguredShortcut {
    shortcut: Shortcut,
    intent: InputIntent,
}

fn browser_code_to_tauri_code(code: &str) -> Option<Code> {
    match code {
        // Letters
        "KeyA" => Some(Code::KeyA),
        "KeyB" => Some(Code::KeyB),
        "KeyC" => Some(Code::KeyC),
        "KeyD" => Some(Code::KeyD),
        "KeyE" => Some(Code::KeyE),
        "KeyF" => Some(Code::KeyF),
        "KeyG" => Some(Code::KeyG),
        "KeyH" => Some(Code::KeyH),
        "KeyI" => Some(Code::KeyI),
        "KeyJ" => Some(Code::KeyJ),
        "KeyK" => Some(Code::KeyK),
        "KeyL" => Some(Code::KeyL),
        "KeyM" => Some(Code::KeyM),
        "KeyN" => Some(Code::KeyN),
        "KeyO" => Some(Code::KeyO),
        "KeyP" => Some(Code::KeyP),
        "KeyQ" => Some(Code::KeyQ),
        "KeyR" => Some(Code::KeyR),
        "KeyS" => Some(Code::KeyS),
        "KeyT" => Some(Code::KeyT),
        "KeyU" => Some(Code::KeyU),
        "KeyV" => Some(Code::KeyV),
        "KeyW" => Some(Code::KeyW),
        "KeyX" => Some(Code::KeyX),
        "KeyY" => Some(Code::KeyY),
        "KeyZ" => Some(Code::KeyZ),

        // Number row
        "Digit0" => Some(Code::Digit0),
        "Digit1" => Some(Code::Digit1),
        "Digit2" => Some(Code::Digit2),
        "Digit3" => Some(Code::Digit3),
        "Digit4" => Some(Code::Digit4),
        "Digit5" => Some(Code::Digit5),
        "Digit6" => Some(Code::Digit6),
        "Digit7" => Some(Code::Digit7),
        "Digit8" => Some(Code::Digit8),
        "Digit9" => Some(Code::Digit9),

        // Numpad
        "Numpad0" => Some(Code::Numpad0),
        "Numpad1" => Some(Code::Numpad1),
        "Numpad2" => Some(Code::Numpad2),
        "Numpad3" => Some(Code::Numpad3),
        "Numpad4" => Some(Code::Numpad4),
        "Numpad5" => Some(Code::Numpad5),
        "Numpad6" => Some(Code::Numpad6),
        "Numpad7" => Some(Code::Numpad7),
        "Numpad8" => Some(Code::Numpad8),
        "Numpad9" => Some(Code::Numpad9),

        // Function keys
        "F1" => Some(Code::F1),
        "F2" => Some(Code::F2),
        "F3" => Some(Code::F3),
        "F4" => Some(Code::F4),
        "F5" => Some(Code::F5),
        "F6" => Some(Code::F6),
        "F7" => Some(Code::F7),
        "F8" => Some(Code::F8),
        "F9" => Some(Code::F9),
        "F10" => Some(Code::F10),
        "F11" => Some(Code::F11),
        "F12" => Some(Code::F12),

        _ => None,
    }
}

fn browser_shortcut_to_tauri_shortcut(
    value: &str,
) -> Result<Shortcut, String> {
    let parts: Vec<&str> = value.split('+').collect();

    let Some((code_value, modifier_values)) =
        parts.split_last()
    else {
        return Err("Shortcut cannot be empty".to_string());
    };

    let code = browser_code_to_tauri_code(code_value)
        .ok_or_else(|| {
            format!("Unsupported shortcut code: {code_value}")
        })?;

    let mut modifiers = Modifiers::empty();

    for modifier in modifier_values {
        let flag = match *modifier {
            "Ctrl" => Modifiers::CONTROL,
            "Alt" => Modifiers::ALT,
            "Shift" => Modifiers::SHIFT,

            unsupported => {
                return Err(format!(
                    "Unsupported shortcut modifier: {unsupported}"
                ));
            }
        };

        if modifiers.contains(flag) {
            return Err(format!(
                "Duplicate shortcut modifier: {modifier}"
            ));
        }

        modifiers |= flag;
    }

    let modifiers = if modifiers.is_empty() {
        None
    } else {
        Some(modifiers)
    };

    Ok(Shortcut::new(modifiers, code))
}

fn build_configured_shortcuts(
    configuration: &ShortcutConfiguration,
) -> Result<Vec<ConfiguredShortcut>, String> {
    let values = [
        (
            configuration.start_split_finish.as_deref(),
            InputIntent::StartSplitFinish,
        ),
        (
            configuration.pause_resume.as_deref(),
            InputIntent::PauseResume,
        ),
        (
            configuration.undo_split.as_deref(),
            InputIntent::UndoSplit,
        ),
        (
            configuration.skip_split.as_deref(),
            InputIntent::SkipSplit,
        ),
        (
            configuration.reset.as_deref(),
            InputIntent::Reset,
        ),
    ];

    let mut configured = Vec::new();

    for (browser_code, intent) in values {
        let Some(browser_code) = browser_code else {
            continue;
        };

        let shortcut =
            browser_shortcut_to_tauri_shortcut(browser_code)?;

        if configured
            .iter()
            .any(|existing: &ConfiguredShortcut| {
                existing.shortcut == shortcut
            })
        {
            return Err(format!(
                "Duplicate shortcut code: {browser_code}"
            ));
        }

        configured.push(ConfiguredShortcut {
            shortcut,
            intent,
        });
    }

    Ok(configured)
}

fn disable_hotkeys(
    app: &tauri::AppHandle,
    hotkeys_enabled: &Arc<AtomicBool>,
    configured_shortcuts: &Arc<Mutex<Vec<ConfiguredShortcut>>>,
) {
    if !hotkeys_enabled.load(Ordering::SeqCst) {
        return;
    }

    match configured_shortcuts.lock() {
        Ok(configured) => {
            for configured_shortcut in configured.iter() {
                if let Err(error) = app
                    .global_shortcut()
                    .unregister(configured_shortcut.shortcut)
                {
                    eprintln!(
                        "Failed to unregister hotkey during disable: {error}"
                    );
                }
            }
        }

        Err(error) => {
            eprintln!(
                "Failed to access configured shortcuts during disable: {error}"
            );
        }
    }

    hotkeys_enabled.store(false, Ordering::SeqCst);

    println!("Hotkeys automatically disabled");
}

const ALLOWED_ORIGINS: &[&str] = &["https://tfdspeedrun.vercel.app"];

fn is_allowed_origin(origin: &str) -> bool {
    ALLOWED_ORIGINS.contains(&origin)
}

async fn run_local_bridge(
    app: tauri::AppHandle,
    pairing_code: Arc<Mutex<PairingState>>,
    connected: Arc<AtomicBool>,
    hotkeys_enabled: Arc<AtomicBool>,
    hotkeys_item: MenuItem<tauri::Wry>,
    active_intent_sender: Arc<
        Mutex<Option<tokio::sync::mpsc::Sender<InputIntent>>>,
    >,
    configured_shortcuts: Arc<Mutex<Vec<ConfiguredShortcut>>>,
) {
    const BRIDGE_ADDRESS: &str = "127.0.0.1:38471";

    let listener = match TcpListener::bind(BRIDGE_ADDRESS).await {
        Ok(listener) => listener,
        Err(error) => {
            eprintln!("Failed to start local bridge on {BRIDGE_ADDRESS}: {error}");
            return;
        }
    };

    println!("Local bridge listening on ws://{BRIDGE_ADDRESS}");

    loop {
        let (stream, address) = match listener.accept().await {
            Ok(connection) => connection,
            Err(error) => {
                eprintln!("Local bridge accept error: {error}");
                continue;
            }
        };
        let pairing_code_for_connection = Arc::clone(&pairing_code);
        let connected_for_connection = Arc::clone(&connected);
        let app_for_connection = app.clone();

        let hotkeys_enabled_for_connection =
            Arc::clone(&hotkeys_enabled);

        let hotkeys_item_for_connection =
            hotkeys_item.clone();

        let active_intent_sender_for_connection =
            Arc::clone(&active_intent_sender);

        let configured_shortcuts_for_connection =
            Arc::clone(&configured_shortcuts);

        tauri::async_runtime::spawn(async move {
            let callback = |request: &Request, response: Response| {
                let origin = request
                    .headers()
                    .get("origin")
                    .and_then(|value| value.to_str().ok());

                match origin {
                    Some(origin) if is_allowed_origin(origin) => {
                        println!("WebSocket origin accepted: {origin}");
                        Ok(response)
                    }

                    Some(origin) => {
                        eprintln!("WebSocket origin rejected: {origin}");

                        let mut error_response =
                            ErrorResponse::new(Some("Origin not allowed".to_string()));

                        *error_response.status_mut() = StatusCode::FORBIDDEN;

                        Err(error_response)
                    }

                    None => {
                        eprintln!("WebSocket connection rejected: missing Origin header");

                        let mut error_response =
                            ErrorResponse::new(Some("Missing Origin header".to_string()));

                        *error_response.status_mut() = StatusCode::FORBIDDEN;

                        Err(error_response)
                    }
                }
            };

            let mut websocket = match accept_hdr_async(stream, callback).await {
                Ok(websocket) => websocket,

                Err(error) => {
                    eprintln!("WebSocket handshake failed for {address}: {error}");
                    return;
                }
            };

            println!("Browser connected, awaiting pairing: {address}");

            let pairing_message =
                tokio::time::timeout(
                    std::time::Duration::from_secs(10),
                    websocket.next(),
                )
                .await;

            let supplied_pairing_code = match pairing_message {
                Ok(Some(Ok(message))) if message.is_text() => {
                    match message.to_text() {
                        Ok(text) => text.to_string(),

                        Err(error) => {
                            eprintln!(
                                "Invalid pairing message from {address}: {error}"
                            );

                            let _ = websocket.close(None).await;
                            return;
                        }
                    }
                }

                Ok(Some(Ok(_))) => {
                    eprintln!(
                        "Pairing rejected for {address}: expected text message"
                    );

                    let _ = websocket.close(None).await;
                    return;
                }

                Ok(Some(Err(error))) => {
                    eprintln!(
                        "WebSocket error during pairing for {address}: {error}"
                    );
                    return;
                }

                Ok(None) => {
                    println!(
                        "Browser disconnected before pairing: {address}"
                    );
                    return;
                }

                Err(_) => {
                    eprintln!(
                        "Pairing timed out for {address}: no pairing code received within 10 seconds"
                    );

                    let _ = websocket.close(None).await;
                    return;
                }
            };

            let pairing_accepted = {
                match pairing_code_for_connection.lock() {
                    Ok(mut pairing_state) => {
                        pairing_state.consume_if_matches(&supplied_pairing_code)
                    }

                    Err(error) => {
                        eprintln!(
                            "Failed to access pairing state for {address}: {error}"
                        );
                        false
                    }
                }
            };

            if !pairing_accepted {
                eprintln!("Pairing rejected for {address}");

                let _ = websocket
                    .send(tokio_tungstenite::tungstenite::Message::Text(
                        "pairing_rejected".into(),
                    ))
                    .await;

                let _ = websocket.close(None).await;
                return;
            }

            println!("Pairing accepted: {address}");
            connected_for_connection.store(true, Ordering::SeqCst);
            println!("Companion state: CONNECTED");

            if let Err(error) = websocket
                .send(tokio_tungstenite::tungstenite::Message::Text(
                    "pairing_ok".into(),
                ))
                .await
            {
                eprintln!("Failed to confirm pairing for {address}: {error}");

                connected_for_connection.store(false, Ordering::SeqCst);

                println!("Companion state: DISCONNECTED");

                return;
            }

            // Pairing succeeded.
            //
            // Create a private intent channel for this authenticated
            // browser connection. The global shortcut handler gets
            // the sender; this WebSocket task owns the receiver.
            let (intent_sender, mut intent_receiver) =
                tokio::sync::mpsc::channel::<InputIntent>(32);

            let intent_channel_activated = {
                match active_intent_sender_for_connection.lock() {
                    Ok(mut active_sender) => {
                        *active_sender = Some(intent_sender);
                        true
                    }

                    Err(error) => {
                        eprintln!(
                            "Failed to activate Companion input channel for {address}: {error}"
                        );
                        false
                    }
                }
            };

            if !intent_channel_activated {
                connected_for_connection.store(false, Ordering::SeqCst);

                let _ = websocket.close(None).await;

                return;
            }

            println!("Authenticated input channel active: {address}");

            loop {
                tokio::select! {
                    websocket_message = websocket.next() => {
                        match websocket_message {
                            Some(Ok(message)) if message.is_close() => {
                                break;
                            }

                            Some(Ok(message)) if message.is_text() => {
                            let text = match message.to_text() {
                                Ok(text) => text,

                                Err(error) => {
                                    eprintln!(
                                        "Invalid browser message from {address}: {error}"
                                    );
                                    continue;
                                }
                            };

                            match serde_json::from_str::<BrowserMessage>(text) {
                                Ok(BrowserMessage::ConfigureShortcuts {
                                    shortcuts,
                                }) => {
                                    let configured = match build_configured_shortcuts(&shortcuts) {
                                        Ok(configured) => configured,

                                        Err(error) => {
                                            eprintln!(
                                                "Shortcut configuration rejected: {error}"
                                            );
                                            continue;
                                        }
                                    };

                                    println!(
                                        "Validated {} configured shortcut(s)",
                                        configured.len()
                                    );

                                    // A configuration change may never silently change
                                    // active OS-level hotkeys. If currently ARMED, disable
                                    // the old configuration first.
                                    if hotkeys_enabled_for_connection.load(Ordering::SeqCst) {
                                        disable_hotkeys(
                                            &app_for_connection,
                                            &hotkeys_enabled_for_connection,
                                            &configured_shortcuts_for_connection,
                                        );

                                        let _ = hotkeys_item_for_connection
                                            .set_text("Hotkeys: Disabled");

                                        println!(
                                            "Hotkeys disabled because shortcut configuration changed"
                                        );
                                    }

                                    match configured_shortcuts_for_connection.lock() {
                                        Ok(mut current_configuration) => {
                                            *current_configuration = configured;
                                        }

                                        Err(error) => {
                                            eprintln!(
                                                "Failed to store shortcut configuration: {error}"
                                            );
                                            continue;
                                        }
                                    }

                                    println!("Shortcut configuration stored");
                                    println!(
                                        "Shortcut configuration received from {address}:"
                                    );

                                    println!(
                                        "  start_split_finish: {:?}",
                                        shortcuts.start_split_finish
                                    );

                                    println!(
                                        "  pause_resume: {:?}",
                                        shortcuts.pause_resume
                                    );

                                    println!(
                                        "  undo_split: {:?}",
                                        shortcuts.undo_split
                                    );

                                    println!(
                                        "  skip_split: {:?}",
                                        shortcuts.skip_split
                                    );

                                    println!(
                                        "  reset: {:?}",
                                        shortcuts.reset
                                    );
                                }

                                Err(error) => {
                                    eprintln!(
                                        "Ignored invalid browser message from {address}: {error}"
                                    );
                                }
                            }
                        }

                            Some(Ok(_)) => {
                                // Andere berichttypen hebben geen autoriteit.
                            }

                            Some(Err(error)) => {
                                eprintln!(
                                    "WebSocket error for {address}: {error}"
                                );
                                break;
                            }

                            None => {
                                break;
                            }
                        }
                    }

                    intent = intent_receiver.recv() => {
                        let Some(intent) = intent else {
                            break;
                        };

                        let intent_text = intent.as_str();

                        if let Err(error) = websocket
                            .send(
                                tokio_tungstenite::tungstenite::Message::Text(
                                    intent_text.into()
                                )
                            )
                            .await
                        {
                            eprintln!(
                                "Failed to send input intent {intent_text} to browser: {error}"
                            );
                            break;
                        }

                        println!(
                            "Input intent sent to browser: {intent_text}"
                        );
                    }
                }
            }

            // This authenticated session no longer has authority to
            // receive input intents.
            match active_intent_sender_for_connection.lock() {
                Ok(mut active_sender) => {
                    *active_sender = None;
                }

                Err(error) => {
                    eprintln!(
                        "Failed to clear active Companion session: {error}"
                    );
                }
            }

            connected_for_connection.store(false, Ordering::SeqCst);

            disable_hotkeys(
                &app_for_connection,
                &hotkeys_enabled_for_connection,
                &configured_shortcuts_for_connection,
            );

            let _ =
                hotkeys_item_for_connection.set_text("Hotkeys: Disabled");

            println!("Companion state: DISCONNECTED");
            println!("Paired browser disconnected: {address}");
        });
    }
}

const PAIRING_CODE_LIFETIME: Duration = Duration::from_secs(120);

struct PairingState {
    code: Option<String>,
    created_at: Instant,
}

impl PairingState {
    fn new() -> Self {
        Self {
            code: Some(generate_pairing_code()),
            created_at: Instant::now(),
        }
    }

    fn valid_code(&self) -> Option<&str> {
        let code = self.code.as_deref()?;

        if self.created_at.elapsed() >= PAIRING_CODE_LIFETIME {
            return None;
        }

        Some(code)
    }

    fn get_or_refresh_code(&mut self) -> String {
        if let Some(code) = self.valid_code() {
            return code.to_string();
        }

        let code = generate_pairing_code();

        self.code = Some(code.clone());
        self.created_at = Instant::now();

        println!("Generated a new pairing code");

        code
    }

    fn consume_if_matches(&mut self, supplied_code: &str) -> bool {
        let matches = self
            .valid_code()
            .is_some_and(|expected_code| expected_code == supplied_code);

        if matches {
            self.code = None;
        }

        matches
    }
}

fn generate_pairing_code() -> String {
    let mut bytes = [0u8; 32];
    rand::rng().fill_bytes(&mut bytes);

    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let hotkeys_enabled = Arc::new(AtomicBool::new(false));
    let connected = Arc::new(AtomicBool::new(false));
    let configured_shortcuts =
        Arc::new(Mutex::new(Vec::<ConfiguredShortcut>::new()));
    let active_intent_sender = Arc::new(Mutex::new(
        None::<tokio::sync::mpsc::Sender<InputIntent>>,
    ));
    let pairing_code =
        Arc::new(Mutex::new(PairingState::new()));

    let hotkeys_enabled_for_shortcuts =
        Arc::clone(&hotkeys_enabled);
    let configured_shortcuts_for_handler =
        Arc::clone(&configured_shortcuts);

    let active_intent_sender_for_shortcuts =
        Arc::clone(&active_intent_sender);

    tauri::Builder::default()
        // Single-instance must remain the first registered plugin.
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {
            // Companion is tray-only.
            // A second launch exits without opening or focusing a window.
        }))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |_app, shortcut, event| {
                if event.state() != ShortcutState::Pressed {
                    return;
                }

                // Defense in depth:
                // even if an OS shortcut somehow remains registered,
                // it has no authority unless the Companion is ARMED.
                if !hotkeys_enabled_for_shortcuts.load(Ordering::SeqCst) {
                    return;
                }

                let intent = {
                let configured = match configured_shortcuts_for_handler.lock() {
                    Ok(configured) => configured,

                    Err(error) => {
                        eprintln!(
                            "Failed to access configured shortcuts: {error}"
                        );
                        return;
                    }
                };

                configured
                    .iter()
                    .find(|configured_shortcut| {
                        shortcut == &configured_shortcut.shortcut
                    })
                    .map(|configured_shortcut| configured_shortcut.intent)
            };

            let Some(intent) = intent else {
                return;
            };

            let sender = match active_intent_sender_for_shortcuts.lock() {
                Ok(sender) => sender,

                Err(error) => {
                    eprintln!(
                        "Failed to access active Companion session: {error}"
                    );
                    return;
                }
            };

            let Some(sender) = sender.as_ref() else {
                eprintln!(
                    "Input intent dropped: no authenticated browser connection"
                );
                return;
            };

            match sender.try_send(intent) {
                Ok(_) => {
                    println!(
                        "Input intent queued: {}",
                        intent.as_str()
                    );
                }

                Err(tokio::sync::mpsc::error::TrySendError::Full(_)) => {
                    eprintln!(
                        "Input intent dropped because the queue is full: {}",
                        intent.as_str()
                    );
                }

                Err(tokio::sync::mpsc::error::TrySendError::Closed(_)) => {
                    eprintln!(
                        "Input intent dropped because the authenticated browser connection is closed: {}",
                        intent.as_str()
                    );
                }
            }
            })
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let open_item =
                MenuItem::with_id(
                    app,
                    "open",
                    "Open TFDSpeedrun",
                    true,
                    None::<&str>,
                )?;

            let hotkeys_item =
                MenuItem::with_id(
                    app,
                    "hotkeys",
                    "Hotkeys: Disabled",
                    true,
                    None::<&str>,
                )?;

            let close_item =
                MenuItem::with_id(
                    app,
                    "close",
                    "Close Companion",
                    true,
                    None::<&str>,
                )?;

                let pairing_code_for_bridge =
                    Arc::clone(&pairing_code);

                let connected_for_bridge =
                    Arc::clone(&connected);

                let hotkeys_enabled_for_bridge =
                    Arc::clone(&hotkeys_enabled);

                let hotkeys_item_for_bridge =
                    hotkeys_item.clone();

                let active_intent_sender_for_bridge =
                    Arc::clone(&active_intent_sender);

                let app_for_bridge =
                    app.handle().clone();

                let configured_shortcuts_for_bridge =
                    Arc::clone(&configured_shortcuts);

                tauri::async_runtime::spawn(
                    run_local_bridge(
                        app_for_bridge,
                        pairing_code_for_bridge,
                        connected_for_bridge,
                        hotkeys_enabled_for_bridge,
                        hotkeys_item_for_bridge,
                        active_intent_sender_for_bridge,
                        configured_shortcuts_for_bridge,
                    )
                );

            let menu =
                Menu::with_items(app, &[&open_item, &hotkeys_item, &close_item])?;

            let hotkeys_enabled_for_menu = Arc::clone(&hotkeys_enabled);
            let hotkeys_item_for_menu = hotkeys_item.clone();
            let pairing_code_for_menu = Arc::clone(&pairing_code);
            let connected_for_menu = Arc::clone(&connected);
            let configured_shortcuts_for_menu =
                Arc::clone(&configured_shortcuts);

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("TFDSpeedrun Companion")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "open" => {
                            let pairing_code = match pairing_code_for_menu.lock() {
                                Ok(mut pairing_state) => {
                                    pairing_state.get_or_refresh_code()
                                }

                                Err(error) => {
                                    eprintln!(
                                        "Failed to access pairing state: {error}"
                                    );
                                    return;
                                }
                            };

                            let url = format!(
                                "https://tfdspeedrun.vercel.app/dashboard#companion_pair={}",
                                pairing_code
                            );

                            let _ = app.opener().open_url(
                                url,
                                None::<&str>,
                            );
                        }

                        "hotkeys" => {
                            let currently_enabled =
                                hotkeys_enabled_for_menu.load(Ordering::SeqCst);

                            let is_connected =
                                connected_for_menu.load(Ordering::SeqCst);

                            if !currently_enabled && !is_connected {
                                println!(
                                    "Hotkeys cannot be enabled: Companion is DISCONNECTED"
                                );
                                return;
                            }

                            if currently_enabled {
                                // Disable all configured hotkeys.
                                let mut unregister_failed = false;

                                let configured = match configured_shortcuts_for_menu.lock() {
                                    Ok(configured) => configured,

                                    Err(error) => {
                                        eprintln!(
                                            "Failed to access configured shortcuts: {error}"
                                        );
                                        return;
                                    }
                                };

                                for configured_shortcut in configured.iter() {
                                    if let Err(error) = app
                                        .global_shortcut()
                                        .unregister(configured_shortcut.shortcut)
                                    {
                                        eprintln!(
                                            "Failed to unregister hotkey: {error}"
                                        );
                                        unregister_failed = true;
                                    }
                                }

                                if unregister_failed {
                                    eprintln!(
                                        "One or more hotkeys could not be unregistered"
                                    );
                                }

                                hotkeys_enabled_for_menu.store(
                                    false,
                                    Ordering::SeqCst,
                                );

                                let _ = hotkeys_item_for_menu
                                    .set_text("Hotkeys: Disabled");

                                println!("Hotkeys disabled");
                            } else {
                                // Register the configured hotkeys one by one.
                                // Keep track of successful registrations so we can
                                // roll them back if a later registration fails.
                                let configured = match configured_shortcuts_for_menu.lock() {
                                    Ok(configured) => configured,

                                    Err(error) => {
                                        eprintln!(
                                            "Failed to access configured shortcuts: {error}"
                                        );
                                        return;
                                    }
                                };

                                if configured.is_empty() {
                                    println!(
                                        "Hotkeys cannot be enabled: no shortcuts configured"
                                    );
                                    return;
                                }
                                let mut registered_shortcuts = Vec::new();
                                let mut registration_error = None;

                                for configured_shortcut in configured.iter() {
                                let shortcut = configured_shortcut.shortcut;

                                match app.global_shortcut().register(shortcut) {
                                    Ok(_) => {
                                        registered_shortcuts.push(shortcut);
                                    }

                                    Err(error) => {
                                        registration_error = Some(error);
                                        break;
                                    }
                                }
                            }

                                if let Some(error) = registration_error {
                                    eprintln!(
                                        "Failed to enable hotkeys: {error}"
                                    );

                                    // Roll back everything registered during
                                    // this enable attempt.
                                    for shortcut in registered_shortcuts {
                                        if let Err(rollback_error) =
                                            app.global_shortcut().unregister(shortcut)
                                        {
                                            eprintln!(
                                                "Failed to roll back hotkey registration: \
                                                {rollback_error}"
                                            );
                                        }
                                    }

                                    hotkeys_enabled_for_menu.store(
                                        false,
                                        Ordering::SeqCst,
                                    );

                                    let _ = hotkeys_item_for_menu
                                        .set_text("Hotkeys: Disabled");

                                    println!(
                                        "Hotkey registration rolled back"
                                    );
                                } else {
                                    hotkeys_enabled_for_menu.store(
                                        true,
                                        Ordering::SeqCst,
                                    );

                                    let _ = hotkeys_item_for_menu
                                        .set_text("Hotkeys: Enabled ✓");

                                    println!("Hotkeys enabled");
                                }
                            }
                        }

                        "close" => {
                            app.exit(0);
                        }

                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
