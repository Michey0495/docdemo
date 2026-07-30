// ===== 架空案件のシナリオ =====
const PROJECT = {
  client: '架空株式会社（フィクション）',
  industry: '電子部品の専門商社・東京3拠点',
  employees: '社員120名',
  brief: '20年もののExcel在庫管理を刷新し、東京3拠点（本社千代田・物流センター江東・物流センター大田）でリアルタイムに動く在庫管理システムを構築したい。バーコードによる入出庫、スマホ照会、既存販売管理とのCSV連携が必須。予算は年額1,500万円以内。',
  meta: [
    { label: 'ヒアリング', value: '90分・3名' },
    { label: '対象拠点', value: '東京3拠点' },
    { label: '想定リリース', value: '6ヶ月後' },
    { label: '予算枠', value: '1,500万円/年' },
  ],
};

// kind: 'knowledge' | 'harness' | 'hook' | 'subagent' | 'skill' | 'mcp' | 'command'
const KIND_LABEL = {
  knowledge: 'ナレッジ（.github/copilot-instructions.md / 規約）',
  harness:   'ハーネス（settings.json）',
  hook:      'Hooks（イベント駆動）',
  subagent:  'カスタムチャットモード',
  skill:     'Skills',
  mcp:       'MCPサーバー',
  command:   'プロンプトファイル',
};

