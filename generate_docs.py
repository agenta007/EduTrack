#!/usr/bin/env python3
"""
Generate HTML source-code documentation for EduTrack.
Uses local Ollama (qwen3.6) to write a short summary for each file.

Usage:
    python3 generate_docs.py           # full run with AI summaries
    python3 generate_docs.py --no-ai   # skip AI, just syntax-highlight

Output: doc/source_index.html  +  doc/source/<rel_path>.html
Summaries are cached in doc/summaries.json so re-runs are fast.
"""

import argparse
import html
import json
import sys
import urllib.request
import urllib.error
from collections import defaultdict
from datetime import datetime
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

ROOT        = Path(__file__).parent
OUT_ROOT    = ROOT / "doc" / "source"
CACHE_FILE  = ROOT / "doc" / "summaries.json"

OLLAMA_HOST  = "http://192.168.1.2:11434"
OLLAMA_MODEL = "qwen3.6:35b-a3b-q4_K_M"

SOURCES = [
    (ROOT / "backend/e-journal/src/main/java", [".java"]),
    (ROOT / "frontend/src",                    [".jsx", ".js", ".css"]),
    (ROOT / "sql",                             [".sql"]),
]

# Max chars sent to the model (keeps prompts fast for large files)
MAX_CHARS = 6000

# ── Syntax highlighting ───────────────────────────────────────────────────────

JAVA_KEYWORDS = {
    "abstract","assert","boolean","break","byte","case","catch","char","class",
    "const","continue","default","do","double","else","enum","extends","final",
    "finally","float","for","goto","if","implements","import","instanceof","int",
    "interface","long","native","new","null","package","private","protected",
    "public","return","short","static","strictfp","super","switch","synchronized",
    "this","throw","throws","transient","try","var","void","volatile","while","true","false",
}
JS_KEYWORDS = {
    "break","case","catch","class","const","continue","debugger","default","delete",
    "do","else","export","extends","finally","for","function","if","import","in",
    "instanceof","let","new","null","return","super","switch","this","throw","try",
    "typeof","undefined","var","void","while","with","yield","async","await","of",
    "from","true","false","static",
}
SQL_KEYWORDS = {
    "SELECT","FROM","WHERE","INSERT","INTO","VALUES","UPDATE","SET","DELETE","CREATE",
    "TABLE","INDEX","DROP","ALTER","ADD","COLUMN","PRIMARY","KEY","FOREIGN","REFERENCES",
    "NOT","NULL","DEFAULT","CONSTRAINT","UNIQUE","ON","AND","OR","IN","IS","AS",
    "JOIN","LEFT","RIGHT","INNER","OUTER","GROUP","BY","ORDER","HAVING","DISTINCT",
    "IF","EXISTS","BEGIN","COMMIT","ROLLBACK","TRANSACTION","SERIAL","INTEGER","VARCHAR",
    "TEXT","BOOLEAN","DECIMAL","BIGINT","TIMESTAMP","DATE","TRUE","FALSE","CASCADE",
    "GRANT","REVOKE","TRUNCATE","WITH","RETURNING","LIKE","ILIKE","LIMIT","OFFSET",
}

LANG_MAP = {
    ".java": ("java", JAVA_KEYWORDS),
    ".jsx":  ("jsx",  JS_KEYWORDS),
    ".js":   ("js",   JS_KEYWORDS),
    ".css":  ("css",  set()),
    ".sql":  ("sql",  SQL_KEYWORDS),
}


