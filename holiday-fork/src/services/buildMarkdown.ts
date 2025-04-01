import moment from "moment";
import { TranslatedHoliday } from "../types";

export const buildMarkdown = (
  holidays: TranslatedHoliday[],
  opts?: { startDate?: boolean; relativeDate?: boolean; reverse?: boolean },
) => {
  const showStartDate = opts?.startDate ?? false;
  const useRelativeDate = opts?.relativeDate ?? true;
  const sortedHolidays = opts?.reverse ? [...holidays].reverse() : holidays;
  return sortedHolidays
    .map(
      ({ start, name, englishName }) => `
### ${englishName ? `${englishName} (${name})` : name}

${moment(start).format("dddd, MMMM Do")} ${showStartDate ? `(Started ${moment(start).fromNow()})` : ""} ${useRelativeDate ? `(${moment(start).fromNow()})` : ""}
`,
    )
    .join("\n\n");
};
