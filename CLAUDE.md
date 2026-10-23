# Sheet Music Player

楽譜の写真・画像・PDFを、ブラウザ内の光学楽譜認識（homr）で読み取り、五線譜の上をカーソルが進みながら再生する Web アプリ。公開 URL: https://ktkwmr.com/sheetmusicplayer/ （日本語: /sheetmusicplayer/ja/）
構成・開発・デプロイの詳細は README.md を参照。

## 共通ベースライン
- 独自機能以外の共通項目は ktkwmr/webapp-baseline（非公開）の WEBAPP_BASELINE.md に従う。
  セッションに無ければ add_repo（read。更新するときは push）で追加して読む。
- 各項目の状態は docs/baseline-status.md に記録する。
- どのアプリにも当てはまる新しい作業・設定・落とし穴が出てきたら、作業の最後に
  ベースラインへの追記案を出す（ユーザーが了承したらベースラインのリポジトリに PR）。
- 共通部分のファイル（`wrangler.jsonc`、`public/_headers`、`sw.js`、workflows など）を直したら、`webapp-baseline/templates/` の同じファイルも直す案を出す。
- 独自機能（読み取りエンジン・楽譜表示・再生・テンポ検出）の変更だけなら追記は不要。

## このアプリの値
- スラッグ: `sheetmusicplayer` / ドメイン: `ktkwmr.com` / 言語: en（既定）+ ja（`/ja/`）
- 運営者: ktkwmr / 問い合わせ: GitHub Issues
- Cloudflare Web Analytics token: `5c53079cb9a64d819d1ca53e8533ca63`（ほかのアプリと同じサイト）
- ホスティング: Cloudflare Workers 静的アセット。ドメインの 4 つ目のアプリなので、別 Worker に Route `ktkwmr.com/sheetmusicplayer*` だけを割り当てる（ベースライン §0 の A）。
  ドメイン直下（`/` のトップページ、`robots.txt`、ルートの `sitemap.xml`、ルートの 404）は ChordTransposer の Worker にある。このアプリの sitemap は `/sheetmusicplayer/sitemap.xml`。
- ライセンス: **AGPL-3.0**（ベースラインの MIT ではない）。アプリの中で homr（AGPL-3.0）の Python コードを配信・実行するため、同じライセンスにしている。
- 対応環境: PC の Chrome・Edge（JSPI が必要）。スマホ・Safari・Firefox は未対応（画面に案内を出す）。

## ルール
- 手で編集するのは `public/sheetmusicplayer/index.html`・`omr-worker.mjs`・`score-model.mjs`・`editor.mjs`・`sw.js`、`engine/python/`、`scripts/`。
  生成ファイルは編集しない:
  - `public/sheetmusicplayer/ja/index.html`、情報ページ（`about/`・`privacy/` とその `ja/`）、`sitemap.xml` → `node scripts/build-ja.mjs`・`node scripts/build-pages.mjs`（`--check` で確認）
  - `public/sheetmusicplayer/engine/<version>/`、`vendor/`、`THIRD_PARTY_LICENSES.md` → `python3 scripts/build-engine.py`（`--check` で確認）
