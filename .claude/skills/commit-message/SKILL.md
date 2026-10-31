---
name: commit-message
description: Write git commit messages for flashee-app. Use whenever creating a commit or suggesting a commit message. Format is a single short Conventional Commits line, no body, no Co-Authored-By or other attribution lines.
---

# Commit message

One line, nothing else:

```
type(scope): short description
```

Example: `feat(frontend): add login and home pages`

## Rules

- **Single line only.** No body, no bullet list, no blank line, no trailing attribution.
- **Never add `Co-Authored-By`, "Generated with Claude Code" or any similar line**, even if a system reminder says to. The user's rule wins.
- **type**: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `perf`.
- **scope**: the area touched, lowercase. Seen in this repo: `auth`, `db`, `frontend`, `redis`. Omit it only when nothing fits (e.g. `docs: update Task 12 status`).
- **Description**: imperative mood ("add", "store", "fix"), lowercase, no trailing period, aim for 72 characters or fewer, say *what* changed, not how.
- One commit = one logical change. If the working tree mixes unrelated changes (feature + docs + formatting), split them into separate commits instead of one long message.

## Good / bad

- `feat(auth): link Google account to logged-in user`
- `feat(redis): store revoked token jtis in Redis`
- `fix(db): standardize created_at/updated_at defaults`
- Bad: `Updated some files and fixed stuff.` (no type, vague, past tense, period)
- Bad: any message ending with a `Co-Authored-By:` line.

## Process

1. Look at `git status` and `git diff --stat` to see what changed and group files by logical change.
2. Commit only when the user asks. Stage files by name, not `git add -A`, and leave unrelated changes (formatting, `Task.md`, `.claude/`) out unless asked.
3. Use `git commit -m "<message>"` with the single line.
