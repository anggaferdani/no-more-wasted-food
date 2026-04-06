export function generateProductCode(): string {
  const digits = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join("")
  return digits
}