import { LocalStorage } from "@raycast/api";

// Define a type for pinned states
type PinnedStates = {
  [countryCode: string]: string[]; // Each country code maps to an array of pinned state codes
};

// Function to pin a country
export const pinCountry = async (countryCode: string) => {
  try {
    const pinnedCountriesJson = await LocalStorage.getItem<string>("pinnedCountries");
    const pinnedCountries: string[] = pinnedCountriesJson ? JSON.parse(pinnedCountriesJson) : [];

    if (!pinnedCountries.includes(countryCode)) {
      pinnedCountries.push(countryCode);
      await LocalStorage.setItem("pinnedCountries", JSON.stringify(pinnedCountries));
    }
  } catch (error) {
    console.error(`Error pinning country ${countryCode}:`, error);
  }
};

// Function to unpin a country
export const unpinCountry = async (countryCode: string) => {
  try {
    const pinnedCountriesJson = await LocalStorage.getItem<string>("pinnedCountries");
    const pinnedCountries: string[] = pinnedCountriesJson ? JSON.parse(pinnedCountriesJson) : [];

    const updatedCountries = pinnedCountries.filter((code: string) => code !== countryCode); // Explicitly define the type as string
    await LocalStorage.setItem("pinnedCountries", JSON.stringify(updatedCountries));
  } catch (error) {
    console.error(`Error unpinning country ${countryCode}:`, error);
  }
};

// Function to load pinned countries
export const loadPinnedCountries = async (): Promise<string[]> => {
  try {
    const pinnedCountriesJson = await LocalStorage.getItem<string>("pinnedCountries");
    const result = pinnedCountriesJson ? JSON.parse(pinnedCountriesJson) : [];
    return result;
  } catch (error) {
    console.error("Error in loadPinnedCountries: ", error);
    return [];
  }
};

// Function to pin a state
export const pinState = async (countryCode: string, stateCode: string) => {
  try {
    const pinnedStatesJson = await LocalStorage.getItem<string>("pinnedStates");
    const pinnedStates: PinnedStates = pinnedStatesJson ? JSON.parse(pinnedStatesJson) : {};

    if (!pinnedStates[countryCode]) {
      pinnedStates[countryCode] = []; // Initialize if countryCode doesn't exist
    }

    if (!pinnedStates[countryCode].includes(stateCode)) {
      pinnedStates[countryCode].push(stateCode); // Pin the state independently
      await LocalStorage.setItem("pinnedStates", JSON.stringify(pinnedStates));
    }
  } catch (error) {
    console.error(`Error pinning state ${stateCode} for country ${countryCode}:`, error);
  }
};

// Function to unpin a state
export const unpinState = async (countryCode: string, stateCode: string) => {
  try {
    const pinnedStatesJson = await LocalStorage.getItem<string>("pinnedStates");
    const pinnedStates: PinnedStates = pinnedStatesJson ? JSON.parse(pinnedStatesJson) : {};

    if (pinnedStates[countryCode]) {
      pinnedStates[countryCode] = pinnedStates[countryCode].filter((code: string) => code !== stateCode); // Explicitly define the type as string
      // Remove the country entry if no states are pinned
      if (pinnedStates[countryCode].length === 0) {
        delete pinnedStates[countryCode];
      }
      await LocalStorage.setItem("pinnedStates", JSON.stringify(pinnedStates));
    }
  } catch (error) {
    console.error(`Error unpinning state ${stateCode} for country ${countryCode}:`, error);
  }
};

// Function to load pinned states for a specific country
export const loadPinnedStates = async (countryCode: string): Promise<string[]> => {
  try {
    const pinnedStatesJson = await LocalStorage.getItem<string>("pinnedStates");
    const pinnedStates: PinnedStates = pinnedStatesJson ? JSON.parse(pinnedStatesJson) : {};
    return pinnedStates[countryCode] || []; // Return pinned states for the country
  } catch (error) {
    console.error(`Error loading pinned states for country ${countryCode}:`, error);
    return [];
  }
};

// Function to load all pinned states for all countries
export const loadAllPinnedStates = async (): Promise<PinnedStates> => {
  try {
    const pinnedStatesJson = await LocalStorage.getItem<string>("pinnedStates");
    const result = pinnedStatesJson ? JSON.parse(pinnedStatesJson) : {};

    return result;
  } catch (error) {
    console.error("Error in loadAllPinnedStates: ", error);
    return {};
  }
};
