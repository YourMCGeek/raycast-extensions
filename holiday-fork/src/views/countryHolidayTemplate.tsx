import moment from "moment";
import { HolidayTypeFilter } from "../types";
import { List } from "@raycast/api";
import Holidays, { HolidaysTypes } from "date-holidays";
import { buildMarkdown } from "../services/buildMarkdown";

interface CountryHolidaysTemplateProps {
  countryCode: string;
  stateCode?: string;
  filter?: HolidayTypeFilter;
  dateFilter?: (holidayDate: moment.Moment) => boolean;
  opts?: { reverse?: boolean };
}

export const CountryHolidaysTemplate = ({
  countryCode,
  stateCode,
  filter,
  dateFilter,
  opts,
}: CountryHolidaysTemplateProps) => {
  try {
    const languages = new Holidays(countryCode).getLanguages();

    // Create a Holidays instance for the country and state (if provided)
    const holidayFetcher = stateCode
      ? new Holidays(countryCode, stateCode, {
          types: filter ? [filter as HolidaysTypes.HolidayType] : [],
        })
      : new Holidays(countryCode, {
          types: filter ? [filter as HolidaysTypes.HolidayType] : [],
        });

    const nativeHoliday = holidayFetcher.getHolidays(moment().format("YYYY"), languages[0]);
    const englishHoliday = holidayFetcher.getHolidays(moment().format("YYYY"), "en");

    if (!nativeHoliday || nativeHoliday.length === 0) {
      return <List.Item.Detail markdown={"No upcoming holidays known"} />;
    } else {
      const effectiveDateFilter = dateFilter || (() => true);

      const filteredHolidays = nativeHoliday.filter((native) => {
        const holidayDate = moment(native.start);
        return effectiveDateFilter(holidayDate);
      });

      const translatedHolidays = filteredHolidays.map((native) => {
        const english = englishHoliday.find((eng) => eng.date === native.date);
        if (english && native.name !== english.name) {
          return { ...native, englishName: english.name };
        }
        return native;
      });

      const reverse = opts?.reverse ?? false;

      if (translatedHolidays.length === 0) {
        return <List.Item.Detail markdown={"No holidays known matching criteria."} />;
      }
      return <List.Item.Detail markdown={buildMarkdown(translatedHolidays, { reverse: reverse })} />;
    }
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return <List.Item.Detail markdown={"An error occurred while fetching holidays."} />;
  }
};
