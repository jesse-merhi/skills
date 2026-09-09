#!/usr/bin/env python3
"""Own one temporary acpx@0.13.1 invocation without deleting Claude history."""
import argparse
import fcntl
import json
import math
import os
from pathlib import Path
import selectors
import signal
import subprocess
import sys
import time
import uuid

SCHEMA = 'ask-claude-run-v1'
GRACE_SECONDS = 5


def save(run, state):
    temporary = run / 'run.json.tmp'
    with temporary.open('w') as stream:
        json.dump(state, stream, indent=2)
        stream.write('\n')
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(run / 'run.json')


def process_table():
    result = subprocess.run(['ps', '-ww', '-axo', 'pid=,pgid=,stat=,lstart=,args='],
                            capture_output=True, text=True, check=True, timeout=5,
                            env=dict(os.environ, TZ='UTC', LC_ALL='C'))
    table = {}
    for line in result.stdout.splitlines():
        fields = line.split(None, 8)
        if len(fields) == 9:
            table[int(fields[0])] = {'group': int(fields[1]), 'status': fields[2],
                                     'started': ' '.join(fields[3:8]), 'command': fields[8]}
    return table


def group_members(state):
    group = state.get('processGroup')
    return {pid: item for pid, item in process_table().items()
            if item['group'] == group and not item['status'].startswith('Z')}


def identity(item):
    return {key: item[key] for key in ('started', 'command')}


def remember_group(run, state):
    members = group_members(state)
    state.setdefault('processes', {}).update({str(pid): identity(item) for pid, item in members.items()})
    save(run, state)
    return members


def stop_group(state):
    members = group_members(state)
    if not members:
        return
    known = state.get('processes', {})
    # A still-live known member holds this process group open, preventing PGID reuse.
    if not any(known.get(str(pid)) == identity(item) for pid, item in members.items()):
        raise RuntimeError('process group has no matching recorded owner; refusing to signal it')
    for sig in (signal.SIGTERM, signal.SIGKILL):
        try:
            os.killpg(state['processGroup'], sig)
        except ProcessLookupError:
            return
        deadline = time.monotonic() + GRACE_SECONDS
        while time.monotonic() < deadline:
            if not group_members(state):
                return
            time.sleep(0.1)
    raise RuntimeError('owned process group did not exit')


def verify(state):
    remaining = list(group_members(state)) if state.get('processGroup') else []
    projects = Path(state['claudeConfigDir']) / 'projects'
    found = []
    try:
        project_dirs = list(projects.iterdir())
    except FileNotFoundError:
        project_dirs = []
    for project in project_dirs:
        for sid in state['nativeSessionIds']:
            for candidate in (project / (sid + '.jsonl'), project / sid):
                try:
                    candidate.lstat()
                except (FileNotFoundError, NotADirectoryError):
                    continue
                found.append(str(candidate))
    # exec creates no acpx record, but inspect persisted records by native identity too.
    try:
        records = list(Path(state['acpxSessionsDir']).iterdir())
    except FileNotFoundError:
        records = []
    for path in records:
        if path.suffix != '.json':
            continue
        record = json.loads(path.read_text())
        if any(record.get(key) in state['nativeSessionIds']
               for key in ('sessionId', 'acpSessionId', 'agentSessionId')):
            found.append(str(path))
    unknown = state.get('creationPending', False) or state.get('protocolError')
    history = 'retained' if found else ('unknown' if unknown else 'absent')
    return {'execution': 'running' if remaining else 'stopped', 'remainingPids': remaining,
            'history': history, 'historyPaths': found,
            'identity': 'unknown' if unknown else ('known' if state['nativeSessionIds'] else 'not-created')}


def verified(state):
    check = state['verification']
    return check['execution'] == 'stopped' and check['history'] == 'absent'


def observe(line, state, answer):
    try:
        message = json.loads(line)
        if not isinstance(message, dict):
            raise ValueError('ACP message must be an object')
        if message.get('result', {}).get('agentInfo'):
            state['agentInfo'] = message['result']['agentInfo']
        if message.get('method') == 'session/new':
            state['creationPending'] = True
            state['creationRequestId'] = message['id']
        elif message.get('id') == state.get('creationRequestId') and state.get('creationPending'):
            sid = message.get('result', {}).get('sessionId')
            if sid:
                if str(uuid.UUID(sid)) != sid:
                    raise ValueError('noncanonical native session ID')
                state['nativeSessionIds'].append(sid)
                state['creationPending'] = False
            # An RPC error cannot prove whether native startup already created a session.
        if message.get('method') == 'session/update':
            params = message['params']
            update = params['update']
            if update.get('sessionUpdate') == 'agent_message_chunk':
                content = update.get('content', {})
                if content.get('type') == 'text':
                    answer.write(content['text'].encode())
                    answer.flush()
        if message.get('error'):
            state['lastError'] = message['error']
    except (ValueError, KeyError, TypeError, AttributeError) as error:
        state['protocolError'] = str(error)


