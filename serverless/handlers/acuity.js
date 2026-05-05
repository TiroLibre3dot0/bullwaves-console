const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const { json, safeParseJsonBody } = require('./_http')
const { fetchLiveData } = require('./acuityFetch')

dotenv.config({
  path: path.join(__dirname, '..', '..', '.env.sendgrid.local'),
  override: false,
})

const SENDGRID_BASE = 'https://api.sendgrid.com/v3'

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'acuity')
const SENDGRID_WORDMARK_URL = 'https://bullwaves-console.vercel.app/Logo.png'
const SENDGRID_ICON_URL = 'https://cdn.mcauto-images-production.sendgrid.net/c49e37cd579f1c08/60bf128f-a2f3-4d7d-a307-a75921400431/1185x1185.png'

const ACUITY_TEMPLATES = [
  {
    id: 'market-pulse',
    name: 'Bullwaves - Market Pulse',
    subject: '📈 Market Pulse – {{date}}',
    file: 'market-pulse.html',
  },
  {
    id: 'trade-alert',
    name: 'Bullwaves - Trade Alert',
    subject: '🚨 Trade Alert: {{alert_direction}} {{alert_asset}} ({{alert_probability}}%)',
    file: 'trade-alert.html',
  },
  {
    id: 'weekly-opportunity',
    name: 'Bullwaves - Weekly Opportunity',
    subject: '🔭 Top Opportunities This Week – {{week_label}}',
    file: 'weekly-opportunity.html',
  },
]

const TEMPLATE_KEYWORDS = {
  'market-pulse': 'market pulse',
  'trade-alert': 'trade alert',
  'weekly-opportunity': 'weekly opportunity',
}

function normalizeTemplateName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/â€“/g, '-')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function findExistingTemplate(existingTemplates, tpl) {
  const targetName = normalizeTemplateName(tpl.name)
  const byExactName = existingTemplates.find((item) => normalizeTemplateName(item?.name) === targetName)
  if (byExactName) return byExactName

  const keyword = TEMPLATE_KEYWORDS[tpl.id]
  if (!keyword) return null
  return existingTemplates.find((item) => normalizeTemplateName(item?.name).includes(keyword)) || null
}

function getApiKey() {
  return String(process.env.SENDGRID_API_KEY || '').trim()
}

function getOnBehalfOf() {
  return String(process.env.SENDGRID_ON_BEHALF_OF || '').trim()
}

function applyVariables(input, variables) {
  let output = String(input || '')
  for (const [token, value] of Object.entries(variables || {})) {
    output = output.split(token).join(value)
  }
  return output
}

function absolutizeTemplateAssets(html) {
  return String(html || '')
    .replace(/src="\/Logo\.png"/g, `src="${SENDGRID_WORDMARK_URL}"`)
    .replace(/src="\/Group%202087330261\.svg"/g, `src="${SENDGRID_ICON_URL}"`)
}

function renderTemplateForSendgrid(html, variables) {
  const withVars = applyVariables(html, variables)
  const withAbsoluteAssets = absolutizeTemplateAssets(withVars)
  return withAbsoluteAssets.replace(/\{\{[^}]+\}\}/g, '—')
}

