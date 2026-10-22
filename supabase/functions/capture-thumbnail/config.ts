/** Cloudflare account identifiers are 32 hexadecimal characters, never placeholders. */
export function captureConfigured(accountId: string | undefined, token: string | undefined): boolean {
  return /^[a-f0-9]{32}$/i.test(accountId ?? "") && Boolean(token?.trim()) && !/placeholder|to_be_replaced/i.test(token ?? "");
}