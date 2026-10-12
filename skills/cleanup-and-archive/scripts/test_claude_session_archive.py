import json
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest
import uuid


SCRIPT = Path(__file__).with_name("claude-session-archive.py")


class SessionArchiveTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.config = Path(self.temporary.name)
        self.session_id = str(uuid.uuid4())
        self.project = self.config / "projects" / "-archive-fixture"
        self.project.mkdir(parents=True)
        self.transcript = self.project / f"{self.session_id}.jsonl"
        self.transcript.write_bytes(b'{"type":"user","message":{"role":"user","content":"fixture"}}\n')
        self.companion = self.project / self.session_id
        (self.companion / "subagents").mkdir(parents=True)
        (self.companion / "subagents" / "agent-fixture.jsonl").write_bytes(b"opaque subagent bytes\n")
        (self.companion / "tool-results").mkdir()
        (self.companion / "tool-results" / "output.txt").write_bytes(b"tool result\x00\xff")
        self.other = self.project / f"{uuid.uuid4()}.jsonl"
        self.other.write_bytes(b"unrelated session")

    def run_command(self, command, *options, success=True):
        result = subprocess.run(
            [sys.executable, str(SCRIPT), command, self.session_id, "--config-dir", str(self.config), *options],
            capture_output=True, text=True, timeout=10,
        )
        self.assertEqual(result.returncode, 0 if success else 1, result.stderr)
        return json.loads(result.stdout if success else result.stderr)

    def snapshot(self):
        return {p.relative_to(self.project): p.read_bytes() for p in self.project.rglob("*") if p.is_file()}

    def test_round_trip_preserves_full_session_and_refuses_restore_over_new_work(self):
        before = self.snapshot()
        self.assertEqual(self.run_command("archive")["status"], "archived")
        self.assertFalse(self.transcript.exists())
        self.assertFalse(self.companion.exists())
        self.assertEqual(self.other.read_bytes(), b"unrelated session")
        self.transcript.write_bytes(b"new work at original path")
        self.run_command("restore", success=False)
        self.assertEqual(self.transcript.read_bytes(), b"new work at original path")
        self.assertFalse(self.companion.exists())
        self.transcript.unlink()
        self.assertEqual(self.run_command("restore")["status"], "restored")
        self.assertEqual(self.snapshot(), before)
        self.assertEqual(self.run_command("archive")["status"], "archived")

    def test_deferred_archive_waits_for_writer_and_keeps_final_session_files(self):
        writer = subprocess.Popen([sys.executable, "-c", "import sys; sys.stdin.read()"], stdin=subprocess.PIPE)
        def stop_writer():
            if writer.poll() is None:
                writer.communicate(timeout=5)
        self.addCleanup(stop_writer)
        records = self.config / "sessions"
        records.mkdir()
        record = records / f"{writer.pid}.json"
        record.write_text(json.dumps({"pid": writer.pid, "sessionId": self.session_id, "entrypoint": "cli"}))
        pending_files = self.config / "pending-files"
        self.companion.rename(pending_files)
        self.run_command("archive", success=False)
        self.assertFalse((self.config / "session-archive" / self.session_id).exists())
        self.assertEqual(self.run_command("archive", "--defer")["status"], "queued")
        self.assertTrue(self.transcript.exists())
        self.assertFalse(self.companion.exists())
        pending_files.rename(self.companion)
        with self.transcript.open("ab") as transcript:
            transcript.write(b'{"type":"assistant","message":{"role":"assistant","content":"final closeout"}}\n')
        before = self.snapshot()
        record.unlink()  # A missing record alone must not imply the known writer exited.
        self.assertEqual(self.run_command("status")["status"], "queued")
        stop_writer()
        deadline = time.monotonic() + 10
        while self.run_command("status")["status"] == "queued":
            self.assertLess(time.monotonic(), deadline, "Archive worker did not finish")
            time.sleep(0.1)
        self.assertEqual(self.run_command("status")["status"], "archived")
        self.assertFalse(self.companion.exists())
        self.run_command("restore")
        self.assertEqual(self.snapshot(), before)


if __name__ == "__main__":
    unittest.main(failfast=True)
