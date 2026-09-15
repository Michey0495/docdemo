# Codex CLI ハーネス一式 - 架空株式会社 在庫管理システム

デモ「AI駆動開発デモ」の Codex 版に登場した設定の完全版です。ページ上の表示は工程ごとの抜粋、この zip が統合済みの完全形です。

## 展開方法

1. AGENTS.md・.codex/・templates/ をプロジェクトルートに配置する
2. _user-level/.codex/config.toml の内容を自分の ~/.codex/config.toml に追記する（MCPサーバー定義はユーザーレベル設定のため）
3. Hooks スクリプトに実行権限を付ける: `chmod +x .codex/hooks/*.sh`
4. MCP を使う場合は環境変数を用意する: GITHUB_TOKEN / DD_API_KEY / DD_APP_KEY / SLACK_BOT_TOKEN
5. `codex` を起動して動作を確認する

## 構成

| パス | 役割 |
|------|------|
| AGENTS.md | 全工程共通のプロジェクト規約（要求工学・ドキュメント・コーディング・テスト・Git運用） |
| .codex/config.toml | モデル・サンドボックス・承認ポリシー・Hooks（危険コマンド遮断・機密検知・typecheck/lint自動・テスト最終ガード）の統合版 |
| .codex/agents/ | 工程別エージェント定義10体（*.toml） |
| .codex/skills/ | extract-requirements 等のパイプラインスキル |
| .codex/hooks/ | block-dangerous.sh / check-secrets.sh |
| templates/ | user-story / adr / error-code の雛形 |
| _user-level/.codex/config.toml | ~/.codex/config.toml に追記する MCP サーバー定義（GitHub / Playwright / Datadog / Slack） |
| SETUP-NOTES.md | ファイルでなく外部スケジューラ等で行う設定（定期実行の launchd / cron 登録） |

## 注意

- モデル名・ツール名はデモ作成時点のものです。導入時は公式ドキュメントで最新の名称を確認してください
- 環境変数の実値をこのファイル群に直接書かないでください（check-secrets.sh が混入を検知します）
- 案件の固有名詞（架空株式会社・Oracle 11g 等）は自案件の内容に置き換えて使ってください
