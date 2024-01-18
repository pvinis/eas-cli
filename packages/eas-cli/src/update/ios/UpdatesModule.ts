import { ExpoConfig } from '@expo/config';
import { IOSConfig } from '@expo/config-plugins';

import { RequestedPlatform } from '../../platform';
import { readPlistAsync, writePlistAsync } from '../../utils/plist';
import { Client } from '../../vcs/vcs';
import { ensureValidVersions } from '../utils';

export async function syncUpdatesConfigurationAsync(
  vcsClient: Client,
  projectDir: string,
  exp: ExpoConfig
): Promise<void> {
  ensureValidVersions(exp, RequestedPlatform.Ios);
  const expoPlist = await readExpoPlistAsync(projectDir);
  const updatedExpoPlist = await IOSConfig.Updates.setUpdatesConfigAsync(
    projectDir,
    exp,
    expoPlist
  );
  await writeExpoPlistAsync(vcsClient, projectDir, updatedExpoPlist);
}

async function readExpoPlistAsync(projectDir: string): Promise<IOSConfig.ExpoPlist> {
  const expoPlistPath = IOSConfig.Paths.getExpoPlistPath(projectDir);
  return ((await readPlistAsync(expoPlistPath)) ?? {}) as IOSConfig.ExpoPlist;
}

async function writeExpoPlistAsync(
  vcsClient: Client,
  projectDir: string,
  expoPlist: IOSConfig.ExpoPlist
): Promise<void> {
  const expoPlistPath = IOSConfig.Paths.getExpoPlistPath(projectDir);
  await writePlistAsync(expoPlistPath, expoPlist);
  await vcsClient.trackFileAsync(expoPlistPath);
}

export async function readReleaseChannelSafelyAsync(projectDir: string): Promise<string | null> {
  try {
    const expoPlist = await readExpoPlistAsync(projectDir);
    return expoPlist[IOSConfig.Updates.Config.RELEASE_CHANNEL] ?? null;
  } catch {
    return null;
  }
}

export async function readChannelSafelyAsync(projectDir: string): Promise<string | null> {
  try {
    const expoPlist = await readExpoPlistAsync(projectDir);
    const updatesRequestHeaders = expoPlist['EXUpdatesRequestHeaders'];
    return updatesRequestHeaders?.['expo-channel-name'] ?? null;
  } catch {
    return null;
  }
}
