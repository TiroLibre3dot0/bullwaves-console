import React, { useMemo } from 'react'
import { strategicObjectives, projects2026 } from '../data/roadmapData'
import WeeklyMapView from '../components/WeeklyMapView'

function mapById(list, labelKey = 'label') {
  return list.reduce((acc, item) => {
    acc[item.id] = { label: item[labelKey], ...item }
    return acc
  }, {})
}

export default function WeeklyMapPage() {
  const megaMap = useMemo(() => mapById(strategicObjectives), [])
  const storyMap = useMemo(() => mapById(projects2026, 'activity'), [])

  return <WeeklyMapView megaMap={megaMap} storyMap={storyMap} />
}
