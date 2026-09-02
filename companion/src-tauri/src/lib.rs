use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
};

use tauri_plugin_global_shortcut::{
    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
};
use tauri_plugin_opener::OpenerExt;

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

fn shortcuts() -> [(Shortcut, InputIntent); 5] {
    [
        (
            Shortcut::new(
                Some(Modifiers::CONTROL | Modifiers::SHIFT),
                Code::F1,
            ),
            InputIntent::StartSplitFinish,
        ),
        (
            Shortcut::new(
                Some(Modifiers::CONTROL | Modifiers::SHIFT),
                Code::F2,
            ),
            InputIntent::PauseResume,
        ),
        (
            Shortcut::new(
                Some(Modifiers::CONTROL | Modifiers::SHIFT),
                Code::F3,
            ),
            InputIntent::UndoSplit,
        ),
        (
            Shortcut::new(
                Some(Modifiers::CONTROL | Modifiers::SHIFT),
                Code::F4,
            ),
            InputIntent::SkipSplit,
        ),
        (
            Shortcut::new(
                Some(Modifiers::CONTROL | Modifiers::SHIFT),
                Code::F5,
            ),
            InputIntent::Reset,
        ),
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let hotkeys_enabled = Arc::new(AtomicBool::new(false));

    tauri::Builder::default()
        // Single-instance must remain the first registered plugin.
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {
            // Companion is tray-only.
            // A second launch exits without opening or focusing a window.
        }))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|_app, shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }

                    for (registered_shortcut, intent) in shortcuts() {
                        if shortcut == &registered_shortcut {
                            println!("Input intent received: {}", intent.as_str());
                            break;
                        }
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let open_item =
                MenuItem::with_id(app, "open", "Open TFDSpeedrun", true, None::<&str>)?;

            let hotkeys_item =
                MenuItem::with_id(app, "hotkeys", "Hotkeys: Disabled", true, None::<&str>)?;

            let close_item =
                MenuItem::with_id(app, "close", "Close Companion", true, None::<&str>)?;

            let menu =
                Menu::with_items(app, &[&open_item, &hotkeys_item, &close_item])?;

            let hotkeys_enabled_for_menu = Arc::clone(&hotkeys_enabled);
            let hotkeys_item_for_menu = hotkeys_item.clone();

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("TFDSpeedrun Companion")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "open" => {
                            let _ = app.opener().open_url(
                                "https://tfdspeedrun.vercel.app",
                                None::<&str>,
                            );
                        }

                        "hotkeys" => {
                            let currently_enabled =
                                hotkeys_enabled_for_menu.load(Ordering::SeqCst);

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