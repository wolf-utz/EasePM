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
