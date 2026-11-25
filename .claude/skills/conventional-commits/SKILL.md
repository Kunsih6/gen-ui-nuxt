---
name: conventional-commits
description: >-
  Write and create git commits that follow the Conventional Commits v1.0.0 spec
  (type(scope)!: description, body, footers, BREAKING CHANGE). Use this skill
  whenever you are about to run `git commit` or write a commit message, including
  when the user says "commit", "commit this", "commit my changes", "make a commit",
  "save this to git", "split this into commits", asks for a commit message, a
  squash-merge message or a revert, or when a task you were given ends with
  committing. Use it even if the user never mentions Conventional Commits.
---

# Conventional Commits

Commits in this project follow [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). The format lets tools generate changelogs and choose SemVer bumps from history, so a wrong type or a malformed header is a real defect, not just a style issue.

```
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

For the full spec rules, the FAQ and edge cases, read `references/specification.md`.

## Workflow

1. **Inspect the changes.** Run `git status --short -uall` (`-uall` lists every untracked file instead of collapsing directories), then `git diff --staged` and `git diff`. Those diffs don't show untracked files, so read new files directly. Run `git log --oneline -20` to see which types and scopes the repo already uses. If the history follows Conventional Commits, match its scopes and habits. If it doesn't, or is just a default "Initial commit", use the defaults in this skill.
2. **Look for project rules.** Check for a commitlint config (`commitlint.config.*`, `.commitlintrc*`, or a `commitlint` key in `package.json`) and for commit guidance in `CONTRIBUTING.md`. Project rules override the defaults in this skill.
3. **Group into logical commits.** One commit should hold one kind of change, and every commit should leave the repo working: it should build and lint on its own. If the changes mix independent concerns (a feature plus an unrelated dependency bump, say), split them. The spec's FAQ recommends that, and it keeps changelogs accurate. When the user asked you to commit, make the split yourself and list the resulting commits in your report; don't stop to ask. Ask first only if the user asked for one commit or already staged files. In that case, honor their request: use the type of the most significant change and mention the rest in the body. Don't split for its own sake. Small changes of the same kind in the same area belong together.
4. **Stage explicitly.** Use `git add <paths>` for the files in each commit, never `git add -A` or `git add .`. Interactive staging (`git add -p`) isn't available, so split by file. If two concerns share a file (both add dependencies to `package.json` and the lockfile, for instance), keep **the whole of both concerns** in one commit, not just the shared file. Otherwise one commit would contain, say, a `lint` script with no ESLint config. Mention the merged concern in the commit body and in your report. Never stage secrets (`.env`, credentials, keys), local-only settings (`.claude/settings.local.json`, `*.local.*`) or build output. If the user already staged a set of files, commit exactly that set.
5. **Write the message** using the rules below.
6. **Validate it.** Write the message to a temp file **outside the work tree**, so it can't get staged (use `mktemp`, or your scratchpad directory). Then run the validator. It lives in `scripts/` next to this SKILL.md, which is `.claude/skills/conventional-commits/scripts/` for this project skill:
   ```bash
   node .claude/skills/conventional-commits/scripts/validate-commit-msg.mjs "$MSG_FILE"
   ```
   Fix every error. Warnings are judgment calls (a description starting with a proper noun like "Nuxt" is fine).
7. **Commit from the file** with `git commit -F "$MSG_FILE"`. This keeps the text exactly as written. Git doesn't strip `#` lines in this mode, so a line like `#42 was caused by…` stays in the message. Don't pass `--no-verify`. If a hook rejects the message, fix the message.
8. **Verify** with `git log -1 --format=%B` and `git status --short`. Then report the commit hash and header. Don't push, amend or rebase unless the user asks.

## Choosing the type

| Type | Use for | SemVer |
|---|---|---|
| `feat` | A new capability for users of the app or library | MINOR |
| `fix` | A bug fix | PATCH |
| `docs` | Documentation only (README, comments, guides) | none |
| `style` | Formatting with no change in meaning: whitespace, quotes, semicolons, lint auto-fixes. **Not CSS.** Visual or CSS changes are `feat` or `fix`. | none |
| `refactor` | Restructuring that neither fixes a bug nor adds a feature | none |
| `perf` | A change made to improve performance | none |
| `test` | Adding or fixing tests only | none |
| `build` | Build system, bundler config or dependencies (`package.json` deps, lockfile, `nuxt.config.ts` build options) | none |
| `ci` | CI pipelines and their scripts (`.github/workflows`, etc.) | none |
| `chore` | Maintenance that touches neither source nor tests: tooling config (ESLint, editor, git hooks), housekeeping | none |
| `revert` | Undoing an earlier commit | depends |

Any type that carries a breaking change triggers a MAJOR bump.

