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
  ドメイン直下（`/` のトップページ、`robots.txt`、ルートの `sitemap.xml`、ルートの 404）は別リポジトリ `ktkwmr/ktkwmr.com`（Worker `ktkwmr-home`、ルート `ktkwmr.com/*`）にある。ほかのアプリには依存しない。このアプリの sitemap は `/sheetmusicplayer/sitemap.xml`。
- ライセンス: **AGPL-3.0**（ベースラインの MIT ではない）。アプリの中で homr（AGPL-3.0）の Python コードを配信・実行するため、同じライセンスにしている。
- 対応環境: 動作確認は PC の Chrome・Edge 137 以降、iPhone の Safari（iOS 27.2、読み取り → 再生まで。COEP `credentialless` の下でも動いた）、Android の Chrome。エンジンに JSPI が必要で、ないブラウザでは案内を出す（`supported` は `WebAssembly.Suspending` の有無で判定）。JSPI は Firefox 153・Mac／iPad の Safari 27 にも入ったが、これらでは未確認。動作を確かめたら README・記事（`guide`・`faq`）・アプリの文言（`err.unsupported`、JSON-LD の `browserRequirements`）を一緒に直す。

## ルール
- 手で編集するのは `public/sheetmusicplayer/index.html`・`omr-worker.mjs`・`score-model.mjs`・`editor.mjs`・`sw.js`、`engine/python/`、`scripts/`。
  生成ファイルは編集しない:
  - `public/sheetmusicplayer/ja/index.html`、記事と情報ページ（`guide/` など・`about/`・`privacy/` とその `ja/`）、`sitemap.xml` → `node scripts/build-ja.mjs`・`node scripts/build-pages.mjs`（`--check` で確認）
  - `public/sheetmusicplayer/guide/img/`、`scripts/pages/data/photo-results.json` → `node scripts/render-guide-images.mjs`（`npx wrangler dev` を起動してから。10〜20 分）
  - `public/sheetmusicplayer/engine/<version>/`、`vendor/`、`THIRD_PARTY_LICENSES.md` → `python3 scripts/build-engine.py`（`--check` で確認）
