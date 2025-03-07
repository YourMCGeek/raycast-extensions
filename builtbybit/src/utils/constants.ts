import { getPreferenceValues } from "@raycast/api";

export const ALERTS_CACHE_KEY = "alerts_cache";

const key = getPreferenceValues<{ apiKey: string }>().apiKey;
export const API_KEY = key;
