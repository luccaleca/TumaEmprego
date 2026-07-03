function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function bodyToHtml(body) {
  const lines = String(body ?? "").split("\n");
  let html = "";
  let inList = false;

  function closeList() {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      closeList();
      html += `<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`;
      continue;
    }

    if (trimmed.startsWith("- ")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${inlineMarkdown(trimmed.slice(2))}</li>`;
      continue;
    }

    closeList();
    html += `<p>${inlineMarkdown(trimmed)}</p>`;
  }

  closeList();
  return html;
}

function preambleToHtml(preamble) {
  const lines = String(preamble ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim()
    .split("\n");

  let html = "";
  let inQuote = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("# ")) {
      html += `<h1>${inlineMarkdown(trimmed.slice(2))}</h1>`;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      if (!inQuote) {
        html += "<div class=\"lead\">";
        inQuote = true;
      }
      html += `<p>${inlineMarkdown(trimmed.slice(2))}</p>`;
      continue;
    }

    if (inQuote) {
      html += "</div>";
      inQuote = false;
    }

    html += `<p class="meta">${inlineMarkdown(trimmed)}</p>`;
  }

  if (inQuote) html += "</div>";
  return html;
}

const CV_STYLES = `
  @page { size: A4; margin: 14mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    font-size: 10.5pt;
    line-height: 1.45;
    color: #18181b;
    margin: 0;
    padding: 0;
  }
  h1 {
    font-size: 20pt;
    font-weight: 700;
    margin: 0 0 6px;
    letter-spacing: -0.02em;
  }
  .lead p {
    margin: 0 0 4px;
    color: #3f3f46;
    font-size: 10pt;
  }
  .meta {
    margin: 2px 0 10px;
    font-size: 9.5pt;
    color: #52525b;
  }
  h2 {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #047857;
    border-bottom: 1px solid #d4d4d8;
    padding-bottom: 3px;
    margin: 14px 0 8px;
  }
  h3 {
    font-size: 10.5pt;
    font-weight: 600;
    margin: 10px 0 2px;
    color: #27272a;
  }
  p { margin: 0 0 5px; }
  ul {
    margin: 4px 0 8px;
    padding-left: 1.1rem;
  }
  li { margin-bottom: 3px; }
  strong { font-weight: 600; }
  section { break-inside: avoid-page; }
`;

export function buildCvHtml(rawMarkdown) {
  const cleaned = String(rawMarkdown ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();

  const parts = cleaned.split(/^## /m);
  const preamble = parts[0]?.trim() ?? "";
  const sections = parts.slice(1).map((part) => {
    const nl = part.indexOf("\n");
    return {
      title: part.slice(0, nl).trim(),
      body: part.slice(nl + 1).trim(),
    };
  });

  const sectionsHtml = sections
    .filter((s) => s.title)
    .map(
      (s) =>
        `<section><h2>${escapeHtml(s.title)}</h2>${bodyToHtml(s.body)}</section>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Currículo</title>
  <style>${CV_STYLES}</style>
</head>
<body>
  ${preambleToHtml(preamble)}
  ${sectionsHtml}
</body>
</html>`;
}
