import { Action, ActionPanel, Icon, List } from "@raycast/api";
import Holidays from "date-holidays";
import moment from "moment";
import { useEffect, useState } from "react";
import { getAllCountries } from "country-locale-map";
import { Country, TranslatedHoliday, HolidayTypeFilter } from "../types";
import { loadPinnedCountries, pinCountry, pinState, unpinCountry, unpinState } from "../services/pinManager";
import { buildMarkdown } from "../services/buildMarkdown";

export default function DateHoliday({ selectedDate }: { selectedDate: moment.Moment }) {
  const [isLoading, setIsLoading] = useState(true);
  const [holidaysFound, setHolidaysFound] = useState<
    Record<string, { country: TranslatedHoliday[]; states: Record<string, TranslatedHoliday[]> }>
  >({});
  const [pinnedCountries, setPinnedCountries] = useState<Country[]>([]);
  const [unpinnedCountries, setUnpinnedCountries] = useState<Country[]>([]);
  const [state, setState] = useState<{ filter: HolidayTypeFilter; searchText: string }>({
    filter: "" as unknown as HolidayTypeFilter,
    searchText: "",
  });

  const loadCountriesAndCheckHolidays = async () => {
    setIsLoading(true);
    const countries = getAllCountries();
    const dateToCheck = selectedDate.toDate(); // Convert moment to Date
    const allHolidays: Record<string, { country: TranslatedHoliday[]; states: Record<string, TranslatedHoliday[]> }> =
      {};
    const pinnedCountriesCodes = await loadPinnedCountries();
    const countriesWithHolidays: Country[] = [];
    const unpinnedCountriesList: Country[] = [];

    for (const country of countries) {
      const hd = new Holidays(country.alpha2);
      let hasHoliday = false;

      // Check country-level holidays
      const nativeHolidays = hd.isHoliday(dateToCheck);

      if (nativeHolidays) {
        const englishHolidays = hd.getHolidays(selectedDate.year(), "en");

        const countryHolidays = nativeHolidays.map((native) => {
          const english = englishHolidays.find((eng) => eng.date === native.date);
          return english && native.name !== english.name ? { ...native, englishName: english.name } : native;
        });

        if (countryHolidays.length > 0) {
          allHolidays[country.alpha2] = { country: countryHolidays, states: {} };
          hasHoliday = true;
        }
      }

      // Check state-level holidays
      const states = hd.getStates(country.alpha2);
      if (states) {
        for (const stateCode of Object.keys(states)) {
          const stateHd = new Holidays(country.alpha2, stateCode);
          const nativeStateHolidays = stateHd.isHoliday(dateToCheck);

          if (nativeStateHolidays) {
            const englishStateHolidays = stateHd.getHolidays(selectedDate.year(), "en");

            const stateHolidays = nativeStateHolidays.map((native) => {
              const english = englishStateHolidays.find((e) => e.date === native.date);
              return english && native.name !== english.name ? { ...native, englishName: english.name } : native;
            });

            if (stateHolidays.length > 0) {
              if (!allHolidays[country.alpha2]) {
                allHolidays[country.alpha2] = { country: [], states: {} };
              }
              allHolidays[country.alpha2].states[stateCode] = stateHolidays;
              hasHoliday = true;
            }
          }
        }
      }

      if (hasHoliday) {
        if (pinnedCountriesCodes.includes(country.alpha2)) {
          countriesWithHolidays.push(country);
        } else {
          unpinnedCountriesList.push(country);
        }
      }
    }
    setHolidaysFound(allHolidays);
    setPinnedCountries(countriesWithHolidays);
    setUnpinnedCountries(unpinnedCountriesList);
    setIsLoading(false);
  };

  const handlePinCountry = async (country: Country) => {
    await pinCountry(country.alpha2);
    await loadCountriesAndCheckHolidays();
    setState((previous) => ({ ...previous, searchText: country.name }));
  };

  const handleUnpinCountry = async (country: Country) => {
    await unpinCountry(country.alpha2);
    await loadCountriesAndCheckHolidays();
    setState((previous) => ({ ...previous, searchText: country.name }));
  };

  const handlePinState = async (countryCode: string, stateCode: string) => {
    await pinState(countryCode, stateCode);
    await loadCountriesAndCheckHolidays();
  };

  const handleUnpinState = async (countryCode: string, stateCode: string) => {
    await unpinState(countryCode, stateCode);
    await loadCountriesAndCheckHolidays();
  };

  useEffect(() => {
    loadCountriesAndCheckHolidays();
  }, [selectedDate]);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search for a holiday..."
      isShowingDetail={true}
      searchText={state.searchText}
      onSearchTextChange={(newValue) => {
        setState((previous) => ({ ...previous, searchText: newValue }));
      }}
      filtering={true}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Select Holiday Type"
          value={state.filter}
          onChange={(newValue) => setState((previous) => ({ ...previous, filter: newValue as HolidayTypeFilter }))}
        >
          <List.Dropdown.Item title="All" value={"" as unknown as HolidayTypeFilter} />
          <List.Dropdown.Item title="Public" value={HolidayTypeFilter.Public} />
          <List.Dropdown.Item title="Bank" value={HolidayTypeFilter.Bank} />
          <List.Dropdown.Item title="Optional" value={HolidayTypeFilter.Optional} />
          <List.Dropdown.Item title="School" value={HolidayTypeFilter.School} />
          <List.Dropdown.Item title="Observance" value={HolidayTypeFilter.Observance} />
        </List.Dropdown>
      }
    >
      <List.Section title="Pinned Countries and States">
        {pinnedCountries.map((country) => {
          const countryHolidays = holidaysFound[country.alpha2]?.country;
          const stateHolidays = holidaysFound[country.alpha2]?.states;
          const stateNames = new Holidays(country.alpha2).getStates(country.alpha2);

          return (
            <>
              {countryHolidays?.length > 0 && (
                <List.Item
                  key={`${country.alpha2}-country`}
                  title={`${country.name}`}
                  icon={country.emoji || ""}
                  detail={
                    <List.Item.Detail
                      markdown={buildMarkdown(countryHolidays, { startDate: true, relativeDate: false })}
                    />
                  }
                  actions={
                    <ActionPanel>
                      <Action
                        title="Unpin"
                        icon={{ source: Icon.TackDisabled }}
                        onAction={() => {
                          handleUnpinCountry(country);
                        }}
                      />
                    </ActionPanel>
                  }
                />
              )}
              {Object.entries(stateHolidays || {}).map(([stateCode, holidays]) => {
                const stateName = stateNames[stateCode];
                return holidays.length > 0 ? (
                  <List.Item
                    key={`${country.alpha2}-${stateCode}`}
                    title={`${stateName}`}
                    icon={country.emoji}
                    accessories={[{ text: `${country.alpha3}`, tooltip: `${country.name}` }]}
                    detail={
                      <List.Item.Detail markdown={buildMarkdown(holidays, { startDate: true, relativeDate: false })} />
                    }
                    actions={
                      <ActionPanel>
                        <Action
                          title="Unpin"
                          icon={{ source: Icon.TackDisabled }}
                          onAction={() => {
                            handleUnpinState(country.alpha2, stateCode);
                          }}
                        />
                      </ActionPanel>
                    }
                  />
                ) : null;
              })}
            </>
          );
        })}
      </List.Section>
      <List.Section title="Unpinned Countries and States">
        {unpinnedCountries.map((country) => {
          const countryHolidays = holidaysFound[country.alpha2]?.country;
          const stateHolidays = holidaysFound[country.alpha2]?.states;
          const stateNames = new Holidays(country.alpha2).getStates(country.alpha2);

          return (
            <>
              {countryHolidays?.length > 0 && (
                <List.Item
                  key={`${country.alpha2}-country`}
                  title={`${country.name}`}
                  icon={country.emoji || ""}
                  detail={
                    <List.Item.Detail
                      markdown={buildMarkdown(countryHolidays, { startDate: true, relativeDate: false })}
                    />
                  }
                  actions={
                    <ActionPanel>
                      <Action
                        title="Pin"
                        icon={{ source: Icon.Tack }}
                        onAction={() => {
                          handlePinCountry(country);
                        }}
                      />
                    </ActionPanel>
                  }
                />
              )}
              {Object.entries(stateHolidays || {}).map(([stateCode, holidays]) => {
                const stateName = stateNames[stateCode];
                return holidays.length > 0 ? (
                  <List.Item
                    key={`${country.alpha2}-${stateCode}`}
                    title={`${stateName}`}
                    icon={country.emoji}
                    accessories={[{ text: `${country.alpha3}`, tooltip: `${country.name}` }]}
                    detail={
                      <List.Item.Detail markdown={buildMarkdown(holidays, { startDate: true, relativeDate: false })} />
                    }
                    actions={
                      <ActionPanel>
                        <Action
                          title="Pin"
                          icon={{ source: Icon.Tack }}
                          onAction={() => {
                            handlePinState(country.alpha2, stateCode);
                          }}
                        />
                      </ActionPanel>
                    }
                  />
                ) : null;
              })}
            </>
          );
        })}
      </List.Section>
    </List>
  );
}
