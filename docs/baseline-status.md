# ベースラインの実施状況（Sheet Music Player）

基準: WEBAPP_BASELINE.md（最終更新 2026-10-21 版）
状態: ✅ 実装済み / ⚠️ 一部 / ❌ 未実装 / 👤 待ち（人間の作業） / — 対象外

## 0. 変数

| 変数 | 値 |
|---|---|
| アプリ名 | Sheet Music Player |
| スラッグ | `sheetmusicplayer` |
| ドメイン | `ktkwmr.com`（4 つ目のアプリ。§0 の **A**: 別 Worker + Route `ktkwmr.com/sheetmusicplayer*`） |
| リポジトリ | `ktkwmr/SheetMusicPlayer`（公開・**未作成**） |
| 運営者・問い合わせ | ktkwmr / GitHub Issues |
| 言語 | en（既定）+ ja（`/ja/`） |
| Web Analytics token | ほかのアプリと同じ |
| ライセンス | **AGPL-3.0**（homr に合わせた。ベースラインの MIT とは異なる） |

## 1. アカウント

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 1-1〜1-3, 1-5, 1-6 | アカウント類・開発環境 | ✅ | 既存アプリで実施済み |
| 1-4 | Claude の GitHub App にリポジトリを許可 | 👤 待ち | リポジトリ作成後 |
| 1-8 | Cloudflare の GitHub App にリポジトリを許可 | 👤 待ち | リポジトリ作成後 |

## 2. 土台とホスティング

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 2-1 | wrangler.jsonc | ✅ | `routes`・`workers_dev: false`・`preview_urls: true`・`previews: {}` |
| 2-2 | `/` → `/<slug>/` の転送 | — | ドメイン直下は ChordTransposer 側 |
| 2-3 | 404.html | ✅ | `wrangler dev` で `/sheetmusicplayer/` 以下の不明な URL が 404 になることを確認 |
| 2-4 | .gitignore | ✅ | `.engine-cache/`（エンジン作成用のダウンロード）も除外 |
| 2-5 | .gitattributes（LF） | ✅ | |
| 2-6 | 生成スクリプトの `--check` | ✅ | `build-ja.mjs`・`build-pages.mjs`・`build-engine.py --check`（ファイルの有無と 25MiB 以下） |
| 2-7 | README（英日） | ✅ | 動作環境・仕組み・エンジンの作り直しも記載 |
| 2-8 | LICENSE | ✅ | AGPL-3.0（homr のライセンス本文） |
| 2-9 | CLAUDE.md | ✅ | |
| 2-10 | バージョン番号なし・キャッシュ名固定 | ✅ | 画面にバージョンは出さない。エンジンだけはフォルダ名でバージョン管理（`engine/v3/`、中身を変えたら上げる） |
| 2-11 | Cloudflare に接続・ルート設定 | 👤 待ち | |
| 2-13 | 自動デプロイの確認 | 👤 待ち | |
| 2-14 | 2 つ目以降のアプリの設定 | ✅ | sitemap は `public/sheetmusicplayer/sitemap.xml`。ChordTransposer の `robots.txt` に `Sitemap:` 行を足す PR が必要（未作成） |
| 2-15 | トップページ | — | ChordTransposer 側 |
| 2-16 | トップページへのアプリの追加 | ❌ | ChordTransposer の `home.mjs` に `ICON`・`APPS` を足す PR（リポジトリ公開後に作成） |

## 3. PWA

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 3-1 | manifest.json | ✅ | |
| 3-2 | アイコン一式 | ✅ | |
| 3-3 | PWA/iOS 用 meta | ✅ | |
| 3-4 | sw.js（ネットワーク優先） | ✅ | 例外: 読み取りエンジン（`engine/`）はキャッシュ優先。`omr-worker.mjs` が専用のキャッシュ `sheetmusicplayer-engine-<version>` に保存し、sw.js はそこから返すだけ（130MB を二重に持たない） |
| 3-5 | SW 登録 | ✅ | |
| 3-6 | `file://` 不可の説明 | ✅ | README |
| 3-7 | インストールの案内 | ❌ | 任意 |
| 3-8 | アイコン PNG の生成 | ✅ | `scripts/render-icons.mjs` |

## 4. 多言語

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 4-1 | I18N と data-i18n | ✅ | |
| 4-2 | 言語の決め方 | ✅ | |
| 4-3 | 日本語ページの自動生成 | ✅ | |
| 4-4 | 日本語の検索用タイトル・説明 | 👤 確認待ち | `scripts/build-ja.mjs` の冒頭。案: 「Sheet Music Player – 楽譜の写真・PDFを読み取って再生する無料アプリ」 |
| 4-5 | 和文の lang 固定 | — | 和文を表示する部分はない |

