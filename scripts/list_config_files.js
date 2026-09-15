// 各バージョンの data.js から configFiles の kind/path 一覧を抽出する
const fs = require('fs');
const versions = ['claudecode', 'codex', 'cursor', 'copilot', 'browser'];
for (const v of versions) {
  console.log(`=== ${v} ===`);
  const src = fs.readFileSync(`${v}/data.js`, 'utf8');
  const sandbox = {};
  // data.js は const 宣言のみなので Function で評価して PHASES を取り出す
  const fn = new Function(src + '\nreturn { PHASES };');
  const { PHASES } = fn.call(sandbox);
  const seen = new Set();
  PHASES.forEach((p, i) => {
    (p.configFiles || []).forEach((f) => {
      const key = `${f.kind} | ${f.path}`;
      if (!seen.has(key)) {
        seen.add(key);
        console.log(String(i + 1).padStart(2, '0'), key);
      }
    });
  });
}
