from contextlib import contextmanager
import http.server
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import time
import unittest


SCRIPT = Path(__file__).with_name("openclaw-stg-test")
@contextmanager
def preview_origin():
    class Preview(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path != "/":
                self.send_error(404)
                return
            body = b"<!doctype html><h1>Synthetic UI preview</h1>"
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *_args):
            pass

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Preview)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}"
    finally:
        server.shutdown()
        server.server_close()
        server_thread.join()


class OpenClawStagingTest(unittest.TestCase):
    def test_interrupted_startup_stops_the_tunnel_process(self):
        with tempfile.TemporaryDirectory() as temporary, preview_origin() as origin:
            root = Path(temporary)
            fake_bin = root / "bin"
            fake_bin.mkdir()
            fake_cloudflared = fake_bin / "cloudflared"
            fake_cloudflared.write_text(
                "#!/usr/bin/env python3\n"
                "import os, time\n"
                "from pathlib import Path\n"
                "Path(os.environ['FAKE_PID_FILE']).write_text(str(os.getpid()))\n"
                "print('https://never-ready.trycloudflare.com', flush=True)\n"
                "time.sleep(300)\n",
                encoding="utf-8",
            )
            fake_cloudflared.chmod(0o755)

            pid_file = root / "tunnel.pid"
            state_dir = root / "state"
            environment = {
                **os.environ,
                "PATH": f"{fake_bin}:{os.environ['PATH']}",
                "FAKE_PID_FILE": str(pid_file),
            }
            process = subprocess.Popen(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--url",
                    origin,
                    "--ttl",
                    "5m",
                    "--state-dir",
                    str(state_dir),
                ],
                env=environment,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            try:
                deadline = time.monotonic() + 5
                while not pid_file.exists() and time.monotonic() < deadline:
                    time.sleep(0.05)
                self.assertTrue(pid_file.exists(), "fake cloudflared did not start")
                tunnel_pid = int(pid_file.read_text())
                process.terminate()
                _stdout, stderr = process.communicate(timeout=8)
                self.assertEqual(process.returncode, 1)
                self.assertIn("startup interrupted", stderr)
                with self.assertRaises(ProcessLookupError):
                    os.kill(tunnel_pid, 0)
                self.assertFalse((state_dir / "state.json").exists())
            finally:
                if process.poll() is None:
                    process.kill()
                    process.wait()


if __name__ == "__main__":
    unittest.main()
