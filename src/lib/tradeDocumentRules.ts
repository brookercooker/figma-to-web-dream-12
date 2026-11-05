export const TRADE_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const TRADE_DOCUMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png";
export const TRADE_DOCUMENT_ERROR = "Files must be PDF, JPG or PNG, up to 10 MB.";
export function tradeDocumentProblem(file: { size: number; type: string }): string | null {
  return file.size > TRADE_DOCUMENT_MAX_BYTES || !["application/pdf", "image/jpeg", "image/png"].includes(file.type)
    ? TRADE_DOCUMENT_ERROR : null;
}