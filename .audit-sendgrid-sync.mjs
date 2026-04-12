import dotenv from 'dotenv'
import path from 'node:path'
import { sendgridTemplateRegistry } from './src/pages/Retention/sendgridTemplateRegistry.js'

dotenv.config({ path: path.join(process.cwd(), '.env.sendgrid.local'), override: false })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false })

const apiKey = process.env.SENDGRID_API_KEY || ''
const baseUrl = process.env.SENDGRID_BASE_URL || 'https://api.sendgrid.com'
const onBehalfOf = process.env.SENDGRID_ON_BEHALF_OF || ''

if (!apiKey) {
  console.error('SENDGRID_API_KEY missing')
  process.exit(1)
}

const mappings = []
for (const [localTemplateId, locales] of Object.entries(sendgridTemplateRegistry || {})) {
  for (const [locale, variants] of Object.entries(locales || {})) {
    for (const [variant, cfg] of Object.entries(variants || {})) {
      if (!cfg?.templateId) continue
      mappings.push({
        localTemplateId,
        locale,
        variant,
        templateId: cfg.templateId,
        expectedVersionId: cfg.versionId || null,
      })
    }
  }
}

const uniqueTemplateIds = [...new Set(mappings.map((m) => m.templateId))]
const headers = { Authorization: `Bearer ${apiKey}` }
if (onBehalfOf) headers['on-behalf-of'] = onBehalfOf

const templateCache = new Map()
for (const templateId of uniqueTemplateIds) {
  const response = await fetch(`${baseUrl}/v3/templates/${templateId}`, { headers })
  const text = await response.text()

  if (!response.ok) {
    templateCache.set(templateId, {
      ok: false,
      error: `${response.status} ${text}`,
    })
    continue
  }

  const payload = text ? JSON.parse(text) : {}
  const versions = Array.isArray(payload?.versions) ? payload.versions : []
  const activeVersions = versions.filter((version) => Number(version?.active) === 1)

  templateCache.set(templateId, {
    ok: true,
    activeVersions,
  })
}

const failures = []
for (const mapping of mappings) {
  const remote = templateCache.get(mapping.templateId)

  if (!remote?.ok) {
    failures.push({ ...mapping, reason: `template fetch failed: ${remote?.error || 'unknown error'}` })
    continue
  }

  if (!remote.activeVersions?.length) {
    failures.push({ ...mapping, reason: 'no active version on template' })
    continue
  }

  if (mapping.expectedVersionId) {
    const found = remote.activeVersions.some((version) => version.id === mapping.expectedVersionId)
    if (!found) {
      failures.push({
        ...mapping,
        reason: `active version mismatch (expected ${mapping.expectedVersionId})`,
      })
    }
  }
}

console.log(`Audit checked mappings: ${mappings.length}`)
console.log(`Unique template IDs: ${uniqueTemplateIds.length}`)
console.log(`Failures: ${failures.length}`)

if (failures.length) {
  console.log(JSON.stringify(failures.slice(0, 20), null, 2))
  process.exit(2)
}
