export type Contribution = { date: string; level: number; count: number };

export function parseContributions(html: string): Contribution[] {
  // ponytail: GitHub HTML is public but can change; use authenticated GraphQL if this markup stops matching.
  return [...html.matchAll(/<td\b[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="([0-4])"[^>]*>[\s\S]*?<\/tool-tip>/g)]
    .map(([cell, date, level]) => ({
      date,
      level: Number(level),
      count: Number(cell.match(/>(\d+) contributions? on /)?.[1] ?? 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
