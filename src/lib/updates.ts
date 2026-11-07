import * as Application from 'expo-application';
import { Directory, File, Paths } from 'expo-file-system';
import { startActivityAsync } from 'expo-intent-launcher';

/**
 * Self-update from GitHub Releases.
 *
 * The release workflow (.github/workflows/release.yml) publishes a signed APK
 * per version tag. Here we read the latest release, compare its tag with the
 * installed version, and hand the downloaded APK to Android's package
 * installer. Android always shows its own confirmation screen -- a sideloaded
 * app cannot install silently -- and only accepts the update if it is signed
 * with the same key as the installed app.
 */

const REPO = 'imnakul/Smaran---Remember-what-matters';
const LATEST_RELEASE_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

const APK_MIME = 'application/vnd.android.package-archive';
/** Intent.FLAG_GRANT_READ_URI_PERMISSION, so the installer can read our file. */
const FLAG_GRANT_READ_URI_PERMISSION = 1;

export interface UpdateInfo {
  version: string;
  downloadUrl: string;
  sizeBytes: number;
  notes: string;
  releaseUrl: string;
}

interface GithubRelease {
  tag_name: string;
  body?: string | null;
  html_url: string;
  draft?: boolean;
  prerelease?: boolean;
  assets?: Array<{ name: string; browser_download_url: string; size: number }>;
}

export function currentVersion(): string {
  return Application.nativeApplicationVersion ?? '0.0.0';
}

function parseVersion(value: string): number[] {
  return value
    .replace(/^v/, '')
    .split('-')[0]
    .split('.')
    .slice(0, 3)
    .map(part => Number.parseInt(part, 10) || 0);
}

/** True when `candidate` is a higher semver than `installed`. */
export function isNewerVersion(candidate: string, installed: string): boolean {
  const a = parseVersion(candidate);
  const b = parseVersion(installed);
  for (let i = 0; i < 3; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

/** Returns the newer release if there is one, otherwise null. */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  const response = await fetch(LATEST_RELEASE_URL, {
    headers: { Accept: 'application/vnd.github+json' },
  });

  // 404 means the repo has no published release yet.
  if (response.status === 404) return null;
  if (response.status === 403 || response.status === 429) {
    throw new Error('GitHub is rate-limiting update checks. Try again in a few minutes.');
  }
  if (!response.ok) throw new Error(`Could not check for updates (${response.status}).`);

  const release = (await response.json()) as GithubRelease;
  if (release.draft || release.prerelease) return null;

  const apk = release.assets?.find(asset => asset.name.toLowerCase().endsWith('.apk'));
  if (!apk) return null;

  const version = release.tag_name.replace(/^v/, '');
  if (!isNewerVersion(version, currentVersion())) return null;

  return {
    version,
    downloadUrl: apk.browser_download_url,
    sizeBytes: apk.size,
    notes: release.body?.trim() ?? '',
    releaseUrl: release.html_url,
  };
}

/**
 * Downloads the APK into the cache and opens the system installer.
 *
 * @param onProgress receives 0..1, or -1 when the size is unknown.
 */
export async function downloadAndInstall(
  update: UpdateInfo,
  onProgress?: (fraction: number) => void
): Promise<void> {
  const dir = new Directory(Paths.cache, 'updates');
  // Drop older downloads so stale APKs never pile up in the cache.
  if (dir.exists) dir.delete();
  dir.create({ intermediates: true });

  const target = new File(dir, `Smaran-${update.version}.apk`);
  const apk = await File.downloadFileAsync(update.downloadUrl, target, {
    idempotent: true,
    onProgress: ({ bytesWritten, totalBytes }) => {
      const total = totalBytes > 0 ? totalBytes : update.sizeBytes;
      onProgress?.(total > 0 ? Math.min(1, bytesWritten / total) : -1);
    },
  });

  await startActivityAsync('android.intent.action.VIEW', {
    data: apk.contentUri,
    type: APK_MIME,
    flags: FLAG_GRANT_READ_URI_PERMISSION,
  });
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
