export const CUSTOM_ATTR_PREFIX = "custom-"

export function toStorageAttrName(name: string) {
  const trimmed = String(name || "").trim()
  if (!trimmed) {
    return ""
  }
  return trimmed.startsWith(CUSTOM_ATTR_PREFIX) ? trimmed : `${CUSTOM_ATTR_PREFIX}${trimmed}`
}
