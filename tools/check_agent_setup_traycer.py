"""Traycer pack checks for tools/check-agent-setup. They pass on machines without Traycer."""
import json
import shutil
import subprocess
from pathlib import Path

GUIDE = Path.home() / ".traycer/agent-selection-guide.md"
CASES = (
    ("git commit -F - <<'EOF'\nnote: traycer agent send routing\nEOF", False),
    ('grep -rn "traycer agent send" docs/', False),
    ('traycer agent send --to a --message "[no-spec] ping"', False),
    ('traycer agent send --to a --message "[visual-check] go look"', False),
    ("traycer agent send --help", False),
    ('traycer agent send --to a --response-id r1 --message "thanks"', False),
    ('traycer agent send --to a --message "build the thing"', True),
    ('cd /tmp && traycer agent send --to a --message "build it"', True),
    ('traycer agent send --to a --message "run it with -h and report"', True),
)


def check(root: Path, fail) -> None:
    guard = root / "tools/writespec-guard"
    for command, should_deny in CASES:
        result = subprocess.run([str(guard)], cwd=root, capture_output=True, text=True, check=False,
                                input=json.dumps({"tool_name": "Bash", "tool_input": {"command": command}}))
        if ("permissionDecision" in result.stdout) != should_deny:
            verb = "did not deny" if should_deny else "wrongly denied"
            fail(f"traycer: writespec-guard {verb}: {command!r}")

    if not shutil.which("traycer") or not GUIDE.parent.is_dir():
        print("SKIP traycer selection guide: Traycer not installed on this machine")
        return
    expected = ((root / "docs/workflows/agent_selection.md").read_text().rstrip("\n") + "\n\n"
                + (root / "docs/workflows/delegation_traycer.md").read_text())
    if not GUIDE.is_file():
        print(f"WARN {GUIDE} not installed; run `kit sync` to install it")
    elif GUIDE.read_text() != expected:
        fail(f"traycer: {GUIDE} differs from this repository's agent_selection.md + "
             "delegation_traycer.md; run `kit sync`")
