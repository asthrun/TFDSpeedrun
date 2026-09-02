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
                    if event.state() == ShortcutState::Pressed {
                        println!("Global shortcut received: {:?}", shortcut);
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
                            let test_shortcut = Shortcut::new(
                                Some(Modifiers::CONTROL | Modifiers::SHIFT),
                                Code::F1,
                            );

                            let currently_enabled =
                                hotkeys_enabled_for_menu.load(Ordering::SeqCst);

                            if currently_enabled {
                                match app.global_shortcut().unregister(test_shortcut) {
                                    Ok(_) => {
                                        hotkeys_enabled_for_menu
                                            .store(false, Ordering::SeqCst);

                                        let _ = hotkeys_item_for_menu
                                            .set_text("Hotkeys: Disabled");

                                        println!("Hotkeys disabled");
                                    }
                                    Err(error) => {
                                        eprintln!(
                                            "Failed to disable hotkeys: {error}"
                                        );
                                    }
                                }
                            } else {
                                match app.global_shortcut().register(test_shortcut) {
                                    Ok(_) => {
                                        hotkeys_enabled_for_menu
                                            .store(true, Ordering::SeqCst);

                                        let _ = hotkeys_item_for_menu
                                            .set_text("Hotkeys: Enabled ✓");

                                        println!(
                                            "Hotkeys enabled: Ctrl+Shift+F1"
                                        );
                                    }
                                    Err(error) => {
                                        eprintln!(
                                            "Failed to enable hotkeys: {error}"
                                        );
                                    }
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