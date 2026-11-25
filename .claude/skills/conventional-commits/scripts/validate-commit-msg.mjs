#!/usr/bin/env node
// Validate a commit message against Conventional Commits 1.0.0 plus this skill's house style.
// Usage: node validate-commit-msg.mjs <message-file>   (or pipe the message on stdin)
// Exit code 1 when there are errors. Warnings never fail.
import { readFileSync } from 'node:fs'
import process from 'node:process'

const TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
]
const HEADER_SOFT_MAX = 72
const HEADER_HARD_MAX = 100
const BODY_LINE_SOFT_MAX = 72

const file = process.argv[2]
const raw = readFileSync(file ?? 0, 'utf8')
// `git commit -F <file>` (no editor) uses --cleanup=whitespace: `#` lines are KEPT,
// only trailing whitespace and trailing blank lines are removed. Mirror that.
const lines = raw.split(/\r?\n/).map(l => l.trimEnd())
while (lines.length && lines.at(-1) === '') lines.pop()

const errors = []
const warnings = []
const header = lines[0] ?? ''

const match = header.match(/^(?<type>[a-z]+)(?:\((?<scope>[^()\s][^()]*)\))?(?<bang>!)?: (?<desc>\S.*)$/i)
if (!match) {
  errors.push(`Header must look like "type(scope)!: description" (scope and ! optional), got: "${header}"`)
}
else {
  const { type, scope, bang, desc } = match.groups
  if (type !== type.toLowerCase())
    errors.push(`Type "${type}" must be lowercase.`)
  if (!TYPES.includes(type.toLowerCase()))
    warnings.push(`Type "${type}" is not one of: ${TYPES.join(', ')}. Allowed by the spec, but tools may ignore it.`)
  if (scope !== undefined && scope.trim() !== scope)
    errors.push('Scope must not have leading or trailing spaces.')
  if (/[.!?]$/.test(desc.trim()) && !desc.trim().endsWith('...'))
    errors.push('Description must not end with punctuation.')
  if (/^[A-Z][a-z]/.test(desc))
    warnings.push(`Description starts with "${desc.split(' ')[0]}". Use lowercase unless it is a proper noun or identifier.`)
  if (/^(?:(?:add|fix|updat|remov|chang|creat|implement|improv|refactor|renam|mov|delet|bump)(?:ed|es|s|ing)|setting|getting)\b/i.test(desc))
    warnings.push('Use the imperative mood ("add", "fix", "update"), not past, third-person or -ing forms.')
  if (bang)
    match.groups.breaking = true
}

if (header.length > HEADER_HARD_MAX)
  errors.push(`Header is ${header.length} chars; the maximum is ${HEADER_HARD_MAX}.`)
else if (header.length > HEADER_SOFT_MAX)
  warnings.push(`Header is ${header.length} chars; aim for ${HEADER_SOFT_MAX} or fewer.`)

if (lines.length > 1 && lines[1].trim() !== '')
  errors.push('Line 2 must be blank: separate the header from the body/footers with one empty line.')

const rest = lines.slice(2)
for (const [i, line] of rest.entries()) {
  if (line.length > BODY_LINE_SOFT_MAX && !/https?:\/\//.test(line))
    warnings.push(`Line ${i + 3} is ${line.length} chars; wrap body lines at ~${BODY_LINE_SOFT_MAX}.`)
}

// Footers live in the last paragraph, which must start with a trailer (`Token: value` / `Token #value`).
// Only that paragraph is checked, so prose in the body that mentions "breaking change:" isn't flagged.
const trailer = /^(?:[a-z][\w-]*|breaking change)\s*(?::|#)/i
const footerStart = rest.findLastIndex((l, i) => l !== '' && (i === 0 || rest[i - 1] === ''))
const footer = footerStart === -1
  ? []
  : rest.slice(footerStart)
const hasFooter = footer.length > 0 && trailer.test(footer[0])
let breakingFooter = false
if (hasFooter) {
  for (const [i, line] of footer.entries()) {
    const m = line.match(/^(breaking[ -]change)\s*:/i)
    if (!m)
      continue
    const lineNo = footerStart + i + 3
    if (m[1] !== 'BREAKING CHANGE' && m[1] !== 'BREAKING-CHANGE')
      errors.push(`Line ${lineNo}: "${m[1]}" must be uppercase: "BREAKING CHANGE:".`)
    if (!/^breaking[ -]change: \S/i.test(line))
      errors.push(`Line ${lineNo}: write "BREAKING CHANGE: <description>" (colon, space, text).`)
    breakingFooter = true
  }
}
else if (footer.slice(1).some(l => /^(?:BREAKING CHANGE|Refs|Closes|Fixes|Co-authored-by|Reviewed-by|Signed-off-by)(?:: | #)/i.test(l))) {
  warnings.push('Footers (e.g. "Refs: #12") should be in their own paragraph, after a blank line.')
}

const breaking = Boolean(match?.groups.breaking) || breakingFooter
if (match) {
  const type = match.groups.type.toLowerCase()
  const bump = breaking
    ? 'MAJOR'
    : type === 'feat'
      ? 'MINOR'
      : type === 'fix'
        ? 'PATCH'
        : 'none'
  console.log(`type=${type} scope=${match.groups.scope ?? '-'} breaking=${breaking} semver=${bump}`)
}
for (const w of warnings) console.log(`warning: ${w}`)
for (const e of errors) console.log(`error: ${e}`)
console.log(errors.length
  ? `✖ ${errors.length} error(s)`
  : '✔ valid Conventional Commit')
process.exit(errors.length ? 1 : 0)
