"""
PlatformIO script: webapp build + copy integration.

Loaded as a regular extra_script (no pre:/post: prefix) so that
AddCustomTarget() is visible to the PlatformIO IDE task panel.

Pre-build hooks automatically copy dist → data/ before every
firmware build (`pio run`) and filesystem build (`pio run -t buildfs`).

Custom target "Build WebApp" (shown in VSCode Project Tasks → Custom):
  Runs `pnpm build` in the webapp folder, then copies dist → data/.

  CLI:  pio run -e ppc-base  -t buildwebapp
        pio run -e ppc-timer -t buildwebapp
        pio run -e ppc-thm   -t buildwebapp

Webapp mapping:
  ppc-base  → web-vite-preact/
  ppc-timer → web-vite-timer/
  ppc-thm   → web-vite-thm/
"""

Import("env")

import subprocess
import shutil
import os

WEBAPP_MAP = {
    "ppc-base":  "web-vite-preact",
    "ppc-timer": "web-vite-timer",
    "ppc-thm":   "web-vite-thm",
}

project_dir = env["PROJECT_DIR"]
pioenv      = env["PIOENV"]
webapp      = WEBAPP_MAP.get(pioenv)


def _copy_dist():
    """Copy webapp dist/ → data/. Warns if dist is missing (not yet built)."""
    if webapp is None:
        print(f"[webapp] No mapping for env '{pioenv}', skipping.")
        return
    src = os.path.join(project_dir, webapp, "dist")
    dst = os.path.join(project_dir, "data")
    if not os.path.isdir(src):
        print(f"[webapp] WARNING: {webapp}/dist not found. "
              f"Use the 'Build WebApp' target first.")
        return
    if os.path.exists(dst):
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    print(f"[webapp] Copied {webapp}/dist → data/")


def _pre_copy(source, target, env):
    """Pre-build action wrapper."""
    _copy_dist()


def _build_and_copy(target, source, env, **kwargs):
    """SCons action for the 'Build WebApp' custom target."""
    if webapp is None:
        print(f"[webapp] No mapping for env '{pioenv}', skipping.")
        return
    webapp_dir = os.path.join(project_dir, webapp)
    print(f"[webapp] Running pnpm build in {webapp}/...")
    result = subprocess.run(["pnpm", "build"], cwd=webapp_dir)
    if result.returncode != 0:
        print(f"[webapp] ERROR: pnpm build failed (exit {result.returncode})")
        env.Exit(result.returncode)
    _copy_dist()


# ── Pre-build hooks ────────────────────────────────────────────────────────────
# Copy dist → data/ before firmware build and filesystem build.
env.AddPreAction("$BUILD_DIR/${PROGNAME}.elf", _pre_copy)
env.AddPreAction("buildfs", _pre_copy)


# ── Custom target: visible in VSCode PlatformIO "Project Tasks" panel ─────────
env.AddCustomTarget(
    name         = "buildwebapp",
    dependencies = None,
    actions      = _build_and_copy,
    title        = "Build WebApp",
    description  = f"pnpm build {webapp or '?'} and copy dist → data/",
)
