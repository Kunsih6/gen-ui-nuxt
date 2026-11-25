# Conventional Commits 1.0.0 — specification notes

This is a paraphrase of https://www.conventionalcommits.org/en/v1.0.0/ (CC BY 3.0). Read it when a case isn't covered by SKILL.md, or when you need the exact requirement level of a rule.

## Structure

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Rules (requirement levels as in the spec)

1. A commit **MUST** start with a type, which is a noun such as `feat` or `fix`. An optional scope and an optional `!` may follow. Then comes a **required** colon and space.
2. `feat` **MUST** be used when the commit adds a new feature.
3. `fix` **MUST** be used when the commit fixes a bug.
4. A scope **MAY** follow the type. If present, it **MUST** be a noun describing a section of the codebase, in parentheses, e.g. `fix(parser):`.
5. The description **MUST** come right after the colon and space. It is a short summary of the change.
6. A longer body **MAY** follow. It **MUST** start one blank line after the description.
7. The body is free-form and **MAY** have any number of paragraphs.
8. One or more footers **MAY** follow, one blank line after the body. Each footer **MUST** be a word token, then `: ` or ` #`, then a value (this follows the git trailer convention).
9. Footer tokens **MUST** use `-` instead of spaces (e.g. `Acked-by`). The exception is `BREAKING CHANGE`, which **MAY** be used as a token.
10. A footer value **MAY** contain spaces and newlines. It ends where the next valid `token: ` or `token #` pair begins.
11. Breaking changes **MUST** be marked in the prefix or in a footer.
12. In a footer, a breaking change **MUST** be the uppercase text `BREAKING CHANGE`, then a colon, a space and a description.
13. In the prefix, a breaking change is a `!` right before the `:`. With `!`, the `BREAKING CHANGE:` footer **MAY** be left out, and the description **SHALL** describe the breaking change.
14. Types other than `feat` and `fix` **MAY** be used.
15. Tools **MUST NOT** treat any part of the message as case-sensitive, except `BREAKING CHANGE`, which **MUST** be uppercase.
16. `BREAKING-CHANGE` **MUST** be treated as a synonym of `BREAKING CHANGE` when used as a footer token.

## SemVer mapping

- `fix` → PATCH
- `feat` → MINOR
- a breaking change in any type (`!` or `BREAKING CHANGE`) → MAJOR
- other types → no release on their own

## Types beyond feat and fix

The spec cites `@commitlint/config-conventional`, which follows the Angular convention: `build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test`. The FAQ also suggests `revert`. The spec itself doesn't require any of these. They're a widely shared convention.

## FAQ highlights

- **Initial development:** work as if the product is already released. Users still need to know what got fixed and what broke.
- **Type casing:** any casing is allowed, but be consistent. This skill uses lowercase.
- **A change that fits several types:** split it into several commits when you can.
- **Wrong type used:** before merging or releasing, fix it by rewriting history (e.g. an interactive rebase). After release, it only means tooling may skip or misreport the commit. It isn't catastrophic.
- **Reverts:** the spec doesn't define them. A common form is a `revert:` type with a footer that references the reverted SHAs, e.g. `Refs: 676104e, a215868`.
- **Contributors who don't follow the spec:** in squash-merge workflows, the maintainer can write a compliant squash message.

## Spec examples, briefly

- `feat: allow provided config object to extend other configs`, with a `BREAKING CHANGE:` footer: a breaking change marked by a footer.
- `feat!: send an email to the customer when a product is shipped`: `!` alone.
- `feat(api)!: send an email to the customer when a product is shipped`: a scope plus `!`.
- `feat!: drop support for Node 6`, plus a `BREAKING CHANGE:` footer: both markers together.
- `docs: correct spelling of CHANGELOG`: a header only.
- `feat(lang): add Polish language`: a scope.
- `fix: prevent racing of requests`, with a multi-paragraph body and `Reviewed-by: Z` and `Refs: #123` footers: a body plus several footers.
