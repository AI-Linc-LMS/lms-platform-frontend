/** Human-readable certificate reference with configurable 2-letter prefix. */
export function generateCertificateId(prefix?: string): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  const letters = String(prefix ?? "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 2);
  const idPrefix = letters.length === 2 ? letters : "ZS";
  return `${idPrefix}-${year}-${seq}`;
}
