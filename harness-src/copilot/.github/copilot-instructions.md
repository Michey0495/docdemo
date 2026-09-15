# 架空株式会社 在庫管理システム - プロジェクト規約

GitHub Copilot はこの .github/copilot-instructions.md をリポジトリ内の全チャットに自動適用する。要求抽出から保守運用までの共通規約をここに集約し、工程固有の手順は .github/chatmodes/（カスタムチャットモード）と .github/prompts/（プロンプトファイル）に分離する。

## プロジェクト概要

- 顧客: 架空株式会社（電子部品の専門商社・東京3拠点・社員120名）
- 対象: Excel在庫管理（12,000SKU・台帳3本）の刷新。バーコード入出庫、スマホ在庫照会、既存販売管理とのCSV連携
- 制約: 予算 年額1,500万円以内。リリース期限はリースPC満了（来年9月）。情シス2名のため運用は外部化前提
- ステークホルダー: 山本社長（ROI判断・最終決裁）/ 田中物流部長（現場運用・最終受入）/ 佐藤情シス（既存連携・運用引取）

## 技術スタック（ADR-0001〜0008 で決定済み）

- Next.js 15 (App Router) / TypeScript strict / PostgreSQL (Supabase)
- 認証: Auth.js + SAML2.0（社内IdP連携）。親会社監査対応のためID共有禁止・MFA必須
- デプロイ: Vercel / バッチ: Vercel Cron / 監視: Datadog
- 既存 Oracle 11g とは CSV(SFTP) 日次バッチのみ。直接接続は禁止（CON-002）
- 技術選定を変更する場合は必ず ADR を design/basic/adr/ に追加する（.github/templates/adr.md）

## ディレクトリ構成

- docs/ 要求一覧・要件定義書・レビュー報告
- specification/ ユーザーストーリー（stories/US-XXX.md）・ワイヤー
- design/ 基本設計（basic/・adr/）・詳細設計（detail/）
- src/ アプリ本体（app/ server/ components/ lib/）
- infra/ Terraform 等の IaC
- reports/ 運用レポート（daily/ weekly/）
- incidents/ PostMortem

## 要求工学

- 用語: 機能要求(FR) / 非機能要求(NFR) / 制約(CON) / ステークホルダー(SH)
- すべての要求に発言者・タイムスタンプ・確信度(高/中/低)を保持する
- 後工程で要求IDから一次ソース（文字起こし行）に1秒で遡れること
- 計測不能な要求は【要具体化】フラグ、暗黙要求は (推定) を本文に明示
- 否定の発言（〜は不要）も要求として残す
- 優先度は MoSCoW。Must 比率が 40% を超えたら要求肥大として警告する

## ドキュメント規約

- 要件定義書の章立ては ISO/IEC/IEEE 29148 準拠（.github/instructions/rdd-template.instructions.md）
- 図は Mermaid に統一（PlantUML・画像貼り付けは不可。差分レビューできる形式のみ）
- 用語は要件定義書末尾の用語集を参照し、表記揺れを禁止
- 受身形を避け能動態で記述する
- すべての要件に FR/NFR/CON ID を付与し、章末に「関連要求ID一覧」を必ず付ける
- ドラフト生成後は req-reviewer モードでレビュー。WARN/ERROR が残ったままの merge は GitHub Actions（docs-quality-gate.yml）が拒否する

## コーディング規約

- TypeScript strict / Next.js 15 App Router
- Server Components 優先。'use client' は最小範囲
- データアクセスは Repository パターン（src/server/repositories/）
- 不変性: 配列は spread / map / filter で更新。push / sort / reverse / 直接代入は禁止
- 例外は境界層（API Route / Server Action）で握る。内部関数は throw を維持
- エラーコードは E_<ドメイン>_<連番3桁>（.github/templates/error-code.md）。ユーザー向けとログ向けのメッセージを分ける
- 入力検証は Zod で境界に置く（design/detail/validation-matrix.md がソース）

## テスト規約

- 受入基準の Gherkin をそのまま it() に変換する（仕様とテストの文面を一致させ、リンクを切らない）
- 単体: Vitest（AAA構成・1ファイル=1スイート）/ E2E: Playwright（ストーリー単位）
- 異常系はエラーコード（E_XXX_NNN）でアサートする
- 異常系テストは正常系の 0.5 倍以上を維持する

## Git運用

- 1ストーリー = 1ブランチ（feat/US-XXX-説明）= 1PR
- merge 前に typecheck / lint / test が通っていること（.github/workflows/ci.yml を required チェックに設定）
- 危険コマンドは .vscode/settings.json の chat.tools.terminal.autoApprove で false 指定（必ず人間承認）。機密値の push はリポジトリ側の Push protection が拒否する
- PR には関連する US-ID を必ず記載する

## レビューフロー

- 生成物は必ず別のチャットモードでレビューする（生成した本人によるセルフレビュー禁止）
- 実装PRは Copilot Code Review（自動）に加え /full-review で3観点レビューを実行
- 自動修正できる指摘（lint / format / import順）は機械が直し、設計判断は人間が決める
