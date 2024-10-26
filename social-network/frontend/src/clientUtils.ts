export function generateRandomSixDigitNumber(): number {
  const min = 100_000; // The smallest 6-digit number
  const max = 999_999; // The largest 6-digit number
  return Math.floor(Math.random() * (max - min + 1) + min);
}
