# ブラウザAIチャット ハーネス一式 - 架空株式会社 在庫管理システム

デモ「AI駆動開発デモ」のブラウザAIチャット版に登場したカスタム指示・テンプレートプロンプト・定期実行ルーチンの全文です。CLIやエディタを入れず、ChatGPT・Claude.ai・Gemini・Microsoft 365 Copilot の標準機能だけで運用する前提の資材です。

## 使い方

prompts/ のファイル名は「工程番号-連番-内容」です。工程順に、各ファイル冒頭のタイトルが示すツールへ貼り付けて使います。

1. カスタム指示（「〜のカスタム指示」「システム指示」）: ChatGPT は Project の指示欄、Claude.ai は Project のカスタム指示、Gemini は Gem の指示欄、M365 Copilot はエージェントの指示に貼る
2. プロジェクト知識（「プロジェクト知識: 〜」）: Claude.ai の Project ナレッジ、ChatGPT の Project ファイルとしてアップロードする
3. テンプレートプロンプト: 会話に都度貼り付ける。長いものはテキストスニペットツールに登録しておくと速い
4. 定期実行ルーチン（「ChatGPT Tasks」「Gemini Scheduled actions」）: 各ツールのスケジュール機能に指示文を登録する
5. ツールの使い分け（workspace）: どの工程をどのツールが主担当するかのメモ。チーム展開時の説明資料に使う

## ツール別の役割分担（デモの前提）

- ChatGPT: コード生成・Code Interpreter でのテスト実行・MoSCoW分類の対話
- Claude.ai: 長文の要件定義書・仕様書・設計書の生成（Projects + Artifacts）
- Gemini: 会議文字起こしの解析・Google Drive 上のレポート集計（Gems + Scheduled actions）
- M365 Copilot: Teams 会議録の抽出・Word 納品体裁・承認フローの下書き

## 注意

- 各ツールの機能名（Projects / Gems / Tasks / Scheduled actions）はデモ作成時点のものです。画面や名称は変わるため、見つからない場合は各ツールのヘルプで現行名を確認してください
- 社内データを扱う場合は、各ツールの学習利用設定（オプトアウト）を先に確認してください
- 案件の固有名詞（架空株式会社・Oracle 11g 等）は自案件の内容に置き換えて使ってください
