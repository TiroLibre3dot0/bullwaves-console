// supportUserCheckService.js
// Coherent implementation of support helpers used by the Support UI.
import Papa from 'papaparse'

// Caches and maps
let _cache = null
let _parsedCount = 0
let _firstRowKeys = []
let _idMap = null
let _mt5Map = null
let _emailMap = null

let _mediaCache = null
let _affiliateKpiMap = null
let _paymentsCache = null
let _paymentsAffiliateMap = null
let _paymentsAffiliateMapById = null
let _paymentsAffiliateMapByName = null

let _idToName = null
let _nameKeyToId = null
let _mediaByNameKey = null
let _affiliateDebugInfo = null

// Lab/index cache for the temporary mapping UI
let _labAffiliateIndex = null

function normalizeHeaderKey(header) {
	if (header == null) return ''
	const s = header.toString().trim().toLowerCase()
	// replace non-alphanum with empty
	const base = s.replace(/[^a-z0-9]+/g, '')
	if (base) return base
	// fallback for headers like "..." or other punctuation-only headers
	if (/^\.+$/.test(s)) return 'ellipsis'
	// generic fallback
	return 'col'
}

function normalizeAffiliateKey(s) {
	if (!s) return ''
	return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '')
}

function normalizeForIndex(value) {
	if (value == null) return ''
	return String(value).replace(/\s+/g, ' ').trim().toLowerCase()
}

function pickField(obj, candidates) {
	if (!obj) return ''
	for (const k of candidates) {
		if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') return String(obj[k])
	}
	return ''
}

function pickFieldNormalized(row, candidates) {
	if (!row) return ''
	for (const k of candidates) {
		if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return String(row[k]).trim()
	}
	return ''
}

function digitsOnly(s) {
	if (s == null) return ''
	const d = String(s).replace(/\D+/g, '')
	return d || ''
}

