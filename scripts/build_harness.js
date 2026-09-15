// 各バージョンの data.js から configFiles を実ファイルに展開し、
// harness-src/<ver>/ の手書き統合版で上書きして <ver>/<ver>-harness.zip を作る。
// data.js の表示（抜粋）と配布物（完全版）の同期はこのスクリプトが担う。
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSIONS = ['claudecode', 'codex', 'cursor', 'copilot', 'browser'];
const BUILD_ROOT = 'harness-build';
const SRC_ROOT = 'harness-src';

// 表示用pathを実ファイルパスへ正規化。ファイルにならないものは null
function normalizePath(raw) {
  const cleaned = raw.replace(/（[^）]*）/g, '').trim();
  // 日本語・空白・コロンが残る場合はファイルではなく運用手順
  if (!/^[\w.~/@-]+$/.test(cleaned)) return null;
  if (cleaned.startsWith('~/')) return path.join('_user-level', cleaned.slice(2));
  return cleaned;
}

// browser 版は全項目がプロンプト・指示文なので prompts/ 配下に連番mdで展開
function browserFileName(phaseNum, idx, title) {
  const safe = title
    .replace(/[「」『』（）()：:／/]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return path.join('prompts', `${phaseNum}-${String(idx + 1).padStart(2, '0')}-${safe}.md`);
}

function loadPhases(version) {
  const src = fs.readFileSync(path.join(version, 'data.js'), 'utf8');
  const fn = new Function(src + '\nreturn { PHASES, PROJECT };');
  return fn.call({});
}

function copyDirOver(srcDir, dstDir) {
  if (!fs.existsSync(srcDir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      count += copyDirOver(s, d);
    } else {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.copyFileSync(s, d);
      count += 1;
    }
  }
  return count;
}

fs.rmSync(BUILD_ROOT, { recursive: true, force: true });

for (const v of VERSIONS) {
  const { PHASES } = loadPhases(v);
  const outDir = path.join(BUILD_ROOT, `${v}-harness`);
  fs.mkdirSync(outDir, { recursive: true });

  const setupNotes = [];
  const written = new Map(); // 正規化path -> 出現回数（複数抜粋の検知用）

  PHASES.forEach((phase) => {
    (phase.configFiles || []).forEach((f, idx) => {
      let rel = v === 'browser'
        ? browserFileName(phase.num, idx, f.path.replace(/（[^）]*）/g, '').trim())
        : normalizePath(f.path);
      if (rel === null) {
        setupNotes.push(`## 工程${phase.num} ${phase.title} — ${f.path}\n\n${f.body}\n`);
        return;
      }
      const dst = path.join(outDir, rel);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      const header = v === 'browser' ? `# ${f.path}\n\n` : '';
      if (written.has(rel)) {
        // 同一ファイルへの複数抜粋は区切りを入れて連結（統合版 override が上書きする想定）
        fs.appendFileSync(dst, `\n\n<!-- ===== 工程${phase.num} ${phase.title} の抜粋 ===== -->\n${f.body}\n`);
        written.set(rel, written.get(rel) + 1);
      } else {
        fs.writeFileSync(dst, header + f.body + '\n');
        written.set(rel, 1);
      }
    });
  });

  if (setupNotes.length) {
    fs.writeFileSync(path.join(outDir, 'SETUP-NOTES.md'),
      `# ファイルではなく設定画面・外部サービス側で行う項目\n\n${setupNotes.join('\n')}`);
  }

  const overridden = copyDirOver(path.join(SRC_ROOT, v), outDir);

  const multi = [...written.entries()].filter(([, n]) => n > 1).map(([p]) => p);
  console.log(`${v}: files=${written.size} setupNotes=${setupNotes.length} overrides=${overridden}`);
  if (multi.length) console.log(`  複数抜粋(要統合): ${multi.join(', ')}`);

  // zip 化（zip内は <ver>-harness/ を1階層かませる）
  const zipName = `${v}-harness.zip`;
  const zipPath = path.join(v, zipName);
  fs.rmSync(zipPath, { force: true });
  execSync(`cd ${BUILD_ROOT} && zip -qr ../${zipPath} ${v}-harness`, { stdio: 'inherit' });
  const size = fs.statSync(zipPath).size;
  console.log(`  -> ${zipPath} (${(size / 1024).toFixed(1)} KB)`);
}
