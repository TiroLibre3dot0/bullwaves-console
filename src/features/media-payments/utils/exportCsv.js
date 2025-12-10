export function exportToCsv({ filename = 'export.csv', headers = [], rows = [] }) {
  const escape = (val) => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }

  const csv = [headers.map(escape).join(',')]
  rows.forEach((row) => csv.push(row.map(escape).join(',')))
  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default exportToCsv
