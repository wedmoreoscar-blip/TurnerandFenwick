---
name: skill-writing
description: Create or revise portable Agent Skills packages for Codex and Claude Code. Use before editing any SKILL.md or when asked to create a skill, slash-command workflow, reusable agent procedure, or cross-client skill package.
---

1. Read `docs/workflows/skill_authoring.md` when the active repository provides it; otherwise use this
   skill's portable structure and the active client's official skill creator.
2. Define realistic triggers, non-triggers, inputs, outputs, safety boundaries, and edge cases.
3. Keep one focused job per skill and use portable `name` plus `description` frontmatter.
4. Keep the body concise; place detailed material in directly linked `references/` and use scripts only
   for deterministic repeated work.
5. Initialize and validate with the active client's official skill creator when available.
6. Write the skill in the repository, never in a home directory: mirror it byte-identically under
   `.agents/skills/<name>/` and `.claude/skills/<name>/` (plus any extra tool targets listed in
   `.agent-kit.lock`), and add Codex `agents/openai.yaml` metadata from the finished skill. There are
   no personal or global skills; a skill is either project-only or shared through the agent kit.
7. If the skill is useful beyond this project, say so and suggest `kit push --new
   .agents/skills/<name> --pack core` to the user. Never run `kit push` yourself unless asked.
8. Test triggers, paraphrases, non-triggers, incomplete inputs, and edge cases in fresh sessions. Run
   `tools/check-agent-setup` when the repository has it.
