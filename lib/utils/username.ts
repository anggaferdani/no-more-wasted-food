export function generateUsername(): string {
  return `user${Math.floor(Math.random() * 900000000) + 100000000}`
}