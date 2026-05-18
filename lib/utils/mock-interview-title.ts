export function cleanInterviewTitle(title: string | null | undefined): string {
  if (!title) return "";
  const match = title.match(/^(.+?)\s*[-–—]\s*(.+?)\s+Interview\s*$/i);
  if (!match) return title;
  const left = match[1].trim();
  const right = match[2].trim();
  if (left.toLowerCase() === right.toLowerCase()) {
    return `${left} Interview`;
  }
  return title;
}
