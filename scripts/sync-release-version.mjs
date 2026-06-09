import fs from 'node:fs'
import path from 'node:path'

const rawVersion = process.argv[2]

if (!rawVersion) {
  console.error('Usage: node scripts/sync-release-version.mjs <version>')
  process.exit(1)
}

const version = rawVersion.replace(/^[v.]+/i, '')
const [major = 0, minor = 0, patch = 0] = version.split('.').map((part) => Number.parseInt(part, 10) || 0)
const versionCode = major * 10000 + minor * 100 + patch

function updateJson(filePath) {
  const value = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  value.version = version
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function updateCargo(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  fs.writeFileSync(filePath, content.replace(/^version = ".*"$/m, `version = "${version}"`))
}

function updateGradle(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const next = content
    .replace(/versionCode\s+\d+/m, `versionCode ${versionCode}`)
    .replace(/versionName\s+".*"/m, `versionName "${version}"`)
  fs.writeFileSync(filePath, next)
}

function updateTauriConfig(filePath) {
  const value = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  value.version = version
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

updateJson(path.resolve('package.json'))
updateJson(path.resolve('apps/mobile/package.json'))
updateJson(path.resolve('apps/desktop/package.json'))
updateCargo(path.resolve('apps/desktop/src-tauri/Cargo.toml'))
updateTauriConfig(path.resolve('apps/desktop/src-tauri/tauri.conf.json'))
updateGradle(path.resolve('android/app/build.gradle'))
updateGradle(path.resolve('apps/mobile/android/app/build.gradle'))

console.log(`Synced release version ${version} (versionCode ${versionCode})`)
