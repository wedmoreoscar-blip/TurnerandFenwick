"""Shared reader for docs/project_profile.md, used by the kit's repository tools.

The profile is project-owned markdown whose first fenced ```toml block holds the commands and file
lists that scripts act on. Everything that needs judgment lives in the prose around it. Kit tools
(test-project, prepare-worktree, spec-block, writespec-guard) read the block through this module so
none of them hard-codes a project's tooling.
"""
from __future__ import annotations

import re
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROFILE_REL = "docs/project_profile.md"
SKILL_DIRS = (".claude/skills", ".agents/skills")

_BLOCK_RE = re.compile(r"^```toml[ \t]*\n(.*?)^```[ \t]*$", re.S | re.M)


class ProfileError(Exception):
    pass


def load(root: Path = ROOT) -> dict:
    path = root / PROFILE_REL
    if not path.is_file():
        raise ProfileError(f"{PROFILE_REL} is missing")
    match = _BLOCK_RE.search(path.read_text())
    if not match:
        raise ProfileError(f"{PROFILE_REL} has no ```toml block")
    try:
        data = tomllib.loads(match.group(1))
    except tomllib.TOMLDecodeError as exc:
        raise ProfileError(f"{PROFILE_REL} TOML block does not parse: {exc}") from exc
    problems = validate(data)
    if problems:
        raise ProfileError(f"{PROFILE_REL}: " + "; ".join(problems))
    return data


def validate(data: dict) -> list[str]:
    problems: list[str] = []
    commands = data.get("commands")
    if not isinstance(commands, dict) or not all(
        isinstance(k, str) and isinstance(v, str) for k, v in commands.items()
    ):
        return ["[commands] must be a table of name = \"shell command\""]
    known = set(commands)

    def names(section: str, key: str) -> list[str]:
        value = data.get(section, {}).get(key, [])
        if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
            problems.append(f"[{section}].{key} must be a list of strings")
            return []
        return value

    for name, steps in data.get("profiles", {}).items():
        if not isinstance(steps, list):
            problems.append(f"[profiles].{name} must be a list of command names")
            continue
        for step in steps:
            if step not in known:
                problems.append(f"[profiles].{name} names unknown command {step!r}")
    for key in ("run", "skip"):
        for step in names("implementer", key):
            if step not in known:
                problems.append(f"[implementer].{key} names unknown command {step!r}")
    names("implementer", "forbid")
    names("implementer", "blocked")
    names("worktree", "copy_files")
    names("worktree", "dependency_files")
    for key in ("install_fresh", "install_incr"):
        if key in data.get("worktree", {}) and data["worktree"][key] not in known:
            problems.append(f"[worktree].{key} names unknown command {data['worktree'][key]!r}")
    return problems


def blocks_dir(root: Path = ROOT) -> Path:
    for rel in SKILL_DIRS:
        candidate = root / rel / "writespec" / "blocks"
        if candidate.is_dir():
            return candidate
    raise ProfileError("writespec blocks directory not found in .claude/skills or .agents/skills")


def _code_list(items: list[str]) -> str:
    quoted = [f"`{item}`" for item in items]
    if len(quoted) <= 2:
        return " or ".join(quoted)
    return ", ".join(quoted[:-1]) + ", or " + quoted[-1]


def render_block(name: str, root: Path = ROOT) -> str:
    """The exact text of one writespec block, as appended to a spec."""
    directory = blocks_dir(root)
    if name in ("scope", "closing"):
        return (directory / f"{name}.md").read_text()
    if name != "baseline":
        raise ProfileError(f"unknown block {name!r}; expected baseline, scope or closing")
    data = load(root)
    commands = data["commands"]
    impl = data.get("implementer", {})
    run = [commands[n] for n in impl.get("run", [])]
    skip = [commands[n] for n in impl.get("skip", [])]
    forbid = impl.get("forbid", [])
    blocked = impl.get("blocked", [])
    run_list = "\n".join(f"- `{c}`" for c in run) if run else "- nothing; there is no runnable check"
    skip_paragraph = (
        f"**Do not run {_code_list(skip)}.** They belong to the checker, who runs the full baseline "
        "once on the integration branch after review. They are the most expensive commands here and "
        "the least informative to you, and several implementers may be running in parallel, so an "
        "unnecessary run starves every other agent and yourself.\n\n"
        if skip else ""
    )
    forbid_line = f"Do not run {_code_list(forbid)}.\n" if forbid else ""
    blocked_paragraph = (
        "These checks are BLOCKED: that infrastructure is not available to you. Do not attempt "
        "them, and never claim them: " + "; ".join(blocked) + "."
        if blocked else "No verification category is blocked for you beyond the commands above."
    )
    template = (directory / "baseline.md.tmpl").read_text()
    return template.format(
        run_list=run_list,
        skip_paragraph=skip_paragraph,
        forbid_line=forbid_line,
        blocked_paragraph=blocked_paragraph,
    )


def checker_only_commands(root: Path = ROOT) -> list[str]:
    data = load(root)
    return [data["commands"][n] for n in data.get("implementer", {}).get("skip", [])]


def die(message: str, code: int = 2) -> None:
    print(message, file=sys.stderr)
    sys.exit(code)
