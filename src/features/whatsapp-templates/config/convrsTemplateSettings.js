// Catalogo Convrs - template attivi in questa fase.
// Keep these names aligned with Convrs naming to map callbacks reliably.
export const convrsTemplateCatalog = [
  'dormant_account',
]

// Internal template id -> Convrs template name.
export const templateIdToConvrsTemplate = {
  'tpl-reengagement-soft': 'dormant_account',
}

export function normalizeConvrsTemplateName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
}