## 5. SEO と SNS 表示

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 5-1〜5-3 | title・description・canonical・hreflang・OGP | ✅ | |
| 5-4 | og-image.png | ✅ | `scripts/og-image.html` から生成 |
| 5-5 | JSON-LD | ✅ | `browserRequirements` に「PC の Chrome・Edge」 |
| 5-6 | robots.txt・sitemap | ⚠️ | sitemap は生成済み。robots.txt は ChordTransposer 側に追記が必要 |
| 5-7 | h1 | ✅ | |
| 5-8 | 見えるテキスト | ✅ | 冒頭の説明と、撮影のコツ |
| 5-10 | アプリごとの sitemap | ✅ | |

## 6. セキュリティヘッダー

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 6-1, 6-2 | `_headers`・CSP の基本形 | ✅ | `wasm-unsafe-eval`（エンジン）、`worker-src 'self' blob:`、`media-src blob:`（Web カメラ）。COOP `same-origin` + COEP `credentialless` + CORP `same-origin`（スレッドで高速化） |
| 6-3 | 外部ホストの CSP | ✅ | 外部は Cloudflare Web Analytics だけ。ライブラリはすべて自サイトから配信 |
| 6-4 | CSP 違反 0 件 | ✅ | `wrangler dev` + Chromium で、読み取り・表示・再生・PDF・カメラ・About を通して違反 0 件。例外として Tesseract.js のワーカー 1 ファイルだけ `unsafe-eval` を許可（`_headers` にコメント） |
| 6-5 | Permissions-Policy | ✅ | `camera=(self)`（写真を撮る） |

## 7. プライバシー・法務

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 7-1 | アプリ内のプライバシー | ✅ | 楽譜を送らないこと、カメラ、保存するデータ |
| 7-2 | プライバシーポリシー | ✅ | 制定日 2026-10-22 |
| 7-3 | 運営者情報 | ✅ | 免責（読み取り結果の正確さ・楽譜の利用）、AGPL と homr |
| 7-4 | 問い合わせ窓口 | ⚠️ | GitHub Issues のみ |
| 7-5 | 文言のそろえ | ✅ | |
| 7-6 | 例のコンテンツ | ✅ | サンプルは伝承曲「きらきら星」を自前で浄書した画像 |
| 7-7 | 外部リンクの確認 | 👤 待ち | |

## 8. ライセンス

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 8-1 | THIRD_PARTY_LICENSES.md | ✅ | `scripts/build-engine.py` が 15 ライブラリの本文を書く（CDN ではなく自サイト配信のため） |
| 8-2 | 更新スクリプト・Actions | ✅ | CDN の URL を探すスクリプトは、自サイト配信の `engine/`・`vendor/` を対象外にした |
| 8-3 | About で表示 | ✅ | |
| 8-4 | バージョン固定・遅延読み込み | ✅ | すべてバージョン固定。エンジン・OSMD・PDF.js は使うときだけ読み込む |

## 9. 共通 UI

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 9-1 | 設定メニュー | ⚠️ | 使い方・プライバシー・このアプリについて。ガイド記事はないので「ガイド・記事」は置いていない |
| 9-2 | 使い方 | ✅ | |
| 9-3 | 状態の保存 | ✅ | 最後の楽譜（MusicXML）・ファイル名・テンポ。新しいファイルではテンポを楽譜の値に戻す |
| 9-4 | スマホ対応 | ⚠️ | 390px で横スクロールなし。ただし読み取りエンジンは PC の Chrome・Edge のみ（JSPI が必要）。スマホでは案内を表示 |
| 9-5 | `accept` | ✅ | 「ファイルを選ぶ」は `accept` なし（どのファイルも選べ、中身で画像・PDF を判定）。「写真を撮る」はスマホではカメラ、PC では Web カメラ |
| 9-6, 9-7 | 印刷・保存 | ✅ | MusicXML の保存（`a[download]`）。印刷はなし |
| 9-8 | アクセシビリティ | ✅ | |
| 9-9 | 自動テスト | ❌ | Playwright での手動 E2E のみ |
| 9-10 | 押したときの反応 | ✅ | |
| 9-11 | ダイアログのフォーカス | ✅ | |

## 10〜15

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 10 | 記事 | — | 人間が「やる」と言ったときに作る |
| 11-1〜11-3 | Web Analytics | ✅ | 同じ token |
| 11-4 | 本番での beacon 確認 | 👤 待ち | COEP（credentialless）の下で beacon が読み込めるかも確認する |
| 12-1, 12-2 | Actions | ✅ | |
| 13 | 公開直前の確認 | 👤 待ち | |
| 14 | Search Console など | 👤 待ち | |
| 15 | 広告 | — | |

## このアプリで見つかった、ベースラインに足す候補

- 大きなファイル（WebAssembly・モデル）を配信するアプリ: Cloudflare Workers の 1 ファイル 25MiB 制限、キャッシュ優先の専用キャッシュ、バージョン付きフォルダ。
- `SharedArrayBuffer`（スレッド）が要るアプリ: `_headers` に COOP/COEP。COEP は `credentialless` にすると Web Analytics の beacon をそのまま使える。
- Playwright で検証するときは、毎回新しいプロファイルを使う（Cache Storage・IndexedDB の古いデータで結果が変わる）。
