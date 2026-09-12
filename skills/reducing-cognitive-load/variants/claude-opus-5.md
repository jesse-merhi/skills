---
name: reducing-cognitive-load
description: 'Write and review code that is easy for a human to follow.'
---

# Reducing cognitive load

Make the code easy to understand on the first read. Use plain words and straightforward steps, even when the implementation is sophisticated.

## Use the simplest accurate name

Read definitions and their usages together. Replace elaborate names with the ordinary words someone would use to explain the job: `executeNotificationDispatch` can be `sendNotification`; `isCredentialValiditySatisfied` can be `isTokenValid` when the value really describes a token.

Keep details that matter. `expiresAtMs` makes the unit clear; a domain term may be more precise than a generic substitute. Choose the simplest accurate name, not the shortest name.

Update internal definitions and usages together. Preserve public contracts unless changing them is authorized.

## Make the steps easy to follow

Keep related work together and make branches readable. Extract a function when its name makes a useful step clearer; keep it inline when another jump would make the reader work harder.

In review, show the confusing code and a simpler version. Preserve required behavior, including features added on the current branch, unless the user authorizes removing it. Use checks that cover those features. Prefer code a person can follow; avoid extra helpers or edits made only to suit personal taste.
