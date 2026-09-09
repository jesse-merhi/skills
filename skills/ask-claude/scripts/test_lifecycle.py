import json
import os
from pathlib import Path
import signal
import subprocess
import tempfile
import time
import unittest

LAUNCHER = Path(__file__).with_name('ask-claude')
SID = 'e967e611-ced0-4d27-a412-26c66fc38d60'


class LifecycleTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.bin = self.root / 'bin'
        self.bin.mkdir()
        self.env = dict(os.environ, PATH=str(self.bin) + os.pathsep + os.environ['PATH'],
                        ASK_CLAUDE_RUNS_DIR=str(self.root / 'runs'),
                        CLAUDE_CONFIG_DIR=str(self.root / 'claude'),
                        ASK_AGENT_TIMEOUT_SECONDS='10', FIXTURE_ROOT=str(self.root))
        self.fake = self.bin / 'npx'
        self.fake.write_text('''#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
root = Path(os.environ['FIXTURE_ROOT'])
(root / 'received.json').write_text(json.dumps({'args': sys.argv[1:], 'skip': os.environ.get('CLAUDE_CODE_SKIP_PROMPT_HISTORY')}))
sid = 'e967e611-ced0-4d27-a412-26c66fc38d60'
print(json.dumps({'jsonrpc':'2.0','id':1,'method':'session/new','params':{'cwd':os.getcwd()}}), flush=True)
print(json.dumps({'jsonrpc':'2.0','id':1,'result':{'sessionId':sid}}), flush=True)
print(json.dumps({'jsonrpc':'2.0','method':'session/update','params':{'sessionId':sid,'update':{'sessionUpdate':'agent_message_chunk','content':{'type':'text','text':'kept answer'}}}}), flush=True)
print(json.dumps({'jsonrpc':'2.0','id':2,'result':{'stopReason':'end_turn'}}), flush=True)
''')
        self.fake.chmod(0o700)

    def invoke(self, *args):
        return subprocess.run([str(LAUNCHER), *args], cwd=self.root, env=self.env,
                              capture_output=True, text=True, timeout=20)

    def run_dir(self):
        return next((self.root / 'runs').iterdir())

    def test_success_keeps_answer_identity_and_scopes_environment(self):
        self.env['CLAUDE_CODE_SKIP_PROMPT_HISTORY'] = '0'
        result = self.invoke('read', 'literal $(echo nope) prompt')
        self.assertEqual(result.returncode, 0, result.stderr)
        run = self.run_dir()
        self.assertEqual((run / 'answer.txt').read_text(), 'kept answer')
        self.assertIn('kept answer', result.stdout)
        state = json.loads((run / 'run.json').read_text())
        self.assertEqual(state['nativeSessionIds'], [SID])
        self.assertEqual(state['verification']['execution'], 'stopped')
        self.assertEqual(state['verification']['history'], 'absent')
        received = json.loads((self.root / 'received.json').read_text())
        self.assertEqual(received['skip'], '1')
        self.assertIn('--approve-reads', received['args'])
        self.assertNotIn('--model', received['args'])
        self.assertEqual(self.env['CLAUDE_CODE_SKIP_PROMPT_HISTORY'], '0')
        self.assertEqual(run.stat().st_mode & 0o777, 0o700)


    def append_fake(self, code):
        with self.fake.open('a') as stream:
            stream.write(code)

    def wait_for(self, predicate):
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            value = predicate()
            if value:
                return value
            time.sleep(0.05)
        self.fail('fixture did not reach expected state')

    def start_waiting(self):
        self.append_fake("""
import subprocess, signal, time
child = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(60)'])
(root / 'child.pid').write_text(str(child.pid))
(root / 'ready').touch()
time.sleep(60)
""")
        process = subprocess.Popen([str(LAUNCHER), 'read', 'wait'], cwd=self.root, env=self.env,
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        self.addCleanup(lambda: process.poll() is None and process.kill())
        self.wait_for(lambda: (self.root / 'ready').exists())
        return process

    def assert_stopped(self):
        state = json.loads((self.run_dir() / 'run.json').read_text())
        self.assertEqual(state['verification']['execution'], 'stopped', state)
        child = int((self.root / 'child.pid').read_text())
        status = subprocess.run(['ps', '-p', str(child), '-o', 'stat='], capture_output=True, text=True)
        self.assertTrue(not status.stdout.strip() or status.stdout.strip().startswith('Z'))
        self.assertEqual((self.run_dir() / 'answer.txt').read_text(), 'kept answer')

    def test_write_and_prompt_failure_preserve_error_and_partial_answer(self):
        self.append_fake("print('fixture error', file=sys.stderr, flush=True)\nsys.exit(23)\n")
        result = self.invoke('write', 'scoped implementation')
        self.assertEqual(result.returncode, 23, result.stderr)
        self.assertEqual((self.run_dir() / 'answer.txt').read_text(), 'kept answer')
        self.assertIn('fixture error', (self.run_dir() / 'stderr.txt').read_text())
        args = json.loads((self.root / 'received.json').read_text())['args']
        self.assertIn('--approve-all', args)
        self.assertNotIn('--approve-reads', args)

    def test_startup_failure_never_claims_a_created_session(self):
        self.fake.write_text('#!/usr/bin/env python3\nimport sys\nsys.exit(17)\n')
        result = self.invoke('read', 'fail before startup')
        self.assertEqual(result.returncode, 17, result.stderr)
        state = json.loads((self.run_dir() / 'run.json').read_text())
        self.assertEqual(state['nativeSessionIds'], [])
        self.assertEqual(state['verification']['identity'], 'not-created')

    def test_incomplete_creation_is_reported_as_unknown(self):
        self.fake.write_text('#!/usr/bin/env python3\nimport json\nprint(json.dumps({"id":1,"method":"session/new"}))\n')
        result = self.invoke('read', 'incomplete startup')
        self.assertEqual(result.returncode, 70, result.stderr)
        state = json.loads((self.run_dir() / 'run.json').read_text())
        self.assertEqual(state['verification']['identity'], 'unknown')

    def test_unexpected_history_is_retained_and_unrelated_history_is_unchanged(self):
        project = Path(self.env['CLAUDE_CONFIG_DIR']) / 'projects' / 'fixture'
        project.mkdir(parents=True)
        owned = project / (SID + '.jsonl')
        other = project / 'user-persistent.jsonl'
        owned.write_text('unexpected helper history')
        other.write_text('user-created persistent history')
        result = self.invoke('read', 'unexpected persistence')
        self.assertEqual(result.returncode, 70, result.stderr)
        self.assertEqual(owned.read_text(), 'unexpected helper history')
        self.assertEqual(other.read_text(), 'user-created persistent history')
        self.assertIn('retained', result.stderr)

    def test_timeout_stops_descendants_and_keeps_partial_answer(self):
        self.env['ASK_AGENT_TIMEOUT_SECONDS'] = '1'
        process = self.start_waiting()
        stdout, stderr = process.communicate(timeout=15)
        self.assertEqual(process.returncode, 124, stderr)
        self.assertIn('kept answer', stdout)
        self.assert_stopped()

    def test_signals_and_caller_death_are_supervised(self):
        # Each signal gets its own fixture process and run record.
        for sig in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP, signal.SIGKILL):
            with self.subTest(signal=sig):
                process = self.start_waiting()
                run = sorted((self.root / 'runs').iterdir(), key=lambda p: p.stat().st_mtime)[-1]
                process.send_signal(sig)
                process.communicate(timeout=15)
                def finished():
                    state = json.loads((run / 'run.json').read_text())
                    return state if 'finishedAt' in state else None
                state = self.wait_for(finished)
                self.assertEqual(state['verification']['execution'], 'stopped', state)
                self.assertEqual((run / 'answer.txt').read_text(), 'kept answer')
                (self.root / 'ready').unlink()

    def test_recovery_after_supervisor_death_and_live_owner_rejection(self):
        process = self.start_waiting()
        run = self.run_dir()
        live = self.invoke('recover', str(run))
        self.assertEqual(live.returncode, 70)
        self.assertIn('still supervised', live.stderr)
        state = json.loads((run / 'run.json').read_text())
        os.kill(state['supervisorPid'], signal.SIGKILL)
        process.communicate(timeout=10)
        recovery = self.invoke('recover', str(run))
        self.assertEqual(recovery.returncode, 0, recovery.stderr)
        self.assert_stopped()

    def test_recovery_refuses_unverified_process_identity(self):
        self.assertEqual(self.invoke('read', 'completed').returncode, 0)
        run = self.run_dir()
        stranger = subprocess.Popen(['sleep', '30'], start_new_session=True)
        def stop_stranger():
            if stranger.poll() is None:
                stranger.terminate()
            stranger.wait(timeout=5)
        self.addCleanup(stop_stranger)
        state = json.loads((run / 'run.json').read_text())
        state['processGroup'] = stranger.pid
        (run / 'run.json').write_text(json.dumps(state))
        recovery = self.invoke('recover', str(run))
        self.assertEqual(recovery.returncode, 70)
        self.assertIn('refusing to signal', recovery.stderr)
        self.assertIsNone(stranger.poll())


if __name__ == '__main__':
    unittest.main(failfast=True)
