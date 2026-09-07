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

In review, show the confusing name or flow and the simpler alternative. Preserve behavior and use the existing checks for refactors. Aim for code a human can explain easily, not extra helpers or changes made solely to match personal taste.
