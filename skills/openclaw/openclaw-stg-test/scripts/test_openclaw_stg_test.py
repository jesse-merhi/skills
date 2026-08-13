import http.server
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
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("openclaw-stg-test")
MODULE = runpy.run_path(str(SCRIPT))
StagingError = MODULE["StagingError"]
parse_origin = MODULE["parse_origin"]
parse_ttl = MODULE["parse_ttl"]
known_private_ports = MODULE["known_private_ports"]
validate_attestation = MODULE["validate_attestation"]


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

    def test_attestation_requires_mock_data_and_no_credentials(self):
        safe = {
            "schemaVersion": 1,
            "publicPreview": True,
            "origin": "http://127.0.0.1:5197",
            "dataSource": "browser-mock",
            "containsCredentials": False,
        }
        self.assertEqual(validate_attestation(safe, safe["origin"]), "browser-mock")
        unsafe = {**safe, "dataSource": "live-gateway"}
        with self.assertRaisesRegex(StagingError, "dataSource"):
            validate_attestation(unsafe, safe["origin"])
        unsafe = {**safe, "containsCredentials": True}
        with self.assertRaisesRegex(StagingError, "containsCredentials"):
            validate_attestation(unsafe, safe["origin"])

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
        with tempfile.TemporaryDirectory() as temporary:
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

            class AttestedOrigin(http.server.BaseHTTPRequestHandler):
                origin = ""

                def do_GET(self):
                    value = {
                        "schemaVersion": 1,
                        "publicPreview": True,
                        "origin": self.origin,
                        "dataSource": "browser-mock",
                        "containsCredentials": False,
                    }
                    body = json.dumps(value).encode()
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)

                def log_message(self, *_args):
                    pass

            server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), AttestedOrigin)
            AttestedOrigin.origin = f"http://127.0.0.1:{server.server_port}"
            server_thread = threading.Thread(target=server.serve_forever, daemon=True)
            server_thread.start()

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
                    AttestedOrigin.origin,
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
                server.shutdown()
                server.server_close()


if __name__ == "__main__":
    unittest.main()
