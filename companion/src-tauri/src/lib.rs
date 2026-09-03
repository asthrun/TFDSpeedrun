use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
};

use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
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

fn shortcuts() -> [(Shortcut, InputIntent); 5] {
    [
        (
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::F1),
            InputIntent::StartSplitFinish,
        ),
        (
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::F2),
            InputIntent::PauseResume,
        ),
        (
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::F3),
            InputIntent::UndoSplit,
        ),
        (
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::F4),
            InputIntent::SkipSplit,
        ),
        (
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::F5),
            InputIntent::Reset,
        ),
    ]
}

fn disable_hotkeys(app: &tauri::AppHandle, hotkeys_enabled: &Arc<AtomicBool>) {
    if !hotkeys_enabled.load(Ordering::SeqCst) {
        return;
    }

    for (shortcut, _) in shortcuts() {
        if let Err(error) = app.global_shortcut().unregister(shortcut) {
            eprintln!("Failed to unregister hotkey during disconnect: {error}");
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
    pairing_code: Arc<Mutex<Option<String>>>,
    connected: Arc<AtomicBool>,
    hotkeys_enabled: Arc<AtomicBool>,
    hotkeys_item: MenuItem<tauri::Wry>,
    active_intent_sender: Arc<
        Mutex<Option<tokio::sync::mpsc::UnboundedSender<InputIntent>>>,
    >,
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

            let pairing_message = websocket.next().await;

            let supplied_pairing_code = match pairing_message {
                Some(Ok(message)) if message.is_text() => match message.to_text() {
                    Ok(text) => text.to_string(),

                    Err(error) => {
                        eprintln!("Invalid pairing message from {address}: {error}");

                        let _ = websocket.close(None).await;
                        return;
                    }
                },

                Some(Ok(_)) => {
                    eprintln!("Pairing rejected for {address}: expected text message");

                    let _ = websocket.close(None).await;
                    return;
                }

                Some(Err(error)) => {
                    eprintln!("WebSocket error during pairing for {address}: {error}");
                    return;
                }

                None => {
                    println!("Browser disconnected before pairing: {address}");
                    return;
                }
            };

            let pairing_accepted = {
                match pairing_code_for_connection.lock() {
                    Ok(mut pairing_code) => {
                        match pairing_code.as_ref() {
                            Some(expected_code)
                                if supplied_pairing_code == expected_code.as_str() =>
                            {
                                // Consume the pairing code immediately.
                                *pairing_code = None;
                                true
                            }

                            _ => false,
                        }
                    }

                    Err(error) => {
                        eprintln!("Failed to access pairing state for {address}: {error}");
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
                tokio::sync::mpsc::unbounded_channel::<InputIntent>();

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
            );

            let _ =
                hotkeys_item_for_connection.set_text("Hotkeys: Disabled");

            println!("Companion state: DISCONNECTED");
            println!("Paired browser disconnected: {address}");
        });
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
    let active_intent_sender = Arc::new(Mutex::new(
        None::<tokio::sync::mpsc::UnboundedSender<InputIntent>>,
    ));
    let pairing_code =
        Arc::new(Mutex::new(Some(generate_pairing_code())));

    let hotkeys_enabled_for_shortcuts =
        Arc::clone(&hotkeys_enabled);

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

                for (registered_shortcut, intent) in shortcuts() {
                    if shortcut != &registered_shortcut {
                        continue;
                    }

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

                    if let Err(error) = sender.send(intent) {
                        eprintln!(
                            "Failed to queue input intent {}: {error}",
                            intent.as_str()
                        );
                        return;
                    }

                    println!(
                        "Input intent queued: {}",
                        intent.as_str()
                    );

                    break;
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

                tauri::async_runtime::spawn(
                    run_local_bridge(
                        app_for_bridge,
                        pairing_code_for_bridge,
                        connected_for_bridge,
                        hotkeys_enabled_for_bridge,
                        hotkeys_item_for_bridge,
                        active_intent_sender_for_bridge,
                    )
                );

            let menu =
                Menu::with_items(app, &[&open_item, &hotkeys_item, &close_item])?;

            let hotkeys_enabled_for_menu = Arc::clone(&hotkeys_enabled);
            let hotkeys_item_for_menu = hotkeys_item.clone();
            let pairing_code_for_menu = Arc::clone(&pairing_code);
            let connected_for_menu = Arc::clone(&connected);

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("TFDSpeedrun Companion")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "open" => {
                        let pairing_code = match pairing_code_for_menu.lock() {
                            Ok(pairing_code) => pairing_code,
                            Err(error) => {
                                eprintln!("Failed to access pairing code: {error}");
                                return;
                            }
                        };

                        let Some(pairing_code) = pairing_code.as_ref() else {
                            eprintln!(
                                "Pairing code has already been used. Restart Companion to pair again."
                            );
                            return;
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

                                for (shortcut, _) in shortcuts() {
                                    if let Err(error) =
                                        app.global_shortcut().unregister(shortcut)
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
                                let mut registered_shortcuts = Vec::new();
                                let mut registration_error = None;

                                for (shortcut, _) in shortcuts() {
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