// ===== 工程データ =====
const PHASES = [

  // ───────────────────────── 01 ─────────────────────────
  {
    num: '01',
    title: 'ヒアリング解析',
    sub: '文字起こしから要求を構造化抽出',
    duration: '約3分',
    outcome: '機能要求48件・非機能要求12件・制約7件・ステークホルダー4名を一括抽出',
    flow: {
      input:     { label: 'ヒアリング文字起こし', detail: 'TXT 約20,000字 / 90分' },
      operation: { label: '/extract-requirements', detail: 'プロンプトファイル' },
      config:    { label: 'req-extractor agent',   detail: 'カスタムチャットモード定義' },
      output:    { label: 'requirements-raw.md',   detail: '要求一覧（生）' },
    },
    artifactsIn: [
      {
        name: 'transcripts/kakuu-2026-04-15.txt',
        lang: 'text',
        body:
`[架空株式会社 ヒアリング文字起こし 抜粋]
00:14:32 田中物流部長: 在庫数の確認に毎日2時間かかってる。Excel台帳が3つあって、どれが最新か誰もわからない。
00:18:05 佐藤情シス: 既存の販売管理システムは20年もの。改修は厳しい。
00:23:11 山本社長: スマホからリアルタイムで在庫が見られたら理想的。営業先で即答できる。
00:31:48 田中物流部長: バーコード読み取りで入出庫を打てると現場が楽。
00:42:22 佐藤情シス: 既存システムとはCSV連携でいい。リアルタイム連携はオーバースペック。
00:51:09 山本社長: 予算は年額1,500万、内製は無理。
01:02:15 田中物流部長: 拠点は千代田の本社、江東と大田の物流センター。3拠点で同時に動かしたい。
01:18:40 佐藤情シス: Oracle 11gが裏にいる。直接触らせるのは無理。CSVで日次が現実的。
01:24:03 山本社長: 営業時間中は止まってほしくない。深夜のメンテは構わない。
01:31:55 田中物流部長: 棚卸しは年4回。差異が出たら原因を追えるようにしたい。`,
      },
    ],
    configFiles: [
      {
        kind: 'knowledge',
        path: '.github/copilot-instructions.md（要求工学のプロジェクト規約 抜粋）',
        lang: 'md',
        body:
`# プロジェクト規約 - 要求工学

## 用語
- 機能要求(FR) / 非機能要求(NFR) / 制約(CON)
- ステークホルダーは「役割 / 関心事 / 権限」の3項で記述

## トレーサビリティ
- すべての要求に発言者・タイムスタンプ・確信度を保持
- 後工程で要求IDから一次ソース（文字起こし行）に辿れること

## 抽出のお作法
- 計測不能な要求は「要具体化」フラグ
- 暗黙要求は (推定) を本文に明示
- 否定の発言（〜は不要）も要求として残す

> リポジトリ直下の .github/copilot-instructions.md は Copilot Chat の全会話に自動適用される`,
      },
      {
        kind: 'subagent',
        path: '.github/chatmodes/req-extractor.chatmode.md',
        lang: 'md',
        body:
`---
description: 顧客ヒアリング文字起こしから機能要求/非機能要求/制約/ステークホルダーを構造化抽出する
tools: ['codebase', 'search', 'editFiles']
model: Claude Opus 4.5
---
あなたは要求工学の専門家です。

入力: ヒアリング文字起こしテキスト
出力: 以下を持つMarkdown

# 機能要求
| ID | 要求 | 発言者 | TS | 確信度(高/中/低) |

# 非機能要求
| ID | 要求 | 種別(性能/可用/セキュ/運用/UX) | 発言者 |

# 制約条件
- 予算 / スケジュール / 既存システム / 法令

# ステークホルダー
- 役割 / 関心事 / 権限 / 連絡先

抽出ルール:
- 発言の根拠タイムスタンプを必ず保持
- 計測不能な要求は「要具体化」フラグを付与
- 暗黙要求は (推定) を本文に明示
- 入力20,000字超の場合は5,000字単位で分割処理しコンテキストを節約`,
      },
      {
        kind: 'subagent',
        path: '.github/chatmodes/req-reviewer.chatmode.md',
        lang: 'md',
        body:
`---
description: 抽出済み要求一覧をレビューし、計測不能・重複・暗黙要求を検出
tools: ['codebase', 'search']
model: Claude Sonnet 4.5
---
チェック観点:
1. 計測不能な要求（「使いやすい」「かっこよく」等）
2. 重複 / 矛盾要求
3. ステークホルダー別の網羅性（権限者ごとに最低1件）
4. 暗黙要求の取りこぼし（特にセキュリティ / 法令 / アクセシビリティ）

出力: [INFO]/[WARN]/[ERROR] + 該当ID + 提案`,
      },
      {
        kind: 'command',
        path: '.github/prompts/extract-requirements.prompt.md',
        lang: 'md',
        body:
`---
mode: agent
description: 文字起こしtxtを解析し、要求抽出からセルフレビューまで完走
tools: ['codebase', 'search', 'editFiles']
---
# 要求抽出パイプライン
1. \${input:transcriptPath} を req-extractor モードの規約で解析
2. 抽出結果を docs/01-requirements-raw.md に書き出す
3. req-reviewer の観点でセルフレビューし、WARN/ERROR があれば
   次工程に進まず、人間に提示して確認

呼び出し: チャットで /extract-requirements と入力`,
      },
    ],
    bestPractices: [
      { title: '一次ソースの保持を最優先', body: '発言者ラベルとタイムスタンプは「監査の根拠」。後工程で要求IDからヒアリング行に1秒で遡れる構造を最初に作る。' },
      { title: '確信度ラベルで「あいまいさ」を可視化', body: '確信度(高/中/低)を要求テーブルに混ぜず別カラムで管理。MoSCoW分類のときに迷い処理が高速化する。' },
      { title: '長文入力は分割処理', body: '20,000字超のtxtはモード指示で分割処理を強制。コンテキストを圧迫すると後段の精度が下がる。' },
      { title: '抽出後すぐにレビューモード', body: '別モード(req-reviewer)で点検する二段構え。同じ思考で書いた本人レビューより精度が出る。' },
    ],
    officialRefs: [
      { label: 'Chat: New Mode File（VS Code公式コマンド）', body: 'コマンドパレットから .github/chatmodes/*.chatmode.md を対話的に作成。frontmatter (description/tools/model) を標準化。' },
      { label: 'Repository custom instructions（GitHub公式）', body: '.github/copilot-instructions.md はリポジトリ全体の Copilot Chat に自動適用。要求工学の社内規約はここに常駐。' },
      { label: 'GitHub公式ドキュメント: Custom chat modes', body: 'モードごとに使えるツールとモデルを絞り込み、専門役割を固定する設計指針を提示。' },
    ],
    execution: {
      command: '添付の transcripts/kakuu-2026-04-15.txt から、機能要求／非機能要求／制約／ステークホルダーを表形式で抽出してください。各行に発言者とタイムスタンプを必ず残し、計測不能な表現は【要具体化】を付けてください。',
      lines: [
        '> /extract-requirements プロンプトファイルを実行',
        '  Step 1: req-extractor モードで解析',
        '    Read: transcripts/kakuu-2026-04-15.txt (19,847字)',
        '    発言抽出: 田中物流部長(48), 佐藤情シス(31), 山本社長(22)',
        '    要求候補を分類中...',
        '    抽出完了: FR48 / NFR12 / CON7 / SH4',
        '    Write: docs/01-requirements-raw.md (3,142行)',
        '',
        '  Step 2: req-reviewer 観点でセルフレビュー',
        '    Read: docs/01-requirements-raw.md',
        '    検出: INFO 1件 / WARN 1件 / ERROR 0件',
        '    → ブロッカー無し、次工程進行可',
        '',
        '✓ 完了 (2分47秒)',
      ],
    },
    artifactsOut: [
      {
        name: 'docs/01-requirements-raw.md',
        lang: 'md',
        body:
`# 要求一覧（生）- 架空株式会社 在庫管理システム

## 機能要求
| ID | 要求 | 発言者 | TS | 確信度 |
|----|------|--------|----|--------|
| FR-001 | スマホからリアルタイム在庫照会 | 山本社長 | 00:23:11 | 高 |
| FR-002 | バーコードによる入出庫登録 | 田中物流部長 | 00:31:48 | 高 |
| FR-003 | 3拠点（千代田/江東/大田）の同時稼働 | 田中物流部長 | 01:02:15 | 高 |
| FR-004 | 既存販売管理(Oracle 11g)とCSV日次連携 | 佐藤情シス | 01:18:40 | 高 |
| FR-005 | 棚卸差異の原因追跡（履歴照会） | 田中物流部長 | 01:31:55 | 中 |
| ...   | （以下43件略） | | | |

## 非機能要求
| NFR-001 | 在庫照会レスポンス 2秒以内 | 性能 |
| NFR-002 | 営業時間中（8-19時）の稼働率 99.5% | 可用性 |
| NFR-003 | 認証は多要素必須 (推定) | セキュリティ |

## 制約
- 予算: 年額1,500万円以内
- 既存DB Oracle 11g は直接更新不可（CSV経由のみ）
- 内製不可、ベンダー保守前提

## ステークホルダー
- 山本社長 / ROI判断・最終決裁
- 田中物流部長 / 現場運用・最終受入
- 佐藤情シス / 既存システム連携・運用引取`,
      },
    ],
    review: {
      skillName: '@req-reviewer',
      prompt:
`要求レビュアとして以下を確認:
1. 計測不能な要求（具体化要請）
2. 重複・矛盾
3. ステークホルダー別の網羅
4. 暗黙要求の取りこぼし（特にセキュリティ・法令）
出力: [INFO]/[WARN]/[ERROR] + 該当ID + 提案`,
      comments: [
        { level: 'INFO', target: 'FR-007', body: '「画面はかっこよく」は計測不能。具体化要請が必要' },
        { level: 'WARN', target: 'NFR-003', body: 'セキュリティ要件が暗黙のみ。次回ヒアリングで深堀り推奨' },
        { level: 'OK',   target: '全件',    body: '機能要求48件すべてに発言者ソースとTSを保持' },
      ],
    },
  },

  // ───────────────────────── 02 ─────────────────────────
  {
    num: '02',
    title: '要求精査・優先度付け',
    sub: 'MoSCoW分類とステークホルダー確認',
    duration: '約8分',
    outcome: 'Must16 / Should14 / Could10 / Wont8。確認シート自動生成、先方の同意1往復で完了',
    flow: {
      input:     { label: 'requirements-raw.md',   detail: '要求一覧（生）' },
      operation: { label: '/prioritize',           detail: 'MoSCoW + 質問返し' },
      config:    { label: 'prioritizer モード',     detail: '人間判断を内蔵' },
      output:    { label: 'requirements-final.md', detail: '優先度付き要求' },
    },
    artifactsIn: [
      { name: 'docs/01-requirements-raw.md', lang: 'md', body: '（前工程の成果物：機能要求48件・非機能要求12件・制約7件）' },
    ],
    configFiles: [
      {
        kind: 'subagent',
        path: '.github/chatmodes/prioritizer.chatmode.md',
        lang: 'md',
        body:
`---
description: 要求一覧をMoSCoW分類し、判断に迷う項目は選択肢付きの質問で人間に確認
tools: ['codebase', 'editFiles']
model: Claude Sonnet 4.5
---
分類基準:
- Must  : リリース必須。なければプロジェクト失敗
- Should: 重要だが回避策あり
- Could : あれば嬉しい
- Wont  : 今回スコープ外（次フェーズ候補）

迷いが生じる条件（即断せず、選択肢を並べてユーザーに質問を返す）:
- 確信度「中・低」かつ Must候補
- 予算/スケジュール制約に抵触する可能性
- ステークホルダー間で対立する要求

出力:
- docs/02-requirements-final.md（優先度カラム付き）
- docs/02-stakeholder-review.md（先方確認シート）`,
      },
      {
        kind: 'harness',
        path: '.vscode/settings.json（プロンプト/モードの有効化）',
        lang: 'json',
        body:
`{
  "chat.promptFiles": true,
  "chat.modeFilesLocations": {
    ".github/chatmodes": true
  },
  "chat.promptFilesLocations": {
    ".github/prompts": true
  }
}`,
      },
    ],
    bestPractices: [
      { title: '迷ったら質問を返させる', body: '「Copilot が勝手に決めた」を防ぐ。モード指示に「即断せず選択肢を出して確認」と固定する。優先度はビジネス判断、技術判断ではない。' },
      { title: 'Must比率は20-40%', body: '50%超は要求肥大のサイン。「全部Must」は要求精査が機能していない証拠。' },
      { title: 'ステークホルダー別に確認シートを分ける', body: '社長向け/現場向け/情シス向けで関心事が違う。1枚で投げると「自分の論点」だけ見て他は流される。' },
      { title: '次フェーズ候補(Wont)も明記', body: '「捨てた」のではなく「順番に並べた」と伝える。営業上のメリットも大きい。' },
    ],
    officialRefs: [
      { label: 'Copilot Chat の会話ループ（GitHub公式）', body: 'エージェントモードでも応答途中で質問を返し、ユーザーの回答を受けて続行できる。判断保留はモード指示文で制御。' },
      { label: 'chat.promptFiles（VS Code公式設定）', body: 'プロンプトファイル/チャットモードの検索場所を settings.json で有効化。チーム共有はリポジトリにコミット。' },
    ],
    execution: {
      command: 'docs/01-requirements-raw.md の要求を MoSCoW で分類してください。確信度が中・低で Must 候補のものは即断せず、選択肢を出して私に確認してください。Must 比率が 40% を超えたら警告してください。',
      lines: [
        '> prioritizer モードに切替（モードピッカーから選択）...',
        '  分類処理: 48件 / 12件 / 7件',
        '  自動分類: 51件',
        '  人間判断要請: 9件',
        '',
        '? Copilot: 「FR-021 IoTセンサー連携」は今回のMustですか？',
        '  発言者の確信度: 低 / 予算逼迫: 該当',
        '  選択肢: [Must / Should / Could / Wont / 確認延期]',
        '> Wont (次フェーズ候補)',
        '',
        '... (8件の確認を経て分類完了)',
        '',
        'Must  16件 / Should 14件 / Could 10件 / Wont 8件',
        '✓ 完了 (7分41秒)',
        '  Write: docs/02-requirements-final.md',
        '  Write: docs/02-stakeholder-review.md',
      ],
    },
    artifactsOut: [
      {
        name: 'docs/02-requirements-final.md',
        lang: 'md',
        body:
`# 要求一覧（精査済）

## Must (16件)
- FR-001 スマホからリアルタイム在庫照会
- FR-002 バーコード入出庫
- FR-003 3拠点同時稼働
- FR-004 Oracle CSV日次連携
- NFR-001 照会レスポンス 2秒以内
- NFR-002 稼働率 99.5%
- ...

## Should (14件)
- FR-005 棚卸差異の原因追跡
- FR-009 在庫アラート（下限割れ）
- ...

## Could (10件)
## Wont (今回スコープ外, 次フェーズ候補)
- FR-021 IoTセンサー連携
- FR-034 AI需要予測`,
      },
      {
        name: 'docs/02-stakeholder-review.md',
        lang: 'md',
        body:
`# ステークホルダー確認シート

田中物流部長 / 現場運用 / 確認依頼:
  - FR-005 棚卸差異追跡 を Should にしました。年4回の棚卸でMust相当ですか？
  - FR-013 写真添付 を Could にしました。証跡として必須ではないでしょうか？

山本社長 / ROI判断 / 確認依頼:
  - FR-021 IoTセンサー / FR-034 AI予測 は次フェーズへ。今期スコープ外で問題ありませんか？

佐藤情シス / 連携 / 確認依頼:
  - FR-027 SAML認証 を Should にしました。法令要件として Must では？`,
      },
    ],
    review: {
      skillName: '/review-priority',
      prompt: 'MoSCoW分類結果を確認し、Must比率33%（16/48）が妥当か、ステークホルダー別の偏りがないか、確認シートが必要十分かをチェック。',
      comments: [
        { level: 'OK',   target: 'Must比率',    body: '33%。一般的な健全範囲(20-40%)' },
        { level: 'INFO', target: '確認シート', body: '3名分、計5項目を要確認として整理。次の打合せ前に送付推奨' },
      ],
    },
  },

  // ───────────────────────── 03 ─────────────────────────
  {
    num: '03',
    title: '要件定義書作成',
    sub: '社内規約に沿ったRDDを生成',
    duration: '約12分',
    outcome: '要件定義書（20章/68頁）+ 業務フロー図（Mermaid）+ 用語集が一括生成',
    flow: {
      input:     { label: 'requirements-final.md',         detail: '優先度付き要求' },
      operation: { label: '/generate-rdd',                 detail: 'RDD生成コマンド' },
      config:    { label: 'rdd-template skill + .github/copilot-instructions.md', detail: '社内規約テンプレ' },
      output:    { label: 'requirements-definition.md',    detail: '要件定義書 v1.0' },
    },
    configFiles: [
      {
        kind: 'knowledge',
        path: '.github/copilot-instructions.md（ドキュメント規約）',
        lang: 'md',
        body:
`# プロジェクト規約 - ドキュメント

## ドキュメント規約
- 章立てはISO/IEC/IEEE 29148準拠
- 図はMermaid（PlantUMLは不可）
- 用語は本書末尾の用語集を参照（揺れを禁止）
- 受身形を避け能動態で記述

## トレーサビリティ
- すべての要件にFR/NFR/CON IDを付与し、要求一覧と紐付け
- 章末に「関連要求ID一覧」を必ず付ける

## レビューフロー
- ドラフト生成後、req-reviewer カスタムチャットモードでレビュー
- WARN/ERRORが残ったままmergeしない（GitHub Actions のチェックで防止）`,
      },
      {
        kind: 'skill',
        path: '.github/instructions/rdd-template.instructions.md',
        lang: 'md',
        body:
`---
applyTo: "docs/**/*.md"
description: 要件定義書(RDD)の標準テンプレートを適用。ISO/IEC/IEEE 29148準拠の章構成を強制し、関連要求IDのトレーサを自動付与する
---
# RDD章構成

1. はじめに（背景・目的・対象範囲）
2. 用語の定義
3. 業務概要
4. 業務フロー（As-Is / To-Be 各Mermaid）
5. システム化の範囲
6. 機能要件
7. 非機能要件
8. 外部システム連携
9. データ要件
10. セキュリティ要件
11. 運用要件
12. 制約条件
13. 移行要件
14. 教育・サポート
15. 受入基準
16. 用語集
（※ 第17-20章はプロジェクト個別追記）

## 関連リソース
- ./templates/rdd-skeleton.md
- ./templates/glossary.md`,
      },
      {
        kind: 'hook',
        path: '.github/workflows/docs-quality-gate.yml（WARN残りmerge禁止）',
        lang: 'yaml',
        body:
`name: docs-quality-gate
on:
  pull_request:
    paths: ['docs/**']
jobs:
  check-review-markers:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: WARN/ERROR が残っていないか検査
        run: |
          if grep -rE '\\[(WARN|ERROR)\\]' docs/; then
            echo '::error::レビュー指摘が未解消のままです'
            exit 1
          fi
# ブランチ保護でこのチェックを required にすると
# 未解消のままの merge を物理的に止められる`,
      },
    ],
    bestPractices: [
      { title: '章構成は規約に強制させる', body: '「次の案件でも同じ品質で」を実現するには、人の記憶ではなく instructions ファイルに記憶させる。applyTo で docs/ 配下に自動適用。' },
      { title: 'トレーサIDで「なぜこの仕様か」を5秒で遡る', body: '半年後の改修時、要求まで戻れる構造が事故を防ぐ。' },
      { title: '生成→レビュー→mergeを Actions でガード', body: 'PRチェックでWARN/ERROR残りmergeを物理的に止める。レビューを忘れる人間の脆弱性を補う。' },
      { title: 'Mermaidに統一', body: '画像系はバージョン管理で差分が見えない。テキスト系図に絞ると差分レビュー可能。' },
    ],
    officialRefs: [
      { label: 'Path-specific instructions（GitHub公式）', body: '.github/instructions/*.instructions.md は applyTo の glob に合致するファイル編集時に自動で読み込まれる。' },
      { label: 'GitHub Actions: pull_request（GitHub公式）', body: 'PR作成・更新のたびに検証ジョブを実行。失敗したチェックはブランチ保護で merge をブロックできる。' },
      { label: 'GitHub公式ドキュメント: Branch protection', body: 'required status checks を設定すると、チェック未通過のPRは物理的に merge 不可。' },
    ],
    execution: {
      command: 'rdd-template の章構成と docs/02-requirements-final.md を使って、要件定義書 v1.0 を docs/03-requirements-definition.md に書き出してください。図は Mermaid、各機能要件章の末尾に関連要求IDを必ず付けてください。',
      lines: [
        '> rdd-template instructions が docs/ 編集に自動適用',
        '  .github/copilot-instructions.md 規約を読込: 章構成 / トレーサ / 図表ルール',
        '  業務フロー(As-Is)を Mermaid で生成中...',
        '  業務フロー(To-Be)を Mermaid で生成中...',
        '  章 1-20 を生成中... (進捗 20/20)',
        '',
        '生成完了:',
        '  本文      8,420行',
        '  Mermaid図   6点',
        '  用語集     38語',
        '',
        '> req-reviewer モードでレビュー...',
        '  WARN 0件 / ERROR 0件',
        '✓ 完了 (11分58秒)',
        '  Write: docs/03-requirements-definition.md',
      ],
    },
    artifactsOut: [
      {
        name: 'docs/03-requirements-definition.md',
        lang: 'md',
        body:
`# 在庫管理システム 要件定義書 v1.0

## 1. はじめに
### 1.1 背景
架空株式会社は3拠点で稼働するExcel在庫管理に依存しており、最新版の特定に毎日2時間を要している。営業現場では在庫照会に半日以上を要する場合があり、機会損失が発生している。

### 1.2 目的
拠点横断のリアルタイム在庫管理を実現し、現場運用効率を改善する。

## 4. 業務フロー
### 4.1 As-Is
\`\`\`mermaid
flowchart LR
  A[受注] --> B[Excel台帳に記入]
  B --> C{台帳3種を確認}
  C -->|差異あり| D[電話で在庫照会]
  C -->|差異なし| E[出荷指示]
  D --> E
\`\`\`
### 4.2 To-Be
\`\`\`mermaid
flowchart LR
  A[受注] --> B[在庫DB照会]
  B --> C[出荷指示]
  C --> D[バーコード読取]
  D --> E[在庫DB更新]
\`\`\`

## 6. 機能要件
### 6.1 在庫照会 (FR-001)
- スマホ/PCブラウザから在庫数を照会できること
- 拠点別/品目別/ロット別で表示できること
- 関連要求: FR-001, FR-003, NFR-001

（以下20章まで継続）`,
      },
    ],
    review: {
      skillName: '/review-rdd',
      prompt: 'RDDの章立てが.github/copilot-instructions.md準拠か、要求IDのトレーサビリティが全項目で取れているか、図表ルール（Mermaid限定）が守られているかチェック。',
      comments: [
        { level: 'OK',   target: '章構成',           body: '20章すべてテンプレ準拠' },
        { level: 'OK',   target: 'トレーサビリティ', body: '機能要件章すべてに関連要求ID記載' },
        { level: 'INFO', target: '4.1 As-Is図',    body: '業務フローを実測値（毎日2時間）と接続。読み手にインパクト' },
      ],
    },
  },

  // ───────────────────────── 04 ─────────────────────────
  {
    num: '04',
    title: '仕様定義',
    sub: '機能仕様書とユーザーストーリーを生成',
    duration: '約18分',
    outcome: 'ユーザーストーリー36本（US-001〜036）+ 受入基準（Gherkin）+ 機能仕様書',
    flow: {
      input:     { label: 'requirements-definition.md', detail: '要件定義書' },
      operation: { label: '/spec-out',                  detail: '仕様生成コマンド' },
      config:    { label: 'spec-writer モード',          detail: 'Gherkin準拠' },
      output:    { label: 'specification/',             detail: '仕様書一式' },
    },
    configFiles: [
      {
        kind: 'subagent',
        path: '.github/chatmodes/spec-writer.chatmode.md',
        lang: 'md',
        body:
`---
description: 要件定義書から機能仕様書とユーザーストーリーを生成
tools: ['codebase', 'search', 'editFiles']
model: Claude Opus 4.5
---
出力ルール:
- ユーザーストーリーは「As a ... / I want ... / So that ...」形式
- 受入基準は Gherkin (Given/When/Then) で記述
- 1ストーリー = 1ファイル (specification/stories/US-XXX.md)
- 関連要求IDを冒頭にメタデータとして付与
- 画面仕様は ASCII art ワイヤーで補強

INVEST原則:
- Independent: ストーリー間で順序依存しない
- Negotiable: 詳細は会話で詰める
- Valuable: ステークホルダーに価値が届く
- Estimable: 見積もり可能 (13pt以上は分割サイン)
- Small: 1スプリントで完了
- Testable: 受入基準で検証可能`,
      },
      {
        kind: 'knowledge',
        path: '.github/templates/user-story.md',
        lang: 'md',
        body:
`---
id: US-XXX
related: FR-XXX, NFR-XXX
priority: Must|Should|Could
estimate: <1-13>pt
---
# US-XXX タイトル

As a <ロール>
I want <欲しい振る舞い>
So that <得られる価値>

## 受入基準
\`\`\`gherkin
Feature: ...
  Scenario: 正常系
    Given ...
    When ...
    Then ...
\`\`\`

## ワイヤーフレーム
\`\`\`
（ASCII artで補強）
\`\`\``,
      },
    ],
    bestPractices: [
      { title: '1ストーリー=1ファイル', body: '差分レビューしやすく、PR単位とも一致する。長大な仕様書1本より管理コストが下がる。' },
      { title: 'Gherkinはそのままit()に変換', body: '仕様↔テストのリンクが切れない。後工程の test-writer が同じファイルを読めば自動でテストになる。' },
      { title: '13pt以上は分割サイン', body: '見積もりが大きすぎる=要件が混ざっている。割れない場合はスパイク(調査タスク)に切り出す。' },
      { title: 'ASCIIワイヤーで意図を固定', body: '画像はバージョン管理で差分が読めない。荒くてもテキストの方が後で活きる。' },
    ],
    officialRefs: [
      { label: 'Chat: New Mode File（VS Code公式コマンド）', body: 'spec-writer の tools/model frontmatter はモードファイル作成UIで設定。' },
      { label: 'GitHub公式ドキュメント: Custom chat modes', body: 'モードごとに model を選び分けることで、コストと性能を両立する設計指針を提示。' },
    ],
    execution: {
      command: 'docs/03-requirements-definition.md から、ユーザーストーリー（US-XXX）と Gherkin の受入基準を specification/ 配下に生成してください。13pt を超えるストーリーは分割案も併記してください。',
      lines: [
        '> spec-writer モードに切替...',
        '  機能要件 24項 → ユーザーストーリー候補に変換中',
        '  US-001 ~ US-036 を生成 (進捗 36/36)',
        '  受入基準 Gherkin を 124本 生成',
        '  画面仕様 ワイヤー 18面 を生成',
        '',
        '✓ 完了 (17分22秒)',
        '  Write: specification/functional-spec.md',
        '  Write: specification/stories/US-001.md ~ US-036.md',
        '  Write: specification/wireframes/*.txt',
      ],
    },
    artifactsOut: [
      {
        name: 'specification/stories/US-001.md',
        lang: 'md',
        body:
`---
id: US-001
related: FR-001, FR-003, NFR-001
priority: Must
estimate: 3pt
---
# US-001 リアルタイム在庫照会

As a 営業担当
I want スマホから品目コードで在庫を照会し
So that 客先で即答できる

## 受入基準
\`\`\`gherkin
Feature: 在庫照会
  Scenario: 品目コードでの照会
    Given 営業担当者がログイン済みである
    When 品目コード "A-001" を入力する
    Then 千代田/江東/大田の在庫数が2秒以内に表示される

  Scenario: 在庫切れ品目の表示
    Given 在庫が0の品目 "B-099" がある
    When 品目コード "B-099" を入力する
    Then 「在庫切れ」表示と最終出庫日が表示される
\`\`\`

## ワイヤーフレーム
\`\`\`
+----------------------------+
| [≡] 在庫照会        [USER] |
+----------------------------+
| 品目コード: [____ ]    [Q] |
+----------------------------+
| A-001 電子コネクタ TypeA   |
|   千代田 120 / 江東   85   |
|   大田    42 / 計    247   |
+----------------------------+
\`\`\``,
      },
    ],
    review: {
      skillName: '/review-spec',
      prompt: 'ユーザーストーリーが INVEST 原則を満たすか、Gherkinが具体的か、関連要求IDの取りこぼしがないかチェック。',
      comments: [
        { level: 'OK',   target: 'INVEST', body: '36本すべて Independent / Testable を満たす' },
        { level: 'INFO', target: 'US-014', body: '見積もり13ptが過大。分割を検討' },
      ],
    },
  },

  // ───────────────────────── 05 ─────────────────────────
  {
    num: '05',
    title: '基本設計',
    sub: 'アーキ・DB・APIとADRを同時に生成',
    duration: '約25分',
    outcome: 'C4図(L1-L3) / ER図 / OpenAPI仕様 / ADR-0001〜0008',
    flow: {
      input:     { label: 'specification/',          detail: '仕様書一式' },
      operation: { label: '/design-architecture',    detail: '設計コマンド' },
      config:    { label: 'architect モード + ADRテンプレ', detail: '意思決定の記録' },
      output:    { label: 'design/basic/',           detail: '基本設計書一式' },
    },
    configFiles: [
      {
        kind: 'subagent',
        path: '.github/chatmodes/architect.chatmode.md',
        lang: 'md',
        body:
`---
description: 仕様書からシステムアーキテクチャ・DB・API設計を生成。意思決定はADRに記録
tools: ['codebase', 'search', 'editFiles', 'fetch', 'github']
model: Claude Opus 4.5
---
意思決定が必要な場面で必ずADR(Architecture Decision Record)を生成。

## 設計の前提
- 技術スタック既定: Next.js 15 / TypeScript / PostgreSQL / Vercel
- 認証: Auth.js + SAML2.0 (社内IdP連携)
- 既存Oracle 11gとはCSV(SFTP) 日次バッチ

## 出力
- C4 Level 1 (System Context)
- C4 Level 2 (Container)
- C4 Level 3 (Component) ※主要コンテナのみ
- ER図 (Mermaid)
- OpenAPI 3.1 仕様
- ADR-NNNN.md (意思決定ごと)`,
      },
      {
        kind: 'knowledge',
        path: '.github/templates/adr.md',
        lang: 'md',
        body:
`# ADR-NNNN: <決定タイトル>

## ステータス
提案 / 採用 / 廃止

## 文脈
何が課題で、なぜ今決める必要があるのか

## 決定
何を選んだか

## 結果
良い影響 / 悪い影響 / 受け入れたトレードオフ

## 代替案
検討したが採用しなかった選択肢と却下理由`,
      },
      {
        kind: 'mcp',
        path: '.vscode/mcp.json（GitHub MCP）',
        lang: 'json',
        body:
`{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
// VS Code の MCP 設定は .vscode/mcp.json に "servers" キーで記述
// GitHub MCP はリモート(HTTP)サーバーとして OAuth 接続できる`,
      },
    ],
    bestPractices: [
      { title: '意思決定の瞬間にADRを書く', body: '半年後に「なぜこの選択にした？」を再現できないと、改修時に必ず後悔する。' },
      { title: '代替案と却下理由まで書く', body: 'ADRの本体は「却下した道」。そこを残さないと意思決定の再現性が0になる。' },
      { title: 'C4のレベル粒度を統一', body: 'L1〜L3で抽象度がブレると読み手が迷う。L3はサービス1〜2個に絞る。' },
      { title: 'OpenAPIをmainブランチに置く', body: 'フロントとサーバーが同じファイルを参照することで、契約破壊を即検知。' },
    ],
    officialRefs: [
      { label: 'GitHub MCP（GitHub公式提供）', body: 'PR/Issue/コメントをGitHub Copilotから直接操作。設計決定をPRとして残せる。' },
      { label: 'MCP: Add Server（VS Code公式コマンド）', body: 'MCPサーバーの追加・状態確認UI。.vscode/mcp.json（プロジェクト共通）とユーザー設定を区別管理。' },
      { label: 'GitHub公式ドキュメント: Model Context Protocol', body: 'stdio / HTTP / SSE のトランスポート、認可フロー、サーバー実装ガイド。' },
    ],
    execution: {
      command: 'specification/ 一式から、アーキテクチャ・DB・API設計を design/basic/ に作成してください。意思決定が発生するたびに ADR を design/basic/adr/ に残し、代替案と却下理由まで書いてください。',
      lines: [
        '> architect モードに切替...',
        '  C4 L1 System Context を生成',
        '  C4 L2 Container を生成 (Web/API/DB/Batch/IdP)',
        '  C4 L3 Component を主要3コンテナで生成',
        '  ER図: 12テーブル, 主要関連18本',
        '  OpenAPI: 24エンドポイント',
        '',
        '  意思決定が発生 → ADR生成:',
        '    ADR-0001 フロントは Next.js 採用',
        '    ADR-0002 DBは PostgreSQL 採用',
        '    ADR-0003 認証は Auth.js + SAML2.0',
        '    ADR-0004 バーコード読取はWeb Bluetooth不採用、PWAカメラ採用',
        '    ADR-0005 拠点ルーティングはアプリ層で処理',
        '    ADR-0006 監査ログは別DBに分離',
        '    ADR-0007 デプロイは Vercel + Supabase',
        '    ADR-0008 バッチは Vercel Cron',
        '',
        '✓ 完了 (24分10秒)',
      ],
    },
    artifactsOut: [
      {
        name: 'design/basic/c4-l1.md',
        lang: 'md',
        body:
`# C4 Level 1: System Context
\`\`\`mermaid
flowchart TB
  user1[営業担当 スマホ] --> sys[在庫管理システム]
  user2[現場作業員 タブレット] --> sys
  user3[管理者 PC] --> sys
  sys --> idp[社内IdP SAML2.0]
  sys --> oracle[(Oracle 11g 既存販売管理)]
  sys --> mail[メール配信]
\`\`\``,
      },
      {
        name: 'design/basic/adr/ADR-0002.md',
        lang: 'md',
        body:
`# ADR-0002: DBは PostgreSQL を採用

## ステータス
採用

## 文脈
既存販売管理システムが Oracle 11g。直接更新不可の制約あり (CON-002)。本システムDBの選択肢として Oracle / PostgreSQL / MySQL を比較。

## 決定
PostgreSQL を採用する。

## 結果
良い影響:
- ライセンス費用ゼロ
- Vercel + Supabase で運用負担を最小化
- JSONB対応でロット属性の柔軟な拡張が可能

悪い影響:
- 既存DBA(Oracle経験)の学習コスト

受け入れたトレードオフ:
- バッチ連携は CSV (SFTP) で疎結合に保ち、両DBの差異を吸収

## 代替案
- Oracle 21c: ライセンス費 年700万 → 予算外で却下
- MySQL: JSONB対応に難 → 却下`,
      },
    ],
    review: {
      skillName: '/architecture-review',
      prompt: 'C4図のレベル整合性、ADRの根拠強度、OpenAPIのRESTfulness、性能要件(NFR-001 2秒)が達成可能かをチェック。',
      comments: [
        { level: 'OK',   target: 'ADR-0002', body: 'トレードオフが明示。再現性ある意思決定' },
        { level: 'WARN', target: 'NFR-001 2秒', body: '在庫照会は3拠点同時参照。インデックス設計と接続プールサイズを詳細設計で要確認' },
      ],
    },
  },

  // ───────────────────────── 06 ─────────────────────────
  {
    num: '06',
    title: '詳細設計',
    sub: 'クラス・シーケンス・画面遷移・検証定義',
    duration: '約32分',
    outcome: 'クラス図18点 / シーケンス図24本 / 画面遷移図6本 / 入力検証マトリクス',
    flow: {
      input:     { label: 'design/basic/',       detail: '基本設計書一式' },
      operation: { label: '/detailed-design',    detail: '詳細設計コマンド' },
      config:    { label: 'detail-designer モード', detail: 'シーケンス自動生成' },
      output:    { label: 'design/detail/',      detail: '詳細設計書一式' },
    },
    configFiles: [
      {
        kind: 'subagent',
        path: '.github/chatmodes/detail-designer.chatmode.md',
        lang: 'md',
        body:
`---
description: 基本設計とユーザーストーリーから詳細設計書を生成
tools: ['codebase', 'editFiles']
model: Claude Opus 4.5
---
出力:
- クラス図 (Mermaid classDiagram, レイヤー別)
- シーケンス図 (1ストーリーにつき正常系/異常系2本以上)
- 画面遷移図 (stateDiagram)
- 入力検証マトリクス (項目 / 必須 / 型 / 範囲 / メッセージ)
- エラーコード一覧 (機能ドメインプレフィクス: E_AUTH_xxx, E_STOCK_xxx)`,
      },
      {
        kind: 'knowledge',
        path: '.github/templates/error-code.md',
        lang: 'md',
        body:
`# エラーコード命名規約

形式: E_<ドメイン>_<連番3桁>
例: E_AUTH_001 / E_STOCK_011 / E_BARCODE_021

## ドメイン
- AUTH    認証・認可
- STOCK   在庫
- BARCODE バーコード読取
- AUDIT   監査ログ
- BATCH   バッチ連携
- SYS     システム共通

## ルール
- HTTPステータスとは1対1にしない（業務エラーは200で返す場合あり）
- 連番は10ずつ空けて始める（追加余地）
- メッセージはユーザー向けとログ向けを分ける`,
      },
    ],
    bestPractices: [
      { title: '異常系シーケンスを正常系の0.5倍以上', body: '異常系こそ事故の温床。正常系1本に対し最低0.5本の異常系を強制すると見落としが減る。' },
      { title: 'エラーコードは機能ドメインで分割', body: 'E0001のような連番だけだと「どこで起きた？」が分からない。E_STOCK_011のようにドメインを前置すると検索性が桁違い。' },
      { title: '入力検証マトリクスをコードと同じリポジトリに', body: '別管理にすると必ず乖離する。コード生成のソースにできる粒度で書く。' },
      { title: '画面遷移図は閉路チェック', body: '「行ったきり戻れない画面」は detail-designer が検知。ユーザーがハマる経路を設計時に潰す。' },
    ],
    officialRefs: [
      { label: 'GitHub公式ドキュメント: Custom chat modes', body: 'tools フィールドを editFiles のみに絞ると、設計フェーズで誤ってターミナル実行する事故を防げる。' },
    ],
    execution: {
      command: 'design/basic/ と specification/stories/ から詳細設計を design/detail/ に生成してください。異常系シーケンスは正常系の0.5倍以上、エラーコードは E_<ドメイン>_<連番3桁> の命名規約に揃えてください。',
      lines: [
        '> detail-designer モードに切替...',
        '  Read: 基本設計書 / ユーザーストーリー36本',
        '  クラス図 (Domain/Application/Infrastructure 18点)',
        '  シーケンス図 (US-001 ~ US-036 / 計24本)',
        '  画面遷移図 (主要6画面)',
        '  入力検証マトリクス (212項目)',
        '  エラーコード一覧 (E_AUTH_001 ~ E_BATCH_007)',
        '',
        '✓ 完了 (31分44秒)',
      ],
    },
    artifactsOut: [
      {
        name: 'design/detail/sequence/US-002-barcode-scan.md',
        lang: 'md',
        body:
`# US-002 バーコード入出庫 - シーケンス（正常系）

\`\`\`mermaid
sequenceDiagram
  participant U as 現場作業員
  participant W as PWA
  participant API as API Server
  participant DB as PostgreSQL
  participant L as 監査ログDB

  U->>W: バーコードをカメラでスキャン
  W->>W: コード形式バリデーション
  W->>API: POST /stock/transactions
  API->>API: JWT検証 + 拠点権限確認
  API->>DB: BEGIN
  API->>DB: 在庫数 -1 (品目+拠点)
  API->>L: 監査ログ書込
  API->>DB: COMMIT
  API-->>W: 200 + 残数
  W-->>U: 「出庫完了 残42」表示
\`\`\``,
      },
      {
        name: 'design/detail/validation-matrix.md',
        lang: 'md',
        body:
`# 入力検証マトリクス（抜粋）

| 画面 | 項目 | 必須 | 型 | 範囲 | エラーコード | メッセージ |
|------|------|------|----|----|--------------|------------|
| 在庫照会 | 品目コード | ○ | string | 5-12文字, 半角英数+'-' | E_STOCK_011 | 品目コードを正しく入力してください |
| 入出庫 | バーコード | ○ | string | EAN-13形式 | E_BARCODE_021 | 読取に失敗しました。再スキャンしてください |
| 入出庫 | 数量 | ○ | int | 1 - 99999 | E_STOCK_022 | 数量は1-99999で入力してください |`,
      },
    ],
    review: {
      skillName: '/detailed-design-review',
      prompt: '異常系シーケンスの網羅性、エラーコード重複、画面遷移の閉路をチェック。',
      comments: [
        { level: 'INFO', target: 'US-008',   body: '異常系シーケンスが正常系1本のみ。タイムアウト経路を追加推奨' },
        { level: 'OK',   target: 'エラーコード', body: '全67件、ドメインプレフィクス重複なし' },
      ],
    },
  },

  // ───────────────────────── 07 ─────────────────────────
  {
    num: '07',
    title: '実装',
    sub: 'エージェントモードにガードレールを敷きつつストーリー単位で実装',
    duration: '約4日（並走）',
    outcome: 'PR #41-#76 / 36ストーリー / 自動修正適用済',
    livePreview: {
      title: '完成版を実際に操作する',
      description: '本工程で実装したアプリの動作デモを別タブで開けます。AI駆動開発12テーマを通して、GitHub Copilot がどのような成果物を作り出すかを画面ごと確認できます。',
      image: 'assets/app-preview.png',
      imageAlt: '完成版アプリのトップ画面',
      url: 'https://ai-dev-demo.ezoai.jp',
      cta: 'アプリを新規タブで開く',
    },
    flow: {
      input:     { label: 'design/detail/',         detail: '詳細設計書' },
      operation: { label: '/implement-feature',     detail: 'ストーリー単位で実装' },
      config:    { label: 'VS Code設定 + Actions CI', detail: '自動承認制御 + 品質ゲート' },
      output:    { label: 'PR diff',                detail: 'GitHub Pull Request' },
    },
    configFiles: [
      {
        kind: 'knowledge',
        path: '.github/copilot-instructions.md（コーディング規約）',
        lang: 'md',
        body:
`# コーディング規約

## 言語・スタック
- TypeScript strict / Next.js 15 App Router
- Server Components 優先 / 'use client' は最小範囲
- データアクセスは Repository パターン

## 不変性
- 配列は spread / map / filter で更新
- オブジェクトは {...obj, key: value}
- mutate するメソッド (push/sort/reverse) は禁止

## エラー
- 例外は境界層で握る (API Route / Server Action)
- 内部関数は throw を維持

## テスト
- 1ファイル = 1スイート
- 単体テストは Vitest
- E2Eは Playwright`,
      },
      {
        kind: 'harness',
        path: '.vscode/settings.json（エージェントモードの権限制御）',
        lang: 'json',
        body:
`{
  "chat.agent.enabled": true,
  "chat.tools.terminal.autoApprove": {
    "npm run typecheck": true,
    "npm run lint": true,
    "npm test": true,
    "git status": true,
    "git diff": true,
    "git checkout -b": true,
    "git commit": true,
    "gh pr create": true,
    "git push --force": false,
    "rm -rf": false,
    "sudo": false
  },
  "chat.editing.autoAcceptDelay": 0,
  "files.exclude": {
    ".env": true,
    "**/secrets/**": true
  }
}
// 許可リストのコマンドは確認なしで実行、
// false 指定のコマンドは必ず人間の承認を要求`,
      },
      {
        kind: 'hook',
        path: '.github/workflows/ci.yml（PR品質ゲート）',
        lang: 'yaml',
        body:
`name: ci
on:
  pull_request:
    branches: [main]
jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - name: 型チェック
        run: npm run typecheck
      - name: Lint
        run: npm run lint
      - name: 単体テスト
        run: npm test
# ブランチ保護で quality-gate を required にすると
# 型エラー/lint違反/テスト失敗のPRは merge 不可`,
      },
      {
        kind: 'hook',
        path: '.github/copilot-code-review-instructions.md（自動レビュー観点）',
        lang: 'md',
        body:
`# Copilot Code Review への指示

PRレビュー時、以下を必ず指摘する:
- 破壊的メソッド (push/sort/reverse/直接代入) の使用
- .env / secrets 配下への参照追加
- try/catch を握りつぶしてログも出していない箇所
- テストが増えていない実装変更

指摘は severity(HIGH/MED/LOW) を付け、修正例を添える。
リポジトリ設定 → Rules で「Copilot review を必須」にすると
全PRに自動レビューが走る`,
      },
      {
        kind: 'hook',
        path: 'リポジトリ設定: Secret scanning + Push protection',
        lang: 'text',
        body:
`Settings → Code security and analysis で有効化:

- Secret scanning: AWSキー/Stripeキー/PEM秘密鍵など
  200以上のパターンをコミット内容から自動検知
- Push protection: 機密値を含む push をサーバー側で拒否
  （ローカルのフックと違い、回避できない）

Copilot が誤って機密値をコードに書いても、
push の時点で物理的に止まる`,
      },
      {
        kind: 'skill',
        path: '.github/instructions/simplify.instructions.md',
        lang: 'md',
        body:
`---
applyTo: "src/**"
description: 変更コードを再利用性・命名・効率の観点でレビューし、必要なら修正する
---
# simplify

## 観点
1. 既存ユーティリティで置き換えできないか
2. 命名は verb-noun / isXxx / hasXxx になっているか
3. 早すぎる抽象化(YAGNI違反)になっていないか
4. 重複コード(DRY違反)がないか
5. mutateしている箇所(immutable違反)がないか

## 動作
- /simplify を投下するとレビュー → 修正提案 → 同意ある場合のみ反映
- レビューだけ欲しい場合は /simplify --review-only`,
      },
      {
        kind: 'command',
        path: '.github/prompts/implement-feature.prompt.md',
        lang: 'md',
        body:
`---
mode: agent
description: ユーザーストーリーIDを入力に、ブランチ作成→実装→テスト→PR作成まで一気通貫
tools: ['codebase', 'editFiles', 'runInTerminal', 'runTests']
---
# 実装パイプライン

\${input:storyId} のストーリーを実装します。

## 手順
1. specification/stories/\${input:storyId}.md と design/detail/sequence/ を読込
2. \`git checkout -b feat/\${input:storyId}-...\`
3. 詳細設計に従い実装（typecheck/lint を都度実行して確認）
4. runTests で全テスト実行、落ちたら修正
5. \`gh pr create\` でPR作成（Copilot Code Review が自動で走る）

## 守るべきこと
- src/ 以外には書かない
- mutateしない（.github/copilot-instructions.md 規約）

呼び出し: チャットで /implement-feature と入力`,
      },
    ],
    bestPractices: [
      { title: 'ガードレールは自動承認リストで敷く', body: 'chat.tools.terminal.autoApprove で安全なコマンドだけ無確認実行を許可。危険コマンドは false 指定で必ず人間承認。' },
      { title: 'ローカルで防げない事故はサーバー側で止める', body: 'Push protection は機密値を含む push をGitHub側で拒否。ローカル設定と違い回避できない。' },
      { title: 'CI を required にして品質を物理担保', body: 'typecheck/lint/test を Actions で回し、ブランチ保護で required に。落ちたPRは merge 不可。' },
      { title: 'Copilot Code Review を全PRに', body: 'リポジトリルールで必須化すると、人間レビュアの前に破壊的操作や機密参照を自動指摘。' },
      { title: 'エージェントモードの編集は必ず差分確認', body: 'Copilot の編集は Accept 前に diff で見える。無確認で採用しない運用に固定。' },
      { title: '1ストーリー=1ブランチ=1PR', body: 'PRサイズが小さいほどレビュー所要時間は二乗で短くなる。' },
    ],
    officialRefs: [
      { label: 'Copilot agent mode（GitHub公式）', body: '複数ファイル編集・ターミナル実行・テスト実行を自律的に行うモード。編集は diff で確認して Accept。' },
      { label: 'Terminal auto-approve（VS Code公式設定）', body: 'chat.tools.terminal.autoApprove でコマンド単位に自動承認/必須承認を制御。' },
      { label: 'Copilot Code Review（GitHub公式）', body: 'PRへの自動コードレビュー。リポジトリルールで全PR必須化できる。レビュー観点はカスタム指示で調整。' },
      { label: 'Secret scanning / Push protection（GitHub公式）', body: '機密値の混入をサーバー側で検知・拒否。ローカルのフックと違い回避不能。' },
      { label: 'GitHub Actions + Branch protection（GitHub公式）', body: 'CI required 化で品質ゲートを物理的に強制。' },
    ],
    execution: {
      command: 'US-001（リアルタイム在庫照会）を実装してください。詳細設計のシーケンスと入力検証マトリクスに従って、API Route／Server Action／Repository／Vitest テストを一式、省略せず完全形で出してください。',
      lines: [
        '> エージェントモードで US-001 を実装します',
        '  参照: design/detail/ + specification/stories/US-001.md',
        '',
        '  ターミナル: git checkout -b feat/US-001-inventory（自動承認済コマンド）',
        '',
        '  編集: src/app/(stock)/inventory/page.tsx',
        '  ターミナル: npm run typecheck ... ✓',
        '  ターミナル: npm run lint ... ✓',
        '',
        '  編集: src/server/repositories/stock.repository.ts',
        '  ターミナル: npm run typecheck ... ✗',
        '    Error: Property "warehouse_id" does not exist on type "Stock"',
        '  → 型定義に warehouse_id を追加して再実行 ... ✓',
        '',
        '  編集: src/server/repositories/stock.repository.test.ts',
        '  runTests: npm test ... ✓ (8 passed)',
        '',
        '  差分を提示 → 人間が diff を確認して Accept',
        '',
        '  ターミナル: gh pr create --title "feat(US-001): リアルタイム在庫照会"',
        '  → Copilot Code Review が自動で走行開始',
        '',
        '✓ 完了 PR #41 作成',
      ],
    },
    artifactsOut: [
      {
        name: 'src/app/(stock)/inventory/page.tsx',
        lang: 'tsx',
        body:
`import { stockRepository } from '@/server/repositories/stock.repository'
import { InventorySearch } from '@/components/inventory/InventorySearch'

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  const stocks = code ? await stockRepository.findByItemCode(code) : []

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">在庫照会</h1>
      <InventorySearch defaultCode={code} />
      {code && <InventoryResult stocks={stocks} />}
    </main>
  )
}

function InventoryResult({ stocks }: { stocks: Stock[] }) {
  if (stocks.length === 0) {
    return <p className="text-stone-500">該当する品目がありません</p>
  }
  const total = stocks.reduce((sum, s) => sum + s.quantity, 0)
  return (
    <ul className="mt-4 divide-y">
      {stocks.map((s) => (
        <li key={\`\${s.itemCode}-\${s.warehouseId}\`} className="py-2">
          <span className="font-medium">{s.warehouseName}</span>
          <span className="ml-2 tabular-nums">{s.quantity}</span>
        </li>
      ))}
      <li className="py-2 font-bold">計 {total}</li>
    </ul>
  )
}`,
      },
    ],
    review: {
      skillName: '@simplify',
      prompt: '生成コードに対して再利用性・命名・効率の観点でレビュー。冗長/重複/早すぎる抽象化を指摘し、必要なら修正案を提示。',
      comments: [
        { level: 'INFO', target: 'InventoryResult', body: '同コンポーネント内に表示ロジックが散在。Stock合計の算出を Repository層に寄せる選択肢も検討（YAGNI観点で現状維持も可）' },
        { level: 'OK',   target: '不変性', body: 'reduce / map のみで mutate なし' },
      ],
    },
  },

  // ───────────────────────── 08 ─────────────────────────
  {
    num: '08',
    title: 'テスト & レビュー',
    sub: '自動レビューと3観点レビューで security / review / qa を一括実行',
    duration: '約45分',
    outcome: 'カバレッジ87% / E2E 24本 / 自動修正18件 / セキュリティ問題ゼロ',
    flow: {
      input:     { label: 'PR #41-#76',                 detail: '実装PR一式' },
      operation: { label: 'Copilot Code Review + /full-review', detail: '自動 + 依頼レビュー' },
      config:    { label: 'code-reviewer + qa-engineer', detail: 'カスタムチャットモード使い分け' },
      output:    { label: 'review-report.md',           detail: 'レビュー総括' },
    },
    configFiles: [
      {
        kind: 'subagent',
        path: '.github/chatmodes/code-reviewer.chatmode.md',
        lang: 'md',
        body:
`---
description: PRのdiffを精査。.github/copilot-instructions.md規約・命名・不変性・例外境界・性能を確認
tools: ['codebase', 'search', 'runInTerminal', 'github']
model: Claude Opus 4.5
---
レビュー観点:
1. .github/copilot-instructions.md規約準拠
2. 不変性（mutate禁止）
3. 例外の境界層集約
4. N+1クエリ / 不要なPromise.all 欠落
5. 命名 (verb-noun, isXxx, hasXxx)
6. テスト網羅 (正常/異常系)

出力: PRコメント形式 (file:line + 提案コード)`,
      },
      {
        kind: 'subagent',
        path: '.github/chatmodes/qa-engineer.chatmode.md',
        lang: 'md',
        body:
`---
description: ユーザーストーリーから単体/E2Eテストを生成し、Playwright MCPで実行
tools: ['codebase', 'editFiles', 'runTests', 'playwright']
model: Claude Sonnet 4.5
---
- 単体: Vitest, AAA(Arrange/Act/Assert)
- E2E: Playwright, ストーリー単位
- 受入基準のGherkin Scenarioをそのまま it() に変換`,
      },
      {
        kind: 'skill',
        path: '.github/instructions/security-review.instructions.md',
        lang: 'md',
        body:
`---
applyTo: "src/**"
description: 変更diffをOWASP Top10観点で精査し、検出時はファイル/行/CWE/重大度/修正案を返す
---
# Security Review

## 観点（OWASP Top 10:2021）
- A01 Broken Access Control
- A02 Cryptographic Failures
- A03 Injection
- A04 Insecure Design
- A05 Security Misconfiguration
- A06 Vulnerable & Outdated Components
- A07 Identification & Authentication
- A08 Software and Data Integrity
- A09 Security Logging & Monitoring
- A10 SSRF

## 出力フォーマット
\`\`\`
[A03 Injection] src/api/users.ts:42 (CWE-89, High)
原因: 文字列連結によるSQL組立
修正: parameterized query を使う
\`\`\`

## 動作
- /full-review プロンプトから参照して起動
- diff 全体を一括レビュー
- 既存実装の追跡コミットがある場合は原典まで遡る`,
      },
      {
        kind: 'mcp',
        path: '.vscode/mcp.json（Playwright MCP）',
        lang: 'json',
        body:
`{
  "servers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}`,
      },
      {
        kind: 'command',
        path: '.github/prompts/full-review.prompt.md',
        lang: 'md',
        body:
`---
mode: agent
description: security-review / code-reviewer / qa-engineer の3観点レビューを実行して総括レポートを作成
tools: ['codebase', 'search', 'runInTerminal', 'runTests', 'github']
---
# 3観点レビュー

PR #\${input:prNumber} を3つの観点で順にレビュー:

1. security-review instructions の観点で差分を精査
2. code-reviewer モードの観点で規約・不変性・性能を精査
3. qa-engineer モードの観点で受入基準をテスト化し実行

3者の出力を docs/08-review-report.md に統合し、
自動修正可能な指摘は適用、人判断が必要なものは残置。

呼び出し: チャットで /full-review と入力`,
      },
    ],
    bestPractices: [
      { title: '自動レビューと依頼レビューの二段構え', body: 'PR作成と同時に Copilot Code Review が自動で走り、深掘りは /full-review で3観点実行。取りこぼしが減る。' },
      { title: '「指摘」より「修正案」', body: 'レビューコメントは修正提案コードを添える方が採用率が高い。code-reviewerに「提案コード必須」を規約化。' },
      { title: '自動修正対象と人判断を分離', body: 'lint/format/import順は機械が直す。設計レイヤーの指摘は人が決める。CIで前者を吸収すると後者に集中できる。' },
      { title: 'Playwright MCPでE2Eを内製化', body: 'Playwright MCP は実ブラウザを操作。受入基準のGherkinをそのまま再生できる。' },
    ],
    officialRefs: [
      { label: 'Copilot Code Review（GitHub公式）', body: 'PR作成時に自動レビュー。カスタム指示でOWASP観点や社内規約を追加できる。' },
      { label: 'Playwright MCP（Microsoft公式）', body: '@playwright/mcp。実ブラウザ操作・スナップショット・ネットワーク監視まで提供。' },
      { label: 'GitHub MCP（GitHub公式）', body: 'PR/Issue/コメントを直接操作。code-reviewerが指摘をPRコメントとして直接投下できる。' },
      { label: 'Copilot Coding Agent（GitHub公式）', body: 'レビュー指摘の修正を Issue 化して copilot にアサインすると、バックグラウンドで修正PRを作成。' },
    ],
    execution: {
      command: 'PR #41 のソース一式について、Gherkin 受入基準を Vitest テストに変換して実行し、pass/fail を表で示してください。あわせて型エラー・不変性違反・例外処理の境界もレビューしてください。',
      lines: [
        '> /full-review で3観点レビューを実行',
        '',
        '[security-review 観点]',
        '  OWASP Top10 観点でdiffを精査',
        '  検出: 0件',
        '',
        '[code-reviewer 観点]',
        '  PR #41-#76 を順次レビュー',
        '  検出 24件 (INFO 18 / WARN 6 / ERROR 0)',
        '  自動修正適用: 18件',
        '',
        '[qa-engineer 観点]',
        '  単体テスト 124件生成 → 実行 ✓ カバレッジ 87.4%',
        '  E2E 24シナリオ → Playwright MCP で実行 ✓',
        '',
        '✓ 完了 (44分38秒)',
        '  Write: docs/08-review-report.md',
      ],
    },
    artifactsOut: [
      {
        name: 'docs/08-review-report.md',
        lang: 'md',
        body:
`# レビュー総括レポート

## サマリ
- セキュリティ問題: 0件
- レビュー指摘: 24件 (うち18件は自動修正済)
- 単体テスト: 124件 / カバレッジ 87.4%
- E2E: 24シナリオ / 全PASS

## 残課題 (要対応)
| ID | 内容 | 担当 | 期日 |
|----|------|------|------|
| RV-003 | InventoryResult の責務分離 | TL | 04-26 |
| RV-007 | バーコード読取の権限 fallback | DEV | 04-27 |
| RV-014 | 監査ログのバッチ書込再考 | ARCH | 04-30 |

## ブロックなし → デプロイ準備へ`,
      },
    ],
    review: {
      skillName: '@security-review',
      prompt:
`OWASP Top10 (A01: Broken Access / A02: Cryptographic / A03: Injection / A07: Identification ...) 観点で diff を精査。
検出時はファイル/行/CWE/重大度/修正案をPRコメントで返す。`,
      comments: [
        { level: 'OK', target: 'A03 Injection', body: 'Prisma + parameterized query。文字列連結なし' },
        { level: 'OK', target: 'A07 Auth',      body: 'JWT検証ミドルウェアが全API Routeに適用' },
      ],
    },
  },

  // ───────────────────────── 09 ─────────────────────────
  {
    num: '09',
    title: 'CI/CD・デプロイ',
    sub: 'IaCとパイプラインを生成、本番環境を立ち上げ',
    duration: '約20分',
    outcome: 'GitHub Actions / Terraform / 本番URL払い出し / Smoke Test PASS',
    flow: {
      input:     { label: 'main ブランチ',     detail: 'マージ済コード' },
      operation: { label: '/setup-cicd',       detail: 'CI/CD構築' },
      config:    { label: 'devops agent + GitHub MCP', detail: 'Vercel + Supabase' },
      output:    { label: 'pipeline + infra',  detail: '稼働中の本番' },
    },
    configFiles: [
      {
        kind: 'subagent',
        path: '.github/chatmodes/devops.chatmode.md',
        lang: 'md',
        body:
`---
description: GitHub Actions / Terraform / Vercel / Supabase を一括構築
tools: ['codebase', 'editFiles', 'runInTerminal', 'github']
model: Claude Opus 4.5
---
構築物:
- .github/workflows/ci.yml (lint / typecheck / test / build)
- .github/workflows/cd.yml (Vercel preview / production deploy)
- infra/terraform/ (Supabase RLS / SFTP用VPC)
- Dockerfile (バッチ用)
- Smoke Test (本番疎通)

セキュリティ:
- Secrets はハードコード禁止
- 認証は GitHub OIDC + Vercel Token
- terraform apply は人間承認後のみ実行`,
      },
      {
        kind: 'mcp',
        path: '.vscode/mcp.json（GitHub MCP）',
        lang: 'json',
        body:
`{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
// VS Code の MCP 設定は .vscode/mcp.json に "servers" キーで記述
// GitHub MCP はリモート(HTTP)サーバーとして OAuth 接続できる`,
      },
      {
        kind: 'hook',
        path: '.github/workflows/iac-guard.yml（IaC変更の見張り）',
        lang: 'yaml',
        body:
`name: iac-guard
on:
  pull_request:
    paths: ['infra/**']
jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - name: terraform plan を PR コメントに添付
        run: |
          terraform -chdir=infra plan -no-color > plan.txt
          gh pr comment "\$PR_NUMBER" --body-file plan.txt
        env:
          GH_TOKEN: \${{ github.token }}
          PR_NUMBER: \${{ github.event.number }}
# apply は environment 承認ゲート付きの別ワークフローで人間承認後のみ`,
      },
    ],
    bestPractices: [
      { title: 'Secretsは GitHub OIDC で短期発行', body: 'long-lived token は流出した瞬間に詰む。OIDCは数分有効、ジョブ完了で失効。' },
      { title: 'terraform plan を必ずPRに添付', body: 'apply は承認後の手動。インフラ変更は「読んでから動かす」が大原則。' },
      { title: 'ロールバック手順をRunbookに先に書く', body: 'デプロイ手順書よりロールバック手順書の方が緊急時に必要。順番に注意。' },
      { title: 'Smoke Testで本番疎通を1秒で検知', body: '/api/health + 主要画面1本だけでよい。デプロイ完了≠正常稼働。' },
    ],
    officialRefs: [
      { label: 'GitHub MCP（GitHub公式）', body: 'PR作成・Action実行・Release管理。devops エージェントの主要連携先。' },
      { label: 'GitHub Actions: Environments（GitHub公式）', body: 'production 環境に必須レビュアーを設定すると、terraform apply 等は人間承認後のみ実行。' },
    ],
    execution: {
      command: '今回のリリース（US-001〜036 / マイグレーション1件）について、CI/CD パイプラインとデプロイ手順書を作成してください。ロールバック手順は手順書の冒頭に置き、環境変数チェックリストは落ちる順に並べてください。',
      lines: [
        '> devops モードに切替...',
        '  GitHub Actions ワークフロー生成 (ci.yml / cd.yml)',
        '  Terraform module: supabase_project / sftp_vpc',
        '  Dockerfile: バッチ連携コンテナ',
        '  Vercel 接続 (GitHub MCP 経由でリポジトリ連携)',
        '',
        '  terraform plan',
        '    + supabase_project.kakuu',
        '    + supabase_storage.csv_inbox',
        '    + aws_vpc.sftp_bridge',
        '  terraform apply (承認後実行)',
        '',
        '  Vercel deploy production',
        '    https://kakuu-stock.vercel.app',
        '',
        '  Smoke Test:',
        '    GET /api/health → 200 ✓',
        '    GET /inventory?code=A-001 → 200 ✓',
        '',
        '✓ 完了 (19分04秒)',
      ],
    },
    artifactsOut: [
      {
        name: '.github/workflows/ci.yml',
        lang: 'yaml',
        body:
`name: CI
on:
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test --coverage
      - run: pnpm build
      - uses: codecov/codecov-action@v4`,
      },
      {
        name: 'infra/terraform/main.tf',
        lang: 'hcl',
        body:
`terraform {
  required_providers {
    supabase = { source = "supabase/supabase", version = "~> 1.0" }
    aws      = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

resource "supabase_project" "kakuu" {
  organization_id = var.supabase_org_id
  name            = "kakuu-stock-prod"
  region          = "ap-northeast-1"
  db_pass         = var.db_password
}

resource "aws_vpc" "sftp_bridge" {
  cidr_block = "10.20.0.0/16"
  tags = { Name = "kakuu-sftp-bridge" }
}`,
      },
    ],
    review: {
      skillName: '/cd-review',
      prompt: 'パイプラインのSecrets取り回し、本番Apply前の承認フロー、ロールバック手順をチェック。',
      comments: [
        { level: 'OK',   target: 'Secrets',       body: 'GitHub OIDC + Vercel Token, ハードコード一切なし' },
        { level: 'INFO', target: 'ロールバック', body: 'Vercel rollback コマンドをRunbook 09-2に記載済' },
      ],
    },
  },

  // ───────────────────────── 10 ─────────────────────────
  {
    num: '10',
    title: '保守運用',
    sub: '定期ジョブと障害対応をエージェントで自動化',
    duration: '常時稼働',
    outcome: '監視ダッシュ / Runbook / 週次レポート自動生成 / インシデントPostMortem',
    flow: {
      input:     { label: '本番運用ログ',           detail: 'Datadog / Vercel logs' },
      operation: { label: 'Actions schedule + Coding Agent',  detail: '定期実行 + Issue自動処理' },
      config:    { label: 'workflows + postmortem指示', detail: 'サーバー側で自動起動' },
      output:    { label: 'reports/ + Runbook/',   detail: '運用ドキュメント' },
    },
    configFiles: [
      {
        kind: 'harness',
        path: '.github/workflows/daily-health-check.yml（定期レポート）',
        lang: 'yaml',
        body:
`name: daily-health-check
on:
  schedule:
    - cron: '0 0 * * *'   # 毎朝9時 JST (UTC 0時)
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: メトリクス取得とレポート生成
        run: node scripts/health-report.mjs   # Datadog API から24h集計
        env:
          DD_API_KEY: \${{ secrets.DD_API_KEY }}
      - name: 閾値超過なら Issue を起票し Copilot に割当
        run: |
          if grep -q '【要対応】' reports/daily/latest.md; then
            gh issue create --title "健全性アラート \$(date +%F)" \\
              --body-file reports/daily/latest.md \\
              --assignee copilot
          fi
        env:
          GH_TOKEN: \${{ github.token }}
# copilot に assign された Issue は Coding Agent が
# バックグラウンドで調査し、修正PRまで自動作成する`,
      },
      {
        kind: 'skill',
        path: '.github/instructions/postmortem.instructions.md',
        lang: 'md',
        body:
`---
applyTo: "incidents/**/*.md"
description: 障害発生時、ログ・タイムライン・影響範囲・根本原因・再発防止を5 Whysで分析しPostMortemを生成
---
# PostMortem テンプレート

## 概要
発生日時 / 検知日時 / 復旧日時 / 影響範囲

## タイムライン
| 時刻 | 出来事 | 担当 |

## 根本原因 (5 Whys)
1. なぜ発生したか
2. なぜ防げなかったか
...

## 再発防止
- 短期(48h以内): ...
- 中期(2週間以内): ...
- 長期(次四半期): ...

## NG表現
- 「気をつける」「徹底する」「意識する」は再発防止として認めない
- 必ず「仕組み」「自動化」「CI化」で書く`,
      },
      {
        kind: 'mcp',
        path: '.vscode/mcp.json（Datadog / Slack MCP）',
        lang: 'json',
        body:
`{
  "servers": {
    "datadog": {
      "command": "npx",
      "args": ["-y", "@datadog/mcp-server-datadog"],
      "env": {
        "DD_API_KEY": "\${input:dd-api-key}",
        "DD_APP_KEY": "\${input:dd-app-key}",
        "DD_SITE": "datadoghq.com"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": { "SLACK_BOT_TOKEN": "\${input:slack-token}" }
    }
  }
}
// VS Code の mcp.json は "servers" キー。
// 機密値は \${input:...} でプロンプト入力にし、コミットしない`,
      },
      {
        kind: 'subagent',
        path: '.github/chatmodes/incident-responder.chatmode.md',
        lang: 'md',
        body:
`---
description: アラート受信時、ログ集約 → タイムライン構築 → 5 Whys → 仮説提示 → Slack共有まで支援
tools: ['codebase', 'editFiles', 'datadog', 'slack']
model: Claude Opus 4.5
---
動作:
1. Datadog MCP で発生時刻前後30分のメトリクス・ログを取得
2. タイムラインに整形
3. postmortem instructions を適用し 5 Whys を実行
4. 根本原因候補を3つ提示（確信度付き）
5. Slack #incident に共有、対応方針を募る`,
      },
      {
        kind: 'command',
        path: '.github/prompts/incident-respond.prompt.md',
        lang: 'md',
        body:
`---
mode: agent
description: 障害IDを入力に、ログ集約からPostMortemドラフトまで作成
tools: ['codebase', 'editFiles', 'datadog', 'slack']
---
# 障害対応パイプライン
incident-responder モードの手順で \${input:incidentId} の関連ログを集約。
postmortem instructions を適用し、ドラフトを
incidents/\${input:incidentId}/postmortem.md に書き出す。

呼び出し: チャットで /incident-respond と入力`,
      },
    ],
    bestPractices: [
      { title: 'Actions schedule で報告を週次から日次に圧縮', body: '人が書くと「週次がやっと」。スケジュール実行 + 自動集計なら日次で粒度が上がる。' },
      { title: '5 Whysは「組織課題」まで掘る', body: 'なぜ→「徹底できなかった」で止めると再発する。「なぜ徹底できない仕組みか？」まで掘る。' },
      { title: '再発防止に期日を必ず明記', body: '短期48h / 中期2週間 / 長期次四半期。期日のない対策は実装されない。' },
      { title: '「気をつける」を禁則ワードに', body: 'postmortem instructions 内でNG表現として明記。仕組み・自動化・CI化で書かせる。' },
      { title: 'アラートIssueは copilot にアサイン', body: 'Coding Agent が裏で調査し修正PRまで作る。人間は「方針判断」と「PRレビュー」だけに集中。' },
    ],
    officialRefs: [
      { label: 'GitHub Actions: schedule（GitHub公式）', body: 'cron 形式でワークフローを定期起動。日次レポートや棚卸しジョブの置き場所。' },
      { label: 'Slack MCP（公式提供）', body: '@modelcontextprotocol/server-slack。チャネル投稿・スレッド返信・ユーザー検索が標準操作。' },
      { label: 'Datadog MCP（Datadog公式）', body: 'メトリクス/ログ/モニタを GitHub Copilot から直接取得。インシデント対応で必須。' },
      { label: 'Copilot Coding Agent（GitHub公式）', body: 'Issue を copilot にアサインするとサーバー側で自律実行し、draft PR を作成。環境は copilot-setup-steps.yml で定義。' },
    ],
    execution: {
      command: '毎朝9時に自動起動するルーチンを設定して、直近24時間のエラー率／p95レスポンス／CSV連携成否を reports/daily/YYYY-MM-DD.md にまとめてください。閾値（エラー率0.5% / p95 2.0s）を超えていれば Slack の #ops に通知してください。',
      lines: [
        '> daily-health-check.yml を main に merge',
        '  schedule: 0 0 * * * (毎朝9時 JST)',
        '✓ Actions に登録完了',
        '',
        '--- 翌朝9時 自動実行 ---',
        '> /health-check 24h',
        '  Datadog MCP: APM metrics 取得 (24h)',
        '  エラー率: 0.04% (閾値0.5%以下)',
        '  p95レスポンス: 1.2s (閾値2.0s以下)',
        '  CSV連携: 全1件成功',
        '',
        '  Write: reports/daily/2026-04-26.md',
        '✓ 完了',
        '',
        '--- 障害発生時 ---',
        '> /incident-respond INC-2026-04-30',
        '  incident-responder モードで処理',
        '  Datadog ログ取得 → タイムライン構築',
        '  postmortem instructions を適用',
        '  5 Whys 自動分析 → 根本原因候補3つ提示',
        '  Slack #incident に共有',
        '  Write: incidents/INC-2026-04-30/postmortem.md',
      ],
    },
    artifactsOut: [
      {
        name: 'reports/weekly/2026-W17.md',
        lang: 'md',
        body:
`# 週次運用レポート 2026-W17

## サマリ
- 稼働率: 99.97% (SLO 99.5% 達成)
- 平均レスポンス: 0.8s
- 取引件数: 14,820件
- インシデント: 0件

## トレンド
- 在庫照会のp95が前週比+12% (1.07s → 1.21s)
- 大田拠点のCSV連携が3日連続で1分遅延
  → 原因: SFTP接続タイムアウト
  → 対応: 次週中に接続プール拡張 (Issue #182)

## 来週の予定メンテ
- 04-30 02:00-04:00 Supabase メジャーアップデート`,
      },
      {
        name: 'incidents/INC-2026-04-30/postmortem.md',
        lang: 'md',
        body:
`# INC-2026-04-30 PostMortem

## 概要
- 発生 13:42 / 検知 13:43 / 復旧 14:11 (29分)
- 影響: 大田拠点のバーコード入出庫が一時停止 (取引数 0)

## タイムライン
| 時刻 | 出来事 |
|------|--------|
| 13:42 | API 5xx 急増 (Datadog アラート発火) |
| 13:43 | オンコール検知、Slack #incident |
| 13:50 | 原因切り分け: 大田 VPN 切断 |
| 14:05 | 自動フェイルオーバー手順実行 |
| 14:11 | 全拠点で復旧確認 |

## 根本原因 (5 Whys)
1. なぜ停止? → 大田-本社間のVPN切断
2. なぜ切断? → 拠点ルータのファーム自動更新
3. なぜ自動更新? → メンテ枠の合意がなかった
4. なぜ合意なし? → 拠点ネットワーク変更の連絡経路が未整備
5. なぜ未整備? → 開発スコープ外として後回し

## 再発防止
- 短期: ルータ自動更新を停止 (本日中)
- 中期: 拠点ネットワーク変更の連絡経路を明文化 (2週間)
- 長期: 拠点フェイルオーバーをアプリ層で吸収するADR追加 (次四半期)`,
      },
    ],
    review: {
      skillName: '@postmortem',
      prompt: '5 Whysが浅くないか、再発防止が「気をつける」「徹底する」で終わっていないか、期日が明示されているかチェック。',
      comments: [
        { level: 'OK', target: '5 Whys',     body: '組織課題まで掘り下げ' },
        { level: 'OK', target: '再発防止',   body: '短期/中期/長期に分かれ、期日明示' },
      ],
    },
  },
];