export async function loadCsvRows(force = false) {
	if (_cache && !force) return _cache
	// try canonical filename first, then a fixed/renamed variant
	let res = await fetch(encodeURI('/Registrations Report.csv'))
	if (!res.ok) {
		res = await fetch(encodeURI('/Registrations Report.fixed.csv'))
		if (!res.ok) { _cache = []; return _cache }
	}
	const text = await res.text()
	let parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
	// If parser produced a single header key (malformed header wrapped in quotes),
	// attempt a lightweight recovery by splitting the first line into real headers
	try {
		if (parsed && parsed.data && parsed.data.length > 0) {
			const firstRowKeys = Object.keys(parsed.data[0] || {})
			if (firstRowKeys.length === 1) {
				const maybeHeaderKey = firstRowKeys[0] || ''
				// if the single key contains commas it's likely the header was wrapped
				if (maybeHeaderKey.indexOf(',') !== -1) {
					const lines = text.split(/\r?\n/)
					if (lines.length > 1) {
						let headerLine = lines.shift()
						// remove surrounding quotes if present and split by '\",\"' pattern when appropriate
						let headerParts = null
						if (/\",\"/.test(headerLine)) {
							headerParts = headerLine.replace(/^\"+|\"+$/g, '').split('\",\"')
						} else {
							headerParts = headerLine.replace(/^\"+|\"+$/g, '').split(',')
						}
						// sanitize header parts
						headerParts = headerParts.map(h => h.replace(/^\"+|\"+$/g, '').trim())
						const rebuilt = [headerParts.join(','), ...lines].join('\n')
						const reparsed = Papa.parse(rebuilt, { header: true, skipEmptyLines: true })
						if (reparsed && reparsed.data && Object.keys(reparsed.data[0] || {}).length > 1) {
							parsed = reparsed
						}
					}
				}
			}
		}
	} catch (e) {
		// best-effort recovery; ignore and continue with original parse
	}
	if (!parsed || (parsed.errors && parsed.errors.length)) { _cache = []; return _cache }

	_parsedCount = parsed.data.length
	_firstRowKeys = Object.keys(parsed.data[0] || {})

	_cache = (parsed.data || []).map(rawRow => {
		const row = {}
		const seen = {}
		for (const origKey of Object.keys(rawRow || {})) {
			let base = normalizeHeaderKey(origKey)
			if (!base) base = 'col'
			seen[base] = (seen[base] || 0) + 1
			const k = seen[base] === 1 ? base : `${base}__${seen[base]}`
			const v = rawRow[origKey] == null ? '' : String(rawRow[origKey]).trim()
			row[k] = v
		}
		row.__searchIndex = Object.values(row).join(' ').toLowerCase()
		return row
	})

	// build quick lookup maps
	_idMap = {}
	_mt5Map = {}
	_emailMap = {}
	for (const r of _cache) {
		const uid = r.userid || r.user_id || r.user || ''
		const uidKey = uid ? String(uid).replace(/\D+/g, '') : ''
		if (uidKey) { _idMap[uidKey] = _idMap[uidKey] || []; _idMap[uidKey].push(r) }
		const mt5 = r.mt5account || r.mt5 || ''
		const mt5Key = mt5 ? String(mt5).replace(/\D+/g, '') : ''
		if (mt5Key) { _mt5Map[mt5Key] = _mt5Map[mt5Key] || []; _mt5Map[mt5Key].push(r) }
		const email = r.email || r.customeremail || ''
		if (email) { const lk = String(email).toLowerCase().trim(); _emailMap[lk] = _emailMap[lk] || []; _emailMap[lk].push(r) }
	}

	return _cache
}

export function getParsedCount() { return _parsedCount }
export function getFirstRowKeys() { return _firstRowKeys }

export async function searchUsers(query) {
	if (!query && query !== 0) return []
	const rows = await loadCsvRows()
	const qRaw = String(query).trim()
	const qNorm = normalizeForIndex(qRaw)

	if (/^\d+$/.test(qRaw)) {
		const exact = []
		if (_idMap && _idMap[qRaw]) exact.push(..._idMap[qRaw])
		if (_mt5Map && _mt5Map[qRaw]) exact.push(..._mt5Map[qRaw])
		if (exact.length) return Array.from(new Set(exact))

		return rows.filter(r => {
			const uidDigits = String(r.userid || r.user_id || r.user || '').replace(/\D/g, '')
			const mt5Digits = String(r.mt5account || r.mt5 || '').replace(/\D/g, '')
			return uidDigits.includes(qRaw) || mt5Digits.includes(qRaw)
		})
	}

	if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(qRaw)) {
		const key = qRaw.toLowerCase()
		if (_emailMap && _emailMap[key]) return Array.from(new Set(_emailMap[key]))
		return rows.filter(r => { const e = String(r.email || r.customeremail || ''); return e.toLowerCase().includes(key) })
	}

	const results = rows.filter(r => r.__searchIndex && r.__searchIndex.includes(qNorm))
	return results
}

export function computePriority(row) {
	if (!row) return 'unknown'
	const regDate = row.registrationdate || row.externaldate || ''
	const hasAffiliate = !!(row.affiliateid || row.affiliate)
	if (hasAffiliate && regDate) return 'high'
	if (hasAffiliate) return 'medium'
	return 'normal'
}

export function logAudit(action, payload) {
	try { const logs = JSON.parse(localStorage.getItem('supportUserCheckAudit') || '[]'); logs.push({ action, payload, ts: Date.now() }); localStorage.setItem('supportUserCheckAudit', JSON.stringify(logs)) } catch (e) { }
}

export function getAuditLog() { try { return JSON.parse(localStorage.getItem('supportUserCheckAudit') || '[]') } catch (e) { return [] } }

export async function loadMediaReport(force = false) {
	if (_mediaCache && !force) return _mediaCache
	try {
		const res = await fetch(encodeURI('/Media Report.csv'))
		if (!res.ok) { _mediaCache = []; _mediaByNameKey = {}; return _mediaCache }
		const text = await res.text()
		const { data, errors } = Papa.parse(text, { header: true, skipEmptyLines: true })
		if (errors && errors.length) { _mediaCache = []; _mediaByNameKey = {}; return _mediaCache }
		// build processed rows with safe headers
		_mediaCache = (data || []).map(rawRow => {
			const row = {}
			const seen = {}
			for (const origKey of Object.keys(rawRow || {})) {
				let base = normalizeHeaderKey(origKey)
				if (!base) base = 'col'
				seen[base] = (seen[base] || 0) + 1
				const k = seen[base] === 1 ? base : `${base}__${seen[base]}`
				row[k] = rawRow[origKey]
			}
			return row
		})
		_mediaByNameKey = {}
		for (const row of _mediaCache) {
			const affiliateName = (row.affiliate || row.affiliatename || row.name || '')
			if (affiliateName) _mediaByNameKey[normalizeAffiliateKey(affiliateName)] = row
		}
		return _mediaCache
	} catch (err) { _mediaCache = []; _mediaByNameKey = {}; return _mediaCache }
}

export async function loadPaymentsReport(force = false) {
	if (_paymentsCache && !force) return _paymentsCache
	try {
		const res = await fetch(encodeURI('/Payments Report.csv'))
		if (!res.ok) { _paymentsCache = []; _paymentsAffiliateMap = {}; return _paymentsCache }
		const text = await res.text()
		const { data, errors } = Papa.parse(text, { header: true, skipEmptyLines: true })
		if (errors && errors.length) { _paymentsCache = []; _paymentsAffiliateMap = {}; return _paymentsCache }
		// Process payments rows with safe header keys
		_paymentsCache = (data || []).map(rawRow => {
			const row = {}
			const seen = {}
			for (const origKey of Object.keys(rawRow || {})) {
				let base = normalizeHeaderKey(origKey)
				if (!base) base = 'col'
				seen[base] = (seen[base] || 0) + 1
				const k = seen[base] === 1 ? base : `${base}__${seen[base]}`
				row[k] = rawRow[origKey]
			}
			return row
		})
		// build two maps: by id and by normalized name
		_paymentsAffiliateMap = {}
		_paymentsAffiliateMapById = {}
		_paymentsAffiliateMapByName = {}
		for (const row of _paymentsCache) {
			const nameCandidates = ['affiliate', 'affiliatename', 'affiliate_name', 'name', 'partner']
			const idCandidates = ['affiliateid', 'affiliate_id', 'id', 'affid', 'aff_id']
			const affiliateName = pickFieldNormalized(row, nameCandidates)
			const affiliateIdRaw = pickFieldNormalized(row, idCandidates)
			const idKey = digitsOnly(affiliateIdRaw)
			if (affiliateName) {
				const nameKey = normalizeAffiliateKey(affiliateName)
				_paymentsAffiliateMapByName[nameKey] = { affiliateId: idKey || null, affiliateName, raw: row }
				_paymentsAffiliateMap[nameKey] = { name: affiliateName, raw: row }
			}
			if (idKey) {
				_paymentsAffiliateMapById[idKey] = { affiliateId: idKey, affiliateName: affiliateName || null, raw: row }
				_paymentsAffiliateMap[idKey] = { name: affiliateName || null, raw: row }
			}
		}
		return _paymentsCache
	} catch (err) { _paymentsCache = []; _paymentsAffiliateMap = {}; return _paymentsCache }
}

export async function getPaymentAffiliateById(id) {
	if (!id) return null
	await loadPaymentsReport()
	// check id map first
	if (_paymentsAffiliateMapById && _paymentsAffiliateMapById[String(id)]) return _paymentsAffiliateMapById[String(id)]
	// fallback: check name map by normalized name
	const maybeNameKey = String(id).toLowerCase()
	if (_paymentsAffiliateMapByName && _paymentsAffiliateMapByName[maybeNameKey]) return _paymentsAffiliateMapByName[maybeNameKey]
	const numericKey = String(id).replace(/\D+/g, '')
	if (numericKey && _paymentsAffiliateMapById && _paymentsAffiliateMapById[numericKey]) return _paymentsAffiliateMapById[numericKey]
	return null
}

export async function loadAllReportsAndBuildAffiliateIndex(force = false) {
	if (_idToName && !force) return { idToName: _idToName, nameKeyToId: _nameKeyToId, mediaByNameKey: _mediaByNameKey, debugInfo: _affiliateDebugInfo }
	const registrationsRows = await loadCsvRows(force)
	await loadPaymentsReport(force)
	await loadMediaReport(force)

	_idToName = {}
	_nameKeyToId = {}
	_affiliateDebugInfo = { unmatchedAffiliateIds: [], unmatchedAffiliateNamesInMedia: [], collisions: [] }

	// Use the payments maps populated by loadPaymentsReport to build id/name indexes
	_paymentsAffiliateMapById = _paymentsAffiliateMapById || {}
	_paymentsAffiliateMapByName = _paymentsAffiliateMapByName || {}

	// populate id->name and name->id
	for (const idKey of Object.keys(_paymentsAffiliateMapById || {})) {
		if (!idKey) continue
		if (idKey === '2287') continue
		const entry = _paymentsAffiliateMapById[idKey]
		const name = entry && entry.affiliateName ? entry.affiliateName : null
		if (!name) continue
		const nameKey = normalizeAffiliateKey(name)
		const numeric = parseInt(String(idKey), 10)
		if (_idToName[numeric] && _idToName[numeric] !== name) {
			_affiliateDebugInfo.collisions.push({ id: numeric, existing: _idToName[numeric], incoming: name })
		}
		_idToName[numeric] = name
		_nameKeyToId[nameKey] = numeric
	}

	// ensure names seen in payments-by-name are at least present in nameKey map (with null id)
	for (const nameKey of Object.keys(_paymentsAffiliateMapByName || {})) {
		const info = _paymentsAffiliateMapByName[nameKey]
		if (!_nameKeyToId[nameKey]) {
			_nameKeyToId[nameKey] = info && info.affiliateId ? parseInt(info.affiliateId, 10) : null
		}
	}

	_mediaByNameKey = _mediaByNameKey || {}
	return { idToName: _idToName, nameKeyToId: _nameKeyToId, mediaByNameKey: _mediaByNameKey, debugInfo: _affiliateDebugInfo }
}

export async function resolveCurrentAffiliateForUser(userAffiliateId) {
	await loadAllReportsAndBuildAffiliateIndex()
	const id = parseInt(userAffiliateId, 10)
	if (isNaN(id)) return null
	const affiliateName = _idToName[id] || null
	const affiliateNameKey = affiliateName ? normalizeAffiliateKey(affiliateName) : null
	const mediaMetrics = affiliateNameKey ? _mediaByNameKey[affiliateNameKey] || null : null
	let mappingConfidence = 'LOW'
	if (affiliateName) mappingConfidence = mediaMetrics ? 'HIGH' : 'MEDIUM'
	return { affiliateId: id, affiliateName, affiliateNameKey, mediaMetrics, payoutMetrics: null, mappingConfidence }
}

export async function resolveSearchedAffiliate(input) {
	await loadAllReportsAndBuildAffiliateIndex()
	if (!input || String(input).trim() === '') return null
	// Support being passed either a primitive (id/name) or a registration row object
	let affiliateId = null
	let affiliateName = null

	if (typeof input === 'object') {
		// examine common fields on a registration row
		const candidates = [
			input.affiliate, input.affiliatename, input.name,
			input.affiliateid, input.affiliate_id, input.id, input.uid
		]
		for (const c of candidates) {
			if (c === undefined || c === null || String(c).trim() === '') continue
			const s = String(c).trim()
			const numeric = parseInt(s, 10)
			if (!isNaN(numeric)) {
				affiliateId = numeric
					affiliateName = _idToName[affiliateId] || null
					// fallback: try payments report mapping by id if payments provide a name
					if (!affiliateName) {
						try {
							const payInfo = await getPaymentAffiliateById(numeric)
							if (payInfo && payInfo.affiliateName) affiliateName = payInfo.affiliateName
						} catch (e) { /* ignore */ }
					}
				if (affiliateId || affiliateName) break
			}
			// treat as name
			const key = normalizeAffiliateKey(s)
			if (_nameKeyToId && _nameKeyToId[key]) {
				affiliateId = _nameKeyToId[key]
				affiliateName = _idToName[affiliateId] || null
				break
			}
			if (_mediaByNameKey && _mediaByNameKey[key]) {
				affiliateName = s
				affiliateId = null
				break
			}
		}
	} else {
		const trimmed = String(input).trim()
		const num = parseInt(trimmed, 10)
		if (!isNaN(num)) { affiliateId = num; affiliateName = _idToName[affiliateId] || null }
		else {
			const key = normalizeAffiliateKey(trimmed)
			affiliateId = _nameKeyToId[key] || null
			if (affiliateId) affiliateName = _idToName[affiliateId] || null
			else if (_mediaByNameKey[key]) { affiliateName = trimmed; affiliateId = null }
		}
	}
	if (!affiliateId && !affiliateName) return null
	const affiliateNameKey = affiliateName ? normalizeAffiliateKey(affiliateName) : null
	const mediaMetrics = affiliateNameKey ? _mediaByNameKey[affiliateNameKey] || null : null
	let mappingConfidence = 'LOW'
	if (affiliateId && affiliateName) mappingConfidence = mediaMetrics ? 'HIGH' : 'MEDIUM'
	else if (mediaMetrics) mappingConfidence = 'LOW'
	return { affiliateId, affiliateName, affiliateNameKey, mediaMetrics, payoutMetrics: null, mappingConfidence }
}

export async function searchAffiliate(query) {
	await loadAllReportsAndBuildAffiliateIndex()
	const qRaw = String(query).trim()
	const isNumeric = /^\d+$/.test(qRaw)
	if (isNumeric) {
		const id = parseInt(qRaw, 10)
		const name = _idToName[id]
		return name ? { id, display: `${id} — ${name}` } : null
	} else {
		const key = normalizeAffiliateKey(qRaw)
		const id = _nameKeyToId[key]
		if (id) { const name = _idToName[id]; return { id, display: `${id} — ${name}` } }
		return null
	}
}

function toNum(x) { if (x === null || x === undefined || x === '') return 0; const n = Number(String(x).replace(/[^0-9.-]+/g, '')); return Number.isFinite(n) ? n : 0 }

export function buildSupportDecision(selectedUser) {
	if (!selectedUser) return null
	const depositsNum = toNum(selectedUser.totalDeposits)
	const withdrawalsNum = toNum(selectedUser.withdrawals)
	const netDeposits = toNum(selectedUser.netDeposits)
	const volumeNum = toNum(selectedUser.volume)
	const plNum = toNum(selectedUser.pl)
	const hasCommissions = toNum(selectedUser.affiliateCommissions || selectedUser.commissions) > 0
	const withdrawalRatio = depositsNum > 0 ? withdrawalsNum / depositsNum : 0

	// determine basic caseType/riskLevel as before but keep full object including replyTemplate
	let caseType = 'ACTIVE_USER'
	let riskLevel = 'low'

	if (selectedUser.paymentsLoaded === false || selectedUser.mediaLoaded === false) {
		caseType = 'DATA_INCOMPLETE'; riskLevel = 'medium'
	} else if (withdrawalsNum > 0 && depositsNum > 0 && withdrawalRatio > 0.7) {
		caseType = 'POTENTIAL_ABUSE'; riskLevel = 'high'
	} else if (withdrawalsNum > 0 && depositsNum > 0) {
		caseType = 'WITHDRAWAL_REQUEST'; riskLevel = 'medium'
	} else if (depositsNum > 0 && volumeNum === 0) {
		caseType = 'DEPOSIT_NO_TRADING'; riskLevel = 'low'
	} else if (depositsNum === 0) {
		caseType = 'NO_DEPOSIT'; riskLevel = 'low'
	} else if (depositsNum > 5000) {
		caseType = 'HIGH_VALUE_USER'; riskLevel = 'low'
	} else if (selectedUser.fraud || selectedUser.action === 'fraud' || selectedUser.status === 'fraud') {
		caseType = 'FRAUD_RISK'; riskLevel = 'high'
	} else {
		caseType = 'ACTIVE_USER'; riskLevel = 'low'
	}

	// replyTemplate mapping
	let replyTemplate = ''
	switch (caseType) {
		case 'DATA_INCOMPLETE': replyTemplate = 'Thanks — we\'re checking your account details and will update you shortly.'; break
		case 'WITHDRAWAL_REQUEST': replyTemplate = 'Thanks — your withdrawal request is in review. We\'ll confirm once checks are completed.'; break
		case 'POTENTIAL_ABUSE': replyTemplate = 'Thanks — we need additional verification before proceeding. Our team will contact you if needed.'; break
		case 'HIGH_VALUE_USER': replyTemplate = 'Thanks — we\'ll prioritize your request and confirm next steps shortly.'; break
		case 'NO_DEPOSIT': replyTemplate = 'Thanks — your account is active. If you need help funding, we can guide you.'; break
		case 'ACTIVE_USER': replyTemplate = 'Thanks — we\'re reviewing your request and will update you shortly.'; break
		default: replyTemplate = 'Thanks — we\'re reviewing and will follow up shortly.'
	}

	return { caseType, riskLevel, replyTemplate }
}

export function buildSupportDecisions(selectedUser) {
	if (!selectedUser) return null
	// derive numeric helpers
	const deposits = toNum(selectedUser.totalDeposits)
	const withdrawals = toNum(selectedUser.withdrawals)
	const netDeposits = toNum(selectedUser.netDeposits)
	const volume = toNum(selectedUser.volume)
	const pl = toNum(selectedUser.pl)
	const hasCommissions = toNum(selectedUser.affiliateCommissions || selectedUser.commissions) > 0
	const withdrawalRatio = deposits > 0 ? (withdrawals / deposits) : 0
	const isHighValue = deposits >= 5000
	const hasAffiliate = Boolean(selectedUser.affiliateId && String(selectedUser.affiliateId).trim() !== '')

	const decisions = {}

	// 1) Affiliate Switch
	if (!hasAffiliate) {
		decisions.affiliateSwitch = {
			status: 'NEEDS_CONTEXT',
			why: 'No affiliate assigned on this account.',
			nextActions: ['Verify CRM affiliate attribution.', 'If user wants a new affiliate, open a NEW account via affiliate link.']
		}
	} else if (hasCommissions) {
		decisions.affiliateSwitch = {
			status: 'NOT_ELIGIBLE',
			why: 'Account already generated affiliate commissions. Switching would create cost/attribution issues.',
			nextActions: ['Do NOT switch the existing account.', 'If user insists, propose opening a NEW account under the requested affiliate link (min deposit may apply).', 'Escalate to Emanuele for final approval if needed.'],
			signals: ['Commissions > 0']
		}
	} else {
		decisions.affiliateSwitch = {
			status: 'ELIGIBLE',
			why: 'No affiliate commissions generated on current account. Switch has no attribution cost.',
			nextActions: ['Proceed with switch (CRM + Skale).', 'Confirm affiliate updated consistently in both systems.'],
			signals: ['Commissions = 0']
		}
	}

	// 2) Account Type Change
	if (withdrawalRatio > 0.7 && deposits > 0) {
		decisions.accountTypeChange = {
			status: 'NEEDS_MANUAL_REVIEW',
			why: 'High withdrawal ratio suggests potential abuse; manual review required before account type change.',
			nextActions: ['Escalate to risk team for manual review.', 'Hold account type change until clearance.'],
			signals: ['High withdrawal ratio']
		}
	} else {
		const next = ['Allow account type change with conditions: verify KYC and PSP status.']
		if (withdrawals > 0) next.unshift('Require KYC/PSP check before changing type')
		decisions.accountTypeChange = {
			status: 'APPROVED_WITH_CONDITIONS',
			why: 'Account type change allowed with operational checks.',
			nextActions: next
		}
	}

	// 3) Bonus/Credit Eligibility
	if (hasCommissions && deposits > 0) {
		decisions.bonus = {
			status: 'NEEDS_VERIFICATION',
			why: 'Account has affiliate commissions and deposits — bonus allocation requires verification to avoid double-cost.',
			nextActions: ['Verify affiliate commission ownership and marketing agreement before granting bonus.', 'If approved, record reason in CRM.'],
			signals: ['Commissions > 0', `Deposits = ${deposits}`]
		}
	} else if (deposits === 0) {
		decisions.bonus = {
			status: 'NOT_ELIGIBLE',
			why: 'No deposits on account — bonus requires deposit activity.',
			nextActions: ['Inform user about funding options and minimum deposit requirements.']
		}
	} else if (isHighValue) {
		decisions.bonus = {
			status: 'ELIGIBLE',
			why: 'High-value user eligible for bonus, subject to KYC.',
			nextActions: ['Proceed with bonus offer and initiate KYC if not present.'],
			signals: ['High value user']
		}
	} else {
		decisions.bonus = {
			status: 'ELIGIBLE',
			why: 'User eligible for standard promotional offers.',
			nextActions: ['Offer standard bonus per promotions catalogue.']
		}
	}

	// 4) Withdrawal/Refund Handling
	if (withdrawals > 0 && deposits > 0 && withdrawalRatio > 0.7) {
		decisions.withdrawals = {
			status: 'HIGH_RISK',
			why: 'High withdrawal ratio vs deposits.',
			nextActions: ['Hold and investigate.', 'Check PSP/KYC, trading activity, and payment methods.'],
			signals: ['High withdrawal ratio']
		}
	} else if (withdrawals > 0) {
		decisions.withdrawals = {
			status: 'NEEDS_PSP_CHECK',
			why: 'Withdrawals detected — verify PSP and KYC before processing.',
			nextActions: ['Verify PSP status.', 'Confirm KYC.', 'Process according to SLA.'],
			signals: ['Withdrawals > 0']
		}
	} else {
		decisions.withdrawals = {
			status: 'STANDARD_PROCESS',
			why: 'No withdrawals; follow standard processing.',
			nextActions: ['No action required.']
		}
	}

	// 5) Revenue Share Analysis
	if (pl < 0 && deposits > 0 && Math.abs(pl) > deposits * 0.5) {
		decisions.revenueShare = {
			status: 'CRITICAL_RISK',
			why: 'Large negative P/L relative to deposits indicating potential retention/abuse risk.',
			nextActions: ['Review retention strategy and fraud indicators.', 'Consider special handling or limits.'],
			signals: ['P/L', `PL=${pl}`, `Deposits=${deposits}`]
		}
	} else if (pl > 0 && withdrawals > 0) {
		decisions.revenueShare = {
			status: 'NEUTRAL',
			why: 'User shows profit and has withdrawals — monitor for churn/cashout.',
			nextActions: ['Monitor cashout behavior.', 'Ensure tax/compliance reporting if needed.'],
			signals: ['P/L positive', 'Withdrawals detected']
		}
	} else if (deposits === 0) {
		decisions.revenueShare = {
			status: 'NEUTRAL',
			why: 'No deposits — revenue impact is neutral.',
			nextActions: ['No revenue actions required.']
		}
	} else if (pl < 0) {
		decisions.revenueShare = {
			status: 'PROFITABLE',
			why: 'User is net-loss (negative P/L) which may be beneficial for revenue share depending on contract.',
			nextActions: ['Review contract terms and retention options.'],
			signals: ['P/L negative', `PL=${pl}`]
		}
	} else {
		decisions.revenueShare = {
			status: 'NEUTRAL',
			why: 'No significant revenue indicators.',
			nextActions: ['No action required.']
		}
	}

	// dev console snapshot for quick verification
	try { const uid = selectedUser.userId || selectedUser.userid || selectedUser.user || null; console.log('Support decisions', { userId: uid, decisions }) } catch (e) { /* ignore */ }

	return decisions
}

export async function buildAffiliateKpiMap(force = false) {
	await loadAllReportsAndBuildAffiliateIndex(force)
	await loadMediaReport(force)
	const rows = Array.isArray(_mediaCache) ? _mediaCache : []
	const map = {}
	_affiliateDebugInfo = { totalRows: rows.length, aggregatedAffiliates: 0, missingIdMappings: [] }

	function getVal(row, candidates) {
		for (const c of candidates) {
			if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== '') return toNum(row[c])
		}
		// try keys that start with candidate (handles suffixes like __2)
		for (const key of Object.keys(row || {})) {
			for (const c of candidates) {
				if (key.toLowerCase().startsWith(c)) return toNum(row[key])
			}
		}
		return 0
	}

	function addToAgg(agg, row) {
		agg.clicks += getVal(row, ['visitors', 'uniquevisitors', 'clicks', 'traffic'])
		agg.registrations += getVal(row, ['registrations', 'registration', 'regs'])
		agg.ftd += getVal(row, ['ftd', 'firstdeposit', 'first_trade', 'firsttrade'])
		agg.qftd += getVal(row, ['qftd', 'qualification'])
		agg.deposits += getVal(row, ['deposits', 'deposit', 'amount'])
		agg.withdrawals += getVal(row, ['withdrawals', 'withdrawal'])
		agg.netDeposits += getVal(row, ['netdeposits', 'net_deposits', 'net'])
		agg.revenue += getVal(row, ['commission', 'commissiontotal', 'commission_total', 'revenue'])
		agg.cpa += getVal(row, ['cpa', 'cpacommission', 'cpa_commission'])
		agg.cpl += getVal(row, ['cpl', 'cplcommission', 'cpl_commission'])
		agg.revshare += getVal(row, ['revshare', 'revsharecommission', 'revshare_commission'])
		agg.sub += getVal(row, ['sub', 'subcommission', 'sub_commission', 'subaffiliatecommissions'])
		agg.other += getVal(row, ['other', 'othercommission', 'other_commission'])
		agg.volume += getVal(row, ['volume', 'turnover'])
		agg.pl += getVal(row, ['pl', 'profitloss', 'netpl', 'net_pl'])
		agg.spend += getVal(row, ['spend', 'cost', 'media_spend'])
		agg.rows += 1
	}

	for (const row of rows) {
		const affiliateName = (row.affiliate || row.affiliatename || row.name || '')
		if (!affiliateName) continue
		const nameKey = normalizeAffiliateKey(affiliateName)

		if (!map[nameKey]) {
			map[nameKey] = {
				affiliateId: null,
				name: affiliateName,
				clicks: 0,
				registrations: 0,
				ftd: 0,
				qftd: 0,
				deposits: 0,
				withdrawals: 0,
				netDeposits: 0,
				revenue: 0,
				commissionTotal: 0,
				cpa: 0,
				cpl: 0,
				revshare: 0,
				sub: 0,
				other: 0,
				volume: 0,
				pl: 0,
				roi: null,
				spend: 0,
				rows: 0
			}
		}

		addToAgg(map[nameKey], row)
	}

	// post-process: attach ids and compute derived fields
	for (const nameKey of Object.keys(map)) {
		const entry = map[nameKey]
		const affiliateId = _nameKeyToId && _nameKeyToId[nameKey] ? _nameKeyToId[nameKey] : null
		if (affiliateId) {
			entry.affiliateId = affiliateId
			const idKey = String(affiliateId)
			map[idKey] = Object.assign({}, entry)
		} else {
			_affiliateDebugInfo.missingIdMappings.push(nameKey)
		}

		// commissionTotal: if commissionTotal column present use revenue value already read, else sum components
		if (!entry.revenue || entry.revenue === 0) {
			entry.commissionTotal = entry.cpa + entry.cpl + entry.revshare + entry.sub + entry.other
			entry.revenue = entry.commissionTotal
		} else {
			entry.commissionTotal = entry.revenue
		}

		// ecpa derived: cpa / max(ftd,1) else null
		entry.ecpa = entry.ftd > 0 ? (entry.cpa / Math.max(1, entry.ftd)) : (entry.ecpa || null)

		// roi: if spend > 0
		if (entry.spend > 0) {
			entry.roi = ((entry.revenue - entry.spend) / entry.spend) * 100
		} else {
			entry.roi = null
		}
	}

	_affiliateKpiMap = map
	_affiliateDebugInfo.totalAggregated = Object.keys(map).length
	_affiliateDebugInfo.aggregatedAffiliates = Object.keys(map).length

	return _affiliateKpiMap
}

export async function getAffiliateKpi(input) {
	if (!input) return null
	await buildAffiliateKpiMap()
	// numeric id lookup
	const asNum = parseInt(String(input).trim(), 10)
	if (!Number.isNaN(asNum)) {
		const idKey = String(asNum)
		if (_affiliateKpiMap && _affiliateKpiMap[idKey]) return _affiliateKpiMap[idKey]
		const name = _idToName && _idToName[asNum]
		if (name) {
			const nameKey = normalizeAffiliateKey(name)
			return (_affiliateKpiMap && _affiliateKpiMap[nameKey]) || null
		}
		return null
	}
	// treat as name
	const nameKey = normalizeAffiliateKey(String(input))
	return (_affiliateKpiMap && (_affiliateKpiMap[nameKey] || _affiliateKpiMap[String(_nameKeyToId && _nameKeyToId[nameKey] || '')])) || null
}

export async function getAffiliateOverview(id) {
	if (!id && id !== 0) return null
	await loadAllReportsAndBuildAffiliateIndex()

	const raw = String(id).trim()
	// try numeric id first
	const asNum = parseInt(raw, 10)
	let affiliateId = null
	let name = null
	if (!Number.isNaN(asNum)) {
		affiliateId = asNum
		name = _idToName ? _idToName[affiliateId] : null
	} else {
		// treat input as affiliate name (or display name)
		const nameKey = normalizeAffiliateKey(raw)
		if (_nameKeyToId && _nameKeyToId[nameKey]) {
			affiliateId = _nameKeyToId[nameKey]
			name = _idToName ? _idToName[affiliateId] : raw
		} else {
			// no id mapping available, return partial overview with provided name
			return {
				id: null,
				name: raw || null,
				clicks: 0,
				registrations: 0,
				ftd: 0,
				revenue: 0,
				ecpa: null,
				roi: null
			}
		}
	}

	const kpi = affiliateId !== null ? await getAffiliateKpi(affiliateId) : null
	if (!kpi) {
		return {
			id: affiliateId,
			name: name || null,
			clicks: 0,
			registrations: 0,
			ftd: 0,
			revenue: 0,
			ecpa: null,
			roi: null
		}
	}
	return {
		id: affiliateId,
		name: name || kpi.name || null,
		clicks: kpi.clicks,
		registrations: kpi.registrations,
		ftd: kpi.ftd,
		revenue: kpi.revenue,
		ecpa: kpi.ecpa,
		roi: kpi.roi
	}
}

export function getAffiliateDebugSnapshot() {
	const paymentsAffiliates = _idToName ? Object.keys(_idToName).length : 0
	const mediaAffiliates = Array.isArray(_mediaCache) ? _mediaCache.length : 0
	const kpiKeys = _affiliateKpiMap ? Object.keys(_affiliateKpiMap).length : 0
	const sampleKpi = []
	if (_affiliateKpiMap) {
		for (const k of Object.keys(_affiliateKpiMap).slice(0, 3)) {
			const v = _affiliateKpiMap[k]
			sampleKpi.push({ key: k, id: v.affiliateId || null, name: v.name, clicks: v.clicks, ftd: v.ftd, revenue: v.revenue })
		}
	}
	return { paymentsAffiliates, mediaAffiliates, kpiKeys, sampleKpi }
}

// --- Lab helpers (temporary, used by Lab page) -----------------------------
export async function loadRegistrationsReport(force = false) {
	// wrapper around existing CSV loader for registrations
	return await loadCsvRows(force)
}

export async function buildAffiliateIdNameIndex(force = false) {
	if (_labAffiliateIndex && !force) return _labAffiliateIndex

	// reuse canonical index builder for payments -> id/name mapping
	await loadAllReportsAndBuildAffiliateIndex(force)
	const regs = Array.isArray(await loadCsvRows(force)) ? await loadCsvRows(force) : []

	const affiliateIdsSet = new Set()
	for (const r of regs) {
		const candidates = [r.affiliateid, r.affiliate, r.affiliatename, r.id]
		for (const c of candidates) {
			if (c === undefined || c === null) continue
			const s = String(c).trim()
			if (s === '') continue
			const digits = digitsOnly(s)
			if (!digits) continue
			if (digits === '2287') continue
			affiliateIdsSet.add(Number(digits))
			break
		}
	}

	const affiliateIdsFromRegistrations = Array.from(affiliateIdsSet).sort((a,b)=>a-b)

	const idToName = {}
	for (const k of Object.keys(_idToName || {})) {
		idToName[String(k)] = _idToName[k]
	}

	const rows = affiliateIdsFromRegistrations.map(idNum => {
		const idKey = String(idNum)
		const affiliateName = idToName[idKey] || null
		return { affiliateId: idKey, affiliateName, status: affiliateName ? 'MAPPED' : 'MISSING' }
	})

	_labAffiliateIndex = { affiliateIdsFromRegistrations, idToName, rows }
	return _labAffiliateIndex
}

export async function getAffiliateNameById(id) {
	if (!id && id !== 0) return null
	if (!_labAffiliateIndex) await buildAffiliateIdNameIndex()
	const key = String(id).replace(/\D+/g, '')
	if (!key) return null
	return _labAffiliateIndex && _labAffiliateIndex.idToName ? (_labAffiliateIndex.idToName[key] || null) : null
}

export function getAffiliateDebugInfo() {
	return {
		parsedPayments: Array.isArray(_paymentsCache) ? _paymentsCache.length : 0,
		idToNameSize: _idToName ? Object.keys(_idToName).length : 0,
		sampleKeys: _idToName ? Object.keys(_idToName).slice(0, 10) : [],
		debug: _affiliateDebugInfo || {}
	}
}


