#!/usr/bin/env python3
"""Keep the planner's code small and clean. Zero dependencies. From the repo root:

    python3 tools/structure/check.py                   # report
    python3 tools/structure/check.py --strict          # exit 1 on a new finding or a stale baseline (CI)
    python3 tools/structure/check.py --update-baseline # accept today's state

Checks:
  big-file   a source file (js, css, html, py) over 500 lines. Files already
             over it are in baseline.json with their size: they may shrink,
             never grow.
  dead-code  a top-level function or const in js/ that no file names.
             Code kept on purpose for later is listed in KEEP below.
  dead-css   a class in styles.css that neither the app (js/) nor index.html names.
"""
from __future__ import annotations

import argparse, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASELINE = Path(__file__).with_name("baseline.json")
MAX_LINES = 500
# Kept on purpose: the promo cards come back when the Growth Skills sales page exists.
KEEP = {"promo", "variantCard", "VARIANT_URL", "SKILL", "SKILL_URL"}


def tracked() -> list[Path]:
    out = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return [ROOT / p for p in out.splitlines() if (ROOT / p).exists()]


def rel(p: Path) -> str:
    return p.relative_to(ROOT).as_posix()


def code_only(s: str) -> str:
    """JS with comments and string text removed; template ${...} code kept."""
    out, i, n, mode, depth = [], 0, len(s), ["code"], [0]
    while i < n:
        c = s[i]
        if mode[-1] == "tpl":
            if c == "\\":
                i += 2; continue
            if c == "`":
                mode.pop(); i += 1; continue
            if s.startswith("${", i):
                mode.append("code"); depth.append(0); i += 2; out.append(" "); continue
            i += 1; continue
        if s.startswith("//", i):
            j = s.find("\n", i); i = n if j < 0 else j; continue
        if s.startswith("/*", i):
            j = s.find("*/", i + 2); i = n if j < 0 else j + 2; continue
        if c in "'\"":
            i += 1
            while i < n and s[i] != c:
                i += 2 if s[i] == "\\" else 1
            i += 1; out.append(" "); continue
        if c == "`":
            mode.append("tpl"); i += 1; out.append(" "); continue
        if c == "{":
            depth[-1] += 1
        if c == "}":
            if depth[-1] == 0 and len(mode) > 1:
                mode.pop(); depth.pop(); i += 1; continue
            depth[-1] -= 1
        out.append(c); i += 1
    return "".join(out)


def big_files() -> dict[str, int]:
    out = {}
    for p in tracked():
        if p.suffix in (".js", ".css", ".html", ".py"):
            n = sum(1 for _ in p.open(encoding="utf-8"))
            if n > MAX_LINES:
                out[rel(p)] = n
    return out


def dead_code() -> list[str]:
    files = {p: p.read_text(encoding="utf-8") for p in (ROOT / "js").glob("*.js")}
    code = {p: code_only(t) for p, t in files.items()}
    decl = re.compile(r"^(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|(?:const|let)\s+(\w+)\s*=)", re.M)
    out = []
    for p, text in files.items():
        for m in decl.finditer(text):
            name = m.group(1) or m.group(2)
            if name in KEEP:
                continue
            # a name after a lone "." is a property, after "..." it is a spread of the name
            pat = re.compile(r"(?<![\w$])(?:(?<=\.\.\.)|(?<!\.))" + re.escape(name) + r"(?![\w$])")
            uses = sum(len(pat.findall(c)) for c in code.values())
            imports = sum(len(re.findall(r"import\s*\{[^}]*\b" + re.escape(name) + r"\b", t)) for t in files.values())
            if uses - imports <= 1:
                out.append(f"{rel(p)}:{name}")
    return sorted(out)


def dead_css() -> list[str]:
    css = re.sub(r"/\*.*?\*/", "", (ROOT / "styles.css").read_text(encoding="utf-8"), flags=re.S)
    selectors = re.sub(r"\{[^{}]*\}", "{}", css)
    names = set(re.findall(r"\.([a-zA-Z][\w-]*)", selectors))
    page = "\n".join(p.read_text(encoding="utf-8") for p in [*(ROOT / "js").glob("*.js"), ROOT / "index.html", ROOT / "404.html"])
    return sorted(f"styles.css:.{n}" for n in names if not re.search(r"(?<![\w-])" + re.escape(n) + r"(?![\w-])", page))


def collect() -> dict:
    return {"big-file": big_files(), "dead-code": dead_code(), "dead-css": dead_css()}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true")
    ap.add_argument("--update-baseline", action="store_true")
    args = ap.parse_args()
    now = collect()
    if args.update_baseline:
        BASELINE.write_text(json.dumps(now, indent=2) + "\n", encoding="utf-8")
        print(f"baseline written: {rel(BASELINE)}")
        return 0
    base = json.loads(BASELINE.read_text(encoding="utf-8")) if BASELINE.exists() else {}
    new, stale = 0, []
    for code, items in now.items():
        known = base.get(code, {} if code == "big-file" else [])
        if code == "big-file":
            fresh = [f"{f} {n} lines (limit {MAX_LINES}" + (f", was {known[f]})" if f in known else ")")
                     for f, n in items.items() if f not in known or n > known[f]]
            stale += [f for f, n in known.items() if items.get(f, 0) < n]
        else:
            fresh = [i for i in items if i not in known]
            stale += [i for i in known if i not in items]
        for f in fresh:
            print(f"::error::{code}: {f}" if args.strict else f"{code}: {f}")
        new += len(fresh)
        print(f"{code}: {len(items)} total, {len(fresh)} new")
    if stale:
        print(f"baseline lists {len(stale)} item(s) already fixed or smaller: run --update-baseline")
    return 1 if args.strict and (new or stale) else 0


if __name__ == "__main__":
    sys.exit(main())
