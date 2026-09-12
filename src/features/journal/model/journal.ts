export const moods = [
  { label: "Excelente", value: "excellent" },
  { label: "Bien", value: "good" },
  { label: "Neutral", value: "neutral" },
  { label: "Mal", value: "bad" },
  { label: "Muy mal", value: "terrible" },
] as const;

export const energyLevels = [1, 2, 3, 4, 5].map((value) => ({
  label: `${value} de 5`,
  value: String(value),
}));

export function formatJournalDate(localDate: string) {
  return new Intl.DateTimeFormat("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${localDate}T12:00:00Z`));
}
