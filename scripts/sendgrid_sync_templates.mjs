import dotenv from 'dotenv'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { segmentJourneyTemplatesById } from '../src/pages/Retention/segmentJourneyTemplates.js'
import { segmentJourneyTemplateExtrasById } from '../src/pages/Retention/segmentJourneyTemplateExtras.js'
import { ALL_TEMPLATES_CATALOG } from '../src/features/sales/data/allTemplatesCatalog.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(workspaceRoot, '.env.sendgrid.local'), override: false })
dotenv.config({ path: path.join(workspaceRoot, '.env.local'), override: false })

const cliArgs = process.argv.slice(2)
const args = new Set(cliArgs)
const isApply = args.has('--apply')
const isDryRun = !isApply || args.has('--dry-run')

function readArgValue(flagName) {
  const index = cliArgs.indexOf(flagName)
  if (index === -1) return ''
  return String(cliArgs[index + 1] || '').trim()
}

const onlyLocalTemplateId = readArgValue('--only-local-template')

const baseUrl = process.env.SENDGRID_BASE_URL || 'https://api.sendgrid.com'
const apiKey = process.env.SENDGRID_API_KEY || ''
const onBehalfOf = process.env.SENDGRID_ON_BEHALF_OF || ''
const outputFile = path.join(workspaceRoot, 'artifacts', 'sendgrid', 'transactional-template-sync.json')
const runtimeRegistryFile = path.join(
  workspaceRoot,
  'src',
  'pages',
  'Retention',
  'sendgridTemplateRegistry.js'
)

function legacyTemplateName({ localTemplateId, locale, variant }) {
  return `BW ${localTemplateId} ${locale.toUpperCase()} ${variant.toUpperCase()}`.slice(0, 100)
}

function buildCatalog() {
  const records = []

  for (const [localTemplateId, template] of Object.entries(segmentJourneyTemplatesById)) {
    if (String(template?.channel || '').toLowerCase() !== 'email') continue

    for (const [locale, localeRoot] of Object.entries(template.locales || {})) {
      const variants = localeRoot?.variants || {}
      const extrasVariants = segmentJourneyTemplateExtrasById?.[localTemplateId]?.locales?.[locale]?.variants || {}

      for (const [variant, payload] of Object.entries(variants)) {
        if (!payload?.html || !payload?.subject) continue

        const extra = extrasVariants?.[variant] || {}
        const sendgridTemplateName = payload.name.slice(0, 100)
        const legacyName = legacyTemplateName({ localTemplateId, locale, variant })
        const plainTextHint = [payload.name, payload.description, extra.timing, extra.delay]
          .filter(Boolean)
          .join(' | ')

        records.push({
          localTemplateId,
          sendgridTemplateName,
          legacyTemplateName: legacyName,
          channel: 'email',
          locale,
          variant,
          name: payload.name,
          description: payload.description,
          subject: payload.sendgridSubject || payload.subject,
          htmlContent: payload.sendgridHtml || payload.html,
          generatePlainContent: true,
          plainContent: plainTextHint,
          editor: 'code',
          timing: extra.timing || null,
          delay: extra.delay || null,
          smsText: extra.smsText || null,
          testData: JSON.stringify({
            ...(payload.sendgridTestData || {}),
            locale,
            variant,
            template_key: localTemplateId,
          }),
        })
      }
    }
  }

  // Also include ALL_TEMPLATES_CATALOG (sales / one-off email templates)
  for (const tpl of ALL_TEMPLATES_CATALOG) {
    if (String(tpl?.channel || '').toLowerCase() !== 'email') continue
    if (!tpl?.html || !tpl?.subject) continue

    const locale = String(tpl.language || 'en').split('-')[0].toLowerCase()
    const sendgridTemplateName = tpl.name.slice(0, 100)
    // Replace {{unsubscribe}} placeholder with SendGrid ASM tag
    const htmlContent = tpl.html.replace(/\{\{unsubscribe\}\}/g, '<%asm_group_unsubscribe_raw_url%>')

    records.push({
      localTemplateId: tpl.id,
      sendgridTemplateName,
      legacyTemplateName: null,
      channel: 'email',
      locale,
      variant: 'a',
      name: tpl.name,
      description: tpl.description || '',
      subject: tpl.subject,
      htmlContent,
      generatePlainContent: true,
      plainContent: tpl.description || tpl.name,
      editor: 'code',
      timing: null,
      delay: null,
      smsText: null,
      testData: JSON.stringify({ locale, variant: 'a', template_key: tpl.id }),
    })
  }

  const sorted = records.sort((left, right) => left.sendgridTemplateName.localeCompare(right.sendgridTemplateName))

  if (!onlyLocalTemplateId) return sorted
  return sorted.filter((item) => item.localTemplateId === onlyLocalTemplateId)
}

