const DEFAULT_LABELS = {
  ceo: 'CEO/Leadership',
  managementTeam: 'Management Team',
  categories: {
    'management-team': 'Management',
    'area-responsibility': 'Area Layer',
    'support-team': 'Support',
    operations: 'Operations',
    affiliation: 'Affiliation',
    'business-development': 'Business Dev',
    marketing: 'Marketing',
    finance: 'Finance',
    payments: 'Payments',
    compliance: 'Compliance',
    dealing: 'Dealing Desk',
  },
}

function normalizeText(value) {
  return (value || '').toString().trim().toLowerCase()
}

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)))
}

function buildNodeId(prefix, id) {
  return `${prefix}:${id}`
}

function safeIdPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function cleanLabel(value) {
  const s = String(value || '').trim()
  if (!s || s === '—') return ''
  return s
}

/**
 * Public tree builder:
 * root -> divisions -> departments -> role/title nodes.
 * Intentionally hides emails and non-management names.
 */
export function buildPublicOrgTreeModel(people = [], opts = {}) {
  const {
    labels: labelOverrides = {},
    showTopManagementNames = true,
    rootLabel = 'Bullwaves',
    includeDepartmentsRoles = false,
    includeCrossEdges = false,
    includeLeadershipGroup = true,
  } = opts

  const labels = {
    ...DEFAULT_LABELS,
    ...labelOverrides,
    categories: {
      ...DEFAULT_LABELS.categories,
      ...(labelOverrides.categories || {}),
    },
  }

  const list = Array.isArray(people) ? people : []
  const isManagement = (p) => (p?.sectionId || '') === 'management-team'

  const rootId = buildNodeId('root', 'org')
  const leadershipId = includeLeadershipGroup ? buildNodeId('group', 'leadership') : null

  const nodes = [{ id: rootId, label: rootLabel, type: 'root', parentId: null, tags: [] }]
  const edges = []

  if (includeLeadershipGroup && leadershipId) {
    nodes.push({
      id: leadershipId,
      label: labels.ceo || DEFAULT_LABELS.ceo,
      type: 'group',
      parentId: rootId,
      tags: ['management-team'],
    })
    edges.push({ from: rootId, to: leadershipId, kind: 'reporting' })
  }

  // Management nodes (role label + optional name)
  const managementPeople = list.filter(isManagement)
  for (const p of includeLeadershipGroup ? managementPeople : []) {
    const title = cleanLabel(p?.title) || 'Leader'
    const name = cleanLabel(p?.name)
    const label = showTopManagementNames && name ? `${title} — ${name}` : title
    const id = buildNodeId('lead', safeIdPart(`${title}-${name || ''}`) || safeIdPart(title))
    nodes.push({
      id,
      label,
      type: 'person',
      parentId: leadershipId,
      tags: ['management-team'],
    })
    edges.push({ from: leadershipId, to: id, kind: 'reporting' })
  }

  // Build divisions/departments tree for all (including management roles, but without names)
  const byDivision = new Map()
  for (const p of list) {
    const division = cleanLabel(p?.division) || 'Unassigned'
    if (!byDivision.has(division)) byDivision.set(division, [])
    byDivision.get(division).push(p)
  }

  const divisionNames = Array.from(byDivision.keys()).sort((a, b) => a.localeCompare(b))

  const divisionIdByName = new Map()
  for (const divName of divisionNames) {
    const divId = buildNodeId('division', safeIdPart(divName) || 'unassigned')
    divisionIdByName.set(divName, divId)
    nodes.push({
      id: divId,
      label: divName,
      type: 'division',
      parentId: rootId,
      tags: [],
    })
    edges.push({ from: rootId, to: divId, kind: 'reporting' })
  }

  // departments under divisions
  const departmentIdByKey = new Map()
  for (const divName of divisionNames) {
    const divId = divisionIdByName.get(divName)
    const peopleInDiv = byDivision.get(divName) || []

    const byDept = new Map()
    for (const p of peopleInDiv) {
      const dept = cleanLabel(p?.department) || 'Unassigned'
      if (!byDept.has(dept)) byDept.set(dept, [])
      byDept.get(dept).push(p)
    }

    const deptNames = Array.from(byDept.keys()).sort((a, b) => a.localeCompare(b))
    for (const deptName of deptNames) {
      const deptKey = `${divName}::${deptName}`
      const deptId = buildNodeId(
        'dept',
        safeIdPart(deptKey) || safeIdPart(deptName) || 'unassigned'
      )
      departmentIdByKey.set(deptKey, deptId)
      nodes.push({
        id: deptId,
        label: deptName,
        type: 'department',
        parentId: divId,
        tags: [],
      })
      edges.push({ from: divId, to: deptId, kind: 'reporting' })

      if (includeDepartmentsRoles) {
        // Optional: role nodes under department (still NO emails, NO names unless management)
        const deptPeople = byDept.get(deptName) || []

        // Best-effort dedupe: identical title+section within same dept.
        const seen = new Set()
        for (const p of deptPeople) {
          const title = cleanLabel(p?.title)
          const sectionId = cleanLabel(p?.sectionId)
          const key = `${title}::${sectionId}`
          if (title && seen.has(key)) continue
          if (title) seen.add(key)

          const roleLabel = (() => {
            if (isManagement(p)) {
              const mgTitle = title || 'Leader'
              const mgName = cleanLabel(p?.name)
              return showTopManagementNames && mgName ? `${mgTitle} — ${mgName}` : mgTitle
            }
            // Non-management: prefer title; never show person name.
            return title || cleanLabel(p?.focus) || cleanLabel(p?.sectionTitle) || 'Role'
          })()

          const roleIdSeed = safeIdPart(`${deptKey}-${roleLabel}`) || safeIdPart(roleLabel)
          const roleId = buildNodeId('role', roleIdSeed)

          // Prevent id collisions by suffixing if needed.
          let finalRoleId = roleId
          let i = 2
          while (nodes.some((n) => n.id === finalRoleId)) {
            finalRoleId = `${roleId}-${i}`
            i++
          }

          nodes.push({
            id: finalRoleId,
            label: roleLabel,
            type: 'role',
            parentId: deptId,
            tags: [p?.sectionId].filter(Boolean),
          })
          edges.push({ from: deptId, to: finalRoleId, kind: 'reporting' })
        }
      }
    }
  }

  if (includeCrossEdges) {
    // Cross-functional: Area Layer connects to divisions (optional; can get noisy).
    const hasArea = list.some((p) => (p?.sectionId || '') === 'area-responsibility')
    if (hasArea) {
      const areaId = buildNodeId('cross', 'area-layer')
      nodes.push({
        id: areaId,
        label: labels.categories['area-responsibility'] || 'Area Layer',
        type: 'cross',
        parentId: rootId,
        tags: ['area-responsibility'],
      })
      edges.push({ from: rootId, to: areaId, kind: 'reporting' })
      for (const divName of divisionNames) {
        const divId = divisionIdByName.get(divName)
        if (!divId) continue
        edges.push({ from: areaId, to: divId, kind: 'cross' })
      }
    }
  }

  return { orgNodes: nodes, orgEdges: edges, ids: { rootId, leadershipId } }
}

