import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { format } from 'date-fns';
import { Thought } from '../types';

function backupFileName(): string {
  return `${format(new Date(), 'yyyy-MM-dd_HH-mm')}-remember.json`;
}

function isThoughtArray(value: unknown): value is Thought[] {
  return (
    Array.isArray(value) &&
    value.every(
      item =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Thought).id === 'string' &&
        typeof (item as Thought).content === 'string' &&
        typeof (item as Thought).colorTheme === 'string' &&
        typeof (item as Thought).repeatIntervalDays === 'number' &&
        typeof (item as Thought).createdAt === 'string' &&
        Array.isArray((item as Thought).completionHistory)
    )
  );
}

export async function exportBackup(thoughts: Thought[]): Promise<boolean> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) return false;

  const file = new File(Paths.cache, backupFileName());
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(thoughts, null, 2));

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export Remember backup',
  });
  return true;
}

/** Returns the parsed thoughts, `null` if the user cancelled, or throws if the file is invalid. */
export async function importBackup(): Promise<Thought[] | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
  if (result.canceled || !result.assets?.[0]) return null;

  const file = new File(result.assets[0].uri);
  const text = await file.text();
  const parsed: unknown = JSON.parse(text);

  if (!isThoughtArray(parsed)) {
    throw new Error('This file does not look like a valid Remember backup.');
  }

  return parsed;
}
