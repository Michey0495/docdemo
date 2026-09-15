# GitHub Copilot ハーネス一式 - 架空株式会社 在庫管理システム

デモ「AI駆動開発デモ」の GitHub Copilot 版に登場した設定の完全版です。ページ上の表示は工程ごとの抜粋、この zip が統合済みの完全形です。VS Code + GitHub の組み合わせでそのまま動く構成にしてあります。

## 展開方法

1. .github/・.vscode/ をプロジェクトルートに配置して push する
2. VS Code の Copilot Chat でモードピッカーを開き、カスタムチャットモード10体が見えることを確認する
3. リポジトリ設定で有効化する: Secret scanning + Push protection / Copilot Code Review の必須化 / ci.yml と docs-quality-gate.yml を required チェックに設定（SETUP-NOTES.md 参照）
4. MCP を使う場合は VS Code の「MCP: Add Server」または .vscode/mcp.json を確認する（Datadog / Slack のキーは起動時にプロンプト入力）

## 構成

| パス | 役割 |
|------|------|
| .github/copilot-instructions.md | 全チャットに自動適用されるプロジェクト規約（要求工学・ドキュメント・コーディング・テスト・Git運用） |
| .github/chatmodes/ | カスタムチャットモード10体（*.chatmode.md） |
| .github/prompts/ | /extract-requirements 等のプロンプトファイル（*.prompt.md） |
| .github/instructions/ | applyTo 付きのパス別指示（rdd-template / simplify / security-review / postmortem） |
| .github/workflows/ | ci.yml（品質ゲート）/ docs-quality-gate.yml（WARN残りmerge拒否）/ iac-guard.yml / daily-health-check.yml |
| .github/copilot-code-review-instructions.md | Copilot Code Review への観点指示 |
| .github/templates/ | user-story / adr / error-code の雛形 |
| .vscode/settings.json | エージェントモード有効化・ターミナル自動承認リスト・プロンプト/モード検索場所の統合版 |
| .vscode/mcp.json | GitHub（リモートHTTP）/ Playwright / Datadog / Slack の MCP サーバー定義 |
| SETUP-NOTES.md | ファイルでなくリポジトリ設定画面で行う項目（Secret scanning 等） |

## 注意

- モデル名・設定キーはデモ作成時点のものです。導入時は公式ドキュメントで最新の名称を確認してください
- 機密値はコミットせず、GitHub Secrets と mcp.json の promptString 入力を使ってください
- 案件の固有名詞（架空株式会社・Oracle 11g 等）は自案件の内容に置き換えて使ってください
