# 利用状況の計測（Cloudflare Zaraz + Google Analytics 4）

ページの滞在時間・ボタンのタップ・読み取りの結果などを、Cloudflare Zaraz 経由で GA4 に送る。
**同意バナーで「すべて同意」を選んだ人だけ**が GA4 に送られる。閲覧数は今までどおり Cloudflare Web Analytics（Cookie なし）でも数える。

## しくみ

- `index.html`・記事のページ（`scripts/pages/layout.mjs`）の `<head>` で `/cdn-cgi/zaraz/i.js`（Zaraz）と `/sheetmusicplayer/usage-events.js` を読む。
  Zaraz の「Auto-inject script」は切ってあるので、Zaraz が動くのはこのタグを書いたページだけ。
- `usage-events.js`: タップ（`smp_tap`）と、ページが見えていた時間・再生した時間（`smp_engaged`）を送る。`window.smpTrack(name, params)` と `window.smpPlaying(on)` を `index.html` に渡す。フッターの「Cookie の設定」（`.cookie-settings`）で `zaraz.showConsentModal()` を開く。
- `index.html`: ファイルを選んだとき（`smp_open`）、読み取りの結果（`smp_read`）、書き出し・共有（`smp_export`）を送る。
- Zaraz がないとき（`wrangler dev`、workers.dev のプレビュー、ブラウザがブロック）は何も送らない。`i.js` が 404 になるだけで、アプリは動く。
- 同じオリジン（`/cdn-cgi/zaraz/…`）なので CSP・COEP は変えていない。Zaraz が GA4 に送るのは Cloudflare のサーバーからで、ブラウザは Google に直接つながない。
- `sw.js` は `/cdn-cgi/` をキャッシュしない（Zaraz のスクリプトはリクエストごとに作られる）。

**楽譜の内容は送らない**: タイトル・ファイル名・音符・画像・エラーメッセージの本文は送らない。イベントを足すときもこれを守り、プライバシーの説明（`scripts/pages/privacy.mjs`、`index.html` の `privacy.body`、README）に書いた範囲に収める。範囲を広げるときは説明も同じ PR で直す。

## イベント

すべてのイベントに `ui_lang`（`en` / `ja`）が付く。

| イベント | パラメーター | いつ |
|---|---|---|
| `smp_tap` | `button` | ボタン・リンクを押したとき。名前は要素の `id`（なければ `data-track`、テンポの ±5 は `bpm+5` など、リンクは `link:/sheetmusicplayer/guide/` や `link:github.com`、それ以外は「上にある id:クラス名」） |
| `smp_engaged` | `seconds`, `play_seconds` | ページが隠れたとき・閉じたとき。前回から、ページが見えていた秒数と再生していた秒数 |
| `smp_open` | `via`（file / camera）, `kind`（image / pdf / xml / mxl / other、複数は `+` でつなぐ）, `files` | ファイルを選んだとき |
| `smp_read` | `result`（ok / cancel / image / pdf / no-staff / unsupported / download / memory / render / xml / error）, `kind`, `files`, `pages`, `seconds`, `tempo`（テンポの取り方） | 読み取り（MusicXML を開くのも含む）が終わったとき |
| `smp_export` | `type`（musicxml / midi / mp3 / share）, `result`（ok / cancel / error、共有は file / link / copied） | 保存・共有したとき |

イベント名を足すときは `smp_` で始める（GA4 で絞り込みやすくするため）。

## 設定（Cloudflare・GA4。2026-11-13 に設定）

- GA4: プロパティ `ktkwmr.com`（ドメイン全体で 1 つ。アプリ・記事はページの URL で分ける）、測定 ID `G-HM6P805V7F`、拡張計測機能オフ、データの保持 14 か月、Google シグナルオフ。
- Zaraz（`ktkwmr.com`）: ツール GA4（自動のアクション Pageviews・Events はオン、E-commerce はオフ、Hide Originating IP はオフ）。
  Settings: Auto-inject script オフ、Data layer compatibility オフ、SPA support オフ、Trim IP addresses オン、Automatic Pageview Tracking オン。
  Consent: 有効、バナーを自動で表示、目的「Analytics」（ID `ZSup`）に GA4 を割り当て、Cookie 名 `zaraz-consent`。バナーの文言とボタンは英日。
- Configuration Rule: このアプリを出すまでは Zaraz を全ページで止めていた。出したあとは「パスが `/sheetmusicplayer` と `/cdn-cgi/` で始まらないページだけ Zaraz を止める」（ほかのアプリはプライバシーの説明を直してから広げる）。

## GA4 で登録するカスタム定義

GA4 → 管理 → カスタム定義。登録しないとレポートに出ない（さかのぼっても出ない）。

| 種類 | 名前（パラメーター） | 範囲・単位 |
|---|---|---|
| カスタムディメンション | `button`, `via`, `kind`, `result`, `type`, `tempo`, `ui_lang` | イベント |
| カスタム指標 | `seconds`, `play_seconds` | イベント・秒 |
| カスタム指標 | `files`, `pages` | イベント・標準 |

## 確かめ方

- ローカル: `npx wrangler dev` で、Playwright の `context.route("**/cdn-cgi/zaraz/i.js")` に `window.zaraz = { track() {…} }` の代わりを返させ、送られるイベントを見る。
- 本番: ブラウザのコンソールで `zaraz.debug("<Debug key>")` を実行して再読み込みすると、Zaraz の送信内容が表示される。GA4 の「リアルタイム」・DebugView にも出る。