def highlight(code: str, ext: str) -> str:
    import re
    lang, keywords = LANG_MAP.get(ext, ("", set()))
    lines = []
    for line in code.splitlines():
        escaped = html.escape(line)
        if not lang or lang == "css":
            lines.append(escaped)
            continue
        escaped = re.sub(
            r'(&quot;(?:[^&]|&(?!quot;))*&quot;|&#x27;[^&#]*&#x27;|`[^`]*`)',
            r'<span class="str">\1</span>', escaped)
        if lang == "sql":
            escaped = re.sub(r'(--.*)', r'<span class="cmt">\1</span>', escaped)
        else:
            escaped = re.sub(r'(//.*)', r'<span class="cmt">\1</span>', escaped)
        escaped = re.sub(r'(@\w+)', r'<span class="ann">\1</span>', escaped)
        escaped = re.sub(r'\b(\d+(?:\.\d+)?)\b', r'<span class="num">\1</span>', escaped)
        flags = re.IGNORECASE if lang == "sql" else 0
        def kw_replace(m):
            word = m.group(0)
            cmp  = word.upper() if lang == "sql" else word
            pool = {k.upper() for k in keywords} if lang == "sql" else keywords
            return f'<span class="kw">{word}</span>' if cmp in pool else word
        escaped = re.sub(r'\b[A-Za-z_]\w*\b', kw_replace, escaped, flags=flags)
        lines.append(escaped)
    return "\n".join(lines)

# ── Ollama ────────────────────────────────────────────────────────────────────

def ollama_summarize(rel_path: str, code: str) -> str:
    """Ask Ollama for a short plain-text summary of the file. Returns '' on error."""
    snippet = code[:MAX_CHARS]
    if len(code) > MAX_CHARS:
        snippet += "\n... (truncated)"

    prompt = (
        f"You are a senior software engineer writing concise documentation.\n"
        f"File: {rel_path}\n\n"
        f"Write a short (3–6 sentence) plain-English summary of what this file does, "
        f"its main classes/functions, and its role in the EduTrack school e-journal system. "
        f"Do NOT use markdown. Do NOT repeat the filename.\n\n"
        f"```\n{snippet}\n```"
    )

    payload = json.dumps({
        "model":  OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "think":  False,          # disable chain-of-thought for qwen3 thinking models
        "options": {"temperature": 0.2, "num_predict": 400},
    }).encode()

    req = urllib.request.Request(
        f"{OLLAMA_HOST}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.loads(resp.read())
            return data.get("response", "").strip()
    except Exception as exc:
        print(f"  [ollama error] {type(exc).__name__}: {exc}")
        return ""

# ── HTML templates ────────────────────────────────────────────────────────────

CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Arial, sans-serif; background: #0d1117; color: #c9d1d9;
       display: flex; height: 100vh; overflow: hidden; }
#sidebar { width: 290px; min-width: 200px; background: #161b22;
           border-right: 1px solid #30363d; overflow-y: auto; display: flex; flex-direction: column; }
#sidebar h2 { padding: 14px 16px; font-size: 12px; text-transform: uppercase;
              letter-spacing: .09em; color: #8b949e; border-bottom: 1px solid #30363d; flex-shrink: 0; }
.tree { padding: 8px 0; flex: 1; }
.tree summary { padding: 4px 12px; cursor: pointer; font-size: 12px; color: #8b949e;
                list-style: none; display: flex; align-items: center; gap: 6px; user-select: none; }