async function sgFetch(endpoint, options = {}) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('SENDGRID_API_KEY not configured')

  const onBehalfOf = getOnBehalfOf()
  if (!onBehalfOf) throw new Error('SENDGRID_ON_BEHALF_OF not configured')

  const res = await fetch(`${SENDGRID_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'on-behalf-of': onBehalfOf,
      ...(options.headers || {}),
    },
  })

  const text = await res.text()
  let data = null
  try { data = JSON.parse(text) } catch { data = { raw: text } }

  return { ok: res.ok, status: res.status, data }
}

// GET /v3/templates?generations=dynamic → list all dynamic templates
async function listSendgridTemplates() {
  const { ok, data } = await sgFetch('/templates?generations=dynamic&page_size=200')
  if (!ok) throw new Error(`SendGrid list failed: ${JSON.stringify(data)}`)
  if (Array.isArray(data?.result)) return data.result
  if (Array.isArray(data?.templates)) return data.templates
  return []
}

// POST /v3/templates → create template shell
async function createTemplate(name) {
  const { ok, data } = await sgFetch('/templates', {
    method: 'POST',
    body: JSON.stringify({ name, generation: 'dynamic' }),
  })
  if (!ok) throw new Error(`SendGrid create template failed: ${JSON.stringify(data)}`)
  return data // { id, name }
}

// POST /v3/templates/:id/versions → create/update active version
async function upsertTemplateVersion(templateId, subject, htmlContent, testData = {}) {
  const detail = await sgFetch(`/templates/${templateId}`)
  if (!detail.ok) throw new Error(`SendGrid template detail failed: ${JSON.stringify(detail.data)}`)

  const versions = Array.isArray(detail?.data?.versions) ? detail.data.versions : []
  const activeVersion = versions.find((item) => Number(item?.active) === 1) || versions[0] || null

  const payload = {
    active: 1,
    name: activeVersion?.name || `v${new Date().toISOString().slice(0, 10)}`,
    subject,
    html_content: htmlContent,
    plain_content: ' ',
    generate_plain_content: true,
    test_data: JSON.stringify(testData),
  }

  let keptVersionId

  if (!activeVersion?.id) {
    const created = await sgFetch(`/templates/${templateId}/versions`, {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        editor: 'code',
      }),
    })
    if (!created.ok) throw new Error(`SendGrid create version failed: ${JSON.stringify(created.data)}`)
    keptVersionId = created.data.id
    // Delete all other versions (shouldn't normally exist, but clean up just in case)
    for (const v of versions) {
      if (v.id !== keptVersionId) {
        await sgFetch(`/templates/${templateId}/versions/${v.id}`, { method: 'DELETE' })
      }
    }
    return created.data
  }

  const updated = await sgFetch(`/templates/${templateId}/versions/${activeVersion.id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (!updated.ok) throw new Error(`SendGrid update version failed: ${JSON.stringify(updated.data)}`)
  keptVersionId = updated.data.id

  // Delete every version except the one we just updated
  const stale = versions.filter(v => v.id !== keptVersionId)
  for (const v of stale) {
    console.log(`[acuity sync] deleting stale version ${v.id} (${v.name}) from template ${templateId}`)
    const del = await sgFetch(`/templates/${templateId}/versions/${v.id}`, { method: 'DELETE' })
    if (!del.ok) console.warn(`[acuity sync] failed to delete version ${v.id}:`, del.data)
  }

  return updated.data
}

async function handleSync(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  const apiKey = getApiKey()
  const onBehalfOf = getOnBehalfOf()
  if (!apiKey) {
    return json(res, 503, { ok: false, error: 'SENDGRID_API_KEY not configured on server' })
  }
  if (!onBehalfOf) {
    return json(res, 503, { ok: false, error: 'SENDGRID_ON_BEHALF_OF not configured on server' })
  }

  try {
    const existing = await listSendgridTemplates()
    const CONSTANTS = {
      '{{unsubscribe}}': '<%asm_group_unsubscribe_raw_url%>',
    }

    const results = []

    for (const tpl of ACUITY_TEMPLATES) {
      const htmlPath = path.join(TEMPLATES_DIR, tpl.file)
      if (!fs.existsSync(htmlPath)) {
        results.push({ id: tpl.id, ok: false, error: `Template file not found: ${tpl.file}` })
        continue
      }

      try {
        const htmlRaw = fs.readFileSync(htmlPath, 'utf8')
        const liveVars = await fetchLiveData(tpl.id)
        const variables = { ...CONSTANTS, ...(liveVars || {}) }
        const htmlContent = renderTemplateForSendgrid(htmlRaw, variables)
        const subject = applyVariables(tpl.subject, variables).replace(/\{\{[^}]+\}\}/g, '—')
        let sgTemplate = findExistingTemplate(existing, tpl)

        // Create shell if it doesn't exist yet
        if (!sgTemplate) {
          sgTemplate = await createTemplate(tpl.name)
          existing.push(sgTemplate)
        }

        const version = await upsertTemplateVersion(sgTemplate.id, subject, htmlContent, liveVars || {})

        results.push({
          id: tpl.id,
          ok: true,
          sendgridTemplateId: sgTemplate.id,
          versionId: version.id,
          name: tpl.name,
        })
      } catch (err) {
        results.push({
          id: tpl.id,
          ok: false,
          error: err.message,
          name: tpl.name,
        })
      }
    }

    return json(res, 200, { ok: true, onBehalfOf, results })
  } catch (err) {
    return json(res, 500, { ok: false, error: err.message })
  }
}

async function handleList(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  const apiKey = getApiKey()
  const onBehalfOf = getOnBehalfOf()
  if (!apiKey) {
    return json(res, 503, { ok: false, error: 'SENDGRID_API_KEY not configured on server' })
  }
  if (!onBehalfOf) {
    return json(res, 503, { ok: false, error: 'SENDGRID_ON_BEHALF_OF not configured on server' })
  }

  try {
    const existing = await listSendgridTemplates()
    const bullwaves = existing.filter((t) => normalizeTemplateName(t?.name).startsWith('bullwaves'))
    return json(res, 200, { ok: true, onBehalfOf, templates: bullwaves })
  } catch (err) {
    return json(res, 500, { ok: false, error: err.message })
  }
}

