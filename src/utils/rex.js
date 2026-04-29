export function extractXhidFromHtml(html) {
  const match = html.match(/<input[^>]*id=["']xhid["'][^>]*value=["']([^"']*)["']/i)
  return match ? match[1] : null
}

export function extractOtherFromHtml(html) {
  const regex = /<td[^>]*colspan=["']8["'][^>]*>([\s\S]*?)<\/td>/i
  const match = html.match(regex)
  if (!match) return []
  let fullText = match[1].replace(/\s+/g, '')
  const items = []
  const parts = fullText.split('实践环节：')
  for (let i = 1; i < parts.length; i++) {
    const endIdx = parts[i].indexOf('人；')
    if (endIdx !== -1) {
      items.push(parts[i].substring(0, endIdx + 2))
    }
  }
  return items
}