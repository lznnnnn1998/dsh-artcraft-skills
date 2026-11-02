#!/usr/bin/env node
/**
 * Regenerate `compatibility.json` from the skills and the plugin contract.
 *
 * The contract is derived, not hand-written: the tool names come from scanning
 * every `SKILL.md`, and the minimum plugin version is the release the recipes
 * were verified against. Regenerating it after editing a skill keeps the two
 * from drifting, and `--check` fails when someone forgot.
 *
 * Usage:
 *   node scripts/sync-compatibility.mjs            # rewrite the file
 *   node scripts/sync-compatibility.mjs --check    # fail when it is stale
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const checkOnly = process.argv.includes('--check')

const CRAFTS = ['cadcraft', 'deckcraft', 'designcraft', 'effectcraft', 'figcraft', 'filmcraft', 'gridcraft',
  'lightcraft', 'pdfcraft', 'photocraft', 'soundcraft', 'texturecraft', 'vectorcraft', 'wordcraft']
const TOOL_KINDS = ['run', 'commands', 'describe', 'inspect', 'convert', 'mcp_tools', 'mcp_call', 'mcp_status', 'job']

const current = JSON.parse(readFileSync(join(root, 'compatibility.json'), 'utf8'))
// The minimum version is maintained by hand — it is a fact about verification,
// not something a scanner can infer — so regenerating preserves it.
const minimumPluginVersion = current.minimumPluginVersion

const skills = {}
for (const entry of readdirSync(join(root, 'skills'), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!entry.isDirectory()) continue
  const file = join(root, 'skills', entry.name, 'SKILL.md')
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  const found = new Set()
  for (const craft of CRAFTS) {
    for (const kind of TOOL_KINDS) {
      if (text.includes(`${craft}_${kind}`)) found.add(`${craft}_${kind}`)
    }
  }
  const tools = [...found].sort()
  skills[entry.name] = {
    tools,
    crafts: [...new Set(tools.map(tool => tool.split('_')[0]))].sort(),
  }
}

const next = {
  pluginRepository: 'https://github.com/lznnnnn1998/dsh-artcraft',
  pluginPackages: 'dsh-artcraft-plugin-<craft>',
  minimumPluginVersion,
  notes: [
    'A skill executes nothing on its own: every step calls a tool from the plugin repository.',
    'minimumPluginVersion is the release the recipes in this repository were verified against.',
    'A tool renamed or removed by a plugin breaks the skills that name it; this file is what the check reads.',
  ],
  skills,
}

const serialized = JSON.stringify(next, null, 2) + '\n'
const previous = JSON.stringify(current, null, 2) + '\n'

if (checkOnly) {
  if (serialized !== previous) {
    console.error('✗ compatibility.json is stale — run: node scripts/sync-compatibility.mjs')
    process.exit(1)
  }
  console.log(`✓ compatibility.json matches the skills (${Object.keys(skills).length} skill(s))`)
  process.exit(0)
}

writeFileSync(join(root, 'compatibility.json'), serialized)
console.log(`wrote compatibility.json: ${Object.keys(skills).length} skill(s), ${Object.values(skills).reduce((n, s) => n + s.tools.length, 0)} named tool call(s)`)