How to decide in ambiguous cases:
- **The user-visible effect decides.** A refactor that also fixes a bug is a `fix`. A new config option for users is a `feat`, even if most of the diff is plumbing.
- **Dependencies on their own** (bumps, adding or removing a runtime library): use `build(deps)`, unless the repo's history uses `chore(deps)` (Renovate and Dependabot do), in which case match it.
- **Dependencies that are part of a larger change** take that change's type. Adding `eslint` together with its config is `chore(eslint)`, not `build(deps)`. Adding a charting library together with the chart that uses it is `feat`.
- **Adding a tool and applying it:** setting up ESLint or Prettier is `chore`. A commit that only re-formats existing files is `style`. Keep the two separate when the formatted files were already committed. In a first commit there's nothing to separate.
- **Scaffolding a new project** (the first real commit) is `chore`, e.g. `chore: scaffold Nuxt app`. Tooling that arrives with it and shares its `package.json` (a linter, say) goes in the same commit (see step 4). It's `feat` only once there is user-facing behavior.
- **Agent and editor config** (`.claude/` skills, `launch.json`, `.vscode/`, shared settings) is `chore`. Commit it when it's meant to be shared with the team.

## Writing the header

- **Type:** lowercase. The spec accepts any casing, but staying consistent is what makes history parseable.
- **Scope (optional):** a noun in parentheses naming the area of the codebase, e.g. `feat(auth):`, `fix(api):`, `build(deps):`, `chore(eslint):`. Take scopes from the repo's structure and history. Leave the scope out when the change spans many areas. Don't invent a new scope for every commit.
- **`!`:** put it right before the colon when the commit breaks a public contract (see Breaking changes below).
- **Description:** imperative mood and present tense ("add", not "added" or "adds"). It completes the sentence "If applied, this commit will …". Start it lowercase, but keep proper nouns and code identifiers as written (`useFetch`, `Nuxt`). No trailing period.
- **Length:** aim for 72 characters or less for the whole header, 100 at most. If it doesn't fit, the commit is probably doing too much, or the details belong in the body.

## Body (optional)

Start the body after one blank line. Explain **what** changed and **why**: the motivation, the previous behavior and the trade-offs. The diff already shows how. Wrap lines at about 72 characters. Skip the body when the header says everything, as it often does for `docs`, `style` and dependency bumps.

## Footers (optional)

Footers come after one blank line, in git trailer format: a token, then `: ` or ` #`, then a value. Use hyphens instead of spaces in tokens (`Reviewed-by`, `Co-authored-by`). The one exception is `BREAKING CHANGE`.

```
Refs: #123
Closes #45
Reviewed-by: Jane Doe
```

If your environment or the user requires attribution trailers (such as `Co-Authored-By:`), put them in the footer section as well, after any `BREAKING CHANGE` or `Refs` footers. They are valid footers, so the message stays spec-compliant.

## Breaking changes

A change is breaking when existing users must change their code, config or data: a removed or renamed API, changed defaults, dropped runtime support, a migrated schema. Mark it in one or both of these ways:

- `!` before the colon: `feat(api)!: drop the v1 endpoints`
- a footer, written in uppercase: `BREAKING CHANGE: <what breaks and how to migrate>`. `BREAKING-CHANGE:` is an accepted synonym.

Use both for anything significant. The `!` is visible in one-line logs, and the footer is where the migration notes go.

## Examples

```
feat(chat): stream assistant responses into the message list
```

```
fix(api): retry generation requests on 429 responses

The provider rate-limits bursts. Requests now back off exponentially,
up to three attempts, before the error is shown to the user.

Refs: #42
```

```
feat(config)!: require an explicit model id

The default model was silently changing between releases. Every
call site now has to pick a model.

BREAKING CHANGE: `generate()` throws if `model` is not set. Add
`model: 'claude-sonnet-5-5'` (or another id) to existing calls.
```

```
build(deps): bump nuxt from 4.7.0 to 4.7.1
```

```
chore(eslint): add @antfu/eslint-config with attribute ordering
```

```
revert: feat(chat): stream assistant responses into the message list

This reverts commit 676104e, because streaming broke Safari.

Refs: 676104e
```

Common corrections:

| Instead of | Write | Why |
|---|---|---|
| `Fixed login bug.` | `fix(auth): prevent redirect loop after login` | type, imperative mood, specific, no period |
| `feat: Add dark mode` | `feat(ui): add dark mode toggle` | lowercase description; the scope adds context |
| `style(button): change primary color` | `feat(button): use brand color for primary variant` | `style` means formatting, not CSS |
| `chore: update stuff` | `build(deps): bump vue to 3.5.46` | say what changed |
| `feat: add search and fix footer and bump deps` | three separate commits | one concern per commit |
