/** Human-readable certificate reference (aligned with legacy API pattern). */
export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `ZS-${year}-${seq}`;
}