- 画面の文言は `index.html` の `I18N`（en / ja）に書き、要素には `data-i18n` / `data-i18n-html` / `data-i18n-attr` を付ける。JS で作る文言は `t()` を使う。子要素を持つ要素に `data-i18n` は付けない（`build-ja.mjs` が止まる）。
- **読み取りエンジン（engine/<version>/）の中身を変えたら、必ずバージョンを上げる**（`build-engine.py` の `VERSION`、`omr-worker.mjs` の `ENGINE_VERSION`、`index.html` の `engine/<version>/` と `caches.has("sheetmusicplayer-engine-<version>")`）。エンジンはキャッシュ優先なので、同じバージョンのまま中身を変えると利用者のブラウザは古いファイルを使い続ける。古いバージョンのフォルダは消す。
- homr の Python ファイルは変更しない。ブラウザ用の差し替えは `engine/python/smp_omr.py`（入口・進捗・タイトル OCR の無効化）と `engine/python/onnxruntime/`（onnxruntime-web への橋渡し）で行う。homr を更新したら、テスト用の楽譜（スキャン・写真、単旋律・大譜表）で結果を確かめる。int8 量子化は homr 0.7.0 でだけ確認済み。
- Cloudflare Workers の静的アセットは 1 ファイル 25MiB まで。大きいモデルは `build-engine.py` で分割する（`--check` が超過を検出する）。
- PDF.js は 5.4 系に固定（5.5 以降は現行ブラウザにない `Map.prototype.getOrInsertComputed` を使う）。
- `public/_headers` の COOP/COEP（cross-origin isolation）は onnxruntime-web を複数スレッドで動かすためのもの。ただし今は `omr-worker.mjs` で 1 スレッドに固定している（複数スレッドだと Pyodide の JSPI 経由の呼び出しで最初のモデル実行が終わらない。検証環境は 2 コアで `hardwareConcurrency - 1` = 1 になり再現しなかったので、スレッド数を変えるときは明示的に 4〜8 を指定して試す）。外部のスクリプトを足すときは CSP に加えて CORS／CORP も確かめる。Tesseract.js のワーカーだけ `unsafe-eval` を許可している（同じファイル内のコメント参照）。
- 編集機能: `score-model.mjs` が MusicXML ⇄ 音符のリスト（24 tick/4分音符、小節は拍子から決める）を変換し、`editor.mjs` がピアノロールを描く。「楽譜」に戻るか保存するときに `buildXml` で MusicXML を作り直す（ヘッダー・パート・各小節の繰り返し記号と改行は元の XML から引き継ぎ、歌詞・スラー等は消える）。`score-model.mjs` を変えたら、テスト用の MusicXML（単旋律・大譜表・3 パート）で「読み込み → 書き出し → 読み込み」で音符が一致することと、OSMD で描けることを確かめる。
- homr は複数小節休符をふつうの 1 小節として読むことがある。`expandMultiRests` は `<multiple-rest>` が付いたときだけ小節を増やす。それ以外は編集画面の「小節を追加」で直してもらう。
- 最後の楽譜は `localStorage` の `sheetmusicplayer-state` に保存する。読み込んだ値は検証してから使う。新しいファイルを開いたらテンポは楽譜の値に戻す。
- 外部ホストを足したら `public/_headers` の CSP と、プライバシーの説明（`scripts/pages/privacy.mjs`、アプリ内の `privacy.body`、README）を同じ PR で直す。
- トップページ（https://ktkwmr.com/）のアプリ一覧に、このアプリの名前・説明・特徴を載せる（ChordTransposer の `scripts/pages/home.mjs` の `APPS`。アイコンは `ICON`）。ガイド記事を追加・改名・削除したとき、アプリ名・説明・アイコンを変えたときは、`ktkwmr/ChordTransposer` に `home.mjs` を直す PR を別に出す（ベースライン §2-16）。
- 記事（ガイド）はまだない。作るときは PR のプレビューで人間が内容を確認してからマージする（ベースライン §10-7、`docs/article-review.md`）。
- 作業はブランチ → PR → Cloudflare のプレビュービルド確認 → squash マージ。
- 本番サイト・Cloudflare 管理画面・外部 CDN にはこの環境から届かないことが多い。確かめられなかったことは「未確認」と書き、ユーザーに確認手順を伝える。
- 動作確認は `npx wrangler dev`（`_headers` が効く）＋ Playwright の Chromium で、テスト用の楽譜画像の読み取り → 表示 → 再生 → カーソルの移動と、MusicXML（.musicxml・.mxl）の読み込みまで通す。テスト用のブラウザプロファイルは使い回さない（Tesseract.js や Cache Storage に古いデータが残ると結果が変わる）。
