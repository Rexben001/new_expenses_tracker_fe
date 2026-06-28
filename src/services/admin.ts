export const ADMIN_EMAILS = [
  "rexben.rb@gmail.com",
  "hello@benjaminajewole.com",
  "dollyrexben@gmail.com",
  "tmgbolade.96@gmail.com",
];

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

export function isAdminEmail(email?: string | null) {
  return ADMIN_EMAILS.includes(normalizeEmail(email));
}
