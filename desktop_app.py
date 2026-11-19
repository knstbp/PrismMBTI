"""Desktop launcher for PrismMBTI using pywebview and an embedded local HTTP server."""

from __future__ import annotations

import base64
import functools
import mimetypes
import os
import socket
import sys
import tempfile
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("image/svg+xml", ".svgz")


PREFERRED_PORT = 18765


def get_resource_root() -> Path:
    """Resolve bundled asset root in PyInstaller or source checkout."""
    meipass = getattr(sys, "_MEIPASS", None)
    if meipass:
        return Path(meipass)
    return Path(__file__).resolve().parent


class QuietHandler(SimpleHTTPRequestHandler):
    """Serve static assets quietly without writing console logs."""

    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".svg": "image/svg+xml",
        ".svgz": "image/svg+xml",
    }

    def log_message(self, format: str, *args: object) -> None:  # noqa: A002
        return


def create_server(root_dir: Path) -> tuple[ThreadingHTTPServer, int]:
    """Bind a localhost-only HTTP server preferring a stable port for localStorage."""
    handler = functools.partial(QuietHandler, directory=str(root_dir))
    for port in (PREFERRED_PORT, 0):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), handler)
            server.daemon_threads = True
            return server, server.server_address[1]
        except OSError:
            continue
    raise RuntimeError("無法在 127.0.0.1 建立本機靜態伺服器")


def get_storage_dir() -> str:
    """Return persistent local storage directory for WebView2 user data."""
    base = os.environ.get("LOCALAPPDATA") or tempfile.gettempdir()
    path = Path(base) / "PrismMBTI" / "webview"
    path.mkdir(parents=True, exist_ok=True)
    return str(path)


def is_port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.2)
        return s.connect_ex(("127.0.0.1", port)) == 0


class DesktopApi:
    """Bridge exposed to pywebview JS for native file saving."""

    def __init__(self) -> None:
        # Keep leading underscore so pywebview does not recursively inspect Window/WinForms COM objects.
        self._window = None

    def save_jpg(self, filename: str, data_url: str) -> dict[str, object]:
        import webview

        if not self._window or not data_url.startswith("data:image/jpeg;base64,"):
            return {"saved": False, "error": "invalid_payload"}

        safe_name = os.path.basename(filename or "PrismMBTI_report.jpg")
        if not safe_name.lower().endswith((".jpg", ".jpeg")):
            safe_name += ".jpg"

        def _open_save_dialog():
            return self._window.create_file_dialog(
                webview.FileDialog.SAVE,
                save_filename=safe_name,
                file_types=("JPEG 圖片 (*.jpg;*.jpeg)",),
            )

        selected = None
        native_form = getattr(self._window, "native", None)
        if native_form is not None and getattr(native_form, "InvokeRequired", False):
            from System import Func, Object

            result_holder: dict[str, object] = {}

            def _ui_call():
                result_holder["selected"] = _open_save_dialog()
                return None

            native_form.Invoke(Func[Object](_ui_call))
            selected = result_holder.get("selected")
        else:
            selected = _open_save_dialog()

        if not selected:
            return {"saved": False, "cancelled": True}

        target_path = selected[0] if isinstance(selected, (list, tuple)) else selected
        if not str(target_path).lower().endswith((".jpg", ".jpeg")):
            target_path = f"{target_path}.jpg"

        raw_b64 = data_url.split(",", 1)[1]
        Path(target_path).write_bytes(base64.b64decode(raw_b64))
        return {"saved": True, "path": str(target_path)}


def main() -> None:
    root_dir = get_resource_root()
    icon_path = root_dir / "assets" / "prism_mbti.ico"
    server, port = create_server(root_dir)

    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    url = f"http://127.0.0.1:{port}/index.html"

    try:
        import webview

        api = DesktopApi()
        window = webview.create_window(
            title="PrismMBTI｜專業人格特質測驗與榮格八維分析",
            url=url,
            js_api=api,
            width=1160,
            height=820,
            min_size=(420, 640),
            text_select=True,
            zoomable=True,
        )
        api._window = window
        webview.start(
            private_mode=False,
            storage_path=get_storage_dir(),
            icon=str(icon_path) if icon_path.exists() else None,
        )
    except Exception:
        # Fallback to system default browser if WebView2 runtime is unavailable
        webbrowser.open(url)
        try:
            server_thread.join()
        except KeyboardInterrupt:
            pass
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
