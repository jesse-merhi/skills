---
name: reducing-cognitive-load
description: 'Write and review code that is easy for a human to follow.'
---

# Reducing cognitive load

Make code understandable on the first read, even when the implementation is sophisticated.

## Use the simplest accurate name

Read definitions with their usages. Use ordinary words: `executeNotificationDispatch` can be `sendNotification`; `isCredentialValiditySatisfied` can be `isTokenValid` when it describes a token.

Keep details that matter: `expiresAtMs` names the unit, and a domain term may beat a generic one. Choose the simplest accurate name, not the shortest.

Update internal definitions and usages together. Preserve public contracts unless changing them is authorized.

## Make the steps easy to follow

Keep related work together and make branches readable. Extract a function when its name makes a useful step clearer; keep it inline when another jump would make the reader work harder.

In review, show the confusing flow or name and a simpler alternative. Preserve behavior and use existing refactor checks; avoid helpers or changes based only on taste.
