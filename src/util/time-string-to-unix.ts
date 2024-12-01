export function convertTimeInputToUnixTimestamp(timeInput: string): number {
  const timeParts = timeInput.match(
    /(?:(\d+)\s*w)?\s*(?:(\d+)\s*d)?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/i
  );

  if (!timeParts) {
    throw new Error("Invalid time input format");
  }

  const weeks = parseInt(timeParts[1], 10) || 0;
  const days = parseInt(timeParts[2], 10) || 0;
  const hours = parseInt(timeParts[3], 10) || 0;
  const minutes = parseInt(timeParts[4], 10) || 0;

  if (isNaN(weeks) || isNaN(days) || isNaN(hours) || isNaN(minutes)) {
    throw new Error("Invalid time input format");
  }

  const totalSeconds =
    weeks * 7 * 24 * 60 * 60 +
    days * 24 * 60 * 60 +
    hours * 60 * 60 +
    minutes * 60;

  return totalSeconds;
}

export function convertUnixTimestampToTimeInput(unixTimestamp: number): string {
  const milliseconds = unixTimestamp * 1000;

  if (milliseconds < 0) {
    throw new Error("The provided Unix timestamp is in the past");
  }

  const totalMinutes = Math.floor(milliseconds / (1000 * 60));
  const weeks = Math.floor(totalMinutes / (60 * 24 * 7));
  const days = Math.floor((totalMinutes % (60 * 24 * 7)) / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  let timeInput = "";
  if (weeks > 0) {
    timeInput += `${weeks}w `;
  }
  if (days > 0) {
    timeInput += `${days}d `;
  }
  if (hours > 0) {
    timeInput += `${hours}h `;
  }
  if (minutes > 0) {
    timeInput += `${minutes}m`;
  }

  return timeInput.trim();
}
