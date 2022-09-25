import { format, differenceInMinutes } from "date-fns";

const StandardDateTimeFormat = "M/dd/yyyy";
const getTimePastIfLessThanDay = (compTime: Date | null): string => {
  if (!compTime) return "";

  const now = new Date();
  const transformTime =
    typeof compTime === "string" ? new Date(compTime) : compTime;
  const diffInMinutes = differenceInMinutes(now, transformTime);
  console.log("diff", diffInMinutes);
  if (diffInMinutes > 60) {
    if (diffInMinutes > 24 * 60) {
      return format(transformTime, StandardDateTimeFormat);
    }
    return Math.round(diffInMinutes / 60) + "h ago";
  }
  console.log("diff", diffInMinutes);
  return Math.round(diffInMinutes) + "m ago";
};

export { getTimePastIfLessThanDay };
