import { mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const logoDataUri = `data:image/png;base64,${(await readFile(resolve(root, 'public/logo.png'))).toString('base64')}`

const documents = [
  {
    source: 'docs/legal/termos-de-uso.md',
    output: 'public/legal/termos_uso_icuide.pdf',
  },
  {
    source: 'docs/legal/politica-de-privacidade-lgpd.md',
    output: 'public/legal/politica_privacidade_icuide.pdf',
  },
  {
    source: 'docs/legal/termo-de-consentimento-dados-documentos.md',
    output: 'public/legal/termo_consentimento_icuide.pdf',
  },
  {
    source: 'docs/legal/politica-de-cookies.md',
    output: 'public/legal/politica_cookies_icuide.pdf',
  },
]

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function inlineMarkdown(value) {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

function flushList(html, listItems) {
  if (listItems.length === 0) return
  html.push('<ul>')
  for (const item of listItems.splice(0)) {
    html.push(`<li>${inlineMarkdown(item)}</li>`)
  }
  html.push('</ul>')
}

function flushTable(html, tableRows) {
  if (tableRows.length === 0) return
  const rows = tableRows.splice(0).map((row) => row.split('|').slice(1, -1).map((cell) => cell.trim()))
  const [head, separator, ...body] = rows
  if (!head || !separator) return
  html.push('<table><thead><tr>')
  for (const cell of head) html.push(`<th>${inlineMarkdown(cell)}</th>`)
  html.push('</tr></thead><tbody>')
  for (const row of body) {
    html.push('<tr>')
    for (const cell of row) html.push(`<td>${inlineMarkdown(cell)}</td>`)
    html.push('</tr>')
  }
  html.push('</tbody></table>')
}

function markdownToHtml(markdown) {
  const html = []
  const listItems = []
  const tableRows = []
  const lines = markdown.replaceAll('\r\n', '\n').split('\n')

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushList(html, listItems)
      flushTable(html, tableRows)
      continue
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      flushList(html, listItems)
      tableRows.push(line)
      continue
    }

    flushTable(html, tableRows)

    if (line.startsWith('- ')) {
      listItems.push(line.slice(2))
      continue
    }

    flushList(html, listItems)

    if (line.startsWith('### ')) {
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`)
    } else if (line.startsWith('## ')) {
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`)
    } else if (line.startsWith('# ')) {
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`)
    } else if (line.startsWith('> ')) {
      html.push(`<aside>${inlineMarkdown(line.slice(2))}</aside>`)
    } else {
      html.push(`<p>${inlineMarkdown(line)}</p>`)
    }
  }

  flushList(html, listItems)
  flushTable(html, tableRows)
  return html.join('\n')
}

function pageTemplate(body) {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: A4; margin: 18mm 16mm 18mm; }
      * { box-sizing: border-box; }
      body {
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 11px;
        line-height: 1.52;
        margin: 0;
      }
      header {
        align-items: center;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        gap: 10px;
        margin-bottom: 18px;
        padding-bottom: 10px;
      }
      header img {
        height: 26px;
        object-fit: contain;
        width: 26px;
      }
      header span { font-size: 14px; font-weight: 700; }
      h1 {
        color: #0f172a;
        font-size: 22px;
        line-height: 1.18;
        margin: 0 0 10px;
        page-break-after: avoid;
      }
      h2 {
        color: #0f172a;
        font-size: 14px;
        line-height: 1.25;
        margin: 18px 0 7px;
        page-break-after: avoid;
      }
      h3 {
        color: #1f2937;
        font-size: 12px;
        margin: 14px 0 6px;
        page-break-after: avoid;
      }
      p { margin: 0 0 7px; }
      ul { margin: 0 0 8px 17px; padding: 0; }
      li { margin: 0 0 4px; }
      aside {
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        color: #475569;
        margin: 10px 0 14px;
        padding: 10px 12px;
      }
      table {
        border-collapse: collapse;
        font-size: 9.5px;
        margin: 8px 0 12px;
        page-break-inside: avoid;
        width: 100%;
      }
      th, td {
        border: 1px solid #d1d5db;
        padding: 5px;
        text-align: left;
        vertical-align: top;
      }
      th { background: #f1f5f9; font-weight: 700; }
      strong { font-weight: 700; }
    </style>
  </head>
  <body>
    <header>
      <img src="${logoDataUri}" alt="" />
      <span>icuide</span>
    </header>
    <main>${body}</main>
  </body>
</html>`
}

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const document of documents) {
    const markdown = await readFile(resolve(root, document.source), 'utf8')
    const html = pageTemplate(markdownToHtml(markdown))
    const output = resolve(root, document.output)

    await page.setContent(html, { waitUntil: 'load' })
    await mkdir(dirname(output), { recursive: true })
    await page.pdf({
      path: output,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      footerTemplate:
        '<div style="width:100%;font-family:Arial,sans-serif;font-size:8px;color:#64748b;padding:0 16mm;text-align:right;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>',
      headerTemplate: '<div></div>',
      margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' },
    })
  }
} finally {
  await browser.close()
}
