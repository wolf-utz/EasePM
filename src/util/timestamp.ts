import moment from "moment";

export function convertUnixToGermanDate(unixTimestamp: number): string {
  const date = new Date(unixTimestamp * 1000);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();

  return `${day}.${month}.${year}`;
}

export function unixTimestampToDateString(
  timestamp: number,
  format: string
): string {
  return moment.unix(timestamp).utc().format(format);
}

export function dateStringToUnixTimestamp(
  dateString: string,
  format: string
): number {
  const parsedDate = moment(dateString, format, true);

  if (!parsedDate.isValid()) {
    throw new Error("Invalid date format");
  }

  return parsedDate.utc().unix();
}
