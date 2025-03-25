import { getPreferenceValues } from "@raycast/api";

const preferences = getPreferenceValues();

export function getSavePath(): string {
  return preferences.savePath;
}

export function getSaveMode(): string {
  return preferences.saveMode;
}

export function getNewFileSuffix(): string {
  return preferences.newFileSuffix;
}
