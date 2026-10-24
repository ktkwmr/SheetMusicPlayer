// How to use the app, step by step, with screenshots (scripts/render-guide-images.mjs).
import { shot, link, DEFAULT_BPM, MAX_PDF_PAGES, BPM_RANGE } from "./parts.mjs";

export default {
  slug: "guide",
  published: "2026-10-24",
  en: {
    title: "How to Play Sheet Music from a Photo or PDF (Guide)",
    heading: "How to play sheet music from a photo or PDF",
    nav: "How to use Sheet Music Player",
    description: "Step-by-step guide to Sheet Music Player: open a photo, image, or PDF of sheet music, let the app read the notes in your browser, play it with a moving cursor, change the tempo, fix mistakes, and save MusicXML.",
    body: () => `
<p class="lead">Sheet Music Player reads printed sheet music from a photo, an image, or a PDF and plays it back, with a cursor that moves along the staff. Use it to hear how a piece goes before you practise it, to check the notes you are reading, or to play along at a slower tempo. This guide walks through each step with screenshots.</p>

<nav class="toc" aria-label="Contents"><b>Contents</b><ol>
  <li><a href="#need">What you need</a></li>
  <li><a href="#open">Open a score</a></li>
  <li><a href="#read">Wait for the reading</a></li>
  <li><a href="#play">Play and follow the cursor</a></li>
  <li><a href="#tempo">Change the tempo</a></li>
  <li><a href="#edit">Fix mistakes</a></li>
  <li><a href="#save">Save the result</a></li>
  <li><a href="#trouble">When it does not work</a></li>
</ol></nav>

<h2 id="need">What you need</h2>
<ul>
  <li><b>A computer with Chrome or Edge (version 137 or later).</b> The reading engine uses a browser feature (JavaScript Promise Integration) that Safari, Firefox, and phone browsers do not have yet. On those, the app shows a message instead.</li>
  <li><b>About 2 GB of free memory</b> while a page is being read. Close other heavy tabs if the computer is short of memory.</li>
  <li><b>An internet connection the first time.</b> The app downloads its reading engine once (about 130 MB) and keeps it in the browser. After that it starts right away and also works offline.</li>
  <li><b>Printed sheet music</b> in standard notation. Handwritten music and tablature are not supported.</li>
</ul>
<p>The app is free and needs no account. The notes are read inside your browser, so your sheet music is never uploaded.</p>

<h2 id="open">1. Open a score</h2>
${shot("en", "app-start", "The app before a score is opened: the Open a score panel with Choose a file and Take a photo, and an empty score area", "The start screen. Open a score from the panel on the left.")}
<p>There are three ways to open sheet music:</p>
<ul>
  <li><b>Choose a file</b>: an image (JPEG, PNG, WebP, …) or a PDF. Up to the first ${MAX_PDF_PAGES} pages of a PDF are read.</li>
  <li><b>Take a photo</b>: uses the computer's webcam. Hold the page flat and fill the frame with it.</li>
  <li><b>Drop a file</b> on the panel.</li>
</ul>
<p>A photo of an open book with two pages side by side is split and read as two pages, left page first. To read several photos as one piece, combine them into one PDF first. A MusicXML file (<code>.musicxml</code>, <code>.mxl</code>, <code>.xml</code>), for example one saved from this app or from MuseScore, opens immediately without reading.</p>
<p>How you take the photo makes a difference. See ${link("en", "photo-tips", "how to photograph sheet music for better results")}.</p>

<h2 id="read">2. Wait for the reading</h2>
${shot("en", "app-reading", "The app while reading: the file card shows the photo, and a progress bar says Reading the staves (0 / 3), 50%", "While the app reads, the left panel shows each step and a progress bar.")}
<p>The app first looks for the tempo marking at the top of the page, then finds the staves and notes, and finally reads the staves one by one. This takes roughly 10 to 60 seconds per page, depending on the computer and the number of staves. The first time, the download of the engine comes before this. You can cancel at any time.</p>

<h2 id="play">3. Play and follow the cursor</h2>
${shot("en", "app-playing", "The score read from the photo, playing: a blue cursor is on the second measure", "The score the app read from the photo, playing. The blue cursor follows the music.")}
<p>When the reading is done, the score is drawn again from the notes the app read. Press <b>Play</b> to start; a blue cursor moves along the staff with the sound. Press <b>Stop</b> to stop where you are, and the <b>back to the beginning</b> button (⏮) to go to the start.</p>
<ul>
  <li>Click a note to move the cursor there. Play then starts from that note, which is handy for repeating a difficult passage.</li>
  <li>Keyboard: <kbd>Space</kbd> play / stop, <kbd>Home</kbd> back to the beginning, <kbd>↑</kbd> <kbd>↓</kbd> tempo ±1 (with <kbd>Shift</kbd>, ±5).</li>
</ul>
<p>Compare what you hear with the printed page. The reading can contain mistakes, and listening is the quickest way to find them.</p>

<h2 id="tempo">4. Change the tempo</h2>
<p>The tempo starts at the metronome mark found on the page (for example ♩ = 108). If there is only a word such as <i lang="it">Andante</i>, the usual tempo for that word is used, and if there is nothing, ♩ = ${DEFAULT_BPM}. Change it with <b>−5</b> / <b>+5</b>, by typing a number, or with the slider (${BPM_RANGE[0]}–${BPM_RANGE[1]}), even while it plays.</p>
<p>The number means quarter notes per minute, and the whole piece plays at one tempo. For a dotted-quarter beat in 6/8, or for tempo changes in the middle of a piece, see ${link("en", "tempo-markings", "tempo markings and BPM")}.</p>

<h2 id="edit">5. Fix mistakes</h2>
${shot("en", "app-edit", "The editor: a piano roll with the notes of the upper staff as black boxes and measure 4 highlighted with an exclamation mark", "The editor. Measures whose beats did not add up are marked with “!” (here, measure 4 is missing a note).")}
<p>Switch to <b>Edit</b> to see the notes as boxes on a piano roll: up and down is the pitch, left to right is time. Drag a box to move it, drag its right edge to change its length, click an empty spot to add a note, and right-click (or press <kbd>Delete</kbd>) to remove one. Click a measure number to add or delete measures. Measures marked <b>!</b> had too many or too few beats when they were read, so start with those.</p>
<p>Switch back to <b>Score</b> to redraw the staff with your changes. For the common mistakes and how to fix each one, see ${link("en", "fix-errors", "how to fix reading mistakes")}.</p>

<h2 id="save">6. Save the result</h2>
<p>The <b>MusicXML</b> button saves the notes as a <code>.musicxml</code> file. You can open it again in this app, or in MuseScore and most other notation programs to print it, transpose it, or export audio. See ${link("en", "musicxml", "what MusicXML is and how to use it")}.</p>
<p>The last score and its tempo are also kept in the browser, so they are still there the next time you open the app. <b>Clear</b> removes the score from the screen and from the browser.</p>

<h2 id="trouble">When it does not work</h2>
<div class="table-wrap">
<table class="text stack">
<thead><tr><th scope="col">Message or problem</th><th scope="col">What to try</th></tr></thead>
<tbody>
<tr><th scope="row">“This browser cannot run the reading engine”</th><td>Use the latest Chrome or Edge on a computer.</td></tr>
<tr><th scope="row">“No staves or notes were found”</th><td>Use a sharper photo or a scan, with the whole page in the frame and the page filling most of it.</td></tr>
<tr><th scope="row">“The browser ran out of memory”</th><td>Close other tabs, or read fewer pages at a time.</td></tr>
<tr><th scope="row">“The reading engine could not be downloaded”</th><td>Check the connection and try again. This is needed only the first time.</td></tr>
<tr><th scope="row">The notes or the tempo are wrong</th><td>Fix them in Edit, or set the tempo by hand. A better photo often helps more.</td></tr>
</tbody>
</table>
</div>
<p>More answers are in the ${link("en", "faq", "FAQ")}.</p>
`,
  },
  ja: {
    title: "楽譜の写真やPDFを読み取って再生する方法（使い方ガイド）",
    heading: "楽譜の写真や PDF を読み取って再生する方法",
    nav: "使い方ガイド",
    description: "Sheet Music Player の使い方を画面つきで解説。楽譜の写真・画像・PDFを開いてブラウザ内で読み取り、カーソル付きで再生、テンポの変更、読み取りミスの修正、MusicXML での保存まで。",
    body: () => `
<p class="lead">Sheet Music Player は、印刷された楽譜の写真・画像・PDF を読み取って、五線譜の上をカーソルが進みながら再生するアプリです。練習の前に曲の感じをつかむ、譜読みした音が合っているか確かめる、ゆっくりのテンポで合わせて弾く、といった使い方ができます。このガイドでは、画面を見ながら順に使い方を説明します。</p>

<nav class="toc" aria-label="目次"><b>目次</b><ol>
  <li><a href="#need">必要なもの</a></li>
  <li><a href="#open">楽譜を開く</a></li>
  <li><a href="#read">読み取りを待つ</a></li>
  <li><a href="#play">再生してカーソルを追う</a></li>
  <li><a href="#tempo">テンポを変える</a></li>
  <li><a href="#edit">間違いを直す</a></li>
  <li><a href="#save">保存する</a></li>
  <li><a href="#trouble">うまくいかないとき</a></li>
</ol></nav>

<h2 id="need">必要なもの</h2>
<ul>
  <li><b>PC の Chrome か Edge（バージョン 137 以降）。</b>読み取りエンジンが使うブラウザの機能（JavaScript Promise Integration）が、Safari・Firefox・スマホのブラウザにはまだありません。これらのブラウザでは案内を表示します。</li>
  <li><b>読み取り中に 2GB ほどの空きメモリ。</b>メモリが少ないときは、ほかの重いタブを閉じてください。</li>
  <li><b>初回だけインターネット接続。</b>読み取りエンジン（約 130MB）を 1 回だけダウンロードしてブラウザに保存します。次からはすぐに始まり、オフラインでも使えます。</li>
  <li><b>印刷された五線譜。</b>手書きの楽譜とタブ譜には対応していません。</li>
</ul>
<p>無料で、登録も要りません。読み取りはブラウザの中で行うので、楽譜がアップロードされることはありません。</p>

<h2 id="open">1. 楽譜を開く</h2>
${shot("ja", "app-start", "楽譜を開く前の画面。左に「ファイルを選ぶ」「写真を撮る」のある「楽譜を開く」パネル、右に空の楽譜の欄", "最初の画面。左の「楽譜を開く」から楽譜を開きます。")}
<p>楽譜の開き方は 3 つあります。</p>
<ul>
  <li><b>ファイルを選ぶ</b>：画像（JPEG・PNG・WebP など）か PDF。PDF は最初の ${MAX_PDF_PAGES} ページまで読み取ります。</li>
  <li><b>写真を撮る</b>：PC の Web カメラで撮ります。楽譜を平らにして、枠いっぱいに入れてください。</li>
  <li>パネルにファイルを<b>ドロップ</b>する。</li>
</ul>
<p>本を開いて見開き 2 ページを 1 枚に撮った写真は、左右に分けて左のページから順に読み取ります。何枚かの写真を 1 曲として読ませたいときは、先に 1 つの PDF にまとめてください。MusicXML のファイル（<code>.musicxml</code>・<code>.mxl</code>・<code>.xml</code>。このアプリや MuseScore で保存したものなど）は、読み取りなしですぐに開きます。</p>
<p>写真の撮り方で結果が変わります。${link("ja", "photo-tips", "楽譜をきれいに読み取る撮り方のコツ")}もご覧ください。</p>

<h2 id="read">2. 読み取りを待つ</h2>
${shot("ja", "app-reading", "読み取り中の画面。開いた写真の名前の下に「段ごとに読み取り中 (0 / 3)」と 50% の進み具合が出ている", "読み取り中は、左のパネルに今の作業と進み具合が出ます。")}
<p>アプリはまず 1 ページ目の上からテンポの指定を探し、次に五線と音符の位置を見つけ、最後に段ごとに音符を読み取ります。PC の性能と段の数によって、1 ページ 10〜60 秒ほどかかります。初回は、その前にエンジンのダウンロードが入ります。途中で「キャンセル」もできます。</p>

<h2 id="play">3. 再生してカーソルを追う</h2>
${shot("ja", "app-playing", "写真から読み取った楽譜を再生している画面。青いカーソルが 2 小節目にある", "写真から読み取った楽譜を再生しているところ。青いカーソルが音に合わせて進みます。")}
<p>読み取りが終わると、読み取った音符から楽譜を描き直して表示します。<b>再生</b>を押すと、音に合わせて青いカーソルが五線の上を進みます。<b>停止</b>でその場で止まり、<b>最初に戻る</b>ボタン（⏮）で先頭に戻ります。</p>
<ul>
  <li>音符をクリックすると、カーソルがそこに移ります。そのまま「再生」を押すとその音符から始まるので、難しいところを繰り返し聴くのに便利です。</li>
  <li>キーボード：<kbd>Space</kbd> 再生／停止、<kbd>Home</kbd> 最初に戻る、<kbd>↑</kbd> <kbd>↓</kbd> テンポ ±1（<kbd>Shift</kbd> を押しながらで ±5）。</li>
</ul>
<p>聴きながら、元の楽譜と見比べてください。読み取り結果には間違いが含まれることがあり、聴くのがいちばん早く見つけられる方法です。</p>

<h2 id="tempo">4. テンポを変える</h2>
<p>テンポは、楽譜から見つけたメトロノーム記号（♩ = 108 など）で始まります。<i lang="it">Andante</i> のような速度記号しかないときはその言葉のふつうの速さ、何もなければ ♩ = ${DEFAULT_BPM} です。<b>−5</b>／<b>+5</b>、数字の入力、スライダー（${BPM_RANGE[0]}〜${BPM_RANGE[1]}）で、再生中でも変えられます。</p>
<p>数字は「4分音符が 1 分間にいくつ」で、曲全体を 1 つのテンポで再生します。6/8 拍子の付点4分音符の指定や、曲の途中のテンポの変化については、${link("ja", "tempo-markings", "速度記号と BPM の一覧")}をご覧ください。</p>

<h2 id="edit">5. 間違いを直す</h2>
${shot("ja", "app-edit", "編集画面。上段の音符が黒い四角でピアノロールに並び、4 小節目が「!」付きで色づけされている", "編集画面。拍の合計が合わなかった小節には「!」が付きます（この例では 4 小節目の音符が 1 つ抜けています）。")}
<p><b>編集</b>に切り替えると、音符がピアノロールの上の四角で表示されます。上下が音の高さ、左右が時間です。四角をドラッグで移動、右端をドラッグで長さを変更、空いている所をクリックで追加、右クリック（または <kbd>Delete</kbd>）で削除できます。小節番号をクリックすると、小節の追加・削除もできます。<b>!</b> の付いた小節は、読み取ったときに拍の数が多すぎたか少なすぎた小節なので、そこから確かめてください。</p>
<p><b>楽譜</b>に戻ると、直した内容で五線譜を描き直します。よくある間違いとそれぞれの直し方は、${link("ja", "fix-errors", "読み取りミスの見つけ方と直し方")}で説明しています。</p>

<h2 id="save">6. 保存する</h2>
<p><b>MusicXML</b> ボタンで、音符を <code>.musicxml</code> のファイルに保存できます。このアプリでもう一度開けるほか、MuseScore などの楽譜ソフトで開いて、印刷・移調・音声ファイルへの書き出しができます。${link("ja", "musicxml", "MusicXML とは")}もご覧ください。</p>
<p>最後に開いた楽譜とテンポはブラウザにも保存されるので、次にアプリを開いたときもそのまま残っています。<b>クリア</b>を押すと、画面とブラウザの両方から楽譜を消します。</p>

<h2 id="trouble">うまくいかないとき</h2>
<div class="table-wrap">
<table class="text stack">
<thead><tr><th scope="col">メッセージ・症状</th><th scope="col">試すこと</th></tr></thead>
<tbody>
<tr><th scope="row">「このブラウザでは読み取りエンジンを動かせません」</th><td>PC の最新の Chrome か Edge で開いてください。</td></tr>
<tr><th scope="row">「五線や音符が見つかりませんでした」</th><td>ページ全体が入り、画面の大部分を楽譜が占める、はっきりした写真かスキャンでお試しください。</td></tr>
<tr><th scope="row">「ブラウザのメモリが足りなくなりました」</th><td>ほかのタブを閉じるか、一度に読むページを減らしてください。</td></tr>
<tr><th scope="row">「読み取りエンジンをダウンロードできませんでした」</th><td>接続を確かめて、もう一度お試しください。必要なのは初回だけです。</td></tr>
<tr><th scope="row">音符やテンポが違う</th><td>「編集」で直すか、テンポを手で設定してください。撮り直すほうが早いこともあります。</td></tr>
</tbody>
</table>
</div>
<p>ほかの疑問は${link("ja", "faq", "よくある質問")}にまとめています。</p>
`,
  },
};
