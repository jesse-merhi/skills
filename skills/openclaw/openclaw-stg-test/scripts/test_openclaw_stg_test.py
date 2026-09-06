from contextlib import contextmanager, redirect_stdout
import http.server
import io
import json
import os
from pathlib import Path
import runpy
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import Mock, patch


SCRIPT = Path(__file__).with_name("openclaw-stg-test")
MODULE = runpy.run_path(str(SCRIPT))
StagingError = MODULE["StagingError"]
parse_origin = MODULE["parse_origin"]
parse_ttl = MODULE["parse_ttl"]
known_private_ports = MODULE["known_private_ports"]
check_preview = MODULE["check_preview"]
start = MODULE["start"]


@contextmanager
def preview_origin():
    requests = []

    class Preview(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            requests.append(self.path)
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
        yield f"http://127.0.0.1:{server.server_port}", requests
    finally:
        server.shutdown()
        server.server_close()
        server_thread.join()


class OpenClawStagingTest(unittest.TestCase):
    def test_accepts_bounded_loopback_origin_and_ttl(self):
        self.assertEqual(parse_origin("http://127.0.0.1:5197"), ("http://127.0.0.1:5197", 5197))
        self.assertEqual(parse_ttl("4h"), 14_400)

    def test_rejects_remote_origin_and_unbounded_lease(self):
        with self.assertRaisesRegex(StagingError, "loopback"):
            parse_origin("http://example.com:8080")
        with self.assertRaisesRegex(StagingError, "use http"):
            parse_origin("https://127.0.0.1:8443")
        with self.assertRaisesRegex(StagingError, "24 hours"):
            parse_ttl("2d")

    def test_accepts_plain_html_and_rejects_http_failure(self):
        with preview_origin() as (origin, requests):
            check_preview(origin)
            with self.assertRaisesRegex(StagingError, "HTTP Error 404"):
                check_preview(origin + "/missing")
            self.assertEqual(requests, ["/", "/missing"])

    def test_starts_checks_and_stops_preview_without_a_declaration(self):
        with tempfile.TemporaryDirectory() as temporary, preview_origin() as (origin, requests):
            state_dir = Path(temporary)
            terminate = Mock(return_value=True)
            output = io.StringIO()
            with patch.dict(start.__globals__, {
                "known_private_ports": lambda: {18789},
                "wait_for_public_url": lambda *_args: origin,
                "resolve_with_public_dns": lambda _host: [],
                "process_start_ticks": lambda _pid: "identity",
                "process_matches": lambda *_args: True,
                "start_watchdog": Mock(return_value=Mock(pid=31002)),
                "terminate_process_group": terminate,
            }), patch("shutil.which", return_value="/mock/cloudflared"), patch("subprocess.Popen", return_value=Mock(pid=31001)), redirect_stdout(output):
                self.assertEqual(start(state_dir, origin, "5m"), 0)
                state = json.loads((state_dir / "state.json").read_text())
                self.assertEqual(state["origin"], origin)
                self.assertEqual(state["publicUrl"], origin)
                self.assertEqual(state["expiresAt"] - state["startedAt"], 300)
                self.assertEqual(MODULE["show_status"](state_dir), 0)
                self.assertTrue(MODULE["stop_managed"](state_dir))
            self.assertEqual(requests, ["/", "/"])
            self.assertIn(f"Public URL: {origin}", output.getvalue())
            terminate.assert_any_call(31001, "identity", "cloudflared")
            terminate.assert_any_call(31002, "identity", "--expire")
            self.assertFalse((state_dir / "state.json").exists())

    def test_protected_ports_and_unready_origin_never_start_a_tunnel(self):
        with tempfile.TemporaryDirectory() as temporary, patch("subprocess.Popen") as launch:
            with patch.dict(start.__globals__, {"known_private_ports": lambda: {18789, 19010}}):
                for port in (18789, 19010):
                    with self.subTest(port=port), self.assertRaisesRegex(StagingError, "protected"):
                        start(Path(temporary), f"http://127.0.0.1:{port}", "5m")
            with patch.dict(start.__globals__, {"check_preview": Mock(side_effect=StagingError("preview unavailable"))}):
                with self.assertRaisesRegex(StagingError, "preview unavailable"):
                    start(Path(temporary), "http://127.0.0.1:5197", "5m")
            launch.assert_not_called()

    def test_public_readiness_failure_cleans_up_started_tunnel(self):
        with tempfile.TemporaryDirectory() as temporary, preview_origin() as (origin, _requests):
            state_dir = Path(temporary)
            terminate = Mock(return_value=True)
            with patch.dict(start.__globals__, {
                "known_private_ports": lambda: {18789},
                "wait_for_public_url": lambda *_args: "https://test.trycloudflare.com",
                "wait_for_public_preview": Mock(side_effect=StagingError("preview unavailable")),
                "process_start_ticks": lambda _pid: "identity",
                "terminate_process_group": terminate,
            }), patch("shutil.which", return_value="/mock/cloudflared"), patch("subprocess.Popen", return_value=Mock(pid=31001)):
                with self.assertRaisesRegex(StagingError, "preview unavailable"):
                    start(state_dir, origin, "5m")
            terminate.assert_called_once_with(31001, "identity", "cloudflared")
            self.assertFalse((state_dir / "state.json").exists())

    def test_protects_service_and_local_test_ports(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            ports_file = root / ".openclaw-local-test" / "run" / "ports.env"
            ports_file.parent.mkdir(parents=True)
            ports_file.write_text(
                "OPENCLAW_LOCAL_TEST_GATEWAY_PORT=19010\n"
                "OPENCLAW_LOCAL_TEST_PROXY_PORT=19011\n",
                encoding="utf-8",
            )
            with patch.object(Path, "home", return_value=root):
                self.assertEqual(known_private_ports(), {18789, 19010, 19011})

    def test_interrupted_startup_stops_the_tunnel_process(self):
        with tempfile.TemporaryDirectory() as temporary, preview_origin() as (origin, _requests):
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
