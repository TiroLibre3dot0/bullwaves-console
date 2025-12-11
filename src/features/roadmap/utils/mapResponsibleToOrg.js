import { sections } from '../../../pages/orgChartData'

function buildPeopleIndex() {
  const people = []
  sections.forEach((section) => {
    (section.roles || []).forEach((role) => {
      const email = (role.email || '').trim()
      const name = (role.name || '').trim()
      if (!name) return
      people.push({
        name,
        email,
        role: role.title || role.division || role.department || '',
        department: role.department || role.division || '',
      })
    })
  })
  return people
}

const peopleIndex = buildPeopleIndex()

export function mapResponsibleToOrg(responsibleName = '') {
  if (!responsibleName) return null
  const nameLc = responsibleName.trim().toLowerCase()
  if (!nameLc) return null

  // Exact email match if the name field is an email
  const byEmail = peopleIndex.find((p) => p.email && p.email.toLowerCase() === nameLc)
  if (byEmail) return byEmail

  // Name match (case-insensitive)
  const byName = peopleIndex.find((p) => p.name.toLowerCase() === nameLc)
  if (byName) return byName

  // Partial match (first + last token)
  const tokens = nameLc.split(' ').filter(Boolean)
  if (tokens.length >= 2) {
    const first = tokens[0]
    const last = tokens[tokens.length - 1]
    const partial = peopleIndex.find((p) => {
      const pn = p.name.toLowerCase()
      return pn.includes(first) && pn.includes(last)
    })
    if (partial) return partial
  }

  return null
}

export function findByEmail(email = '') {
  if (!email) return null
  const emailLc = email.trim().toLowerCase()
  return peopleIndex.find((p) => p.email && p.email.toLowerCase() === emailLc) || null
}
