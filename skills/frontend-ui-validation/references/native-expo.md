# Native UI checks

The implementation owner launches the app through the repository's mobile workflow and uses Maestro to exercise the changed screen on a simulator or device. Reuse existing flows instead of introducing a second native harness.

For an existing Maestro flow:

```sh
maestro test <flow.yaml>
```

Use stable accessibility selectors or React Native `testID` values. For Expo Go, open the development link; standalone/development builds use their bundle/package ID. See [Maestro React Native support](https://docs.maestro.dev/get-started/supported-platform/react-native) and [CLI commands](https://docs.maestro.dev/maestro-cli/maestro-cli-commands-and-options), checked 2026-09-05.

Check the actual interaction, keyboard, scrolling, long content, and relevant failure states. Capture the screen and app logs. Use hardware when gesture feel matters.

Keep Maestro/E2E runs manually triggered. Adding tooling or remote builds, uploads, and cloud tests needs separate authorization. An existing native test workflow should be reused, not replaced just to follow this skill.

If Maestro or the required device is unavailable, stop and ask the user for help. A permitted manual interaction can provide partial evidence but does not count as a Maestro run. Do not install tools or alter authentication to make the check appear complete.

Record evidence using [Keep evidence useful](../SKILL.md#keep-evidence-useful).
