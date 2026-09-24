export function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export function isValidEmail(value: unknown) {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value !== "string" || value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isValidPhone(value: unknown) {
  if (typeof value !== "string") return false;
  const phone = value.trim();
  const digits = phone.replace(/\D/g, "");
  return /^[+\d().\s-]+$/.test(phone) && digits.length >= 7 && digits.length <= 15;
}

export function finiteAmount(value: unknown, max = 100_000_000) {
  const number = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) && number >= 0 && number <= max;
}

export function validDate(value: unknown) {
  if (typeof value !== "string" && !(value instanceof Date)) return false;
  return Number.isFinite(new Date(value).getTime());
}