- 画面の文言は `index.html` の `I18N`（en / ja）に書き、要素には `data-i18n` / `data-i18n-html` / `data-i18n-attr` を付ける。JS で作る文言は `t()` を使う。子要素を持つ要素に `data-i18n` は付けない（`build-ja.mjs` が止まる）。
- **読み取りエンジン（engine/<version>/）の中身を変えたら、必ずバージョンを上げる**（`build-engine.py` の `VERSION`、`omr-worker.mjs` の `ENGINE_VERSION`、`index.html` の `engine/<version>/` と `caches.has("sheetmusicplayer-engine-<version>")`）。エンジンはキャッシュ優先なので、同じバージョンのまま中身を変えると利用者のブラウザは古いファイルを使い続ける。古いバージョンのフォルダは消す。
- homr の Python ファイルは変更しない。ブラウザ用の差し替えは `engine/python/smp_omr.py`（入口・進捗・タイトル OCR の無効化）と `engine/python/onnxruntime/`（onnxruntime-web への橋渡し）で行う。homr を更新したら、テスト用の楽譜（スキャン・写真、単旋律・大譜表）で結果を確かめる。int8 量子化は homr 0.7.0 でだけ確認済み。
- iPhone・iPad では CPython（Pyodide）が WebKit の不具合よけに wasm-gc のトランポリンを使わず JavaScript のトランポリンに切り替え、JSPI が止まれなくなる（「JavaScript frames found between WebAssembly.Suspending and WebAssembly.promising」、2 回目以降は Pyodide が壊れて「undefined is not an object (evaluating 'l[0]')」）。`omr-worker.mjs` の `withoutAppleMobileCheck` で、`loadPyodide` の間だけ iOS の判定を外している。Pyodide を更新したら、`pyodide.asm.mjs` の `getPyEMTrampolinePtr` の判定が変わっていないか確かめる（Playwright の Chromium で iPhone の userAgent にすると再現・確認できる）。
- メモリ（iPhone で「メモリが足りなくなりました」が出やすい）: WebAssembly のヒープは一度増えると縮まないので、ピークを抑える。`omr-worker.mjs` で、homr がページごとに作る分割モデルのセッションを使い回し（作り直すと 1 回読むごとに増える）、onnxruntime のメモリアリーナ・メモリパターンを切り、分割モデルに 8 枚ずつ渡されるタイルを `SEGNET_BATCH`（2）枚ずつに分けて流し、ページを読むたびに Python の `gc.collect()` を呼ぶ。ページの画素は読む直前にキャンバスから取り出し、読んだらキャンバスを捨てる。メモリ不足のエラーのときは新しいワーカーで 1 回だけ読み直す。ファイルを 1 つ読み終えたら（成功・失敗とも）ワーカーを止める（`index.html` の `stopWorker`。止めないと 1 枚読んだあとも約 1.4GB を持ったままになり、次のファイルがその上に積まれて iPhone でメモリ不足になった）。測り方: ワーカーの `WebAssembly.Memory` の大きさを Playwright で見る（Chromium、この写真 1 枚で Pyodide 約 330MB・onnxruntime 約 200MB）。int8 のモデルは活性の量子化の幅をバッチ全体で決めるので、`SEGNET_BATCH` を変えると読み取り結果が少し変わる（変えたら `render-guide-images.mjs --only photos` で測り直す）。
- Cloudflare Workers の静的アセットは 1 ファイル 25MiB まで。大きいモデルは `build-engine.py` で分割する（`--check` が超過を検出する）。
- PDF.js は 5.4 系に固定（5.5 以降は現行ブラウザにない `Map.prototype.getOrInsertComputed` を使う）。
- `public/_headers` の COOP/COEP（cross-origin isolation）は onnxruntime-web を複数スレッドで動かすためのもの。ただし今は `omr-worker.mjs` で 1 スレッドに固定している（複数スレッドだと Pyodide の JSPI 経由の呼び出しで最初のモデル実行が終わらない。検証環境は 2 コアで `hardwareConcurrency - 1` = 1 になり再現しなかったので、スレッド数を変えるときは明示的に 4〜8 を指定して試す）。外部のスクリプトを足すときは CSP に加えて CORS／CORP も確かめる。Tesseract.js のワーカーだけ `unsafe-eval` を許可している（同じファイル内のコメント参照）。
- 編集機能: `score-model.mjs` が MusicXML ⇄ 音符のリスト（24 tick/4分音符、小節は拍子から決める）を変換し、`editor.mjs` がピアノロールを描く。「楽譜」に戻るか保存するときに `buildXml` で MusicXML を作り直す（ヘッダー・パート・各小節の繰り返し記号と改行は元の XML から引き継ぎ、歌詞・スラー等は消える）。`score-model.mjs` を変えたら `npm test`（`tests/score-model.test.mjs`。「読み込み → 書き出し → 読み込み」で音符が一致するか等）を通し、OSMD で描けることも確かめる。直した不具合や新しい機能にはテストを足す。
- homr は複数小節休符をふつうの 1 小節として読むことがある。`expandMultiRests` は `<multiple-rest>` が付いたときだけ小節を増やす。それ以外は編集画面の「小節を追加」で直してもらう。
- homr の認識モデルにはタイの記号がなく、タイはスラーとして出力される。読み取り結果は `slursToTies`（`score-model.mjs`）で「同じ譜表で隣り合う同じ高さの 2 音を結ぶスラー」をタイに直してから表示・再生する（直さないとタイの先の音符も鳴る）。MusicXML ファイルを開いたときは変換しない。
- homr はふつうの音符を 3 連符の音符（`<time-modification>` 3:2）として読むことがある（16分音符が 3 連の 16分音符になり、短く鳴る）。homr は 3 連符がそろったときだけ括弧（`<tuplet>`）を付けるので、読み取り結果は `fixStrayTuplets`（`score-model.mjs`）で「足りない小節の、括弧のない連符の音符」を元の長さに戻す。戻して小節がちょうど埋まるときだけ直す。MusicXML ファイルには使わない。
- homr は大譜表で、もう一方の譜表に戻るときの `<backup>` を書き落とすことがある（低音部の 4分音符の途中から始まる高音部の 8分音符が、その 4分音符のあとに回され、小節線を越えて遅れて鳴る）。1 小節で何か所も落とすことがある。読み取り結果は `fixVoiceOverflow`（`score-model.mjs`）で、声部が小節線を越える小節だけ、「音の長さの合計が小節の長さとちょうど同じ声部」の音符を書かれた順に頭から並べ直し、その小節を時刻順に書き直す（合計が合わない声部は読み違いなのでそのまま）。MusicXML ファイルには使わない。
- `ja/index.html` には `<base href="/sheetmusicplayer/">` がある。JS で URL を組み立てるときは `location.href` ではなく `document.baseURI` を基準にする（`location.href` だと `/ja/` の下を指して 404 になる）。
- Service Worker がエンジンのキャッシュからワーカーのスクリプト（Tesseract.js）を返すときは COEP ヘッダーを付ける（`sw.js` の `withWorkerHeaders`）。付けないと cross-origin isolation のページではワーカーが起動せず、テンポを読めない。
- 最後の楽譜は `localStorage` の `sheetmusicplayer-state` に保存する。読み込んだ値は検証してから使う。新しいファイルを開いたらテンポは楽譜の値に戻す。
- 外部ホストを足したら `public/_headers` の CSP と、プライバシーの説明（`scripts/pages/privacy.mjs`、アプリ内の `privacy.body`、README）を同じ PR で直す。
- トップページ（https://ktkwmr.com/）のアプリ一覧に、このアプリの名前・説明・特徴を載せる（`ktkwmr/ktkwmr.com` の `scripts/pages/home.mjs` の `APPS`。アイコンは `ICON`。`public/robots.txt` の `Sitemap:` 行も）。ガイド記事を追加・改名・削除したとき、アプリ名・説明・アイコンを変えたときは、`ktkwmr/ktkwmr.com` に `home.mjs` を直す PR を別に出す（ベースライン §2-16）。
- アプリの下のフッター（`index.html` の `foot.guides`、英日）に記事の一覧を手で書いている（このアプリはアプリの下の説明に記事の一覧がないため。ベースライン §9-14）。記事を追加・改名・削除したら、ここも直す。
- 記事（ガイド）は 7 本（`scripts/pages/` の `guide`・`faq`・`photo-tips`・`fix-errors`・`tempo-markings`・`musicxml`・`what-is-omr`、一覧は README）。記事の追加・変更は PR のプレビューで人間が内容を確認してからマージする（ベースライン §10-7、`docs/article-review.md`）。
  - 記事の説明（ボタン名・手順・既定値）はアプリと合わせる。速度記号の表・既定のテンポ・PDF のページ上限は `scripts/pages/parts.mjs` が `index.html` から読む。画面・文言・操作を変えたら、該当する記事と画面写真（`render-guide-images.mjs`）も直す。
  - `photo-tips` の表は実測値（`photo-results.json`）から作る。測り直して結果が本文と合わなくなると `build-pages.mjs` が止まるので、本文を直す。
  - 見本の楽譜は「歓喜の歌」（パブリックドメイン、`render-guide-images.mjs` で生成）。著作権のある曲・楽譜の画像は使わない。
- 作業はブランチ → PR → Cloudflare のプレビュービルド確認 → squash マージ。
- 本番サイト・Cloudflare 管理画面・外部 CDN にはこの環境から届かないことが多い。確かめられなかったことは「未確認」と書き、ユーザーに確認手順を伝える。
- 動作確認は `npx wrangler dev`（`_headers` が効く）＋ Playwright の Chromium で、テスト用の楽譜画像の読み取り → 表示 → 再生 → カーソルの移動と、MusicXML（.musicxml・.mxl）の読み込みまで通す。テスト用のブラウザプロファイルは使い回さない（Tesseract.js や Cache Storage に古いデータが残ると結果が変わる）。