/**
 * Non-breaking derived org model builder.
 *
 * @param {Array<object>} people Flat array of people. Each entry should include at least:
 *   { name, title, department, division, sectionId }
 *   It may include any other existing fields (email, region, focus, duties...).
 *
 * @param {object} opts
 * @param {'all'|string} opts.selectedCategory Section/category filter id.
 * @param {string} opts.searchTerm Filters people by name.
 * @param {object} opts.labels Optional label overrides.
 * @param {boolean} opts.includeManagementPeopleAsNodes Adds management people as nodes (public view).
 * @param {number} opts.maxDepartmentNodes When selectedCategory === 'all', limit visible department nodes.
 */
export function buildDerivedOrgModel(people = [], opts = {}) {
  const {
    selectedCategory = 'all',
    searchTerm = '',
    labels: labelOverrides = {},
    includeManagementPeopleAsNodes = false,
    maxDepartmentNodes = 6,
  } = opts

  const labels = {
    ...DEFAULT_LABELS,
    ...labelOverrides,
    categories: {
      ...DEFAULT_LABELS.categories,
      ...(labelOverrides.categories || {}),
    },
  }

  const query = normalizeText(searchTerm)
  const peopleWithMeta = Array.isArray(people) ? people : []

  const matchesSearch = (p) => {
    if (!query) return true
    return normalizeText(p?.name).includes(query)
  }

  const filterByCategory = (p) => {
    if (selectedCategory === 'all') return true
    return (p?.sectionId || '') === selectedCategory
  }

  const filteredPeople = peopleWithMeta.filter((p) => filterByCategory(p) && matchesSearch(p))

  const countsBySection = filteredPeople.reduce((acc, p) => {
    const key = p?.sectionId || 'unassigned'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const allSectionIds = uniq(peopleWithMeta.map((p) => p?.sectionId))

  const isManagementSection = (sectionId) => sectionId === 'management-team'

  const sectionLabel = (sectionId) => labels.categories[sectionId] || sectionId

  const managementPeople = filteredPeople.filter((p) => isManagementSection(p?.sectionId))

  const nonManagementPeople = filteredPeople.filter((p) => !isManagementSection(p?.sectionId))

  const groupBySection = (arr) => {
    const map = new Map()
    for (const p of arr) {
      const sectionId = p?.sectionId || 'unassigned'
      if (!map.has(sectionId)) map.set(sectionId, [])
      map.get(sectionId).push(p)
    }
    return map
  }

  const groupsBySection = []
  const nonManagementBySection = groupBySection(nonManagementPeople)

  for (const [sectionId, sectionPeople] of nonManagementBySection.entries()) {
    const byDepartment = new Map()
    for (const p of sectionPeople) {
      const dept = (p?.department || '').trim() || 'Unassigned'
      if (!byDepartment.has(dept)) byDepartment.set(dept, [])
      byDepartment.get(dept).push(p)
    }

    const departmentGroups = Array.from(byDepartment.entries())
      .map(([department, deptPeople]) => {
        const divisions = uniq(deptPeople.map((x) => (x?.division || '').trim())).filter(Boolean)
        return {
          id: `${sectionId}::${department}`,
          department,
          divisions,
          people: deptPeople,
        }
      })
      .sort((a, b) => a.department.localeCompare(b.department))

    groupsBySection.push({
      sectionId,
      sectionLabel: sectionLabel(sectionId),
      people: sectionPeople,
      departmentGroups,
    })
  }

  groupsBySection.sort((a, b) => a.sectionLabel.localeCompare(b.sectionLabel))

  const categoryNodeIds = allSectionIds.filter((id) => id && !isManagementSection(id))

  let visibleCategoryIds = []
  if (selectedCategory !== 'all' && !isManagementSection(selectedCategory)) {
    visibleCategoryIds = [selectedCategory]
  } else if (selectedCategory === 'all') {
    // Show all departments/teams in the tree for the All view.
    // This keeps tree + cards consistent with the filter chips.
    visibleCategoryIds = [...categoryNodeIds]

    // Optional safety: if an app ever adds a huge number of categories, allow limiting.
    if (Number.isFinite(maxDepartmentNodes) && maxDepartmentNodes > 0) {
      if (visibleCategoryIds.length > maxDepartmentNodes) {
        visibleCategoryIds = visibleCategoryIds.slice(0, maxDepartmentNodes)
      }
    }
  }

  const rootId = buildNodeId('root', 'ceo')
  const managementId = buildNodeId('root', 'management-team')

  const orgNodes = [
    { id: rootId, label: labels.ceo, type: 'root', parentId: null, tags: [] },
    {
      id: managementId,
      label: labels.managementTeam,
      type: 'group',
      parentId: rootId,
      tags: ['management-team'],
    },
  ]

  // Department/category nodes
  for (const sectionId of visibleCategoryIds) {
    orgNodes.push({
      id: buildNodeId('category', sectionId),
      label: sectionLabel(sectionId),
      type: 'category',
      parentId: managementId,
      tags: [sectionId],
    })
  }

  // Management people nodes (public view)
  if (includeManagementPeopleAsNodes) {
    for (const p of managementPeople) {
      const title = (p?.title || '').trim() || 'Leader'
      const name = (p?.name || '').trim()
      const label = name ? `${title} — ${name}` : title
      orgNodes.push({
        id: buildNodeId('person', `${title}:${name}`),
        label,
        type: 'person',
        parentId: managementId,
        tags: ['management-team'],
        person: p,
      })
    }
  }

  const orgEdges = [
    { from: rootId, to: managementId, kind: 'reporting' },
    ...visibleCategoryIds.map((sectionId) => ({
      from: managementId,
      to: buildNodeId('category', sectionId),
      kind: 'reporting',
    })),
  ]

  // Optional: dashed cross-functional edges from Area Layer to other departments
  if (visibleCategoryIds.includes('area-responsibility')) {
    for (const sectionId of visibleCategoryIds) {
      if (sectionId === 'area-responsibility') continue
      orgEdges.push({
        from: buildNodeId('category', 'area-responsibility'),
        to: buildNodeId('category', sectionId),
        kind: 'cross',
      })
    }
  }

  // Search-match highlighting: mark categories that contain matching people.
  const matchedNodeIds = new Set()
  if (query) {
    const bySection = groupBySection(filteredPeople)
    for (const [sectionId, sectionPeople] of bySection.entries()) {
      if (sectionPeople.length === 0) continue
      if (isManagementSection(sectionId)) {
        matchedNodeIds.add(managementId)
      } else {
        matchedNodeIds.add(buildNodeId('category', sectionId))
      }
    }
  }

  return {
    orgNodes,
    orgEdges,
    filteredPeople,
    managementPeople,
    groupsBySection,
    visibleCategoryIds,
    matchedNodeIds,
    countsBySection,
    ids: { rootId, managementId },
  }
}