async function sendgridRequest(method, resourcePath, body) {
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is required for API operations.')
  }

  if (!onBehalfOf) {
    throw new Error('SENDGRID_ON_BEHALF_OF is required to target the correct SendGrid subuser.')
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  if (onBehalfOf) {
    headers['on-behalf-of'] = onBehalfOf
  }

  const response = await fetch(`${baseUrl}${resourcePath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  const json = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(`${method} ${resourcePath} failed (${response.status}): ${text}`)
  }

  return json
}

function extractSendgridPageToken(nextValue) {
  if (!nextValue) return null

  const raw = String(nextValue).trim()
  if (!raw) return null

  try {
    const parsed = raw.startsWith('http') ? new URL(raw) : new URL(raw, baseUrl)
    return parsed.searchParams.get('page_token') || raw
  } catch {
    return raw
  }
}

async function getAllDynamicTemplates() {
  const result = []
  let pageToken = null

  do {
    const params = new URLSearchParams({
      generations: 'dynamic',
      page_size: '200',
    })

    if (pageToken) {
      params.set('page_token', pageToken)
    }

    const payload = await sendgridRequest('GET', `/v3/templates?${params.toString()}`)
    const page = Array.isArray(payload?.result) ? payload.result : []
    result.push(...page)
    pageToken = extractSendgridPageToken(payload?._metadata?.next)
  } while (pageToken)

  return result
}

async function ensureTemplate(record, existingByName) {
  let template = existingByName.get(record.sendgridTemplateName) || null

  if (!template) {
    // Migration: try legacy stable name and rename in-place
    const legacyTemplate = record.legacyTemplateName
      ? existingByName.get(record.legacyTemplateName) || null
      : null
    if (legacyTemplate) {
      await sendgridRequest('PATCH', `/v3/templates/${legacyTemplate.id}`, {
        name: record.sendgridTemplateName,
      })
      template = { ...legacyTemplate, name: record.sendgridTemplateName }
      existingByName.delete(record.legacyTemplateName)
      existingByName.set(record.sendgridTemplateName, template)
    } else {
      template = await sendgridRequest('POST', '/v3/templates', {
        name: record.sendgridTemplateName,
        generation: 'dynamic',
      })
      existingByName.set(record.sendgridTemplateName, template)
    }
  }

  const fullTemplate = await sendgridRequest('GET', `/v3/templates/${template.id}`)
  const versions = Array.isArray(fullTemplate?.versions) ? fullTemplate.versions : []
  const activeVersion = versions.find((item) => Number(item?.active) === 1) || versions[0] || null
  const payload = {
    active: 1,
    name: `${record.locale.toUpperCase()} ${record.variant.toUpperCase()} - ${record.name}`.slice(0, 100),
    subject: record.subject,
    html_content: record.htmlContent,
    plain_content: record.plainContent,
    generate_plain_content: record.generatePlainContent,
    test_data: record.testData,
  }

  if (!activeVersion) {
    const createdVersion = await sendgridRequest('POST', `/v3/templates/${template.id}/versions`, {
      ...payload,
      editor: record.editor,
    })
    return {
      templateId: template.id,
      versionId: createdVersion?.id || null,
      action: 'created-template-and-version',
    }
  }

  const updatedVersion = await sendgridRequest(
    'PATCH',
    `/v3/templates/${template.id}/versions/${activeVersion.id}`,
    payload
  )

  return {
    templateId: template.id,
    versionId: updatedVersion?.id || activeVersion.id,
    action: 'updated-version',
  }
}

async function writeOutput(data) {
  await fs.mkdir(path.dirname(outputFile), { recursive: true })
  await fs.writeFile(outputFile, JSON.stringify(data, null, 2), 'utf8')
}

function buildRuntimeRegistryContent(summary) {
  const registry = {}

  for (const item of summary.templates || []) {
    if (!item?.sendgrid?.templateId) continue
    if (!registry[item.localTemplateId]) registry[item.localTemplateId] = {}
    if (!registry[item.localTemplateId][item.locale]) registry[item.localTemplateId][item.locale] = {}

    registry[item.localTemplateId][item.locale][item.variant] = {
      templateId: item.sendgrid.templateId,
      versionId: item.sendgrid.versionId,
      name: item.name,
      subject: item.subject,
      timing: item.timing,
      delay: item.delay,
    }
  }

  return `const WHATSAPP_NUMBER = '35799514794'

const WHATSAPP_TEXT = {
  en: 'Hi Bullwaves, I would like help with the next step on my account.',
  it: 'Ciao Bullwaves, vorrei supporto per il prossimo passo sul mio account.',
}

function getLocalizedSupportUrl(locale = 'en') {
  const normalizedLocale = locale === 'it' ? 'it' : 'en'
  return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(WHATSAPP_TEXT[normalizedLocale])
}

export const SENDGRID_DYNAMIC_TEMPLATE_DEFAULTS = ${JSON.stringify(
    {
      cta_url: 'https://portal.bullwaves.com/login',
      account_manager_name: 'The Bullwaves Team',
    },
    null,
    2
  )}

export const sendgridTemplateRegistryGeneratedAt = ${JSON.stringify(summary.generatedAt)}

export const sendgridTemplateRegistry = ${JSON.stringify(registry, null, 2)}

export function getSendgridTemplateMapping(localTemplateId, locale = 'en', variant = 'a') {
  return sendgridTemplateRegistry?.[localTemplateId]?.[locale]?.[variant] || null
}

export function buildSendgridDynamicTemplateData(overrides = {}) {
  const locale = overrides?.locale === 'it' ? 'it' : 'en'
  return Object.fromEntries(
    Object.entries({
      ...SENDGRID_DYNAMIC_TEMPLATE_DEFAULTS,
      support_url: overrides?.support_url ?? getLocalizedSupportUrl(locale),
      ...overrides,
    }).filter(([, value]) => value !== undefined)
  )
}
`
}

async function writeRuntimeRegistry(summary) {
  await fs.mkdir(path.dirname(runtimeRegistryFile), { recursive: true })
  await fs.writeFile(runtimeRegistryFile, buildRuntimeRegistryContent(summary), 'utf8')
}

async function main() {
  if (!onBehalfOf) {
    throw new Error('SENDGRID_ON_BEHALF_OF missing. Refusing sync without explicit subuser target.')
  }

  const catalog = buildCatalog()
  if (onlyLocalTemplateId && !catalog.length) {
    throw new Error(`No template found for --only-local-template=${onlyLocalTemplateId}`)
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    mode: isApply ? 'apply' : 'dry-run',
    sendgridBaseUrl: baseUrl,
    onBehalfOf: onBehalfOf || null,
    totals: {
      templates: catalog.length,
      uniqueLocalTemplateIds: new Set(catalog.map((item) => item.localTemplateId)).size,
      locales: new Set(catalog.map((item) => item.locale)).size,
      variants: new Set(catalog.map((item) => item.variant)).size,
    },
    mappingStrategy: {
      rationale:
        'Each SendGrid template maps to one local template id + locale + variant, because SendGrid allows only one active version per template and cannot run A/B variants as simultaneously active versions of a single template.',
      templateCountImpact: '15 local email template ids x 2 locales x 2 variants = 60 SendGrid dynamic templates.',
    },
    templates: catalog,
  }

  if (isDryRun && !isApply) {
    await writeOutput(summary)
    console.log(`Dry run complete. Prepared ${catalog.length} SendGrid template records.`)
    console.log(`Target subuser: ${onBehalfOf}`)
    if (onlyLocalTemplateId) {
      console.log(`Filtered local template id: ${onlyLocalTemplateId}`)
    }
    console.log(`Output written to ${outputFile}`)
    return
  }

  const existingTemplates = await getAllDynamicTemplates()
  const existingByName = new Map(existingTemplates.map((item) => [item.name, item]))

  for (const record of catalog) {
    const remote = await ensureTemplate(record, existingByName)
    record.sendgrid = remote
    console.log(`${remote.action}: ${record.sendgridTemplateName} -> ${remote.templateId}`)
  }

  await writeOutput(summary)
  await writeRuntimeRegistry(summary)
  console.log(`Target subuser: ${onBehalfOf}`)
  if (onlyLocalTemplateId) {
    console.log(`Filtered local template id: ${onlyLocalTemplateId}`)
  }
  console.log(`Sync complete. Output written to ${outputFile}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