def supervise(run):
    os.umask(0o077)
    state = json.loads((run / 'run.json').read_text())
    with (run / 'owner.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        supervise_locked(run, state)


def supervise_locked(run, state):
    cancelled = []
    for sig in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
        signal.signal(sig, lambda number, frame: cancelled.append(number))
    state['supervisorPid'] = os.getpid()
    save(run, state)
    child = None
    exit_code = 70
    reason = 'launcher-error'
    try:
        permissions = ['--approve-reads', '--non-interactive-permissions', 'fail']
        if state['mode'] == 'write':
            permissions = ['--approve-all']
        args = ['npx', '--yes', 'acpx@0.13.1', '--cwd', state['cwd'], *permissions,
                '--format', 'json', '--timeout', str(state['timeoutSeconds']),
                'claude', 'exec', '--file', str(run / 'prompt.txt')]
        env = dict(os.environ, CLAUDE_CODE_SKIP_PROMPT_HISTORY='1')
        with (run / 'events.ndjson').open('ab') as events, (run / 'answer.txt').open('ab') as answer, \
                (run / 'stderr.txt').open('ab') as errors:
            child = subprocess.Popen(args, cwd=state['cwd'], env=env, stdin=subprocess.DEVNULL,
                                     stdout=subprocess.PIPE, stderr=errors, start_new_session=True)
            state['processGroup'] = child.pid
            remember_group(run, state)
            selector = selectors.DefaultSelector()
            selector.register(sys.stdin.buffer, selectors.EVENT_READ, 'parent')
            selector.register(child.stdout, selectors.EVENT_READ, 'output')
            pending = b''
            deadline = time.monotonic() + state['timeoutSeconds']
            next_snapshot = time.monotonic() + 1
            reason = 'completed'
            with selector:
                while True:
                    if cancelled or time.monotonic() >= deadline:
                        reason = 'cancelled' if cancelled else 'timeout'
                        stop_group(state)
                        break
                    if time.monotonic() >= next_snapshot:
                        remember_group(run, state)
                        next_snapshot = time.monotonic() + 1
                    for key, _ in selector.select(0.1):
                        if key.data == 'parent':
                            if not os.read(key.fd, 1):
                                cancelled.append(signal.SIGHUP)
                                selector.unregister(key.fileobj)
                        else:
                            chunk = os.read(key.fd, 65536)
                            if not chunk:
                                selector.unregister(key.fileobj)
                            else:
                                events.write(chunk)
                                events.flush()
                                pending += chunk
                                while b'\n' in pending:
                                    line, pending = pending.split(b'\n', 1)
                                    observe(line, state, answer)
                                remember_group(run, state)
                    if child.poll() is not None:
                        # Pipe EOF, not process exit, establishes that all output was read.
                        if not any(key.data == 'output' for key in selector.get_map().values()):
                            break
            # Drain available bytes without waiting forever for an escaped writer.
            os.set_blocking(child.stdout.fileno(), False)
            while True:
                try:
                    chunk = os.read(child.stdout.fileno(), 65536)
                except BlockingIOError:
                    state['protocolError'] = 'output pipe did not close after teardown'
                    break
                if not chunk:
                    break
                events.write(chunk)
                pending += chunk
            child.stdout.close()
            for line in pending.splitlines():
                observe(line, state, answer)
            for stream in (events, answer, errors):
                stream.flush()
                os.fsync(stream.fileno())
            child.wait(timeout=GRACE_SECONDS)
            exit_code = child.returncode if child.returncode >= 0 else 128 - child.returncode
            if reason == 'timeout':
                exit_code = 124
            elif reason == 'cancelled':
                exit_code = 128 + cancelled[0]
            elif exit_code:
                reason = 'failed'
    except Exception as error:
        reason = 'launcher-error'
        state['launcherError'] = str(error)
    finally:
        try:
            if state.get('processGroup'):
                stop_group(state)
            if child:
                child.wait(timeout=GRACE_SECONDS)
            state['verification'] = verify(state)
        except Exception as error:
            state['verification'] = {'execution': 'unknown', 'history': 'unknown', 'error': str(error)}
        if exit_code == 0 and (not verified(state) or not state['nativeSessionIds']):
            exit_code = 70
        state.update(status=reason, exitCode=exit_code, finishedAt=time.time())
        save(run, state)


def load_run(path):
    run = Path(path).resolve()
    if str(uuid.UUID(run.name)) != run.name:
        raise ValueError('expected a UUID run directory printed by ask-claude')
    if run.stat().st_uid != os.getuid() or run.stat().st_mode & 0o077:
        raise ValueError('run directory must be private and owned by the current user')
    state = json.loads((run / 'run.json').read_text())
    if state.get('schema') != SCHEMA or state.get('runDir') != str(run):
        raise ValueError('not an ask-claude run record')
    return run, state


def inspect_run(path, recover=False):
    run, state = load_run(path)
    with (run / 'owner.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise RuntimeError('run is still supervised; wait for it or cancel the foreground command')
        if recover:
            stop_group(state)
        state['verification'] = verify(state)
        if recover:
            state.setdefault('exitCode', 130)
            state.update(status='recovered', recoveredAt=time.time())
            save(run, state)
        print(json.dumps(state, indent=2))
        return 0 if verified(state) else 70


def launch(mode, prompt):
    timeout = float(os.environ.get('ASK_AGENT_TIMEOUT_SECONDS', '1800'))
    if not math.isfinite(timeout) or timeout <= 0:
        raise ValueError('ASK_AGENT_TIMEOUT_SECONDS must be a positive finite number')
    process_table()  # Refuse to launch when process ownership cannot be verified.
    os.umask(0o077)
    root = Path(os.environ.get('ASK_CLAUDE_RUNS_DIR',
                str(Path(os.environ.get('XDG_STATE_HOME', str(Path.home() / '.local/state'))) / 'ask-claude/runs')))
    root.mkdir(parents=True, exist_ok=True)
    run = (root / str(uuid.uuid4())).resolve()
    run.mkdir(mode=0o700)
    state = {'schema': SCHEMA, 'runDir': str(run), 'mode': mode, 'cwd': str(Path.cwd()),
             'claudeConfigDir': str(Path(os.environ.get('CLAUDE_CONFIG_DIR', str(Path.home() / '.claude'))).resolve()),
             'acpxSessionsDir': str(Path.home() / '.acpx/sessions'), 'timeoutSeconds': timeout,
             'nativeSessionIds': [], 'status': 'starting', 'createdAt': time.time(),
             'historyPolicy': 'CLAUDE_CODE_SKIP_PROMPT_HISTORY=1'}
    (run / 'prompt.txt').write_text(prompt)
    (run / 'answer.txt').touch()
    save(run, state)
    print('ask-claude: evidence ' + str(run), file=sys.stderr, flush=True)
    with (run / 'supervisor.stderr').open('ab') as errors:
        worker = subprocess.Popen([sys.executable, str(Path(__file__).resolve()), '_supervise', str(run)],
                                  stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=errors,
                                  start_new_session=True)
        interrupted = []
        def cancel(number, frame):
            interrupted.append(number)
            worker.stdin.close()
        for sig in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
            signal.signal(sig, cancel)
        with (run / 'answer.txt').open('rb') as answer:
            while True:
                chunk = answer.read()
                if chunk:
                    try:
                        sys.stdout.buffer.write(chunk)
                        sys.stdout.buffer.flush()
                    except BrokenPipeError:
                        cancel(signal.SIGPIPE, None)
                        sys.stdout = open(os.devnull, 'w')
                if worker.poll() is not None:
                    break
                time.sleep(0.1)
            sys.stdout.buffer.write(answer.read())
            sys.stdout.buffer.flush()
        worker.stdin.close()
    state = json.loads((run / 'run.json').read_text())
    if 'verification' not in state:
        print('ask-claude: supervisor interrupted; run recover ' + str(run), file=sys.stderr)
        return 70
    print('\nask-claude: ' + json.dumps(state['verification']), file=sys.stderr)
    if state.get('lastError') or state.get('launcherError'):
        print('ask-claude: ' + str(state.get('lastError') or state['launcherError']), file=sys.stderr)
    return 128 + interrupted[0] if interrupted else state['exitCode']


def main():
    parser = argparse.ArgumentParser(
        prog='ask-claude',
        description='Ask a temporary Claude ACP session; preserve evidence without native history.',
        epilog='Temporary helpers cannot be resumed. The answer streams to stdout; stderr prints the private evidence directory. '
               'ASK_CLAUDE_RUNS_DIR overrides its default under $XDG_STATE_HOME/ask-claude/runs '
               '(~/.local/state when unset). ASK_AGENT_TIMEOUT_SECONDS sets the overall deadline (default: 1800). '
               'After interruption, use recover with that exact directory, then inspect. '
               'Unverified cleanup exits nonzero and retains evidence; no history is deleted. '
               'Recovery requires the supervisor to have stopped. Unrecognized or detached processes need manual investigation.')
    commands = parser.add_subparsers(dest='command', required=True, metavar='{read,write,inspect,recover}')
    for name in ('read', 'write'):
        commands.add_parser(name).add_argument('prompt', nargs='+')
    for name in ('inspect', 'recover', '_supervise'):
        commands.add_parser(name).add_argument('run')
    args = parser.parse_args()
    if args.command == '_supervise':
        supervise(Path(args.run))
        return 0
    if args.command in ('inspect', 'recover'):
        return inspect_run(args.run, args.command == 'recover')
    return launch(args.command, ' '.join(args.prompt))


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        print('ask-claude: ' + str(error), file=sys.stderr)
        sys.exit(70)
