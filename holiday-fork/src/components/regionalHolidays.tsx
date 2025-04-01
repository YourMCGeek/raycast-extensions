import { Action, ActionPanel, Icon, List } from "@raycast/api";
import Holidays from "date-holidays";
import moment from "moment";
import { CountryHolidaysTemplate } from "../views/countryHolidayTemplate";
import { HolidayTypeFilter, TranslatedHoliday } from "../types";
import { useEffect, useState } from "react";
import { loadPinnedStates, pinState, unpinState } from "../services/pinManager";

export const RegionalHolidays = ({
  countryCode,
  dateFilter,
}: {
  countryCode: string;
  dateFilter?: (holidayDate: moment.Moment) => boolean;
}) => {
  const country = new Holidays(countryCode);
  const states = country.getStates(countryCode);

  const [isLoading, setIsLoading] = useState(true);
  const [pinnedStates, setPinnedStates] = useState<string[]>([]);
  const [state, setState] = useState<{ filter: HolidayTypeFilter; searchText: string }>({
    filter: "" as unknown as HolidayTypeFilter,
    searchText: "",
  });
  const [holidaysByState, setHolidaysByState] = useState<Record<string, TranslatedHoliday[]>>({});

  useEffect(() => {
    const fetchStatesAndHolidays = async () => {
      setIsLoading(true);

      // Load pinned states
      const pinnedStateCodes = await loadPinnedStates(countryCode);
      setPinnedStates(pinnedStateCodes);

      // Filter holidays and set the holiday records for each state
      const languages = country.getLanguages();
      const allHolidaysByState: Record<string, TranslatedHoliday[]> = {};

      Object.keys(states).forEach((stateCode) => {
        const stateHd = new Holidays(countryCode, stateCode);
        const nativeHolidays = stateHd.getHolidays(moment().format("YYYY"), languages[0]);
        const englishHolidays = stateHd.getHolidays(moment().format("YYYY"), "en");

        // Filter and map holidays
        const filteredHolidays = nativeHolidays
          .filter((native) => (dateFilter ? dateFilter(moment(native.start)) : true))
          .map((native) => {
            const english = englishHolidays.find((eng) => eng.date === native.date);
            return english && native.name !== english.name ? { ...native, englishName: english.name } : native;
          });

        if (filteredHolidays.length > 0) {
          allHolidaysByState[stateCode] = filteredHolidays;
        }
      });
      setHolidaysByState(allHolidaysByState);
      setIsLoading(false);
    };
    fetchStatesAndHolidays();
  }, [countryCode, dateFilter]);

  const handlePinState = async (stateCode: string) => {
    await pinState(countryCode, stateCode);
    setPinnedStates((prev) => [...prev, stateCode]);
    setState((previous) => ({ ...previous, searchText: states[stateCode] })); // Update the search text to the pinned state name
  };

  const handleUnpinState = async (stateCode: string) => {
    await unpinState(countryCode, stateCode);
    setPinnedStates((prev) => prev.filter((code) => code !== stateCode));
    setState((previous) => ({ ...previous, searchText: "" }));
  };

  const unpinnedStates = Object.keys(states).filter((stateCode) => !pinnedStates.includes(stateCode));

  if (Object.keys(holidaysByState).length === 0) {
    return (
      <List>
        <List.Item title="No upcoming holidays known" />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      isShowingDetail={true}
      searchBarPlaceholder="Search for a state..."
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
      <List.Section title="Pinned States">
        {pinnedStates.map((stateCode) => {
          const stateHolidays = holidaysByState[stateCode];
          if (stateHolidays) {
            return (
              <List.Item
                key={stateCode}
                title={states[stateCode]} // State name as the title
                detail={
                  <CountryHolidaysTemplate
                    filter={state.filter}
                    countryCode={countryCode}
                    stateCode={stateCode}
                    dateFilter={dateFilter}
                  />
                }
                accessories={[{ text: `${stateCode}` }]}
                actions={
                  <ActionPanel>
                    <Action
                      title="Unpin State"
                      icon={{ source: Icon.TackDisabled }}
                      onAction={async () => {
                        await handleUnpinState(stateCode); // Unpin the state
                      }}
                    />
                  </ActionPanel>
                }
              />
            );
          }
          return null;
        })}
      </List.Section>
      <List.Section title="Unpinned States">
        {unpinnedStates.map((stateCode) => {
          return (
            <List.Item
              key={stateCode}
              title={states[stateCode]} // State name as the title
              detail={
                <CountryHolidaysTemplate
                  filter={state.filter}
                  countryCode={countryCode}
                  stateCode={stateCode}
                  dateFilter={dateFilter}
                />
              }
              accessories={[{ text: `${stateCode}` }]}
              actions={
                <ActionPanel>
                  <Action
                    title="Pin State"
                    icon={{ source: Icon.Tack }}
                    onAction={async () => {
                      await handlePinState(stateCode); // Pin the state
                    }}
                  />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
};
