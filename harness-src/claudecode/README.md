# Claude Code ハーネス一式 - 架空株式会社 在庫管理システム

デモ「AI駆動開発デモ」の Claude Code 版に登場した設定の完全版です。ページ上の表示は工程ごとの抜粋、この zip が統合済みの完全形です。プロジェクト直下に展開するとそのまま動く構成にしてあります。

## 展開方法

1. この中身をプロジェクトルートに配置する（CLAUDE.md・.claude/・.mcp.json がリポジトリ直下に来る）
2. Hooks スクリプトに実行権限を付ける: `chmod +x .claude/hooks/*.sh`
3. MCP を使う場合は環境変数を用意する: GITHUB_TOKEN / DD_API_KEY / DD_APP_KEY / SLACK_BOT_TOKEN（使わないサーバーは .mcp.json から消してよい）
4. `claude` を起動し、`/agents` でサブエージェント10体が見えることを確認する

## 構成

| パス | 役割 |
|------|------|
| CLAUDE.md | 全工程共通のプロジェクト規約（要求工学・ドキュメント・コーディング・テスト・Git運用） |
| .claude/settings.json | permissions（allow/deny）と Hooks（危険コマンド遮断・機密検知・WARN残りcommit拒否・typecheck/lint自動・テスト最終ガード） |
| .claude/agents/ | 工程別サブエージェント10体（req-extractor 〜 incident-responder） |
| .claude/commands/ | /extract-requirements 等のパイプラインコマンド |
| .claude/skills/ | rdd-template / simplify / security-review / postmortem |
| .claude/templates/ | user-story / adr / error-code の雛形 |
| .claude/hooks/ | block-dangerous.sh / check-secrets.sh |
| .claude/triggers/ | daily-health-check（毎朝9時の定期実行） |
| .mcp.json | GitHub / Playwright / Datadog / Slack の MCP サーバー定義 |

## 使い方の流れ（デモの10工程との対応）

1. `/extract-requirements transcripts/<文字起こし>.txt` で要求抽出とレビューまで完走
2. `/prioritize docs/01-requirements-raw.md` で MoSCoW 分類（迷いは AskUserQuestion で人間確認）
3. `/generate-rdd` 〜 `/detailed-design` で要件定義から詳細設計まで
4. `/implement-feature US-XXX` でブランチ作成から PR 作成まで（Hooks がガードレール）
5. `/full-review <PR番号>` で security / code / qa の3並列レビュー
6. `/incident-respond INC-YYYY-MM-DD` で障害対応と PostMortem

## 注意

- モデル名・ツール名はデモ作成時点のものです。導入時は各公式ドキュメントで最新の名称を確認してください
- 環境変数の実値をこのファイル群に直接書かないでください（check-secrets.sh が混入を検知します）
- 案件の固有名詞（架空株式会社・Oracle 11g 等）は自案件の内容に置き換えて使ってください
