
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, WindowEvent,
};
use tauri_plugin_opener::OpenerExt;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let window_for_close = window.clone();

                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_for_close.hide();
                    }
                });
            }

            let open_item = MenuItem::with_id(
                app,
                "open",
                "Open TFDSpeedrun",
                true,
                None::<&str>,
            )?;

            let hotkeys_item = MenuItem::with_id(
                app,
                "hotkeys",
                "Hotkeys: Disabled",
                false,
                None::<&str>,
            )?;

            let close_item = MenuItem::with_id(
                app,
                "close",
                "Close Companion",
                true,
                None::<&str>,
            )?;

            let menu = Menu::with_items(
                app,
                &[&open_item, &hotkeys_item, &close_item],
            )?;

            TrayIconBuilder::new()
            .icon(app.default_window_icon().unwrap().clone())
            .tooltip("TFDSpeedrun Companion")
            .menu(&menu)
            .show_menu_on_left_click(false)
            .on_menu_event(|app, event| {
                match event.id.as_ref() {
                    "open" => {
                        let _ = app.opener().open_url(
                            "https://tfdspeedrun.vercel.app",
                            None::<&str>,
                        );
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
