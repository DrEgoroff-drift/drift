# Ship «tools» — G13 in the cloud

Branch `claude/gpu-tools`, from the fleet base `claude/optimistic-gates-u46osn`. Zone: `test.ps1`,
`docs/mkshots.ps1`, `docs/mksiteshots.ps1`, `tests/90-harness.js`, `tests/90a-tools.js`, new files
under `docs/`/`tools/`. Machine: 4 CPUs, Chromium 141 (`/opt/pw-browsers/chromium`), pwsh 7.6,
`DRIFT_GPU=swiftshader`.

## Commits

1. **test.ps1 runs on Linux.** A platform block after `param`: `$onLin` (pwsh ≥ 6 and not
   Windows), `$psh` (`pwsh` on Linux, `powershell` at home) for the nested build/test calls, and
   `TEMP`/`NUMBER_OF_PROCESSORS` filled from .NET when the OS does not set them. Chrome found at
   `/opt/pw-browsers/chromium`, `/usr/bin/chromium`, `/usr/bin/google-chrome` (Linux only); the
   `file://` URL and the profile dir built with `/`; a hung shard killed with `pkill -f <profile>`
   instead of `Win32_Process`. GPU flags: `--enable-unsafe-webgpu` on Linux or under
   `DRIFT_GPU=swiftshader`, plus the `SWIFTSHADER` list **read from `docs/shot.py`** at run time
   (one source; the script throws if the list is gone). Windows without `DRIFT_GPU`: every new
   branch is a no-op — same Chrome paths, same URL, same profile string, same argv, same kill.
   Verified here: the default tier (Node 16 888 green + the Chrome smoke, 28 s), and the kill path
   (`-Browser -ShardSec 20` → both shards named, killed, red verdict, no stray Chrome).
