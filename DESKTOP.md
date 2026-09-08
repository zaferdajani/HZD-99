# Windows desktop playtest

Download the `CLAWBYTE-Windows-x64-<commit>` artifact from the latest successful
[Windows build](https://github.com/zaferdajani/HZD-99/actions/workflows/desktop.yml).
Sign in to GitHub to download workflow artifacts. Extract the entire ZIP and
run `CLAWBYTE.exe`; keep the other files beside it.

The workflow launches the packaged game offline and verifies saved progress
across two launches before publishing the artifact. This is an unsigned
Windows x64 development playtest, not a certified Steam release.

Saved progress lives in `%APPDATA%/CLAWBYTE`, separately from the installation.
F11 toggles fullscreen. Escape pauses or goes back. Losing focus pauses gameplay.

The old assembly script is retired: it used an obsolete repository/runtime
and omitted files required by the current desktop shell. It now points to the
verified build instead of assembling an incompatible installation.

For reproducible local packaging, runtime details and validation scope, see
[desktop/README.md](desktop/README.md). Commercial release gates are tracked in
[docs/STEAM_READINESS.md](docs/STEAM_READINESS.md).
