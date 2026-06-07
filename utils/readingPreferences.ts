const READING_FRAGMENT_SIZE_KEY = "abzac_reading_fragment_size";
const DEFAULT_READING_FRAGMENT_SIZE = 3000;

let currentReadingFragmentSize = DEFAULT_READING_FRAGMENT_SIZE;

export const READING_FRAGMENT_SIZE_OPTIONS = [
  { value: 1500, label: "Короткий", description: "Небольшая порция текста" },
  { value: 3000, label: "Средний", description: "Удобный объем для чтения" },
  { value: 5000, label: "Длинный", description: "Больше текста за один подход" },
] as const;

export function getReadingFragmentSize() {
  if (typeof localStorage === "undefined") return currentReadingFragmentSize;

  const storedValue = Number(localStorage.getItem(READING_FRAGMENT_SIZE_KEY));
  const isValid = READING_FRAGMENT_SIZE_OPTIONS.some((option) => option.value === storedValue);
  if (isValid) currentReadingFragmentSize = storedValue;

  return currentReadingFragmentSize;
}

export function setReadingFragmentSize(value: number) {
  currentReadingFragmentSize = value;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(READING_FRAGMENT_SIZE_KEY, String(value));
  }
}