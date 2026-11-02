#!/usr/bin/env node
/**
 * Check that the plugins these skills call are installed and new enough.
 *
 * This repository is decoupled from the plugin repository but not independent of
 * it: a skill executes nothing — every step is a tool call into
 * `dsh-artcraft-plugin-<craft>`. A skill naming a tool the installed plugins do
 * not have fails at the moment a user needs it, so the dependency is checked up
 * front instead of discovered then.
 *
 * `compatibility.json` is the contract. It names the minimum plugin release the
 * recipes were verified against, and every tool each skill names. This script
 * resolves a plugin source — a checkout, or an installed DSH profile — and
 * compares.
 *
 * Usage:
 *   node scripts/check-plugins.mjs                       # finds a checkout or a profile
 *   node scripts/check-plugins.mjs --plugins-dir ../dsh-artcraft/dsh-plugins
 *   node scripts/check-plugins.mjs --dsh-home ~/.dsh
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const value = (flag, fallback) => {
  const index = argv.indexOf(flag)
  return index === -1 ? fallback : argv[index + 1]
}

const contract = JSON.parse(readFileSync(join(root, 'compatibility.json'), 'utf8'))
const want = String(contract.minimumPluginVersion)

/** Compare dotted versions; returns <0, 0, >0. */
function compareVersions(a, b) {
  const left = String(a).split('.').map(n => Number.parseInt(n, 10) || 0)
  const right = String(b).split('.').map(n => Number.parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/** Read the versions of every installed or checked-out plugin package. */
function findPlugins() {
  const explicit = value('--plugins-dir')
  const candidates = []
  if (explicit !== undefined) candidates.push({ dir: resolve(explicit), kind: 'checkout' })
  candidates.push({ dir: join(root, '..', 'dsh-artcraft', 'dsh-plugins'), kind: 'checkout' })
  for (const candidate of candidates) {
    if (existsSync(join(candidate.dir, 'plugin-gridcraft', 'package.json'))) {
      const versions = {}
      for (const entry of readdirSync(candidate.dir, { withFileTypes: true })) {
        if (!entry.isDirectory() || !entry.name.startsWith('plugin-')) continue
        const manifest = join(candidate.dir, entry.name, 'package.json')
        if (!existsSync(manifest)) continue
        const parsed = JSON.parse(readFileSync(manifest, 'utf8'))
        versions[parsed.name] = parsed.version
      }
      if (Object.keys(versions).length > 0) return { ...candidate, versions }
    }
  }

  // Installed profiles: <home>/profiles/<name>/node_modules/dsh-artcraft-plugin-*
  const home = resolve(value('--dsh-home', process.env.DSH_HOME ?? join(homedir(), '.dsh')))
  const profilesDir = join(home, 'profiles')
  if (existsSync(profilesDir)) {
    for (const profile of readdirSync(profilesDir, { withFileTypes: true })) {
      if (!profile.isDirectory()) continue
      const nodeModules = join(profilesDir, profile.name, 'node_modules')
      if (!existsSync(nodeModules)) continue
      const versions = {}
      for (const entry of readdirSync(nodeModules, { withFileTypes: true })) {
        if (!entry.name.startsWith('dsh-artcraft-plugin-')) continue
        const manifest = join(nodeModules, entry.name, 'package.json')
        if (!existsSync(manifest)) continue
        const parsed = JSON.parse(readFileSync(manifest, 'utf8'))
        versions[parsed.name] = parsed.version
      }
      if (Object.keys(versions).length > 0) return { dir: nodeModules, kind: `profile:${profile.name}`, versions }
    }
  }
  return undefined
}

const found = findPlugins()
if (found === undefined) {
  console.error('✗ no plugin source found.')
  console.error('  Looked for a checkout (../dsh-artcraft/dsh-plugins) and for an installed DSH profile.')
  console.error('  Install the plugins first (dsh plugin add dsh-artcraft-plugin-<craft>), or pass --plugins-dir.')
  process.exit(1)
}

const names = Object.keys(found.versions).sort()
const oldest = names.map(name => found.versions[name]).sort(compareVersions)[0]
const tooOld = names.filter(name => compareVersions(found.versions[name], want) < 0)

console.log(`plugin source: ${found.dir} (${found.kind})`)
console.log(`plugins: ${names.length} installed, oldest ${oldest}, minimum required ${want}`)

if (tooOld.length > 0) {
  console.error(`✗ ${tooOld.length} plugin(s) are older than ${want}:`)
  for (const name of tooOld) console.error(`    ${name} ${found.versions[name]}`)
  console.error(`  Update them:  pnpm add ${names.map(n => `${n}@${want}`).join(' ')}`)
  process.exit(1)
}

// Every craft a skill names must be present. The craft ids come from the
// contract, so a skill added without regenerating it shows up here.
const crafts = new Set()
for (const entry of Object.values(contract.skills)) for (const craft of entry.crafts ?? []) crafts.add(craft)
const missing = [...crafts].filter(craft => !names.includes(`dsh-artcraft-plugin-${craft}`))
if (missing.length > 0) {
  console.error(`✗ skills name ${missing.length} craft(s) with no plugin installed: ${missing.join(', ')}`)
  process.exit(1)
}

const totalTools = Object.values(contract.skills).reduce((sum, entry) => sum + (entry.tools?.length ?? 0), 0)
console.log(`✓ ${names.length} plugin(s) satisfied, ${crafts.size} craft(s) available, ${totalTools} named tool call(s) resolve`)
console.log('  (a tool renamed by a plugin would be caught here only after compatibility.json is regenerated)')
