/**
 * Stamps a release version into app.json and package.json.
 *
 *   node scripts/set-version.js 1.3.0
 *
 * versionCode is derived from the version (major*10000 + minor*100 + patch) so
 * it always increases with the version and never needs hand-editing. That caps
 * minor and patch at 99.
 */
const fs = require('fs');
const path = require('path');

const version = (process.argv[2] || '').replace(/^v/, '');
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
if (!match) {
  console.error(`Expected a version like 1.3.0, got "${process.argv[2] ?? ''}"`);
  process.exit(1);
}

const [major, minor, patch] = match.slice(1).map(Number);
if (minor > 99 || patch > 99) {
  console.error('Minor and patch must be 99 or less for the derived versionCode.');
  process.exit(1);
}
const versionCode = major * 10000 + minor * 100 + patch;

const root = path.resolve(process.argv[1], '..', '..');

const appJsonPath = path.join(root, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
appJson.expo.version = version;
appJson.expo.android.versionCode = versionCode;
fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);

const packageJsonPath = path.join(root, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.version = version;
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(`version ${version}, versionCode ${versionCode}`);
