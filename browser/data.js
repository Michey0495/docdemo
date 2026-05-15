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

// kind: 'instructions' | 'workspace' | 'prompt' | 'attachment' | 'connector' | 'routine' | 'review'
const KIND_LABEL = {
  instructions: 'カスタム指示・プロジェクト知識',
  workspace:    'Projects / Gem / Copilot エージェント',
  prompt:       'テンプレートプロンプト',
  attachment:   '添付ファイル',
  connector:    'コネクタ・拡張機能',
  routine:      '定期実行ルーチン',
  review:       'レビュー手順（人手）',
};

// ブラウザAIチャットの基本方針（全工程共通の前提）
// - 4ツールを役割で使い分ける:
//   ChatGPT   : コード生成・データ分析(Code Interpreter)・画像・Canvas
//   Claude.ai : 長文の設計書・仕様書・Artifactsプレビュー
//   Gemini    : Google Workspace連携(Docs/Sheets)・超長文の横断読解
//   M365 Copilot : 社内データ(SharePoint/Teams/Outlook)接続・Office納品
// - CLIや専用エディタは入れない。成果物はダウンロード/コピペで取り出す
// - 自動連鎖の代わりに「テンプレートプロンプト + 人手レビュー手順」で品質を担保

// ===== 工程データ =====
const PHASES = [

  // ───────────────────────── 01 ─────────────────────────
  {
    num: '01',
    title: 'ヒアリング解析',
    sub: '会議文字起こしから要求を構造化抽出',
    duration: '約5分',
    outcome: '機能要求48件・非機能要求12件・制約7件・ステークホルダー4名を一覧化（発言者とタイムスタンプ付き）',
    flow: {
      input:     { label: '会議の文字起こし', detail: 'Teams/Meet 自動文字起こし 約20,000字' },
      operation: { label: '要求抽出プロンプト送信', detail: 'Gemini に貼付 + Doc 参照' },
      config:    { label: '要求工学カスタム指示', detail: 'Gem のシステム指示' },
      output:    { label: '要求一覧（生）', detail: 'Googleスプレッドシート / Markdown' },
    },
    artifactsIn: [
      {
        name: '会議文字起こし（Google Docs に保存）',
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
        kind: 'instructions',
        path: 'Gemini Gem「要求アナリスト」のシステム指示',
        lang: 'md',
        body:
`あなたは要求工学の専門家です。会議の文字起こしから要求を構造化抽出します。

# 出力フォーマット
機能要求(FR) / 非機能要求(NFR) / 制約(CON) / ステークホルダー(SH) の4区分。
それぞれ表形式で、列は ID・要求・発言者・タイムスタンプ・確信度(高/中/低)。

# 抽出ルール
- 発言の根拠タイムスタンプを必ず保持（後で原文に1秒で戻れること）
- 計測不能な要求（使いやすい等）は「要具体化」と明記
- 暗黙要求は (推定) を本文に付ける
- 否定の発言（〜は不要）も要求として残す
- 入力が長い場合は5,000字ずつに区切って処理し、最後に統合する

# 禁止
- 要約しすぎて発言の粒度を失わない
- 出典のない要求を勝手に足さない`,
      },
      {
        kind: 'workspace',
        path: 'ツールの使い分け（この工程）',
        lang: 'text',
        body:
`主担当: Gemini Gem「要求アナリスト」
  理由: 文字起こしが Google Meet / Docs 上にあり、20,000字超を一度に読める長コンテキスト

副担当: Microsoft 365 Copilot
  理由: 会議が Teams の場合、Copilot が会議のトランスクリプトに直接アクセスできる
  使い方: Teams 会議を開き「この会議の決定事項と要望を一覧化して」と指示

クロスチェック: ChatGPT Projects に同じ文字起こしを添付し、抽出結果を突き合わせる
  → 2ツールで拾った要求の差分が、聞き漏らし候補になる`,
      },
      {
        kind: 'prompt',
        path: 'テンプレートプロンプト（保存して再利用）',
        lang: 'md',
        body:
`添付（または下記）の会議文字起こしから、機能要求/非機能要求/制約/ステークホルダーを
表形式で抽出してください。

制約:
- 各行に発言者とタイムスタンプを必ず付ける
- 計測不能な表現には【要具体化】タグ
- 暗黙の前提は (推定) と明示
- 最後に「聞き漏らしの可能性がある論点」を5件、別表で提示

出力はそのまま Google スプレッドシートに貼れる TSV でも出してください。`,
      },
    ],
    bestPractices: [
      { title: '一次ソースを必ず残す', body: '発言者とタイムスタンプを各要求行に持たせる。商談後に「これは誰の要望か」を即答できる構造を最初に作る。チャットの一発抽出でも、ここを省くと後工程が崩れる。' },
      { title: 'Gem / GPT に役割を固定する', body: '毎回プロンプトに長い前提を貼ると揺れる。Gemini の Gem や ChatGPT の Projects 指示に要求工学のルールを常駐させ、入力だけ差し替える。' },
      { title: '2ツールで重ね読みする', body: 'CLIのサブエージェント二段レビューの代わりに、Gemini と ChatGPT で別々に抽出し差分を取る。片方だけが拾った要求が見落とし候補。' },
      { title: '長文は分割を指示に書き込む', body: '20,000字超は「5,000字ずつ処理して統合」と指示文に固定。チャットは黙っていると後半を雑に読む。' },
    ],
    officialRefs: [
      { label: 'Gemini Gems（Google公式）', body: 'カスタム指示を保存した専用チャット。Google Docs / Drive のファイルを参照できる。要求工学ルールの常駐先。' },
      { label: 'Microsoft 365 Copilot in Teams（Microsoft公式）', body: '会議のトランスクリプトに基づき決定事項・アクションを抽出。社内会議はここが一次ソースになる。' },
      { label: 'ChatGPT Projects（OpenAI公式）', body: 'プロジェクト単位でカスタム指示とファイルを保持。クロスチェック用の第2ビューとして使う。' },
    ],
    execution: {
      tool: 'Gemini（Gem: 要求アナリスト）',
      command: '添付した会議文字起こしから要求を構造化抽出して。発言者とTSを必ず残して。',
      lines: [
        'Gem「要求アナリスト」が応答中...',
        '  参照: 会議文字起こし.gdoc (19,847字)',
        '  5,000字ずつ4ブロックで処理 → 統合',
        '',
        '抽出結果:',
        '  機能要求 FR  48件',
        '  非機能要求 NFR 12件',
        '  制約 CON      7件',
        '  ステークホルダー SH 4名',
        '',
        '聞き漏らし候補（別表）:',
        '  - セキュリティ要件が暗黙のみ（NFR-003 推定）',
        '  - 棚卸し差異の保持期間が未定義',
        '',
        'TSV を出力しました。スプレッドシートに貼り付けてください。',
      ],
    },
    artifactsOut: [
      {
        name: '01-requirements-raw（Googleスプレッドシート / Markdown）',
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
      skillName: '別ツール（ChatGPT Projects）で同じ文字起こしを抽出し、差分をレビュー',
      prompt:
`次の観点で抽出結果をチェックしてください。
1. 計測不能な要求（具体化要請が必要なもの）
2. 重複・矛盾
3. ステークホルダー別の網羅（権限者ごとに最低1件）
4. 暗黙要求の取りこぼし（特にセキュリティ・法令）
結果は [INFO]/[WARN]/[ERROR] + 該当ID + 提案 の形式で。`,
      comments: [
        { level: 'INFO', target: 'FR-007', body: '「画面はかっこよく」は計測不能。具体化要請が必要' },
        { level: 'WARN', target: 'NFR-003', body: 'セキュリティ要件が暗黙のみ。次回ヒアリングで深掘り推奨' },
        { level: 'OK',   target: '全件',    body: 'ChatGPT 抽出と突合し、FR48件すべてに発言者ソースとTSを確認' },
      ],
    },
  },

  // ───────────────────────── 02 ─────────────────────────
  {
    num: '02',
    title: '要求精査・優先度付け',
    sub: 'MoSCoW分類とステークホルダー確認シート',
    duration: '約12分',
    outcome: 'Must16 / Should14 / Could10 / Wont8。確認シートを自動生成し、先方の同意1往復で確定',
    flow: {
      input:     { label: '要求一覧（生）', detail: 'スプレッドシート 67行' },
      operation: { label: 'MoSCoW分類プロンプト', detail: 'ChatGPT に投入' },
      config:    { label: '判断保留ルール', detail: 'GPT の Projects 指示' },
      output:    { label: '優先度付き要求 + 確認シート', detail: 'Markdown / Word' },
    },
    artifactsIn: [
      { name: '01-requirements-raw（前工程の成果物）', lang: 'md', body: '（機能要求48件・非機能要求12件・制約7件・ステークホルダー4名）' },
    ],
    configFiles: [
      {
        kind: 'instructions',
        path: 'ChatGPT Project「優先度づけ」のカスタム指示',
        lang: 'md',
        body:
`要求一覧を MoSCoW で分類する。

分類基準:
- Must  : リリース必須。なければプロジェクト失敗
- Should: 重要だが回避策あり
- Could : あれば嬉しい
- Wont  : 今回スコープ外（次フェーズ候補）

迷ったら勝手に決めず、必ず質問する条件:
- 確信度が中・低で、かつ Must 候補
- 予算/スケジュール制約に抵触する可能性
- ステークホルダー間で対立する要求

出力:
1. 優先度カラム付きの要求表
2. ステークホルダー別の確認シート（社長/現場/情シスで論点を分ける）
Must比率が40%を超えたら警告を出す。`,
      },
      {
        kind: 'workspace',
        path: 'ツールの使い分け（この工程）',
        lang: 'text',
        body:
`主担当: ChatGPT Project「優先度づけ」
  理由: 分類の判断保留を質問として返させたい。会話の往復がしやすい

人手の判断: 優先度はビジネス判断であり技術判断ではない
  → AIが Must/Should を断定したら、その場で根拠を問い返す
  → 確認シートは Gemini で Google ドキュメント化し、先方と共有

確認シートの配布:
  社内会議が Teams なら M365 Copilot で確認シートを会議メモに添付`,
      },
      {
        kind: 'prompt',
        path: 'テンプレートプロンプト',
        lang: 'md',
        body:
`添付の要求一覧を MoSCoW 分類してください。

ルール:
- 確信度が中・低で Must 候補のものは、即断せず私に質問する
- 予算1,500万/年・リリース6ヶ月の制約に抵触しそうなら指摘する
- Must が全体の40%を超えたら「要求肥大の可能性」と警告

出力:
1. 優先度カラム付き要求表（TSV）
2. ステークホルダー別 確認シート（山本社長/田中物流部長/佐藤情シス）
   各人の関心事に絞った確認項目だけを並べる`,
      },
    ],
    bestPractices: [
      { title: '即断させず質問させる', body: 'AskUserQuestion 的なふるまいを指示文で再現する。「迷ったら質問」とカスタム指示に固定し、AIが優先度を断定したら根拠を問い返す。優先度はビジネス判断。' },
      { title: 'Must比率は20〜40%に収める', body: '50%超は要求肥大のサイン。AIに「40%超で警告」を出させ、人間が削る判断をする。全部Mustは精査が機能していない証拠。' },
      { title: '確認シートは相手別に割る', body: '社長/現場/情シスで関心事が違う。1枚にまとめて投げると自分の論点しか見ない。Gemini で Google ドキュメント化し3部に分ける。' },
      { title: 'Wont を「捨てた」と言わない', body: '次フェーズ候補として並べたと伝える。商談での印象が変わる。' },
    ],
    officialRefs: [
      { label: 'ChatGPT Projects（OpenAI公式）', body: 'プロジェクト単位のカスタム指示で「判断保留ルール」を常駐。会話の往復で人間の判断を差し込める。' },
      { label: 'Gemini + Google ドキュメント（Google公式）', body: '確認シートをそのまま共有可能なドキュメントとして出力。先方コメントを同じ場所で受けられる。' },
    ],
    execution: {
      tool: 'ChatGPT（Project: 優先度づけ）',
      command: '添付の要求一覧をMoSCoW分類して。迷うものは質問して。',
      lines: [
        'ChatGPT が応答中...',
        '  67件を読み込み、分類を試行',
        '  自動分類: 58件',
        '  判断保留: 9件 → 質問します',
        '',
        'Q: FR-021「IoTセンサー連携」は今回の Must ですか?',
        '   発言者の確信度: 低 / 予算逼迫: 該当',
        '   候補: Must / Should / Could / Wont',
        'あなた: Wont（次フェーズ）',
        '',
        '... 8件の確認を経て分類確定',
        '',
        'Must 16 / Should 14 / Could 10 / Wont 8',
        'Must比率 33% （警告閾値40%以下）',
        '優先度表(TSV)とステークホルダー別確認シートを出力しました。',
      ],
    },
    artifactsOut: [
      {
        name: '02-requirements-final（Markdown / Word）',
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

## Should (14件)
- FR-005 棚卸差異の原因追跡
- FR-009 在庫アラート（下限割れ）

## Could (10件)
## Wont (今回スコープ外, 次フェーズ候補)
- FR-021 IoTセンサー連携
- FR-034 AI需要予測`,
      },
      {
        name: '02-stakeholder-review（Google ドキュメント）',
        lang: 'md',
        body:
`# ステークホルダー確認シート

田中物流部長 / 現場運用 / 確認依頼:
  - FR-005 棚卸差異追跡 を Should にしました。年4回の棚卸でMust相当ですか?
  - FR-013 写真添付 を Could にしました。証跡として必須では?

山本社長 / ROI判断 / 確認依頼:
  - FR-021 IoTセンサー / FR-034 AI予測 は次フェーズへ。今期スコープ外で問題ありませんか?

佐藤情シス / 連携 / 確認依頼:
  - FR-027 SAML認証 を Should にしました。法令要件として Must では?`,
      },
    ],
    review: {
      skillName: 'Claude.ai に分類結果を貼り、Must比率と偏りを独立チェック',
      prompt: 'MoSCoW分類結果を確認し、Must比率33%（16/48）が妥当か、ステークホルダー別の偏りがないか、確認シートが必要十分かをチェック。',
      comments: [
        { level: 'OK',   target: 'Must比率',    body: '33%。健全範囲(20-40%)に収まる' },
        { level: 'INFO', target: '確認シート', body: '3名分・計5項目。次の打合せ前に送付推奨' },
      ],
    },
  },

  // ───────────────────────── 03 ─────────────────────────
  {
    num: '03',
    title: '要件定義書作成',
    sub: '社内規約に沿ったRDDを生成',
    duration: '約15分',
    outcome: '要件定義書（20章相当）+ 業務フロー図（Mermaid）+ 用語集を Artifact で一括生成',
    flow: {
      input:     { label: '優先度付き要求', detail: 'requirements-final' },
      operation: { label: 'RDD生成プロンプト', detail: 'Claude.ai に投入' },
      config:    { label: 'RDDテンプレ + ドキュメント規約', detail: 'Claude Project の知識' },
      output:    { label: '要件定義書 v1.0', detail: 'Claude Artifact → Word' },
    },
    configFiles: [
      {
        kind: 'instructions',
        path: 'Claude Project「要件定義」のカスタム指示',
        lang: 'md',
        body:
`要件定義書(RDD)を社内規約に沿って作成する。

# ドキュメント規約
- 章立ては ISO/IEC/IEEE 29148 準拠
- 図は Mermaid（PlantUML不可）
- 用語は末尾の用語集に統一（表記揺れ禁止）
- 受身を避け能動態で書く

# トレーサビリティ
- すべての要件に FR/NFR/CON ID を付与し要求一覧と紐付け
- 章末に「関連要求ID一覧」を必ず置く

# 出力
Artifact（Markdown）で1本にまとめる。完成後に Word 変換しやすい見出し構造にする。`,
      },
      {
        kind: 'workspace',
        path: 'ツールの使い分け（この工程）',
        lang: 'text',
        body:
`主担当: Claude.ai Project「要件定義」+ Artifacts
  理由: 数万字の長文ドキュメントを崩さず一気に書ける。
        Artifact で章構成を見ながら編集指示を返せる

プロジェクト知識に置くファイル:
  - RDD章構成テンプレート（下記）
  - 02-requirements-final（前工程の成果物）
  - 既存システム概要メモ

納品形式: Artifact の Markdown を Word に変換
  Word 体裁が必要なら M365 Copilot で「この Markdown を社内RDDテンプレで整形」`,
      },
      {
        kind: 'attachment',
        path: 'プロジェクト知識: RDD章構成テンプレート',
        lang: 'md',
        body:
`# RDD章構成（この順序で必ず生成）
1. はじめに（背景・目的・対象範囲）
2. 用語の定義
3. 業務概要
4. 業務フロー（As-Is / To-Be 各 Mermaid）
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
（17-20章はプロジェクト個別）`,
      },
      {
        kind: 'prompt',
        path: 'テンプレートプロンプト',
        lang: 'md',
        body:
`プロジェクト知識のRDD章構成テンプレートと 02-requirements-final を使い、
要件定義書 v1.0 を Artifact で作成してください。

必須:
- 4章は As-Is / To-Be を Mermaid flowchart で
- 各機能要件章の末尾に「関連要求ID一覧」
- 用語集を16章に置き、本文の表記をそれに統一
- 受身表現を能動態に直す

長くなってよい。途中で省略せず全章書き切ること。`,
      },
    ],
    bestPractices: [
      { title: '章構成は知識ファイルに固定する', body: 'CLIのSkillの代わりに、Claude Project の知識へ章構成テンプレを置く。毎案件で同じ品質が出る。プロンプトに毎回貼らない。' },
      { title: 'トレーサIDで仕様の根拠を辿れるようにする', body: '半年後の改修時に要求まで戻れる構造。章末の関連要求ID一覧を必須にすると事故が減る。' },
      { title: '長文は「省略するな」と明示する', body: 'チャットは長くなると勝手に「以下同様」で畳む。Artifact で全章書き切る指示を入れ、生成後に章数を数える。' },
      { title: '図はMermaidに統一する', body: '画像はバージョン管理で差分が読めない。テキスト図に絞ると、後の修正指示もチャットで完結する。' },
    ],
    officialRefs: [
      { label: 'Claude Projects（Anthropic公式）', body: 'プロジェクト知識にテンプレと前工程成果物を常駐。長文RDDを文脈を保ったまま生成。' },
      { label: 'Claude Artifacts（Anthropic公式）', body: '生成物を別ペインで保持し、章単位の差し替え指示を会話で繰り返せる。' },
      { label: 'Microsoft 365 Copilot in Word（Microsoft公式）', body: 'Markdown を社内RDDテンプレートに流し込み、納品体裁を整える。' },
    ],
    execution: {
      tool: 'Claude.ai（Project: 要件定義 / Artifact）',
      command: 'プロジェクト知識のテンプレと requirements-final で RDD v1.0 を Artifact 作成して。',
      lines: [
        'Claude が応答中...',
        '  プロジェクト知識を参照: RDD章構成 / requirements-final',
        '  業務フロー As-Is を Mermaid 生成',
        '  業務フロー To-Be を Mermaid 生成',
        '  章 1〜20 を Artifact に生成（省略なし）',
        '',
        '生成完了:',
        '  本文 約8,400行 / Mermaid図 6点 / 用語集 38語',
        '  各機能要件章に 関連要求ID一覧 を付与',
        '',
        'Artifact「要件定義書 v1.0」を作成しました。',
        '右ペインで章を確認し、修正は会話で指示してください。',
      ],
    },
    artifactsOut: [
      {
        name: '03-requirements-definition v1.0（Artifact）',
        lang: 'md',
        body:
`# 在庫管理システム 要件定義書 v1.0

## 1. はじめに
### 1.1 背景
架空株式会社は3拠点で稼働するExcel在庫管理に依存し、最新版の特定に毎日2時間を要している。営業現場では在庫照会に半日以上かかる場合があり、機会損失が発生している。

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
      skillName: 'ChatGPT に Artifact 全文を貼り、規約準拠とトレーサビリティを点検',
      prompt: 'RDDの章立てが規約準拠か、要求IDのトレーサビリティが全章で取れているか、図がMermaid限定かをチェック。抜けは章番号で指摘。',
      comments: [
        { level: 'OK',   target: '章構成',           body: '20章すべてテンプレ準拠' },
        { level: 'OK',   target: 'トレーサビリティ', body: '機能要件章すべてに関連要求ID記載' },
        { level: 'INFO', target: '4.1 As-Is図',     body: '業務フローを実測値（毎日2時間）と接続。読み手にインパクト' },
      ],
    },
  },

  // ───────────────────────── 04 ─────────────────────────
  {
    num: '04',
    title: '仕様定義',
    sub: 'ユーザーストーリーと受入基準を生成',
    duration: '約20分',
    outcome: 'ユーザーストーリー36本 + 受入基準（Gherkin）+ ASCIIワイヤー',
    flow: {
      input:     { label: '要件定義書', detail: 'requirements-definition v1.0' },
      operation: { label: '仕様生成プロンプト', detail: 'Claude.ai に投入' },
      config:    { label: 'INVEST + Gherkin 規約', detail: 'Claude Project の知識' },
      output:    { label: '仕様書一式', detail: 'US-001〜036 / Gherkin' },
    },
    configFiles: [
      {
        kind: 'instructions',
        path: 'Claude Project「仕様定義」のカスタム指示',
        lang: 'md',
        body:
`要件定義書からユーザーストーリーと機能仕様を生成する。

出力ルール:
- ストーリーは As a / I want / So that 形式
- 受入基準は Gherkin (Given/When/Then)
- 1ストーリー = 1ブロック（US-XXX）
- 冒頭に関連要求ID（FR/NFR）をメタとして付ける
- 画面仕様は ASCII ワイヤーで補強

INVEST原則:
Independent / Negotiable / Valuable / Estimable(13pt超は分割サイン) / Small / Testable`,
      },
      {
        kind: 'workspace',
        path: 'ツールの使い分け（この工程）',
        lang: 'text',
        body:
`主担当: Claude.ai Project「仕様定義」
  理由: Gherkin と ASCII ワイヤーを崩さず大量に出せる

ストーリー一覧の管理:
  Gemini で Google スプレッドシートに US-ID/見積り/関連要求 を表化
  → 後工程のテスト計画と同じシートを共有

画面ワイヤーのビジュアル化（任意）:
  ChatGPT に ASCII ワイヤーを渡し「この画面のラフ画像を1枚」`,
      },
      {
        kind: 'prompt',
        path: 'テンプレートプロンプト',
        lang: 'md',
        body:
`要件定義書 v1.0 の機能要件章から、ユーザーストーリーを生成してください。

- 1ストーリーごとに US-ID・関連要求ID・優先度・見積り(pt)
- 受入基準は Gherkin で正常系と異常系を最低1本ずつ
- 13pt を超えるストーリーは分割案も併記
- 各ストーリーに ASCII ワイヤーを1つ

最後に US-ID / 見積り / 関連要求 の一覧表（TSV）も出してください。`,
      },
    ],
    bestPractices: [
      { title: '1ストーリー1ブロックで出す', body: 'CLIの「1ファイル1ストーリー」をチャットで再現。ブロック単位なら差し替え指示がしやすく、後でPR単位とも揃う。' },
      { title: 'Gherkinはそのままテストにする', body: '受入基準を Gherkin で固定すると、08工程のテスト生成で同じ文面を流用でき、仕様とテストのリンクが切れない。' },
      { title: '13pt超は分割サイン', body: '見積もりが大きい＝要件が混ざっている。AIに分割案を併記させ、人間が割る判断をする。' },
      { title: 'ASCIIワイヤーで意図を固定', body: '画像ワイヤーは差分が読めない。粗くてもテキストの方が後の修正会話で活きる。' },
    ],
    officialRefs: [
      { label: 'Claude Projects / Artifacts（Anthropic公式）', body: '仕様の大量生成と章単位の差し替えに向く。' },
      { label: 'Gemini + Google スプレッドシート（Google公式）', body: 'ストーリー一覧を表で持ち、見積りと関連要求を後工程と共有。' },
    ],
    execution: {
      tool: 'Claude.ai（Project: 仕様定義）',
      command: 'RDDの機能要件章からユーザーストーリーと Gherkin を生成して。',
      lines: [
        'Claude が応答中...',
        '  機能要件 24項 → ストーリー候補へ変換',
        '  US-001 〜 US-036 を生成',
        '  受入基準 Gherkin 124本（正常系/異常系）',
        '  ASCII ワイヤー 18面',
        '',
        'US-014 は 13pt 超 → 分割案を併記',
        '',
        'ストーリー一覧（TSV）も出力しました。',
        'Google スプレッドシートに貼って後工程と共有してください。',
      ],
    },
    artifactsOut: [
      {
        name: 'US-001 リアルタイム在庫照会',
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
      skillName: 'ChatGPT で INVEST 観点の独立レビュー',
      prompt: 'ユーザーストーリーが INVEST を満たすか、Gherkinが具体的か、関連要求IDの取りこぼしがないかチェック。',
      comments: [
        { level: 'OK',   target: 'INVEST', body: '36本すべて Independent / Testable を満たす' },
        { level: 'INFO', target: 'US-014', body: '見積もり13ptが過大。分割案を採用推奨' },
      ],
    },
  },

  // ───────────────────────── 05 ─────────────────────────
  {
    num: '05',
    title: '基本設計',
    sub: 'アーキ・DB・APIと意思決定記録(ADR)',
    duration: '約30分',
    outcome: 'C4図(L1-L3) / ER図 / OpenAPI仕様 / ADR-0001〜0008',
    flow: {
      input:     { label: '仕様書一式', detail: 'US-001〜036' },
      operation: { label: '設計プロンプト', detail: 'Claude.ai + ChatGPT Canvas' },
      config:    { label: 'ADRテンプレ + 技術前提', detail: 'Claude Project の知識' },
      output:    { label: '基本設計書一式', detail: 'C4 / ER / OpenAPI / ADR' },
    },
    configFiles: [
      {
        kind: 'instructions',
        path: 'Claude Project「基本設計」のカスタム指示',
        lang: 'md',
        body:
`仕様書からアーキ・DB・API設計を生成する。意思決定は必ず ADR に残す。

前提（既定スタック）:
- Next.js 15 / TypeScript / PostgreSQL / Vercel
- 認証: Auth.js + SAML2.0（社内IdP連携）
- 既存 Oracle 11g とは CSV(SFTP) 日次バッチ

出力:
- C4 Level 1 / 2 / 3（L3は主要コンテナのみ）
- ER図（Mermaid）
- OpenAPI 3.1
- ADR-NNNN（意思決定ごと。代替案と却下理由まで書く）`,
      },
      {
        kind: 'workspace',
        path: 'ツールの使い分け（この工程）',
        lang: 'text',
        body:
`主担当: Claude.ai Project「基本設計」
  理由: ADR と設計文書を文脈を保って一括生成

図の編集: ChatGPT Canvas
  Mermaid を Canvas に貼り、図だけ反復編集
  → 図の調整を本文と切り離して回せる

技術調査: Gemini Deep Research
  「PostgreSQL と Oracter の CSV連携 ベストプラクティス」等を裏取りし
  ADR の根拠に引用`,
      },
      {
        kind: 'attachment',
        path: 'プロジェクト知識: ADRテンプレート',
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
        kind: 'connector',
        path: 'Claude Connectors / GitHub（任意）',
        lang: 'text',
        body:
`Claude.ai の Connectors で GitHub をリモート接続すると、
設計決定を Issue として起票できる（MCP 経由）。

ChatGPT 側は GitHub コネクタ、
M365 Copilot 側は Azure DevOps エージェントが同等の役割。

接続しない場合は ADR を Markdown で出力し、人手で起票する。`,
      },
      {
        kind: 'prompt',
        path: 'テンプレートプロンプト',
        lang: 'md',
        body:
`仕様書一式から基本設計を作成してください。

- C4 を L1/L2/L3 で（L3は主要3コンテナのみ）
- ER図と OpenAPI 3.1
- 技術選定など意思決定が発生したら、その都度 ADR を ADRテンプレで作成
- ADR は代替案と却下理由まで必ず書く
- NFR-001（在庫照会2秒）が達成可能かを設計時点で評価し、懸念は明記`,
      },
    ],
    bestPractices: [
      { title: '意思決定の瞬間にADRを書かせる', body: '後から「なぜこの選択か」を再現できないと改修時に必ず後悔する。チャットでも「決定が出るたびADR」を指示文に固定。' },
      { title: '代替案と却下理由を必須にする', body: 'ADRの本体は却下した道。そこを残さないと意思決定の再現性がゼロになる。' },
      { title: '図はCanvasで分離して回す', body: '本文と図を同じ会話で直すと崩れる。ChatGPT Canvas に Mermaid を移し、図だけ反復。' },
      { title: '性能要件を設計時に評価させる', body: 'NFR-001(2秒)のような数値要件は、設計段階で「達成可能か」を問う。実装後に気づくと手戻りが大きい。' },
    ],
    officialRefs: [
      { label: 'Claude Connectors（Anthropic公式）', body: 'リモートMCPでGitHub等に接続。設計決定をIssue化できる。未接続でもMarkdown出力で代替可。' },
      { label: 'ChatGPT Canvas（OpenAI公式）', body: '文書/コードを別ペインで反復編集。Mermaid図の調整に向く。' },
      { label: 'Gemini Deep Research（Google公式）', body: '技術選定の裏取り。ADRの根拠に出典を添える。' },
    ],
    execution: {
      tool: 'Claude.ai（Project: 基本設計）',
      command: '仕様書一式から基本設計とADRを作成して。決定ごとにADRを残して。',
      lines: [
        'Claude が応答中...',
        '  C4 L1 System Context 生成',
        '  C4 L2 Container（Web/API/DB/Batch/IdP）',
        '  C4 L3 主要3コンテナ',
        '  ER図 12テーブル / OpenAPI 24エンドポイント',
        '',
        '  意思決定 → ADR 生成:',
        '    ADR-0001 フロントは Next.js',
        '    ADR-0002 DBは PostgreSQL',
        '    ADR-0003 認証は Auth.js + SAML2.0',
        '    ADR-0004 バーコードは PWAカメラ採用',
        '    ADR-0005 拠点ルーティングはアプリ層',
        '    ADR-0006 監査ログは別DB分離',
        '    ADR-0007 デプロイは Vercel + Supabase',
        '    ADR-0008 バッチは Vercel Cron',
        '',
        '完了。図は Canvas で調整できます。',
      ],
    },
    artifactsOut: [
      {
        name: 'design/c4-l1（基本設計）',
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
        name: 'design/adr/ADR-0002',
        lang: 'md',
        body:
`# ADR-0002: DBは PostgreSQL を採用

## ステータス
採用

## 文脈
既存販売管理が Oracle 11g。直接更新不可の制約あり(CON-002)。Oracle / PostgreSQL / MySQL を比較。

## 決定
PostgreSQL を採用する。

## 結果
良い影響: ライセンス費ゼロ / Vercel + Supabase で運用負担最小 / JSONB でロット属性を柔軟に拡張
悪い影響: 既存DBA(Oracle経験)の学習コスト
トレードオフ: バッチ連携は CSV(SFTP) で疎結合に保ち両DBの差異を吸収

## 代替案
- Oracle 21c: ライセンス費 年700万 → 予算外で却下
- MySQL: JSONB対応に難 → 却下`,
      },
    ],
    review: {
      skillName: 'ChatGPT に C4/ADR/OpenAPI を渡し、整合と根拠強度を点検',
      prompt: 'C4図のレベル整合、ADRの根拠強度、OpenAPIのRESTfulness、NFR-001(2秒)の達成可能性をチェック。',
      comments: [
        { level: 'OK',   target: 'ADR-0002',    body: 'トレードオフが明示。再現性ある意思決定' },
        { level: 'WARN', target: 'NFR-001 2秒', body: '3拠点同時参照。インデックス設計と接続プールを詳細設計で要確認' },
      ],
    },
  },

  // ───────────────────────── 06 ─────────────────────────
  {
    num: '06',
    title: '詳細設計',
    sub: 'クラス・シーケンス・画面遷移・入力検証',
    duration: '約35分',
    outcome: 'クラス図18点 / シーケンス図24本 / 画面遷移図6本 / 入力検証マトリクス',
    flow: {
      input:     { label: '基本設計書一式', detail: 'C4 / ER / OpenAPI / ADR' },
      operation: { label: '詳細設計プロンプト', detail: 'Claude.ai に投入' },
      config:    { label: 'エラーコード規約', detail: 'Claude Project の知識' },
      output:    { label: '詳細設計書一式', detail: 'シーケンス / 検証マトリクス' },
    },
    configFiles: [
      {
        kind: 'instructions',
        path: 'Claude Project「詳細設計」のカスタム指示',
        lang: 'md',
        body:
`基本設計とユーザーストーリーから詳細設計を生成する。

出力:
- クラス図（Mermaid classDiagram, レイヤー別）
- シーケンス図（1ストーリーにつき正常系/異常系を2本以上）
- 画面遷移図（stateDiagram, 閉路チェック）
- 入力検証マトリクス（項目/必須/型/範囲/エラーコード/メッセージ）
- エラーコードは E_<ドメイン>_<連番3桁>（例 E_STOCK_011）`,
      },
      {
        kind: 'workspace',
        path: 'ツールの使い分け（この工程）',
        lang: 'text',
        body:
`主担当: Claude.ai Project「詳細設計」
  理由: シーケンス図と検証マトリクスを大量に整合させて出せる

検証マトリクスの管理:
  ChatGPT Code Interpreter に表を渡し、エラーコード重複を機械チェック
  「E_ で始まるコードの重複と連番の飛びを検出して」

画面遷移の閉路チェック:
  Gemini に stateDiagram を渡し「戻れない画面がないか」を確認`,
      },
      {
        kind: 'attachment',
        path: 'プロジェクト知識: エラーコード命名規約',
        lang: 'md',
        body:
`形式: E_<ドメイン>_<連番3桁>
例: E_AUTH_001 / E_STOCK_011 / E_BARCODE_021

ドメイン: AUTH 認証 / STOCK 在庫 / BARCODE 読取 / AUDIT 監査 / BATCH 連携 / SYS 共通

ルール:
- HTTPステータスと1対1にしない（業務エラーは200で返す場合あり）
- 連番は10ずつ空けて始める（追加余地）
- メッセージはユーザー向けとログ向けを分ける`,
      },
      {
        kind: 'prompt',
        path: 'テンプレートプロンプト',
        lang: 'md',
        body:
`基本設計とユーザーストーリーから詳細設計を作成してください。

- クラス図はレイヤー別（Domain/Application/Infrastructure）
- シーケンスは各ストーリーに正常系と異常系を最低1本ずつ
- 画面遷移図は「行ったきり戻れない画面」がないか自己点検し報告
- 入力検証マトリクスを表で
- エラーコードは命名規約に従い、最後に重複チェック結果を付ける`,
      },
    ],
    bestPractices: [
      { title: '異常系を正常系の0.5倍以上書かせる', body: '異常系こそ事故の温床。チャットは指示しないと正常系だけ書く。比率を明示して網羅を強制。' },
      { title: 'エラーコードはドメインで分ける', body: 'E0001 のような通し番号だと「どこで起きたか」が分からない。E_STOCK_011 形式で検索性が桁違いに上がる。' },
      { title: '重複チェックを機械にやらせる', body: '人目では見逃す。ChatGPT Code Interpreter にエラーコード表を渡し、重複と連番飛びをコードで検出させる。' },
      { title: '画面遷移は閉路を自己点検させる', body: '戻れない画面はユーザーがハマる。生成時に「閉路チェック結果」を必ず添えさせる。' },
    ],
    officialRefs: [
      { label: 'ChatGPT Code Interpreter（OpenAI公式）', body: '表データをコードで検証。エラーコード重複や連番の飛びを機械的に検出。' },
      { label: 'Claude Projects（Anthropic公式）', body: 'エラーコード規約を知識に常駐し、全工程で一貫した命名を保つ。' },
    ],
    execution: {
      tool: 'Claude.ai（Project: 詳細設計）',
      command: '基本設計とUSから詳細設計を作成。異常系も正常系の0.5倍以上で。',
      lines: [
        'Claude が応答中...',
        '  クラス図 18点（Domain/Application/Infrastructure）',
        '  シーケンス図 24本（正常系/異常系）',
        '  画面遷移図 6本 + 閉路チェック',
        '  入力検証マトリクス 212項目',
        '  エラーコード E_AUTH_001 〜 E_BATCH_007',
        '',
        '自己点検: 閉路チェック OK / 戻れない画面なし',
        '',
        '次に ChatGPT でエラーコード重複を機械チェックしてください。',
      ],
    },
    artifactsOut: [
      {
        name: 'detail/sequence/US-002-barcode-scan',
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
        name: 'detail/validation-matrix',
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
      skillName: 'ChatGPT Code Interpreter でエラーコード重複を機械検証',
      prompt: '異常系シーケンスの網羅性、エラーコード重複、画面遷移の閉路をチェック。コードで重複を検出した結果も示す。',
      comments: [
        { level: 'INFO', target: 'US-008',       body: '異常系が正常系1本のみ。タイムアウト経路を追加推奨' },
        { level: 'OK',   target: 'エラーコード', body: '全67件、コード検証で重複なしを確認' },
      ],
    },
  },

  // ───────────────────────── 07 ─────────────────────────
  {
    num: '07',
    title: '実装',
    sub: 'チャットでコード生成し、ダウンロードして組み込む',
    duration: '約6日（手作業を含む）',
    outcome: '36ストーリー分のソースを Artifact/Canvas で生成、ZIP化して既存リポジトリへ手作業マージ',
    livePreview: {
      title: '完成版を実際に操作する',
      description: 'この工程で組み上げたアプリの動作デモを別タブで開けます。ブラウザAIチャットだけでも、設計から実装までの成果物がここまで形になることを画面ごと確認できます。',
      image: 'assets/app-preview.png',
      imageAlt: '完成版アプリのトップ画面',
      url: 'https://ai-dev-demo.ezoai.jp',
      cta: 'アプリを新規タブで開く',
    },
    flow: {
      input:     { label: '詳細設計書', detail: 'シーケンス / 検証マトリクス' },
      operation: { label: 'コード生成プロンプト', detail: 'ChatGPT Canvas / Claude Artifact' },
      config:    { label: 'コーディング規約', detail: 'Projects のカスタム指示' },
      output:    { label: 'ソース一式（ZIP）', detail: 'ダウンロード → 手作業で組込' },
    },
    configFiles: [
      {
        kind: 'instructions',
        path: 'ChatGPT / Claude Project「実装」のカスタム指示',
        lang: 'md',
        body:
`コーディング規約:
- TypeScript strict / Next.js 15 App Router
- Server Components 優先 / 'use client' は最小範囲
- データアクセスは Repository パターン
- 配列は spread/map/filter、push/sort/reverse 禁止（不変性）
- 例外は境界層(API Route/Server Action)で握る
- テストは Vitest（単体）/ Playwright（E2E）

出力ルール:
- 1ストーリー = 1メッセージ。ファイルパスをコメント先頭に明記
- 省略（// ... 既存と同様）をしない。コピペで動く完全形で出す
- 最後にそのストーリーの単体テストも併せて出す`,
      },
      {
        kind: 'workspace',
        path: 'ツールの使い分け（この工程）',
        lang: 'text',
        body:
`コード生成: ChatGPT Canvas（反復編集に強い）/ Claude Artifacts（長いファイル）
取り出し: Canvas/Artifact からコピー、または ChatGPT に ZIP 化させて Code Interpreter からダウンロード
組み込み: ダウンロードしたソースを開発者が手作業で既存リポジトリに配置しコミット

CLI のような自動コミットや Hook ガードレールは無い。
代わりに 08工程の機械チェックと人手レビューで品質を担保する。

社内コードの参照: M365 Copilot を SharePoint/Azure Repos に接続すると
既存コード規約を踏まえた生成ができる`,
      },
      {
        kind: 'prompt',
        path: 'テンプレートプロンプト（ストーリー単位で繰り返す）',
        lang: 'md',
        body:
`US-002（バーコード入出庫）を実装してください。

- 詳細設計のシーケンス図と入力検証マトリクスに従う
- ファイルごとに先頭へパスをコメント
- 省略禁止。コピペで動く完全形で
- API Route / Server Action / Repository / 単体テスト を一式
- 最後に「このストーリーで触ったファイル一覧」を出す

完了したら ZIP にまとめてダウンロードリンクを出してください。`,
      },
    ],
    bestPractices: [
      { title: '規約はProjects指示に常駐させる', body: 'CLIの CLAUDE.md の代わり。毎メッセージに規約を貼ると揺れる。Projects のカスタム指示に固定し、入力だけ変える。' },
      { title: '「省略禁止」を毎回書く', body: 'チャットは長いコードを「以下同様」で畳む癖がある。コピペで動く完全形を毎回明示し、生成後にファイル末尾まで確認する。' },
      { title: 'ストーリー単位で会話を切る', body: '1会話に詰め込むと文脈が濁る。US 単位でスレッドを分け、ZIPで取り出して人手で組む。PRも小さく保てる。' },
      { title: 'ガードレールが無い前提で動く', body: 'Hookの自動 typecheck/lint は無い。生成直後に開発者がローカルで型チェックを通すまでが1ストーリーの完了条件。' },
    ],
    officialRefs: [
      { label: 'ChatGPT Canvas（OpenAI公式）', body: 'コードを別ペインで反復編集。差分指示を会話で繰り返せる。' },
      { label: 'Claude Artifacts（Anthropic公式）', body: '長いソースファイルを保持し、部分修正を指示できる。' },
      { label: 'Microsoft 365 Copilot + Azure Repos（Microsoft公式）', body: '社内既存コードの規約を踏まえた生成。SharePoint/Repos 接続時。' },
    ],
    execution: {
      tool: 'ChatGPT（Canvas: 実装）',
      command: 'US-002 を実装。シーケンスと検証マトリクスに従い、省略せず完全形で。',
      lines: [
        'ChatGPT が応答中...',
        '  app/api/stock/transactions/route.ts 生成',
        '  lib/repositories/stockRepository.ts 生成',
        '  app/actions/scanBarcode.ts 生成',
        '  __tests__/scanBarcode.test.ts 生成',
        '',
        '触ったファイル: 4件',
        'ZIP（us-002.zip）を作成しました。ダウンロードしてください。',
        '',
        '※ この後、開発者がローカルで型チェックを通し',
        '   既存リポジトリへ手作業でコミットします。',
      ],
    },
    artifactsOut: [
      {
        name: 'app/actions/scanBarcode.ts（生成コード抜粋）',
        lang: 'ts',
        body:
`// app/actions/scanBarcode.ts
'use server';

import { z } from 'zod';
import { stockRepository } from '@/lib/repositories/stockRepository';
import { writeAuditLog } from '@/lib/audit';

const scanInput = z.object({
  barcode: z.string().regex(/^\\d{13}$/, 'E_BARCODE_021'),
  locationId: z.enum(['chiyoda', 'koto', 'ota']),
  delta: z.number().int().min(-99999).max(99999),
});

export async function scanBarcode(raw: unknown) {
  const input = scanInput.parse(raw);
  return stockRepository.applyTransaction(async (tx) => {
    const next = await tx.adjustStock(input);
    await writeAuditLog(tx, { type: 'SCAN', ...input });
    return { remaining: next.quantity };
  });
}`,
      },
    ],
    review: {
      skillName: '生成直後にローカル型チェック + Claude.ai でコードレビュー',
      prompt: 'TypeScript strict で型エラーがないか、不変性規約（push/sort禁止）違反がないか、入力検証が Zod で境界に置かれているかをレビュー。',
      comments: [
        { level: 'OK',   target: '不変性',     body: 'spread/map のみ。破壊的操作なし' },
        { level: 'WARN', target: 'エラー処理', body: 'scanBarcode の例外が境界層まで到達。API Route で握る処理を追加' },
      ],
    },
  },

  // ───────────────────────── 08 ─────────────────────────
  {
    num: '08',
    title: 'テスト & レビュー',
    sub: 'Code Interpreter で擬似実行し、別ツールで相互レビュー',
    duration: '約1日',
    outcome: '単体テスト 124 ケース / Code Interpreter で実行確認 / レビュー指摘を反映',
    flow: {
      input:     { label: '実装コード一式', detail: 'ZIP / 各ファイル' },
      operation: { label: 'テスト生成 + 擬似実行', detail: 'ChatGPT Code Interpreter' },
      config:    { label: 'テスト方針', detail: 'Projects のカスタム指示' },
      output:    { label: 'テスト + レビュー報告', detail: 'pass/fail + 指摘一覧' },
    },
    configFiles: [
      {
        kind: 'instructions',
        path: 'ChatGPT Project「テスト」のカスタム指示',
        lang: 'md',
        body:
`Gherkin の受入基準をそのまま Vitest のテストに変換する。

ルール:
- 1ファイル = 1スイート
- Given→arrange / When→act / Then→assert に対応
- 異常系を必ず含める
- Code Interpreter で実行できる範囲は実行し、pass/fail を表で示す
- 外部依存はモックし、何をモックしたか明記する`,
      },
      {
        kind: 'workspace',
        path: 'ツールの使い分け（この工程）',
        lang: 'text',
        body:
`テスト生成と擬似実行: ChatGPT Code Interpreter
  純粋ロジックは実際に走らせて pass/fail を確認できる
  DB/ネットワーク依存はモックして論理を検証

相互レビュー（重要）:
  実装した会話とは別ツールでレビューする
  ChatGPT 実装 → Claude.ai レビュー / Claude.ai 実装 → ChatGPT レビュー
  → 同じモデルの自己レビューより指摘が出る

最終確認は開発者がローカルで全テスト実行`,
      },
      {
        kind: 'prompt',
        path: 'テンプレートプロンプト',
        lang: 'md',
        body:
`添付の実装コードについて:
1. US-002 の Gherkin 受入基準を Vitest テストに変換
2. 純粋ロジック部分は Code Interpreter で実行し pass/fail を表で
3. DB依存はモック。モック内容を明記
4. 異常系（不正バーコード/数量超過）を必ず含める

最後に、別ツールでのレビュー用に「重点的に見るべき箇所」を3つ挙げてください。`,
      },
    ],
    bestPractices: [
      { title: 'Gherkinをそのままテストにする', body: '04工程の受入基準をコピペでテスト化。仕様とテストの文面が一致し、リンクが切れない。' },
      { title: '実行できるものは実行させる', body: 'Code Interpreter で純粋ロジックは実走。チャットの「たぶん通る」を、実際の pass/fail に変える。' },
      { title: '実装と別ツールでレビューする', body: 'CLIのレビュー専用サブエージェントの代わり。実装した会話に続けてレビューさせず、別ツールに渡す。自己レビューの盲点を消す。' },
      { title: '最終はローカル実行で締める', body: 'チャットの擬似実行は環境が完全でない。開発者が手元で全テストを通すまでが完了。' },
    ],
    officialRefs: [
      { label: 'ChatGPT Code Interpreter（OpenAI公式）', body: 'サンドボックスで Python/JS を実行。純粋ロジックの pass/fail を実測。' },
      { label: 'Claude.ai 相互レビュー（Anthropic公式の使い分け）', body: '実装と別ツールでレビューし、自己レビューの盲点を補う運用。' },
    ],
    execution: {
      tool: 'ChatGPT（Code Interpreter: テスト）',
      command: 'US-002 の Gherkin を Vitest 化して、純粋ロジックは実行して結果を見せて。',
      lines: [
        'ChatGPT が応答中...',
        '  Gherkin 2 シナリオ → テスト 6 ケースに変換',
        '  Code Interpreter で実行中...',
        '',
        '  PASS  scanBarcode 正常系 (在庫-1)',
        '  PASS  不正バーコードで E_BARCODE_021',
        '  PASS  数量超過で E_STOCK_022',
        '  FAIL  在庫0からの出庫（負数を許容している）',
        '',
        '4件中3 PASS / 1 FAIL',
        '重点レビュー: ①在庫下限ガード ②トランザクション境界 ③監査ログ漏れ',
        '→ FAIL 箇所を修正後、Claude.ai でレビューしてください。',
      ],
    },
    artifactsOut: [
      {
        name: '__tests__/scanBarcode.test.ts（生成テスト抜粋）',
        lang: 'ts',
        body:
`// __tests__/scanBarcode.test.ts
import { describe, it, expect, vi } from 'vitest';
import { scanBarcode } from '@/app/actions/scanBarcode';

describe('US-002 バーコード入出庫', () => {
  it('正常系: 在庫が1減る', async () => {
    const res = await scanBarcode({ barcode: '4901234567894', locationId: 'ota', delta: -1 });
    expect(res.remaining).toBe(41);
  });

  it('異常系: 不正バーコードで E_BARCODE_021', async () => {
    await expect(scanBarcode({ barcode: 'NG', locationId: 'ota', delta: -1 }))
      .rejects.toThrow('E_BARCODE_021');
  });

  it('異常系: 在庫0からの出庫は拒否される', async () => {
    await expect(scanBarcode({ barcode: '4901234567894', locationId: 'ota', delta: -1 }))
      .rejects.toThrow('E_STOCK_030'); // 下限ガード
  });
});`,
      },
    ],
    review: {
      skillName: 'Claude.ai でコードと FAIL 箇所を独立レビュー',
      prompt: 'FAIL した「在庫0からの出庫」について、下限ガードをどこに置くべきか、トランザクション境界と監査ログの整合が取れているかをレビュー。',
      comments: [
        { level: 'ERROR', target: 'scanBarcode', body: '在庫下限ガード未実装。Repository のトランザクション内で残数を検証すべき' },
        { level: 'INFO',  target: '監査ログ',     body: '失敗時もログを残す設計に変更推奨（誰が在庫切れを踏んだか追える）' },
      ],
    },
  },

  // ───────────────────────── 09 ─────────────────────────
  {
    num: '09',
    title: 'デプロイ・公開',
    sub: '手順書とスクリプトをAIが作り、人間が実行する',
    duration: '約半日',
    outcome: 'デプロイ手順書 / 環境変数チェックリスト / リリースノート / ロールバック手順',
    flow: {
      input:     { label: 'テスト済みコード', detail: 'main にマージ済' },
      operation: { label: '手順書生成プロンプト', detail: 'M365 Copilot + ChatGPT' },
      config:    { label: 'デプロイ規約', detail: 'Projects のカスタム指示' },
      output:    { label: 'Runbook + リリースノート', detail: 'Word / Markdown' },
    },
    configFiles: [
      {
        kind: 'instructions',
        path: 'ChatGPT Project「リリース」のカスタム指示',
        lang: 'md',
        body:
`デプロイは AI が手順とスクリプトを作り、人間が実行する前提で書く。

出力:
- 環境変数チェックリスト（漏れたら本番が落ちる順に）
- デプロイ手順書（コマンドと、各ステップの確認方法）
- スモークテスト手順（公開直後に何を叩くか）
- ロールバック手順（戻し方を先に書く）
- リリースノート（利用者向けと社内向けを分ける）

秘密情報の値は書かない。プレースホルダにする。`,
      },
      {
        kind: 'workspace',
        path: 'ツールの使い分け（この工程）',
        lang: 'text',
        body:
`手順書とリリースノート: M365 Copilot in Word
  社内Runbookテンプレに沿って体裁を整え、SharePoint に保存

デプロイスクリプト: ChatGPT
  Vercel/Supabase の CLI コマンド列を生成
  ※ 実行は開発者。AIはコマンドを出すだけ

承認フロー: M365 Copilot で承認依頼メール/Teams投稿の下書き
  「リリース内容と影響範囲を3行で要約し、承認依頼を作成」`,
      },
      {
        kind: 'prompt',
        path: 'テンプレートプロンプト',
        lang: 'md',
        body:
`今回のリリース（US-001〜036 / DBマイグレーション1件あり）について:
1. 環境変数チェックリスト（不足で落ちる順）
2. デプロイ手順書（各ステップに確認コマンドを併記）
3. 公開直後のスモークテスト5項目
4. ロールバック手順（DBマイグレーションの戻しも含む）
5. リリースノート（利用者向け / 社内向け）

実行は人間が行う前提で、コマンドはそのままコピペできる形で。`,
      },
    ],
    bestPractices: [
      { title: 'ロールバックを先に書かせる', body: '戻し方が無い手順書は本番で凍りつく。AIに「ロールバックを手順書の冒頭に」と指示し、進む前に退路を確保する。' },
      { title: '環境変数は落ちる順に並べる', body: '抜けると即死する変数から並べさせる。チャットはアルファベット順に並べがちで、重要度が伝わらない。' },
      { title: '実行はAIにさせない', body: 'ブラウザチャットに本番操作権限を与えない。AIは手順とコマンドを作る。実行と承認は人間。これは安全側の既定。' },
      { title: 'スモークテストを手順化する', body: '公開直後に何を叩けば生きていると言えるか。AIに5項目で固定させ、毎リリース同じ基準で確認する。' },
    ],
    officialRefs: [
      { label: 'Microsoft 365 Copilot in Word（Microsoft公式）', body: '社内Runbookテンプレに沿った手順書をSharePointに保存。承認フローと地続き。' },
      { label: 'ChatGPT（OpenAI公式）', body: 'デプロイコマンド列とスクリプトを生成。実行は人間が担う。' },
    ],
    execution: {
      tool: 'M365 Copilot（Word: リリース手順）',
      command: '今回のリリースのデプロイ手順書とロールバック手順を社内Runbookテンプレで作成して。',
      lines: [
        'Copilot が応答中...',
        '  参照: 社内Runbookテンプレート（SharePoint）',
        '  リリース内容: US-001〜036 / マイグレーション1件',
        '',
        '生成:',
        '  0. ロールバック手順（先頭に配置）',
        '  1. 環境変数チェックリスト（12項目, 重要度順）',
        '  2. デプロイ手順（確認コマンド付き 8ステップ）',
        '  3. スモークテスト 5項目',
        '  4. リリースノート（利用者向け / 社内向け）',
        '',
        'Word を SharePoint /Releases/2026-W22 に保存しました。',
        '承認依頼の Teams 下書きも作成済みです。',
      ],
    },
    artifactsOut: [
      {
        name: 'Runbook: デプロイ手順（抜粋）',
        lang: 'md',
        body:
`# リリース Runbook 2026-W22

## 0. ロールバック（先に確認）
- アプリ: Vercel ダッシュボードで前デプロイに Promote
- DB: \`supabase db reset --version <前回>\` で戻す
- 想定復旧時間: 10分以内

## 1. 環境変数チェック（落ちる順）
1. DATABASE_URL（未設定で即死）
2. SAML_IDP_METADATA_URL（認証不可）
3. SFTP_HOST / SFTP_KEY（CSV連携停止）
4. ...（計12項目）

## 2. デプロイ手順
| # | 操作 | 確認 |
|---|------|------|
| 1 | main を Vercel Production に Promote | デプロイURLが200 |
| 2 | DBマイグレーション適用 | \`\\dt\` で新テーブル確認 |
| 3 | SFTPバッチを手動1回起動 | 連携ログに success |

## 3. スモークテスト
- /login で SAML 認証が通る
- 在庫照会 A-001 が2秒以内
- バーコード入出庫が記録される
- 監査ログに行が増える
- 日次CSVバッチが success`,
      },
    ],
    review: {
      skillName: 'Claude.ai で手順書の抜け（特にロールバック）を点検',
      prompt: 'デプロイ手順にロールバックが先頭にあるか、環境変数が落ちる順か、スモークテストが公開判定に十分かをチェック。',
      comments: [
        { level: 'OK',   target: 'ロールバック', body: '手順書冒頭に配置。DBの戻しも記載' },
        { level: 'WARN', target: 'スモークテスト', body: 'CSV連携の確認が「success ログ」のみ。実データ1件の突合を追加推奨' },
      ],
    },
  },

  // ───────────────────────── 10 ─────────────────────────
  {
    num: '10',
    title: '保守運用',
    sub: '定期実行ルーチンで日次レポートと障害初動を自動化',
    duration: '常時稼働',
    outcome: '日次ヘルスレポート / 週次運用レポート / 障害PostMortem を定期ルーチンで自動生成',
    flow: {
      input:     { label: '運用ログ・監視データ', detail: 'ログ要約 / メトリクス貼付' },
      operation: { label: '定期実行ルーチン', detail: 'ChatGPT Tasks / Gemini Scheduled' },
      config:    { label: 'PostMortem 規約', detail: 'Projects のカスタム指示' },
      output:    { label: '運用ドキュメント', detail: 'レポート / PostMortem' },
    },
    configFiles: [
      {
        kind: 'instructions',
        path: 'PostMortem カスタム指示（共通）',
        lang: 'md',
        body:
`障害発生時、ログ・タイムライン・影響範囲・根本原因・再発防止を 5 Whys で分析する。

# PostMortem テンプレート
- 概要: 発生/検知/復旧 時刻と影響範囲
- タイムライン: 時刻・出来事・担当
- 根本原因: 5 Whys（組織課題まで掘る）
- 再発防止: 短期(48h)/中期(2週)/長期(次四半期) に分け、必ず期日を入れる

# 禁止
「気をつける」「徹底する」「意識する」を再発防止に書かない。
仕組み・自動化・チェックリスト化で書く。`,
      },
      {
        kind: 'routine',
        path: 'ChatGPT Tasks: 日次ヘルスレポート',
        lang: 'text',
        body:
`スケジュール: 毎朝9時（JST）
指示文:
「貼り付ける24時間分のログ要約とメトリクスから、
 エラー率・p95レスポンス・CSV連携成否をまとめ、
 閾値（エラー率0.5% / p95 2.0s）超過があれば先頭に【要対応】を付けて
 日次レポート Markdown を作成。Slack/Teams 投稿用に3行要約も。」

※ ChatGPT Tasks はスケジュール起動で下書きを生成。
   ログの取り込みは運用担当が定型コピペ or コネクタ経由。`,
      },
      {
        kind: 'routine',
        path: 'Gemini Scheduled actions: 週次運用レポート',
        lang: 'text',
        body:
`スケジュール: 毎週月曜 8時
指示文:
「先週分の日次レポート（Google Drive フォルダ）を集計し、
 稼働率・平均レスポンス・取引件数・インシデント件数の
 週次レポートを Google ドキュメントで作成。
 前週比で悪化した指標は理由の仮説を添える。」

Gemini は Drive のファイル群を直接読めるため集計に向く。`,
      },
      {
        kind: 'connector',
        path: 'コネクタ / 障害通知',
        lang: 'text',
        body:
`障害初動: M365 Copilot エージェント
  Teams のアラート投稿をトリガに、PostMortem ドラフトの章立てを起こし
  #incident に「タイムライン雛形 + 確認事項」を投下

メトリクス取り込み: 監視SaaSのエクスポートを定型でチャットに貼る
  （ブラウザチャットは監視基盤を直接叩けないため、貼付 or コネクタが前提）`,
      },
      {
        kind: 'prompt',
        path: 'テンプレートプロンプト（障害時）',
        lang: 'md',
        body:
`INC-2026-04-30 について PostMortem を作成してください。

入力（下記に貼付）:
- アラート発火〜復旧のログ
- 対応 Teams スレッドの抜粋

要件:
- 5 Whys は組織課題まで掘る
- 再発防止は短期/中期/長期に分け、必ず期日
-「気をつける」系の対策は禁止。仕組みで書く`,
      },
    ],
    bestPractices: [
      { title: '定期ルーチンで報告頻度を上げる', body: 'CLIのCronトリガーの代わりに ChatGPT Tasks / Gemini Scheduled actions。人が書くと週次が限界の報告を、AI下書きで日次に上げる。' },
      { title: '5 Whysは組織課題まで掘らせる', body: '「徹底できなかった」で止めると再発する。「なぜ徹底できない仕組みか」まで掘る指示を固定。' },
      { title: '再発防止に必ず期日を入れさせる', body: '短期48h/中期2週/長期次四半期。期日のない対策は実装されない。AIに期日空欄を許さない。' },
      { title: '「気をつける」を禁則語にする', body: 'カスタム指示でNG表現として明記。仕組み・自動化・チェックリストで書かせる。' },
      { title: '実行権限はAIに渡さない', body: 'ブラウザチャットは監視基盤や本番を直接操作しない。AIは下書きと分析。データ取り込みと対応実行は人間。' },
    ],
    officialRefs: [
      { label: 'ChatGPT Tasks（OpenAI公式）', body: 'スケジュール起動でレポート下書きを定期生成。日次ヘルスレポートに使う。' },
      { label: 'Gemini Scheduled actions（Google公式）', body: '定期実行で Drive のファイル群を集計。週次運用レポートに向く。' },
      { label: 'Microsoft 365 Copilot エージェント（Microsoft公式）', body: 'Teams のアラートを起点に PostMortem 雛形を起こし #incident に投下。' },
    ],
    execution: {
      tool: 'ChatGPT（Tasks: 日次ヘルスレポート）',
      command: '（毎朝9時に自動起動）貼付ログから日次ヘルスレポートを作成',
      lines: [
        'ChatGPT Tasks が起動（09:00 JST）...',
        '  入力: 直近24hのログ要約 + メトリクス',
        '  エラー率 0.04%（閾値0.5%以下）',
        '  p95 1.2s（閾値2.0s以下）',
        '  CSV連携 全1件 success',
        '',
        '【正常】日次レポートを作成しました。',
        'Slack/Teams 投稿用3行要約も生成済み。',
        '',
        '--- 障害発生時（手動起動）---',
        'あなた: INC-2026-04-30 のログを貼付。PostMortem を作って',
        '  5 Whys 実行 → 根本原因候補3つ（確信度付き）',
        '  再発防止を短期/中期/長期 + 期日で生成',
        '  Teams #incident 投稿用の要約も作成',
      ],
    },
    artifactsOut: [
      {
        name: '週次運用レポート 2026-W17（Google ドキュメント）',
        lang: 'md',
        body:
`# 週次運用レポート 2026-W17

## サマリ
- 稼働率: 99.97%（SLO 99.5% 達成）
- 平均レスポンス: 0.8s
- 取引件数: 14,820件
- インシデント: 0件

## トレンド
- 在庫照会 p95 が前週比 +12%（1.07s → 1.21s）
- 大田拠点の CSV連携が3日連続で1分遅延
  → 原因仮説: SFTP接続タイムアウト
  → 対応: 次週中に接続プール拡張（Issue #182）

## 来週の予定メンテ
- 04-30 02:00-04:00 Supabase メジャーアップデート`,
      },
      {
        name: 'incidents/INC-2026-04-30/postmortem',
        lang: 'md',
        body:
`# INC-2026-04-30 PostMortem

## 概要
- 発生 13:42 / 検知 13:43 / 復旧 14:11（29分）
- 影響: 大田拠点のバーコード入出庫が一時停止（取引数 0）

## タイムライン
| 時刻 | 出来事 |
|------|--------|
| 13:42 | API 5xx 急増（監視アラート発火） |
| 13:43 | オンコール検知、Teams #incident |
| 13:50 | 原因切り分け: 大田 VPN 切断 |
| 14:05 | フェイルオーバー手順実行 |
| 14:11 | 全拠点で復旧確認 |

## 根本原因（5 Whys）
1. なぜ停止? → 大田-本社間 VPN 切断
2. なぜ切断? → 拠点ルータのファーム自動更新
3. なぜ自動更新? → メンテ枠の合意がなかった
4. なぜ合意なし? → 拠点NW変更の連絡経路が未整備
5. なぜ未整備? → 開発スコープ外として後回し

## 再発防止
- 短期(本日中): ルータ自動更新を停止
- 中期(2週間): 拠点NW変更の連絡経路を明文化
- 長期(次四半期): 拠点フェイルオーバーをアプリ層で吸収するADR追加`,
      },
    ],
    review: {
      skillName: 'Claude.ai で 5 Whys の深さと再発防止の期日を点検',
      prompt: '5 Whysが組織課題まで掘れているか、再発防止が「気をつける」で終わっていないか、各対策に期日があるかをチェック。',
      comments: [
        { level: 'OK', target: '5 Whys',   body: '組織課題（連絡経路未整備）まで掘り下げ' },
        { level: 'OK', target: '再発防止', body: '短期/中期/長期に分かれ、すべて期日明示' },
      ],
    },
  },
];
