# Context reading

Trace each changed flow end to end. For every meaningful flow, identify:

- first executable entrypoint
- changed symbols in the diff
- callers and callees affected by those symbols
- data/state/control that crosses file boundaries
- runtime boundary where external input or side effects enter
- tests or checks that should cover the path
- for rendered frontend UI, screenshots, layout audit, console check, or trace
  needed to prove the changed viewport/state

Read full files only when the diff hunk is not enough. Prefer targeted context:

```sh
rg -n "<changed symbol|route|query key|env var>" .
git log --oneline --follow -- <file>
git log -S"<changed symbol>" -- <file-or-dir>
git show <base>:<file>
```
