# CLAUDE.md から codex 版 AGENTS.md / copilot 版 copilot-instructions.md を派生生成する
# 規約の中身は3ツールで共通。差分は「誰がいつ読むか」とファイル参照先だけ
base = open('harness-src/claudecode/CLAUDE.md').read()
body = base.split('\n', 3)[3]  # 先頭のタイトル+読み込み説明の段落を除いた本文

CODEX_HEAD = """# 架空株式会社 在庫管理システム - プロジェクト規約

Codex CLI はセッション開始時にこの AGENTS.md を読み込む。要求抽出から保守運用までの共通規約をここに集約し、工程固有の手順は .codex/agents/（専門エージェント）と .codex/skills/（パイプライン）に分離する。
"""
codex = CODEX_HEAD + body
codex = codex.replace('.claude/templates/', 'templates/')
codex = codex.replace('.claude/skills/rdd-template', '.codex/skills/rdd-template.md')
codex = codex.replace('req-reviewer サブエージェント', 'req-reviewer エージェント')
codex = codex.replace('別のサブエージェントでレビューする（生成した本人によるセルフレビュー禁止）', '別のエージェントでレビューする（生成した本人によるセルフレビュー禁止）')
codex = codex.replace('PreToolUse Hook が拒否する', 'PreToolUse Hook（.codex/config.toml）が拒否する')
codex = codex.replace('（PostToolUse Hook が自動実行）', '（PostToolUse Hook が自動実行、.codex/config.toml）')
codex = codex.replace('迷いは AskUserQuestion で人間確認', '迷いは人間への確認質問')
open('harness-src/codex/AGENTS.md', 'w').write(codex)

COPILOT_HEAD = """# 架空株式会社 在庫管理システム - プロジェクト規約

GitHub Copilot はこの .github/copilot-instructions.md をリポジトリ内の全チャットに自動適用する。要求抽出から保守運用までの共通規約をここに集約し、工程固有の手順は .github/chatmodes/（カスタムチャットモード）と .github/prompts/（プロンプトファイル）に分離する。
"""
cop = COPILOT_HEAD + body
cop = cop.replace('.claude/templates/', '.github/templates/')
cop = cop.replace('.claude/skills/rdd-template', '.github/instructions/rdd-template.instructions.md')
cop = cop.replace('req-reviewer サブエージェントが自動レビュー。WARN/ERROR が残ったままの commit は PreToolUse Hook が拒否する',
                  'req-reviewer モードでレビュー。WARN/ERROR が残ったままの merge は GitHub Actions（docs-quality-gate.yml）が拒否する')
cop = cop.replace('commit 前に typecheck / lint が通っていること（PostToolUse Hook が自動実行）',
                  'merge 前に typecheck / lint / test が通っていること（.github/workflows/ci.yml を required チェックに設定）')
cop = cop.replace('危険コマンド（push --force / reset --hard / rm -rf / sudo）は Hook で遮断済み。必要な場合は人間が実行する',
                  '危険コマンドは .vscode/settings.json の chat.tools.terminal.autoApprove で false 指定（必ず人間承認）。機密値の push はリポジトリ側の Push protection が拒否する')
cop = cop.replace('生成物は必ず別のサブエージェントでレビューする（生成した本人によるセルフレビュー禁止）',
                  '生成物は必ず別のチャットモードでレビューする（生成した本人によるセルフレビュー禁止）')
cop = cop.replace('実装PRは /full-review で security-review / code-reviewer / qa-engineer を並列実行',
                  '実装PRは Copilot Code Review（自動）に加え /full-review で3観点レビューを実行')
cop = cop.replace('迷いは AskUserQuestion で人間確認', '迷いは選択肢付きの質問返しで人間確認')
open('harness-src/copilot/.github/copilot-instructions.md', 'w').write(cop)
print('AGENTS.md:', len(codex), 'chars / copilot-instructions.md:', len(cop), 'chars')
