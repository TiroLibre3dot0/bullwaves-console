import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { segmentJourneyTemplatesById } from '../src/pages/Retention/segmentJourneyTemplates.js'
import { segmentJourneyTemplateExtrasById } from '../src/pages/Retention/segmentJourneyTemplateExtras.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..')

const args = new Set(process.argv.slice(2))
const isApply = args.has('--apply')
const isDryRun = !isApply || args.has('--dry-run')

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

function stableTemplateName({ localTemplateId, locale, variant }) {
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
        const sendgridTemplateName = stableTemplateName({ localTemplateId, locale, variant })
        const plainTextHint = [payload.name, payload.description, extra.timing, extra.delay]
          .filter(Boolean)
          .join(' | ')

        records.push({
          localTemplateId,
          sendgridTemplateName,
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

  return records.sort((left, right) => left.sendgridTemplateName.localeCompare(right.sendgridTemplateName))
}

async function sendgridRequest(method, resourcePath, body) {
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is required for API operations.')
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
    pageToken = payload?._metadata?.next || null
  } while (pageToken)

  return result
}

async function ensureTemplate(record, existingByName) {
  let template = existingByName.get(record.sendgridTemplateName) || null

  if (!template) {
    template = await sendgridRequest('POST', '/v3/templates', {
      name: record.sendgridTemplateName,
      generation: 'dynamic',
    })
    existingByName.set(record.sendgridTemplateName, template)
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

  return `export const SENDGRID_DYNAMIC_TEMPLATE_DEFAULTS = ${JSON.stringify(
    {
      cta_url: 'https://portal.bullwaves.com/custom/webtrader',
      support_url:
        'https://wa.me/35799514794?text=Hi%20Bullwaves%2C%20I%20would%20like%20help%20with%20the%20next%20step%20on%20my%20account.',
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
  return Object.fromEntries(
    Object.entries({
      ...SENDGRID_DYNAMIC_TEMPLATE_DEFAULTS,
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
  const catalog = buildCatalog()
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
  console.log(`Sync complete. Output written to ${outputFile}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
