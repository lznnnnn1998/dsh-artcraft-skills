#!/usr/bin/env node
/**
 * Validate every skill in `skills/` before it is installed.
 *
 * DSH discovers a skill by reading the YAML frontmatter of its `SKILL.md`. A
 * malformed frontmatter fails silently: the skill simply never appears in the
 * model's catalogue, which looks exactly like a skill nobody wrote. The usual
 * mistake is an unquoted description holding ": " — YAML reads the rest of the
 * line as a nested key and the block does not parse.
 *
 * Usage: node scripts/validate-skills.mjs
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(dirname(import.meta.url.replace('file://', '')), '..')
const skillsRoot = join(root, 'skills')

/** js-yaml comes from the harness checkout, or from this repo's node_modules. */
function findYaml() {
  const candidates = [
    join(root, 'node_modules', 'js-yaml'),
    process.env.DSH_HARNESS_DIR ? join(process.env.DSH_HARNESS_DIR, 'node_modules', 'js-yaml') : undefined,
    join(process.env.HOME ?? '', 'deepseek-harness', 'node_modules', 'js-yaml'),
  ].filter(Boolean)
  for (const moduleDir of candidates) {
    if (existsSync(moduleDir)) return pathToFileURL(join(moduleDir, 'dist', 'js-yaml.mjs')).href
  }
  return undefined
}

const yamlUrl = findYaml()
if (yamlUrl === undefined) {
  console.error('js-yaml not found — run `npm install` here, or set DSH_HARNESS_DIR to a deepseek-harness checkout.')
  process.exit(2)
}
const yaml = await import(yamlUrl)

const dirs = readdirSync(skillsRoot, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
let failures = 0

for (const name of dirs) {
  const file = join(skillsRoot, name, 'SKILL.md')
  if (!existsSync(file)) {
    console.error(`✗ ${name}: no SKILL.md`)
    failures += 1
    continue
  }
  const raw = readFileSync(file, 'utf8')
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
  if (frontmatter === null) {
    console.error(`✗ ${name}: SKILL.md does not start with a YAML frontmatter block`)
    failures += 1
    continue
  }
  let meta
  try {
    meta = yaml.load(frontmatter[1])
  } catch (error) {
    console.error(`✗ ${name}: frontmatter does not parse — ${error.message.split('\n')[0]}`)
    console.error('    Quote a description that contains ": ", e.g. description: "Use when …: …"')
    failures += 1
    continue
  }
  const problems = []
  if (typeof meta?.name !== 'string' || meta.name.trim().length === 0) problems.push('frontmatter needs a name')
  if (typeof meta?.description !== 'string' || meta.description.trim().length === 0) problems.push('frontmatter needs a description')
  else if (meta.description.length > 1024) problems.push(`description is ${meta.description.length} chars; keep it under 1024`)
  if (problems.length === 0) console.log(`✓ ${name} (${meta.name}) — ${meta.description.length} chars`)
  else {
    failures += 1
    console.error(`✗ ${name}`)
    for (const problem of problems) console.error(`    ${problem}`)
  }
}

console.log(failures === 0 ? `\nall ${dirs.length} skill(s) are valid` : `\n${failures} of ${dirs.length} skill(s) have problems`)
process.exit(failures === 0 ? 0 : 1)
