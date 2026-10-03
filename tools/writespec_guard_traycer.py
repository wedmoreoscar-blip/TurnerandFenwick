"""writespec-guard plugin: a `traycer agent send` carrying a message is a commission.

Only an actual invocation is governed. The phrase inside a heredoc, a commit message, or a grep
pattern is a mention, not a send. A send without `--message` delivers nothing (e.g. `--help`), and a
reply (`--response-id`) commissions nothing.
"""
import re

HEREDOC_RE = re.compile(r"<<-?\s*(['\"]?)([A-Za-z_]\w*)\1.*?^\s*\2\s*$", re.DOTALL | re.MULTILINE)
_WRAPPER = (r"(?:\w+=\S*\s+|nohup\s+|setsid\s+|command\s+|time\s+|"
            r"env\s+(?:-[iu]\s+\S+\s+|\w+=\S*\s+)*)*")
# A command-start position. A bare quote is not a boundary (`grep "traycer agent send" docs/` is
# normal); only a quote introducing a nested shell counts.
INVOKE_RE = re.compile(r"""(?:\A|[;&|()\n]|\|\||&&|-l?c\s*["'])\s*""" + _WRAPPER
                       + r"traycer\s+agent\s+send\b")


def extract(payload):
    if payload.get("tool_name") != "Bash":
        return None
    cmd = payload.get("tool_input", {}).get("command", "")
    if not INVOKE_RE.search(HEREDOC_RE.sub(" ", cmd)):
        return None
    if "--message" not in cmd or "--response-id" in cmd:
        return None
    return cmd
