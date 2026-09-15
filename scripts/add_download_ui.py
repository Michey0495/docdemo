# 各バージョンのヒーローにハーネスDLボタン、ハブにDLセクションを追加する
VERSIONS = {
    'claudecode': ('claudecode-harness.zip', 'CLAUDE.md・サブエージェント10体・Hooks・MCP 設定の統合完全版'),
    'codex':      ('codex-harness.zip', 'AGENTS.md・エージェント定義・config.toml・MCP 設定の統合完全版'),
    'cursor':     ('cursor-harness.zip', 'Project Rules・Custom Modes・husky Hooks・MCP 設定の統合完全版'),
    'copilot':    ('copilot-harness.zip', 'copilot-instructions・チャットモード・prompt files・Actions の統合完全版'),
    'browser':    ('browser-harness.zip', '4ツール分のカスタム指示・テンプレートプロンプト・定期ルーチン全文'),
}

ANCHOR = """        <div class="scenario-meta" id="scenario-meta"></div>
      </div>
    </section>"""

BTN_TMPL = """        <div class="scenario-meta" id="scenario-meta"></div>
      </div>

      <a class="hero-download" href="{zip}" download>
        <span class="hero-download-text">
          <span class="hero-download-label">このページのハーネス一式をダウンロード（ZIP）</span>
          <span class="hero-download-sub">{sub}</span>
        </span>
        <span class="hero-download-arrow" aria-hidden="true"></span>
      </a>
    </section>"""

CSS = """
/* ---- ハーネス一式ダウンロード ---- */
.hero-download {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
  padding: 14px 20px;
  border: 1px solid var(--ink-2);
  border-radius: var(--r);
  background: var(--bg);
  transition: all var(--t);
}
.hero-download:hover {
  background: var(--ink);
  border-color: var(--ink);
}
.hero-download-text { display: flex; flex-direction: column; gap: 2px; }
.hero-download-label { font-size: 14px; font-weight: 700; color: var(--ink); }
.hero-download-sub { font-size: 12px; color: var(--ink-3); }
.hero-download:hover .hero-download-label { color: #fff; }
.hero-download:hover .hero-download-sub { color: rgba(255, 255, 255, 0.72); }
.hero-download-arrow {
  flex: 0 0 auto;
  width: 10px; height: 10px;
  border-right: 2px solid var(--ink-2);
  border-bottom: 2px solid var(--ink-2);
  transform: rotate(45deg);
  transition: all var(--t);
}
.hero-download:hover .hero-download-arrow { border-color: #fff; }
"""

for v, (zip_name, sub) in VERSIONS.items():
    p = f'{v}/index.html'
    s = open(p).read()
    assert s.count(ANCHOR) == 1, f'{v}: anchor count={s.count(ANCHOR)}'
    s = s.replace(ANCHOR, BTN_TMPL.format(zip=zip_name, sub=sub))
    open(p, 'w').write(s)

    cp = f'{v}/styles.css'
    cs = open(cp).read()
    if '.hero-download' not in cs:
        open(cp, 'a').write(CSS)
    print(v, 'OK')

# ---- ハブ: カードグリッドの下にDLセクション ----
HUB_ANCHOR = """    <div class="footer">"""
HUB_DL = """    <div class="dl-section">
      <div class="dl-head">ハーネス一式のダウンロード</div>
      <p class="dl-note">各ページに登場する設定ファイルの統合完全版です。展開してプロジェクト直下に置くと、そのまま同じ運用を再現できます。</p>
      <div class="dl-links">
        <a href="./claudecode/claudecode-harness.zip" download>Claude Code 版</a>
        <a href="./codex/codex-harness.zip" download>Codex CLI 版</a>
        <a href="./cursor/cursor-harness.zip" download>Cursor 版</a>
        <a href="./browser/browser-harness.zip" download>ブラウザAIチャット版</a>
        <a href="./copilot/copilot-harness.zip" download>GitHub Copilot 版</a>
      </div>
    </div>

    <div class="footer">"""

HUB_CSS = """    .dl-section{margin-top:40px;border:1px solid var(--line);border-radius:var(--r-lg);padding:24px 26px;background:var(--bg-soft);}
    .dl-head{font-size:15px;font-weight:800;margin-bottom:6px;}
    .dl-note{font-size:13px;color:var(--ink-3);margin:0 0 14px;}
    .dl-links{display:flex;flex-wrap:wrap;gap:10px;}
    .dl-links a{font-size:13px;font-weight:700;padding:9px 16px;border:1px solid var(--ink-2);border-radius:999px;background:var(--bg);transition:all var(--t);}
    .dl-links a:hover{background:var(--ink);color:#fff;border-color:var(--ink);}
"""

p = 'index.html'
s = open(p).read()
assert s.count(HUB_ANCHOR) == 1, f'hub anchor={s.count(HUB_ANCHOR)}'
s = s.replace(HUB_ANCHOR, HUB_DL)
s = s.replace('    .footer{margin-top:64px;', HUB_CSS + '    .footer{margin-top:64px;')
open(p, 'w').write(s)
print('hub OK')
