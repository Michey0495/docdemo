# Cursor ハーネス一式 - 架空株式会社 在庫管理システム

デモ「AI駆動開発デモ」の Cursor 版に登場した設定の完全版です。ページ上の表示は工程ごとの抜粋、この zip が統合済みの完全形です。

## 展開方法

1. .cursor/・.husky/・templates/・package.json の該当設定をプロジェクトルートに配置する
2. _user-level/ 配下（個人用 Notepads と Datadog / Slack MCP）は自分のホームディレクトリ側 ~/.cursor/ に反映する
3. husky を有効化する: `npx husky init`（.husky/ のスクリプトに実行権限が付いているか確認）
4. MCP を使う場合は環境変数を用意する: GITHUB_TOKEN / DD_API_KEY / DD_APP_KEY / SLACK_BOT_TOKEN
5. Cursor でプロジェクトを開き、Rules と Custom Modes が読み込まれていることを設定画面で確認する

## 構成

| パス | 役割 |
|------|------|
| .cursor/rules/ | Project Rules（req-engineering / doc-conventions / coding-standards の *.mdc） |
| .cursor/modes/ | Custom Modes 10体（req-extractor 〜 incident-responder の *.json） |
| .cursor/notepads/ | パイプラインの手順書（extract-requirements 等） |
| .cursor/settings.json | Auto-Run・書込スコープ・危険コマンド確認・並列実行の統合版 |
| .cursor/mcp.json | GitHub / Playwright の MCP サーバー定義（プロジェクト範囲） |
| .husky/ | pre-commit（WARN残り拒否）/ post-commit（IaC変更検知）/ scripts（危険コマンド・機密検知） |
| package.json | lint-staged + husky の統合設定 |
| templates/ | user-story / adr / error-code の雛形 |
| _user-level/ | ~/.cursor/ に置く個人用 Notepads と Datadog / Slack MCP |
| SETUP-NOTES.md | ファイルでなく外部スケジューラ等で行う設定（定期実行の登録） |

## 注意

- モデル名・設定キーはデモ作成時点のものです。導入時は公式ドキュメントで最新の名称を確認してください
- 環境変数の実値をこのファイル群に直接書かないでください（check-secrets.mjs が混入を検知します）
- 案件の固有名詞（架空株式会社・Oracle 11g 等）は自案件の内容に置き換えて使ってください
