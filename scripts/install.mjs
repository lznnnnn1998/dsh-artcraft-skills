#!/usr/bin/env node
/**
 * Install these skills into a DSH home.
 *
 * DSH reads skills from `$DSH_HOME/skills/<name>/SKILL.md`, so installing is a
 * copy: no build step, no plugin entry, and the model's catalogue picks them up
 * on the next session (or live, when the harness rescans).
 *
 * Usage:
 *   node scripts/install.mjs                        # into ~/.dsh/skills
 *   node scripts/install.mjs --dsh-home /path/.dsh
 *   node scripts/install.mjs --dry-run
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const value = (flag, fallback) => {
  const index = argv.indexOf(flag)
  return index === -1 ? fallback : argv[index + 1]
}
const dryRun = argv.includes('--dry-run')
const dshHome = resolve(value('--dsh-home', process.env.DSH_HOME ?? join(homedir(), '.dsh')))
const skillsRoot = join(root, 'skills')
const targetRoot = join(dshHome, 'skills')

// A broken frontmatter disappears silently, so refuse to install a skill the
// validator cannot read.
try {
  execFileSync(process.execPath, [join(root, 'scripts', 'validate-skills.mjs')], { cwd: root, stdio: 'pipe' })
} catch (error) {
  console.error('skill validation failed; nothing installed')
  console.error(String(error.stdout ?? error.message).slice(0, 800))
  process.exit(1)
}

const skills = readdirSync(skillsRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(join(skillsRoot, entry.name, 'SKILL.md')))
  .map(entry => entry.name)

if (dryRun) {
  console.log(`would install ${skills.length} skill(s) into ${targetRoot}: ${skills.join(', ')}`)
  process.exit(0)
}

mkdirSync(targetRoot, { recursive: true })
for (const name of skills) {
  const target = join(targetRoot, name)
  rmSync(target, { recursive: true, force: true })
  cpSync(join(skillsRoot, name), target, { recursive: true })
}
console.log(`installed ${skills.length} skill(s) into ${targetRoot}: ${skills.join(', ')}`)