function handlePreview(req, res, templateId) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  const tpl = ACUITY_TEMPLATES.find(t => t.id === templateId)
  if (!tpl) {
    return json(res, 404, { ok: false, error: `Template '${templateId}' not found` })
  }

  const htmlPath = path.join(TEMPLATES_DIR, tpl.file)
  if (!fs.existsSync(htmlPath)) {
    return json(res, 404, { ok: false, error: `Template file missing: ${tpl.file}` })
  }

  // Minimal non-Acuity constants always needed
  const CONSTANTS = {
    '{{unsubscribe}}': '#',
  }

  const renderHtml = (variables) => {
    let html = fs.readFileSync(htmlPath, 'utf8')
    for (const [token, value] of Object.entries(variables)) {
      html = html.split(token).join(value)
    }
    // Replace any remaining unfilled placeholders with an em-dash
    html = html.replace(/\{\{[^}]+\}\}/g, '—')
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.end(html)
  }

  // Always fetch live data
  fetchLiveData(templateId)
    .then(liveVars => {
      renderHtml({ ...CONSTANTS, ...(liveVars || {}) })
    })
    .catch(err => {
      console.error('[acuity preview live error]', err.message)

      // Distinguish 403 (permission) from other errors
      const is403 = err.message && err.message.includes('403')
      const bgColor = is403 ? '#7c2d12' : '#7f1d1d'
      const icon = is403 ? '⚠️' : '❌'
      const msg = is403
        ? `Account Bullwaves: limited endpoint access (${templateId} uses ${err.message.split('→')[1] || 'restricted API'})`
        : `Acuity live fetch error: ${err.message}`

      let html = fs.readFileSync(htmlPath, 'utf8')
      for (const [token, value] of Object.entries(CONSTANTS)) {
        html = html.split(token).join(value)
      }
      html = html.replace(/\{\{[^}]+\}\}/g, '—')
      const banner = `<div style="background:${bgColor};color:#fff;font-family:monospace;font-size:12px;padding:8px 16px;position:fixed;top:0;left:0;right:0;z-index:9999;opacity:0.95">${icon} ${msg}</div>`
      html = html.replace(/<body[^>]*>/, m => m + banner)
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.setHeader('X-Frame-Options', 'SAMEORIGIN')
      res.end(html)
    })
}

async function handleTestSend(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  const apiKey = getApiKey()
  const onBehalfOf = getOnBehalfOf()
  if (!apiKey) return json(res, 503, { ok: false, error: 'SENDGRID_API_KEY not configured' })
  if (!onBehalfOf) return json(res, 503, { ok: false, error: 'SENDGRID_ON_BEHALF_OF not configured' })

  let body
  try {
    body = await safeParseJsonBody(req)
  } catch (err) {
    return json(res, 400, { ok: false, error: 'Invalid JSON body' })
  }

  const { templateId, recipients } = body || {}
  if (!templateId) return json(res, 400, { ok: false, error: '`templateId` required' })
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return json(res, 400, { ok: false, error: '`recipients` array required' })
  }

  const tpl = ACUITY_TEMPLATES.find(t => t.id === templateId)
  if (!tpl) return json(res, 404, { ok: false, error: `Template '${templateId}' not found` })

  const htmlPath = path.join(TEMPLATES_DIR, tpl.file)
  if (!fs.existsSync(htmlPath)) {
    return json(res, 404, { ok: false, error: `Template file missing: ${tpl.file}` })
  }

  try {
    const htmlRaw = fs.readFileSync(htmlPath, 'utf8')
    const liveVars = await fetchLiveData(templateId).catch(() => ({}))
    const variables = { '{{unsubscribe}}': '#', ...(liveVars || {}) }
    const htmlContent = renderTemplateForSendgrid(htmlRaw, variables)
    const subject = `[TEST] ${applyVariables(tpl.subject, variables).replace(/\{\{[^}]+\}\}/g, '—')}`

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@bullwaves.com'
    const fromName = 'Bullwaves'

    const results = []
    for (const recipient of recipients) {
      const email = typeof recipient === 'string' ? recipient : recipient.email
      const name = typeof recipient === 'object' ? recipient.name : undefined
      const to = name ? [{ email, name }] : [{ email }]

      const payload = {
        personalizations: [{ to }],
        from: { email: fromEmail, name: fromName },
        subject,
        content: [{ type: 'text/html', value: htmlContent }],
      }

      const r = await sgFetch('/mail/send', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      results.push({ email, ok: r.ok, status: r.status, error: r.ok ? null : JSON.stringify(r.data) })
    }

    return json(res, 200, { ok: true, templateId, subject, results })
  } catch (err) {
    return json(res, 500, { ok: false, error: err.message })
  }
}

async function routeAcuity(req, res, parts) {
  const sub = parts[0] || ''

  if (sub === 'templates') {
    const action = parts[1] || ''
    if (action === 'sync') return handleSync(req, res)
    if (action === 'test-send') return handleTestSend(req, res)
    if (action === 'preview') {
      const templateId = parts[2] || ''
      return handlePreview(req, res, templateId)
    }
    if (action === '' || action === 'list') return handleList(req, res)
  }

  return json(res, 404, { ok: false, error: 'Not found' })
}

module.exports = { routeAcuity }
