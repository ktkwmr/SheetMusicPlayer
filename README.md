# Sheet Music Player

Take a photo of sheet music, or open an image or PDF, and hear it. The app reads the notes with optical music recognition ([homr](https://github.com/liebharc/homr)) **inside your browser** and plays them back with a cursor that moves along the staff. The tempo starts at the marking found on the page and can be changed while it plays.

楽譜を写真に撮るか、画像・PDFを開くと、その楽譜を再生できます。音符の読み取り（光学楽譜認識、[homr](https://github.com/liebharc/homr)）は**ブラウザの中で**行い、再生中は五線譜の上をカーソルが進みます。テンポは楽譜に書かれた値で始まり、再生中にも変えられます。

**▶ https://ktkwmr.com/sheetmusicplayer/** (日本語: https://ktkwmr.com/sheetmusicplayer/ja/)

> Works on the latest Chrome or Edge on a computer for now. Phones and Safari are not supported yet (see [Requirements](#requirements--動作環境)).
> いまは PC の最新の Chrome・Edge で動きます。スマホと Safari には未対応です（[動作環境](#requirements--動作環境)）。

## Features / 機能

- **Open a score**: choose any file (images — JPEG, PNG, WebP, GIF, BMP, … — and PDF up to 12 pages are read; a MusicXML file — .musicxml / .xml / .mxl, e.g. one saved from this app — opens as it is), take a photo (phone camera app, or the webcam on a computer), or drop a file. **Clear** removes the score
  ファイルを選ぶ（どのファイルも選べ、画像〈JPEG・PNG・WebP・GIF・BMPなど〉と PDF〈12ページまで〉を読み取る。MusicXML〈.musicxml・.xml・.mxl。このアプリで保存したものなど〉はそのまま開く）、写真を撮る（スマホはカメラアプリ、PC は Web カメラ）、ドロップ。「クリア」で楽譜を消す
- **Reading in the browser**: homr's Python code runs in Pyodide and its models in onnxruntime-web, so the score is never uploaded. The engine (~127 MB) is downloaded once and cached, so later visits start right away and work offline
  homr の Python コードを Pyodide で、モデルを onnxruntime-web で動かすので、楽譜はアップロードされない。エンジン（約127MB）は初回だけダウンロードしてキャッシュし、次回からはすぐに起動・オフラインでも動作
- **Tempo from the page**: Tesseract.js reads the metronome marking (♩ = 100) or a tempo word (Allegro …) at the top of the first page. ♩ = 120 when there is none
  1ページ目の上部から、メトロノーム記号（♩ = 100）や速度用語（Allegro など）を Tesseract.js で読み取る。見つからなければ ♩ = 120
- **Score and playback**: OpenSheetMusicDisplay draws the score; a blue cursor glides along the staff with the sound (Web Audio API). Click a note to move the cursor there (Play starts from it). Change the tempo with −5 / +5, the number, or the slider, even while playing
  OpenSheetMusicDisplay で楽譜を表示し、音（Web Audio API）に合わせて青いカーソルが五線の上を進む。音符をクリックでカーソルを移動（「再生」でそこから）。テンポは −5／+5・数字・スライダーで、再生中でも変更可
- **Fix mistakes in a piano-roll editor** (“Edit”): each note is a box — drag to change its pitch and timing, drag its right edge for the length, click to add, right-click or Delete to remove, select several by dragging, add or delete measures, undo / redo. Measures whose beats did not add up when read are marked. Going back to “Score” rebuilds the MusicXML and redraws the staff (lyrics, slurs, and articulations are not kept after an edit)
  ピアノロールの編集画面（「編集」）で間違いを直せる。音符を四角で表し、ドラッグで音の高さとタイミング、右端で長さ、クリックで追加、右クリックか Delete で削除、ドラッグでまとめて選択、小節の追加・削除、元に戻す／やり直し。読み取り時に拍が合わなかった小節には印を付ける。「楽譜」に戻ると MusicXML を作り直して五線譜を描き直す（編集すると歌詞・スラー・アーティキュレーションは消える）
- **Save as MusicXML** to open the result in MuseScore or other notation apps
  MusicXML で保存して、MuseScore などでも開ける
- **The last score is kept** in the browser. Installable PWA. English / Japanese UI (`/sheetmusicplayer/ja/` is always Japanese; `?lang=en` / `?lang=ja` override)
  最後の楽譜をブラウザに保存。ホーム画面に追加可能。英語・日本語の表示（`/sheetmusicplayer/ja/` は常に日本語、`?lang=en` / `?lang=ja` で切り替え）

## Requirements / 動作環境

| | |
|---|---|
| Browser | Chrome or Edge 137 or later on a computer. The engine needs **JavaScript Promise Integration (JSPI)**, which Safari and Firefox do not have yet. Other browsers get a message instead of a broken page |
| Memory | About 2 GB free while reading |
| Time | Roughly 10–60 seconds per page, depending on the computer and the number of staves (measured: 40–70 s per page on a 2-core cloud machine) |
| First visit | Downloads ~127 MB once |

| | |
|---|---|
| ブラウザ | PC の Chrome・Edge 137 以降。エンジンが **JavaScript Promise Integration（JSPI）** を使うため、Safari と Firefox はまだ動かない（その場合は案内を表示） |
| メモリ | 読み取り中に約 2GB |
| 時間 | PC の性能と段の数によって 1 ページ 10〜60 秒ほど（2 コアのクラウド環境で 1 ページ 40〜70 秒を実測） |
| 初回 | 約 127MB を 1 回だけダウンロード |

## How it works / 仕組み

```
file / photo ──► page canvas (PDF.js for PDF) ──► RGBA pixels
                                   │
   tempo: Tesseract.js on the top of page 1 ─┐
                                   ▼          │
   omr-worker.mjs (Web Worker)                │
     Pyodide ─ homr (unchanged) + engine/python/smp_omr.py
        └─ engine/python/onnxruntime/  ← onnxruntime API on top of onnxruntime-web,
                                          called synchronously with JSPI (pyodide.ffi.run_sync)
                                   ▼          ▼
                             MusicXML (+ tempo) ──► OpenSheetMusicDisplay ──► timeline
                                                                   │
                                     Web Audio scheduler ◄─────────┴──► cursor on the staff
```

- homr's segmentation model and encoder are **quantized to int8** (57→14 MB and 52→15 MB). On the six test scores the results were exactly the same as with the original models, and reading was faster. The decoder is already int8 and is split into two files (Cloudflare Workers serves files up to 25 MiB).
- `public/_headers` sets **cross-origin isolation** (COOP `same-origin` + COEP `credentialless`) so onnxruntime-web can use several threads. **For now the engine runs on one thread**: with more, the first model run never finishes when it is called from Python through JSPI (under investigation).
- homr の分割モデルとエンコーダーは **int8 に量子化**（57→14MB、52→15MB）。6 つのテスト楽譜で元のモデルと結果が完全に一致し、速くなった。デコーダーは元から int8 で、Cloudflare Workers の 1 ファイル 25MiB の制限に合わせて 2 つに分割。
- `public/_headers` で **cross-origin isolation**（COOP `same-origin` + COEP `credentialless`）を有効にしている（onnxruntime-web を複数スレッドで動かすため）。ただし**今は 1 スレッドで動かしている**。複数スレッドにすると、Python から JSPI 経由で呼んだときに最初のモデルの実行が終わらなくなる（調査中）。

## Privacy / プライバシー

- The photos, images, and PDFs you open are read only in your browser and are never sent to a server. Camera photos are not saved. The app has no accounts, cookies, or ads.
- The last score (as MusicXML), its file name, and the tempo, plus the app and its reading engine (for offline use), are saved in your browser's storage. Clear this site's data to remove them.
- The site is hosted on Cloudflare, which keeps standard access logs (IP address, time, requested page or file) for operation and security. Page views are counted with Cloudflare Web Analytics, which uses no cookies.

- 開いた写真・画像・PDF はブラウザの中だけで読み取り、サーバーには送りません。カメラで撮った写真も保存しません。アカウント登録・Cookie・広告はありません。
- 最後の楽譜（MusicXML）・ファイル名・テンポと、オフラインで使うためのアプリ本体・読み取りエンジンをブラウザ内に保存します。サイトデータを削除すると消えます。
- サイトは Cloudflare で配信しており、運用・セキュリティのために標準的なアクセスログ（IP アドレス、日時、アクセスしたページやファイル）が記録されます。閲覧数は Cookie を使わない Cloudflare Web Analytics で集計しています。

The same notice is shown in the app under ⚙ → **Privacy**. The full privacy policy is at `/sheetmusicplayer/privacy/` (Japanese: `/sheetmusicplayer/ja/privacy/`), and the operator information is at `/sheetmusicplayer/about/`.
アプリ内の ⚙ → **プライバシー** でも同じ内容を表示しています。プライバシーポリシーは `/sheetmusicplayer/ja/privacy/`、運営者情報は `/sheetmusicplayer/ja/about/` にあります。

## Project structure / 構成

```
public/
  _headers                      # security headers (CSP, COOP/COEP, Permissions-Policy)
  404.html                      # page for unknown URLs under /sheetmusicplayer/ (status 404)
  sheetmusicplayer/
    index.html                  # the app (HTML / CSS / JS, English and Japanese text)
    omr-worker.mjs              # Web Worker: downloads and caches the engine, runs homr in Pyodide
    score-model.mjs             # MusicXML <-> editable notes (ticks, measures, staves), and back to MusicXML
    editor.mjs                  # the piano-roll editor (canvas)
    engine/v3/                  # the reading engine, built by scripts/build-engine.py (do not edit)
      pyodide/ ort/ models/ tesseract/ homr.zip manifest.json
    vendor/                     # OpenSheetMusicDisplay and PDF.js (copied by scripts/build-engine.py)
    ja/index.html               # Japanese page, generated from index.html (do not edit)
    guide/ faq/ photo-tips/ fix-errors/ tempo-markings/ musicxml/ what-is-omr/
                                # guide articles, generated from scripts/pages/ (do not edit)
    guide/img/                  # screenshots and sample pictures for the articles (scripts/render-guide-images.mjs)
    about/ privacy/ ja/<slug>/  # info pages, generated from scripts/pages/ (do not edit)
    sitemap.xml                 # generated by scripts/build-pages.mjs (do not edit)
    sw.js                       # Service Worker (network first; engine files cache first)
    manifest.json  icons/  og-image.png
    THIRD_PARTY_LICENSES.md     # third-party notices (shown in About), written by scripts/build-engine.py
engine/python/                  # the browser glue for homr (packed into engine/<version>/homr.zip)
  smp_omr.py                    #   entry point: pixels → MusicXML, progress, no file I/O or title OCR
  onnxruntime/__init__.py       #   the part of the onnxruntime API homr uses, on top of onnxruntime-web
scripts/
  build-engine.py               # builds public/sheetmusicplayer/engine/<version>/, vendor/, THIRD_PARTY_LICENSES.md
  build-ja.mjs  build-pages.mjs  pages/   # pages/<slug>.mjs: one article or info page each (English and Japanese)
  pages/data/photo-results.json # measured by render-guide-images.mjs, used by pages/photo-tips.mjs
  render-guide-images.mjs       # screenshots + photo-variant measurements for the articles
  update-third-party-licenses.mjs
  og-image.html  render-og-image.mjs  render-icons.mjs
wrangler.jsonc                  # Cloudflare Workers (static assets, route ktkwmr.com/sheetmusicplayer*)
CLAUDE.md                       # instructions for Claude Code
docs/baseline-status.md         # status of the shared web app baseline items
```

This is the fourth app on `ktkwmr.com`. Its Worker only serves `/sheetmusicplayer/*`; the domain root (`/`, `robots.txt`, the root `sitemap.xml`, and 404 for other paths) belongs to the `ktkwmr-home` Worker ([ktkwmr/ktkwmr.com](https://github.com/ktkwmr/ktkwmr.com)), so this app does not depend on any other app.
`ktkwmr.com` の 4 つ目のアプリです。この Worker は `/sheetmusicplayer/*` だけを配信し、ドメイン直下は Chord Transposer の Worker が持っています。

When you load a script or data from a new external host, add it to the `Content-Security-Policy` in `public/_headers`, or the browser will block it. With COEP, a cross-origin script also needs CORS. Also update the privacy text.
新しい外部サイトからスクリプトやデータを読み込むときは、`public/_headers` の CSP にそのホストを追加してください。COEP のため、別オリジンのスクリプトは CORS も必要です。プライバシーの説明も同時に直します。

## Development / 開発

```sh
npx wrangler dev        # http://localhost:8787/sheetmusicplayer/ (also runs the generators and applies _headers)
```

Use `wrangler dev` rather than a plain static server: the app needs the headers in `public/_headers` (cross-origin isolation for threads) to run at full speed. `file://` does not work. After editing a file, restart `wrangler dev` (it keeps serving the old ETag). On Windows PowerShell, use `npx.cmd` if `npx` is blocked.
ふつうの静的サーバーではなく `wrangler dev` を使ってください（`_headers` の cross-origin isolation がないとスレッドが使えず遅くなります）。`file://` では動きません。ファイルを編集したら `wrangler dev` を起動し直してください。

### Tests / テスト

```sh
npm install   # once: jsdom (test only; the app has no npm dependencies)
npm test      # unit tests of score-model.mjs (tests/, with the scores in tests/fixtures/)
```

The **Test** workflow runs them on every pull request and push to `main`, and checks that the generated pages are up to date. The reading engine, display, and playback are checked by hand in Chromium (see CLAUDE.md).
GitHub Actions の **Test** が、PR と `main` への push のたびに単体テストと生成ファイルの確認を行います。読み取り・表示・再生は Chromium で手動確認します（CLAUDE.md 参照）。

### Rebuilding the engine / エンジンの作り直し

The engine files are committed, so normal changes do not need this. To update homr, Pyodide, onnxruntime-web, Tesseract.js, OpenSheetMusicDisplay, or PDF.js:

1. Change the versions at the top of `scripts/build-engine.py`. If anything in `engine/` changes, also bump `VERSION` there and `ENGINE_VERSION` in `omr-worker.mjs` (and the `engine/<version>/` paths and the cache name in `index.html`), so browsers download the new engine instead of using the cached one.
2. `pip install onnx onnxruntime` and run `python3 scripts/build-engine.py` (downloads ~400 MB into `.engine-cache/`, which is ignored by Git). Delete the old `engine/<version>/` folder.
3. Check the results on several scores (scan and photo) before publishing; the int8 quantization was only verified for homr 0.7.0.

エンジンのファイルはコミットしてあるので、ふだんは不要です。ライブラリを更新するときは、`scripts/build-engine.py` の先頭のバージョンを変え、エンジンの中身が変わるなら `VERSION`・`omr-worker.mjs` の `ENGINE_VERSION`・`index.html` の `engine/<version>/` とキャッシュ名も上げてから、`python3 scripts/build-engine.py` を実行します（`pip install onnx onnxruntime` が必要）。公開前に複数の楽譜（スキャン・写真）で結果を確かめてください。int8 量子化は homr 0.7.0 でだけ確認しています。

## Deploy / デプロイ

The app is served with Cloudflare Workers static assets. With Workers Builds connected to this repository, a push to `main` deploys automatically, and other branches get preview builds. To deploy by hand: `npx wrangler deploy`.

## Generated files / 生成ファイル

Edit only `public/sheetmusicplayer/index.html`, `omr-worker.mjs`, `score-model.mjs`, `editor.mjs`, `sw.js`, `engine/python/`, and `scripts/`. These files are generated and must not be edited by hand:

- `public/sheetmusicplayer/ja/index.html` – from `index.html` (Japanese `<head>` in `scripts/build-ja.mjs`, UI text from `I18N.ja`)
- the guide articles, `about/`, `privacy/`, their `ja/` versions, and `sitemap.xml` – from `scripts/pages/`
- `guide/img/` and `scripts/pages/data/photo-results.json` – from `scripts/render-guide-images.mjs`
- `engine/<version>/`, `vendor/`, `THIRD_PARTY_LICENSES.md` – from `scripts/build-engine.py`

```sh
node scripts/build-ja.mjs             # regenerate ja/index.html
node scripts/build-pages.mjs          # regenerate the articles, info pages, and sitemap.xml
node scripts/build-ja.mjs --check     # exit 1 if out of date (same for build-pages.mjs)
python3 scripts/build-engine.py --check  # check that every engine file is present and under 25 MiB
```

The first two run automatically on `wrangler deploy` / `wrangler dev` and on push to `main` (GitHub Actions).
編集するのは `index.html`・`omr-worker.mjs`・`score-model.mjs`・`editor.mjs`・`sw.js`・`engine/python/`・`scripts/` だけです。日本語ページ・情報ページ・`sitemap.xml` は生成ファイル、`engine/`・`vendor/`・`THIRD_PARTY_LICENSES.md` は `scripts/build-engine.py` が作ります。

## Images / 画像

```sh
npm install --no-save playwright && npx playwright install chromium
node scripts/render-og-image.mjs      # og-image.png from scripts/og-image.html
node scripts/render-icons.mjs         # PNG icons from icons/icon.svg
npx wrangler dev                      # in another terminal, then:
node scripts/render-guide-images.mjs  # article screenshots and the photo-tips measurements (10–20 min)
```

`render-guide-images.mjs` draws a sample score (Ode to Joy, public domain) with the app's OpenSheetMusicDisplay, reads it in the app, and takes the screenshots in English and Japanese. It also makes tilted, blurred, … versions of the page, reads each one, and writes how many notes were right to `scripts/pages/data/photo-results.json`. Run it again when the app's look changes, then `node scripts/build-pages.mjs`. If the new results no longer match the text of the photo-tips article, the build stops and says so.
画面が変わったら `render-guide-images.mjs` で記事の画面写真を撮り直します。撮り方の比較（写真ごとの読み取り結果）も測り直し、結果が記事の文章と合わなくなったら `build-pages.mjs` が止まります。

## Guide articles / ガイド記事

| Slug | Article |
|---|---|
| `guide` | How to use the app, with screenshots / 使い方ガイド |
| `faq` | FAQ / よくある質問 |
| `photo-tips` | Photographing sheet music (six photos of one page, measured) / 撮り方のコツ |
| `fix-errors` | Finding and fixing reading mistakes / 読み取りミスの直し方 |
| `tempo-markings` | Tempo markings and BPM (the app's own tempo table) / 速度記号と BPM |
| `musicxml` | What MusicXML is / MusicXML とは |
| `what-is-omr` | How optical music recognition works / 楽譜を読み取る仕組み |

Values that the app also uses (the tempo table, the default tempo, the PDF page limit) are read from `index.html` by `scripts/pages/parts.mjs`, so the articles follow the app. Article changes go through a pull request and are read on the preview URL before merging (`docs/article-review.md`).
アプリと共通の値（速度記号の表・既定のテンポ・PDF のページ数の上限）は `index.html` から読み込みます。記事の変更は PR のプレビューで人が読んでからマージします（`docs/article-review.md`）。

## License / ライセンス

[GNU Affero General Public License v3](LICENSE) © 2026 ktkwmr — the same license as [homr](https://github.com/liebharc/homr), whose code runs in the app. The libraries the app includes and their licenses are listed in [`THIRD_PARTY_LICENSES.md`](public/sheetmusicplayer/THIRD_PARTY_LICENSES.md).

アプリの中で動く [homr](https://github.com/liebharc/homr) に合わせ、[GNU AGPL v3](LICENSE) で公開しています。同梱しているライブラリとそのライセンスは [`THIRD_PARTY_LICENSES.md`](public/sheetmusicplayer/THIRD_PARTY_LICENSES.md) にあります。
