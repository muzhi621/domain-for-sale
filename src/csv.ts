// 极简 CSV 解析（支持引号转义与逗号分隔）
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (!lines.length) return []
  const headers = splitCSVLine(lines[0]).map((h) => h.trim())
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVLine(lines[i])
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => (obj[h] = (cells[idx] ?? '').trim()))
    rows.push(obj)
  }
  return rows
}

function splitCSVLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inq = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inq && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inq = !inq
      }
    } else if (ch === ',' && !inq) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}