.tree summary:hover { background: #21262d; }
.tree summary::before { content: '▶'; font-size: 9px; transition: transform .15s; }
.tree details[open] > summary::before { transform: rotate(90deg); }
.tree a { display: block; padding: 3px 12px 3px 28px; font-size: 12px; color: #58a6ff;
          text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tree a:hover { background: #21262d; }
.tree a.active { background: #1f3a5f; color: #79c0ff; }
#main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
#file-header { padding: 10px 20px; background: #161b22; border-bottom: 1px solid #30363d;
               font-size: 13px; color: #8b949e; flex-shrink: 0; }
#file-header span { color: #c9d1d9; font-weight: 600; }
#code-wrap { flex: 1; overflow: auto; }
.index-page { padding: 32px; max-width: 860px; }
.index-page h1 { font-size: 24px; margin-bottom: 8px; }
.index-page p  { color: #8b949e; margin-bottom: 24px; }
.index-page h2 { font-size: 14px; color: #8b949e; text-transform: uppercase;
                 letter-spacing: .07em; margin: 24px 0 8px; }
.index-page ul { list-style: none; }
.index-page li { margin-bottom: 4px; }
.index-page li a { color: #58a6ff; font-size: 13px; text-decoration: none; }
.index-page li a:hover { text-decoration: underline; }
.summary-box { margin: 0; padding: 14px 20px; background: #161b22;
               border-bottom: 1px solid #30363d; font-size: 13px;
               color: #c9d1d9; line-height: 1.7; }
.summary-box .label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em;
                       color: #8b949e; margin-bottom: 6px; }
table.hl { border-collapse: collapse; width: 100%;
           font-family: 'JetBrains Mono','Fira Code',monospace; font-size: 13px; line-height: 1.6; }
table.hl tr:hover td { background: #161b22; }
td.ln   { width: 1%; min-width: 48px; padding: 0 16px 0 8px; text-align: right;
          color: #484f58; border-right: 1px solid #21262d; user-select: none; white-space: nowrap; }
td.code { padding: 0 20px; white-space: pre; }
.kw  { color: #ff7b72; }
.str { color: #a5d6ff; }
.cmt { color: #8b949e; font-style: italic; }
.ann { color: #ffa657; }
.num { color: #79c0ff; }
"""

FRAME_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>EduTrack — Source Docs</title>
<style>{css}</style>
</head>
<body>
<div id="sidebar">
  <h2>EduTrack Source</h2>
  <div class="tree">{tree}</div>
</div>
<div id="main">
  <div id="file-header">Select a file &nbsp;·&nbsp; Generated {date}</div>
  <div id="code-wrap"><div class="index-page">{index_body}</div></div>
</div>
<script>
const links = document.querySelectorAll('.tree a');
const header = document.getElementById('file-header');
const codeWrap = document.getElementById('code-wrap');
links.forEach(a => {{
  a.addEventListener('click', e => {{
    e.preventDefault();
    links.forEach(l => l.classList.remove('active'));
    a.classList.add('active');
    header.innerHTML = '<span>' + a.dataset.path + '</span>';
    fetch(a.href).then(r=>r.text()).then(t=>{{
      const m = t.match(/<div id="content">([\s\S]*)<\/div>/);
      codeWrap.innerHTML = m ? m[1] : t;
    }});
  }});
}});
</script>
</body>
</html>
"""

FILE_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>{title}</title>
<style>
{css}
/* Standalone overrides (no sidebar when opened directly) */
body {{ display: block; height: auto; overflow: auto; padding: 0; }}
#content {{ display: block; }}
</style>
</head>
<body>
<div id="content">
{summary_html}
<table class="hl"><tbody>
{rows}
</tbody></table>
</div>
</body>
</html>
"""

# ── Helpers ───────────────────────────────────────────────────────────────────

def build_tree_html(file_entries):
    groups = defaultdict(list)
    for abs_p, rel_str, out_p in file_entries:
        groups[Path(rel_str).parts[0]].append((rel_str, out_p))

    parts = []
    for group, items in sorted(groups.items()):
        sub = defaultdict(list)
        for rel_str, out_p in items:
            p = Path(rel_str).parts
            sub[p[1] if len(p) > 2 else ""].append((rel_str, out_p))

        parts.append(f'<details open><summary>{html.escape(group)}</summary>')
        for subkey, sitems in sorted(sub.items()):
            if subkey:
                parts.append(f'<details><summary>{html.escape(subkey)}</summary>')
            for rel_str, out_p in sorted(sitems, key=lambda x: x[0]):
                fname = Path(rel_str).name
                href  = out_p.relative_to(OUT_ROOT.parent).as_posix()
                parts.append(
                    f'<a href="../{href}" data-path="{html.escape(rel_str)}">'
                    f'{html.escape(fname)}</a>'
                )
            if subkey:
                parts.append('</details>')
        parts.append('</details>')
    return "\n".join(parts)


def generate_file_page(abs_path: Path, ext: str, summary: str) -> str:
    code        = abs_path.read_text(encoding="utf-8", errors="replace")
    highlighted = highlight(code, ext)
    rows = [
        f'<tr><td class="ln">{i}</td><td class="code">{line}</td></tr>'
        for i, line in enumerate(highlighted.splitlines(), 1)
    ]
    if summary:
        summary_html = (
            '<div class="summary-box">'
            '<div class="label">Summary</div>'
            + html.escape(summary)
            + '</div>'
        )
    else:
        summary_html = ""

    return FILE_HTML.format(
        title=abs_path.name,
        css=CSS,
        summary_html=summary_html,
        rows="\n".join(rows),
    )

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-ai", action="store_true", help="Skip Ollama summarization")
    #parser.add_argument("--regenerate-all", action="store_true", help="Regenerate all files")
    args = parser.parse_args()

    OUT_ROOT.mkdir(parents=True, exist_ok=True)

    # Load summary cache
    cache: dict[str, str] = {}
    if CACHE_FILE.exists():
        cache = json.loads(CACHE_FILE.read_text())

    # Collect source files
    file_entries = []
    for src_dir, exts in SOURCES:
        if not src_dir.exists():
            continue
        for abs_p in sorted(src_dir.rglob("*")):
            if abs_p.suffix in exts and abs_p.is_file():
                rel_str = abs_p.relative_to(ROOT).as_posix()
                out_p   = OUT_ROOT / (rel_str + ".html")
                file_entries.append((abs_p, rel_str, out_p))

    print(f"Found {len(file_entries)} source files")

    # Generate file pages
    for idx, (abs_p, rel_str, out_p) in enumerate(file_entries, 1):
        out_p.parent.mkdir(parents=True, exist_ok=True)

        summary = ""
        if rel_str in cache and cache[rel_str]:
            summary = cache[rel_str]
            print(f"  [{idx}/{len(file_entries)}] (cached) {rel_str}")
        elif not args.no_ai:
            print(f"  [{idx}/{len(file_entries)}] summarising {rel_str} ...", end=" ", flush=True)
            code    = abs_p.read_text(encoding="utf-8", errors="replace")
            summary = ollama_summarize(rel_str, code)
            cache[rel_str] = summary
            CACHE_FILE.write_text(json.dumps(cache, indent=2, ensure_ascii=False))
            print("done" if summary else "FAILED")
        else:
            print(f"  [{idx}/{len(file_entries)}] (no-ai, no cache) {rel_str}")

        page = generate_file_page(abs_p, abs_p.suffix, summary)
        out_p.write_text(page, encoding="utf-8")

    # Index
    groups = defaultdict(list)
    for abs_p, rel_str, out_p in file_entries:
        groups[Path(rel_str).parts[0]].append((rel_str, out_p))

    index_parts = [
        "<h1>EduTrack — Source Documentation</h1>",
        f"<p>{len(file_entries)} files &nbsp;·&nbsp; "
        f"Generated {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>",
    ]
    for group, items in sorted(groups.items()):
        index_parts.append(f"<h2>{html.escape(group)}</h2><ul>")
        for rel_str, out_p in sorted(items, key=lambda x: x[0]):
            href = out_p.relative_to(OUT_ROOT.parent).as_posix()
            index_parts.append(
                f'<li><a href="../{href}" data-path="{html.escape(rel_str)}">'
                f'{html.escape(rel_str)}</a></li>'
            )
        index_parts.append("</ul>")

    frame = FRAME_HTML.format(
        css=CSS,
        tree=build_tree_html(file_entries),
        date=datetime.now().strftime("%Y-%m-%d %H:%M"),
        index_body="\n".join(index_parts),
    )

    index_out = OUT_ROOT.parent / "source_index.html"
    index_out.write_text(frame, encoding="utf-8")
    print(f"\nIndex → {index_out}")
    print("Done.")


if __name__ == "__main__":
    main()
