/** Collapse all runs of whitespace (including newlines) into single spaces. */
export function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Collapse then hard-truncate a single-line value, appending an ellipsis. */
export function truncateLine(text: string, max: number): string {
  const line = collapseWhitespace(text);
  if (line.length <= max) {
    return line;
  }
  return `${line.slice(0, max).trimEnd()} …`;
}

/** Format a Date (or now) as YYYY-MM-DD. */
export function isoDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
