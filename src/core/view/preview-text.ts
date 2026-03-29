export function truncatePreviewText(value: string, maxLength = 10) {
  const text = String(value || "")
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}
