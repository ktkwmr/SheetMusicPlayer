// How to use the app, step by step, with screenshots (scripts/render-guide-images.mjs).
import { shot, link, DEFAULT_BPM, MAX_FILES, BPM_RANGE } from "./parts.mjs";

export default {
  slug: "guide",
  published: "2026-10-24",
  en: {
    title: "How to Play Sheet Music from a Photo or PDF (Guide)",
    heading: "How to play sheet music from a photo or PDF",
    nav: "How to use Sheet Music Player",
    description: "Step-by-step guide to Sheet Music Player: open a photo, image, or PDF of sheet music, let the app read the notes in your browser, play it with a moving cursor, practise with a loop, metronome, and transposition, fix mistakes, and save MusicXML, MIDI, or MP3.",
    body: () => `
<p class="lead">Sheet Music Player reads printed sheet music from a photo, an image, or a PDF and plays it back, with a cursor that moves along the staff. Use it to hear how a piece goes before you practise it, to check the notes you are reading, or to play along at a slower tempo. This guide walks through each step with screenshots.</p>

<nav class="toc" aria-label="Contents"><b>Contents</b><ol>
  <li><a href="#need">What you need</a></li>
  <li><a href="#open">Open a score</a></li>
  <li><a href="#read">Wait for the reading</a></li>
  <li><a href="#play">Play and follow the cursor</a></li>
  <li><a href="#tempo">Change the tempo</a></li>
  <li><a href="#practice">Practise: loop, metronome, parts, transpose</a></li>
  <li><a href="#edit">Fix mistakes</a></li>
  <li><a href="#save">Save and share</a></li>
  <li><a href="#recent">Recent scores</a></li>
  <li><a href="#trouble">When it does not work</a></li>
</ol></nav>

<h2 id="need">What you need</h2>
<ul>
  <li><b>A computer with Chrome or Edge (version 137 or later), an Android phone with Chrome (137 or later), or an iPhone with Safari (iOS 27.2 or later).</b> The reading engine needs a browser feature called JavaScript Promise Integration (JSPI); browsers without it show a message instead. Newer Firefox (153+) and Safari on a Mac or iPad (27+) also have it, but the app is tested only on Chrome and Edge on a computer, Safari on iPhone, and Chrome on Android.</li>
  <li><b>About 2 GB of free memory</b> while a page is being read. Close other heavy tabs if the computer is short of memory.</li>
  <li><b>An internet connection the first time.</b> The app downloads its reading engine once (about 130 MB) and keeps it in the browser. After that it starts right away and also works offline.</li>
  <li><b>Printed sheet music</b> in standard notation. Handwritten music and tablature are not supported.</li>
</ul>
<p>The app is free and needs no account. The notes are read inside your browser, so your sheet music is never uploaded.</p>

<h2 id="open">1. Open a score</h2>
${shot("en", "app-start", "The app before a score is opened: the Open a score panel with Choose a file and Take a photo, and an empty score area", "The start screen. Open a score from the panel on the left.")}
<p>There are three ways to open sheet music:</p>
<ul>
  <li><b>Choose a file</b>: images (JPEG, PNG, WebP, …) or PDFs.</li>
  <li><b>Take a photo</b>: uses the computer's webcam. Hold the page flat and fill the frame with it.</li>
  <li><b>Drop a file</b> on the panel.</li>
</ul>
<p>The files are added to a list (up to ${MAX_FILES}), numbered in the order you chose them. Tap a picture to see it larger, drag the handle to change the order, then press <b>Read the score</b>: the files are read in that order and joined into one score. A photo of an open book with two pages side by side is split and read as two pages, left page first. Reading several pages takes about a minute per page and may fail when the browser runs out of memory (more likely on a phone); then read fewer pages at a time. A MusicXML file (<code>.musicxml</code>, <code>.mxl</code>, <code>.xml</code>), for example one saved from this app or from MuseScore, opens immediately without reading.</p>
${shot("en", "app-list", "The list of files to read: two photos numbered 1 and 2, each with a delete button and a handle, a note that reading several pages may fail, and the Read the score button", "The files to read, in order. Drag the handle (≡) to change the order.")}
<p>How you take the photo makes a difference. See ${link("en", "photo-tips", "how to photograph sheet music for better results")}.</p>

<h2 id="read">2. Wait for the reading</h2>
${shot("en", "app-reading", "The app while reading: the file card shows the photo, and a progress bar says Reading the staves (0 / 3), 50%", "While the app reads, the left panel shows each step and a progress bar.")}
<p>The app first looks for the tempo marking at the top of the page, then finds the staves and notes, and finally reads the staves one by one. This takes roughly 10 to 60 seconds per page, depending on the device and the number of staves. The first time, the download of the engine comes before this. You can cancel at any time.</p>

<h2 id="play">3. Play and follow the cursor</h2>
${shot("en", "app-playing", "The score read from the photo, playing: a blue cursor is on the second measure", "The score the app read from the photo, playing. The blue cursor follows the music.")}
<p>When the reading is done, the score is drawn again from the notes the app read. Press the play button (▶) to start; a blue cursor moves along the staff with the sound. While it plays, the same button shows ❚❚: press it to pause, and press ▶ again to carry on from there. The stop button (■) stops and goes back to the beginning.</p>
<ul>
  <li>Click a note to move the cursor there. Play then starts from that note.</li>
  <li>Keyboard: <kbd>Space</kbd> play / pause, <kbd>Home</kbd> stop (back to the beginning), <kbd>↑</kbd> <kbd>↓</kbd> tempo ±1 (with <kbd>Shift</kbd>, ±5).</li>
</ul>
<p>Compare what you hear with the printed page. The reading can contain mistakes, and listening is the quickest way to find them.</p>

<h2 id="tempo">4. Change the tempo</h2>
<p>The tempo starts at the metronome mark found on the page (for example ♩ = 108). If there is only a word such as <i lang="it">Andante</i>, the usual tempo for that word is used, and if there is nothing, ♩ = ${DEFAULT_BPM}. Change it with <b>−5</b> / <b>+5</b>, by typing a number, or with the slider (${BPM_RANGE[0]}–${BPM_RANGE[1]}), even while it plays.</p>
<p>The number means quarter notes per minute, and the whole piece plays at one tempo. For a dotted-quarter beat in 6/8, or for tempo changes in the middle of a piece, see ${link("en", "tempo-markings", "tempo markings and BPM")}.</p>

<h2 id="practice">5. Practise: loop, metronome, parts, transpose</h2>
${shot("en", "app-practice", "Practice mode: Loop: m. 1–4 and Metronome are on, measures 1 to 4 are shaded blue, and the cursor is in measure 2", "Practice mode, playing measures 1–4 over and over with the metronome.")}
<p>Press <b>Practice mode</b> to show the practice tools under the player:</p>
<ul>
  <li><b>Loop</b>: press it, then tap the first and the last measure on the score. Those measures are shaded and play over and over. Press <b>Loop</b> again to stop looping. While a loop is set, the stop button goes back to the start of the loop.</li>
  <li><b>Metronome</b>: a click on every beat, higher on the first beat of each measure. In 6/8, 9/8, and 12/8 it clicks on each dotted quarter.</li>
  <li><b>Count-in</b>: one measure of clicks before the music starts, so you can come in on time.</li>
  <li><b>Parts</b> (for scores with more than one staff, such as piano or choir): tap a part to change it from normal to <b>louder</b> (the other parts are played softly) to <b>muted</b>, and back. Use it to hear your own part clearly, or to play or sing it yourself while the app plays the others.</li>
  <li><b>Transpose</b>: − and + move the music down or up a semitone at a time, up to an octave either way. The key signature changes with it, and the notes are spelled to suit the new key. The editor shows and plays the notes transposed too; set it back to ±0 to compare them with the paper.</li>
</ul>

<h2 id="edit">6. Fix mistakes</h2>
${shot("en", "app-edit", "The editor: a piano roll with the notes of the upper staff as black boxes and measure 4 highlighted with an exclamation mark", "The editor. Measures whose beats did not add up are marked with “!” (here, measure 4 is missing a note).")}
<p>Switch to <b>Edit</b> to see the notes as boxes on a piano roll: up and down is the pitch, left to right is time. Drag a box to move it, drag its right edge to change its length, click an empty spot to add a note, and right-click (or press <kbd>Delete</kbd>) to remove one. Click a measure number to add or delete measures. Measures marked <b>!</b> had too many or too few beats when they were read, so start with those.</p>
<p>Switch back to <b>Score</b> to redraw the staff with your changes. For the common mistakes and how to fix each one, see ${link("en", "fix-errors", "how to fix reading mistakes")}.</p>

<h2 id="save">7. Save and share</h2>
${shot("en", "app-export", "The Save / share menu: Share…, MusicXML (score), MIDI, MP3 (audio)", "The Save / share menu.")}
<p><b>Save / share</b> has four choices. The files are named after the title of the score.</p>
<ul>
  <li><b>MusicXML (score)</b>: the notes as a <code>.musicxml</code> file, transposed if you transposed them. Open it again in this app, or in MuseScore and most other notation programs to print it or edit it further. See ${link("en", "musicxml", "what MusicXML is and how to use it")}.</li>
  <li><b>MIDI</b>: a <code>.mid</code> file with one track per staff, at the current tempo, for music software and digital pianos.</li>
  <li><b>MP3 (audio)</b>: a recording of what you hear: the current tempo, the louder and muted parts, and the transposition (without the metronome). It is made on your device and takes a few seconds; a practice track for each part of a choir, for example, is one MP3 per part.</li>
  <li><b>Share…</b>: sends the app's link and the MusicXML file through your device's share menu (messages, mail, …), so others can open the score in this app. If the browser cannot attach the file, the file is saved and only the link is shared (or copied); attach the file yourself.</li>
</ul>
<p>The last item, <b>Print with note names (Note Namer)</b>, opens <a href="https://ktkwmr.com/notenamer/">Note Namer</a>, another free app on this site that writes the name of every note (C D E, Do Re Mi, …) under it, ready to print. Open the same photo or the saved MusicXML file there.</p>

<h2 id="recent">8. Recent scores</h2>
<p>The title of the score is shown above it: the title written in a MusicXML file, or the date and time it was read. Click the title to rename it. The last 10 scores you opened are kept in the browser, with their tempo and transposition, and are listed under <b>Recent scores</b> in the left panel; tap one to open it again. <b>Clear history</b> removes them (the open score stays), and <b>Clear</b> removes the open score from the screen and from the browser.</p>

<h2 id="trouble">When it does not work</h2>
<div class="table-wrap">
<table class="text stack">
<thead><tr><th scope="col">Message or problem</th><th scope="col">What to try</th></tr></thead>
<tbody>
<tr><th scope="row">“This browser cannot run the reading engine”</th><td>Use the latest Chrome or Edge on a computer or the latest Chrome on Android, or update your iPhone to iOS 27.2 or later and use Safari.</td></tr>
<tr><th scope="row">“No staves or notes were found”</th><td>Use a sharper photo or a scan, with the whole page in the frame and the page filling most of it.</td></tr>
<tr><th scope="row">“The browser ran out of memory”</th><td>Close other tabs, or read fewer pages at a time.</td></tr>
<tr><th scope="row">“The reading engine could not be downloaded”</th><td>Check the connection and try again. This is needed only the first time.</td></tr>
<tr><th scope="row">The notes or the tempo are wrong</th><td>Fix them in Edit, or set the tempo by hand. A better photo often helps more.</td></tr>
<tr><th scope="row">“Share…” does not attach the file</th><td>Some browsers can share only the link. The MusicXML file is saved to your downloads; attach it to the message yourself.</td></tr>
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
    description: "Sheet Music Player の使い方を画面つきで解説。楽譜の写真・画像・PDFを開いてブラウザ内で読み取り、カーソル付きで再生、テンポの変更、ループ・メトロノーム・移調での練習、読み取りミスの修正、MusicXML・MIDI・MP3 での保存まで。",
    body: () => `
<p class="lead">Sheet Music Player は、印刷された楽譜の写真・画像・PDF を読み取って、五線譜の上をカーソルが進みながら再生するアプリです。練習の前に曲の感じをつかむ、譜読みした音が合っているか確かめる、ゆっくりのテンポで合わせて弾く、といった使い方ができます。このガイドでは、画面を見ながら順に使い方を説明します。</p>

<nav class="toc" aria-label="目次"><b>目次</b><ol>
  <li><a href="#need">必要なもの</a></li>
  <li><a href="#open">楽譜を開く</a></li>
  <li><a href="#read">読み取りを待つ</a></li>
  <li><a href="#play">再生してカーソルを追う</a></li>
  <li><a href="#tempo">テンポを変える</a></li>
  <li><a href="#practice">練習する（ループ・メトロノーム・パート・移調）</a></li>
  <li><a href="#edit">間違いを直す</a></li>
  <li><a href="#save">保存・共有する</a></li>
  <li><a href="#recent">最近の楽譜</a></li>
  <li><a href="#trouble">うまくいかないとき</a></li>
</ol></nav>

<h2 id="need">必要なもの</h2>
<ul>
  <li><b>PC の Chrome か Edge（バージョン 137 以降）、Android の Chrome（137 以降）、または iPhone の Safari（iOS 27.2 以降）。</b>読み取りエンジンには JavaScript Promise Integration（JSPI）というブラウザの機能が必要で、この機能がないブラウザでは案内を表示します。新しい Firefox（153 以降）・Mac や iPad の Safari（27 以降）にもこの機能はありますが、動作を確認しているのは PC の Chrome・Edge、iPhone の Safari、Android の Chrome だけです。</li>
  <li><b>読み取り中に 2GB ほどの空きメモリ。</b>メモリが少ないときは、ほかの重いタブを閉じてください。</li>
  <li><b>初回だけインターネット接続。</b>読み取りエンジン（約 130MB）を 1 回だけダウンロードしてブラウザに保存します。次からはすぐに始まり、オフラインでも使えます。</li>
  <li><b>印刷された五線譜。</b>手書きの楽譜とタブ譜には対応していません。</li>
</ul>
<p>無料で、登録も要りません。読み取りはブラウザの中で行うので、楽譜がアップロードされることはありません。</p>

<h2 id="open">1. 楽譜を開く</h2>
${shot("ja", "app-start", "楽譜を開く前の画面。左に「ファイルを選ぶ」「写真を撮る」のある「楽譜を開く」パネル、右に空の楽譜の欄", "最初の画面。左の「楽譜を開く」から楽譜を開きます。")}
<p>楽譜の開き方は 3 つあります。</p>
<ul>
  <li><b>ファイルを選ぶ</b>：画像（JPEG・PNG・WebP など）や PDF。</li>
  <li><b>写真を撮る</b>：PC の Web カメラで撮ります。楽譜を平らにして、枠いっぱいに入れてください。</li>
  <li>パネルにファイルを<b>ドロップ</b>する。</li>
</ul>
<p>選んだファイルは一覧に（${MAX_FILES} 個まで）、選んだ順に番号が付いて並びます。画像をタップすると大きく表示し、ハンドルをドラッグすると順番を変えられます。「<b>楽譜を読み取る</b>」を押すと、並んだ順に読み取って 1 つの楽譜につなげます。本を開いて見開き 2 ページを 1 枚に撮った写真は、左右に分けて左のページから順に読み取ります。複数ページの読み取りには 1 ページにつき 1 分ほどかかり、メモリが足りなくなるとエラーになることがあります（特にスマートフォン）。そのときはページを減らして読み取ってください。MusicXML のファイル（<code>.musicxml</code>・<code>.mxl</code>・<code>.xml</code>。このアプリや MuseScore で保存したものなど）は、読み取りなしですぐに開きます。</p>
${shot("ja", "app-list", "読み取るファイルの一覧。1・2 の番号が付いた 2 枚の写真に、それぞれ削除ボタンとハンドルがあり、その下に複数ページの読み取りについての注意と「楽譜を読み取る」ボタンがある", "読み取るファイルが順番に並びます。ハンドル（≡）をドラッグすると順番を変えられます。")}
<p>写真の撮り方で結果が変わります。${link("ja", "photo-tips", "楽譜をきれいに読み取る撮り方のコツ")}もご覧ください。</p>

<h2 id="read">2. 読み取りを待つ</h2>
${shot("ja", "app-reading", "読み取り中の画面。開いた写真の名前の下に「段ごとに読み取り中 (0 / 3)」と 50% の進み具合が出ている", "読み取り中は、左のパネルに今の作業と進み具合が出ます。")}
<p>アプリはまず 1 ページ目の上からテンポの指定を探し、次に五線と音符の位置を見つけ、最後に段ごとに音符を読み取ります。端末の性能と段の数によって、1 ページ 10〜60 秒ほどかかります。初回は、その前にエンジンのダウンロードが入ります。途中で「キャンセル」もできます。</p>

<h2 id="play">3. 再生してカーソルを追う</h2>
${shot("ja", "app-playing", "写真から読み取った楽譜を再生している画面。青いカーソルが 2 小節目にある", "写真から読み取った楽譜を再生しているところ。青いカーソルが音に合わせて進みます。")}
<p>読み取りが終わると、読み取った音符から楽譜を描き直して表示します。再生ボタン（▶）を押すと、音に合わせて青いカーソルが五線の上を進みます。再生中は同じボタンが ❚❚ になり、押すと一時停止、もう一度 ▶ を押すとそこから続きを再生します。停止ボタン（■）を押すと、止めて最初に戻ります。</p>
<ul>
  <li>音符をクリックすると、カーソルがそこに移ります。そのまま再生するとその音符から始まります。</li>
  <li>キーボード：<kbd>Space</kbd> 再生／一時停止、<kbd>Home</kbd> 停止（最初に戻る）、<kbd>↑</kbd> <kbd>↓</kbd> テンポ ±1（<kbd>Shift</kbd> を押しながらで ±5）。</li>
</ul>
<p>聴きながら、元の楽譜と見比べてください。読み取り結果には間違いが含まれることがあり、聴くのがいちばん早く見つけられる方法です。</p>

<h2 id="tempo">4. テンポを変える</h2>
<p>テンポは、楽譜から見つけたメトロノーム記号（♩ = 108 など）で始まります。<i lang="it">Andante</i> のような速度記号しかないときはその言葉のふつうの速さ、何もなければ ♩ = ${DEFAULT_BPM} です。<b>−5</b>／<b>+5</b>、数字の入力、スライダー（${BPM_RANGE[0]}〜${BPM_RANGE[1]}）で、再生中でも変えられます。</p>
<p>数字は「4分音符が 1 分間にいくつ」で、曲全体を 1 つのテンポで再生します。6/8 拍子の付点4分音符の指定や、曲の途中のテンポの変化については、${link("ja", "tempo-markings", "速度記号と BPM の一覧")}をご覧ください。</p>

<h2 id="practice">5. 練習する（ループ・メトロノーム・パート・移調）</h2>
${shot("ja", "app-practice", "練習モードの画面。「ループ：1〜4小節」と「メトロノーム」がオンで、1〜4 小節が青く塗られ、カーソルは 2 小節目にある", "練習モードで、1〜4 小節をメトロノームつきでくり返し再生しているところ。")}
<p><b>練習モード</b>を押すと、再生ボタンの下に練習用の機能が出ます。</p>
<ul>
  <li><b>ループ</b>：押してから、楽譜の上でくり返したい最初の小節と最後の小節をタップします。その範囲が青く塗られ、くり返し再生されます。やめるときはもう一度<b>ループ</b>を押します。ループ中に停止ボタンを押すと、ループの最初に戻ります。</li>
  <li><b>メトロノーム</b>：拍ごとにクリック音を鳴らします。小節の 1 拍目は高い音です。6/8・9/8・12/8 拍子では付点4分音符ごとに鳴ります。</li>
  <li><b>カウントイン</b>：再生の前に 1 小節ぶんクリック音を鳴らすので、タイミングを合わせて入れます。</li>
  <li><b>パート</b>（ピアノや合唱など、段が 2 つ以上ある楽譜）：パートをタップするたびに、通常 → <b>強調</b>（ほかのパートを小さく）→ <b>消音</b> → 通常 と切り替わります。自分のパートをはっきり聴いたり、ほかのパートだけ鳴らして自分のパートを弾いたり歌ったりするのに使えます。</li>
  <li><b>移調</b>：−／+ で半音ずつ、上下 1 オクターブまで移調できます。調号も変わり、♯・♭ の付け方も新しい調に合わせます。編集画面も移調した高さで表示・再生します。紙の楽譜と見比べるときは ±0 に戻してください。</li>
</ul>

<h2 id="edit">6. 間違いを直す</h2>
${shot("ja", "app-edit", "編集画面。上段の音符が黒い四角でピアノロールに並び、4 小節目が「!」付きで色づけされている", "編集画面。拍の合計が合わなかった小節には「!」が付きます（この例では 4 小節目の音符が 1 つ抜けています）。")}
<p><b>編集</b>に切り替えると、音符がピアノロールの上の四角で表示されます。上下が音の高さ、左右が時間です。四角をドラッグで移動、右端をドラッグで長さを変更、空いている所をクリックで追加、右クリック（または <kbd>Delete</kbd>）で削除できます。小節番号をクリックすると、小節の追加・削除もできます。<b>!</b> の付いた小節は、読み取ったときに拍の数が多すぎたか少なすぎた小節なので、そこから確かめてください。</p>
<p><b>楽譜</b>に戻ると、直した内容で五線譜を描き直します。よくある間違いとそれぞれの直し方は、${link("ja", "fix-errors", "読み取りミスの見つけ方と直し方")}で説明しています。</p>

<h2 id="save">7. 保存・共有する</h2>
${shot("ja", "app-export", "「保存・共有」のメニュー。共有…、MusicXML（楽譜）、MIDI、MP3（音声）", "「保存・共有」のメニュー。")}
<p><b>保存・共有</b>には 4 つの項目があります。ファイル名は楽譜のタイトルになります。</p>
<ul>
  <li><b>MusicXML（楽譜）</b>：音符を <code>.musicxml</code> のファイルに保存します。移調しているときは移調した楽譜になります。このアプリでもう一度開けるほか、MuseScore などの楽譜ソフトで開いて、印刷やさらに細かい修正ができます。${link("ja", "musicxml", "MusicXML とは")}もご覧ください。</li>
  <li><b>MIDI</b>：段ごとに 1 トラックの <code>.mid</code> ファイルを、今のテンポで保存します。音楽ソフトや電子ピアノで使えます。</li>
  <li><b>MP3（音声）</b>：聞こえているとおりの音（今のテンポ、パートの強調・消音、移調。メトロノームは入りません）を録音したファイルです。端末の中で数秒かけて作ります。合唱のパートごとに練習用の音源を作る、といった使い方ができます。</li>
  <li><b>共有…</b>：アプリのリンクと MusicXML のファイルを、端末の共有メニュー（メッセージ・メールなど）で送ります。受け取った人はこのアプリで楽譜を開けます。ブラウザがファイルを添付できないときは、ファイルを保存してからリンクだけを共有（またはコピー）するので、ファイルは手で添付してください。</li>
</ul>
<p>いちばん下の<b>ドレミ付きで印刷（Note Namer）</b>は、このサイトの別のアプリ <a href="https://ktkwmr.com/notenamer/ja/">Note Namer</a> を開きます。すべての音符の下にドレミなどの音名を書いて印刷できる無料のアプリです。同じ写真か、保存した MusicXML をそちらで開いてください。</p>

<h2 id="recent">8. 最近の楽譜</h2>
<p>楽譜の上には、タイトルを表示します。MusicXML のファイルに書かれたタイトルか、なければ読み取った日時です。タイトルをクリックすると名前を変えられます。最近開いた 10 曲は、テンポや移調の設定と一緒にブラウザに保存され、左のパネルの<b>最近の楽譜</b>から開き直せます。<b>履歴を消去</b>で一覧を消し（開いている楽譜は残ります）、<b>クリア</b>で開いている楽譜を画面とブラウザから消します。</p>

<h2 id="trouble">うまくいかないとき</h2>
<div class="table-wrap">
<table class="text stack">
<thead><tr><th scope="col">メッセージ・症状</th><th scope="col">試すこと</th></tr></thead>
<tbody>
<tr><th scope="row">「このブラウザでは読み取りエンジンを動かせません」</th><td>PC か Android の最新の Chrome（PC は Edge も可）で開くか、iPhone を iOS 27.2 以降に更新して Safari で開いてください。</td></tr>
<tr><th scope="row">「五線や音符が見つかりませんでした」</th><td>ページ全体が入り、画面の大部分を楽譜が占める、はっきりした写真かスキャンでお試しください。</td></tr>
<tr><th scope="row">「ブラウザのメモリが足りなくなりました」</th><td>ほかのタブを閉じるか、一度に読むページを減らしてください。</td></tr>
<tr><th scope="row">「読み取りエンジンをダウンロードできませんでした」</th><td>接続を確かめて、もう一度お試しください。必要なのは初回だけです。</td></tr>
<tr><th scope="row">音符やテンポが違う</th><td>「編集」で直すか、テンポを手で設定してください。撮り直すほうが早いこともあります。</td></tr>
<tr><th scope="row">「共有…」でファイルが添付されない</th><td>リンクしか共有できないブラウザもあります。MusicXML のファイルはダウンロードフォルダに保存されるので、メッセージに手で添付してください。</td></tr>
</tbody>
</table>
</div>
<p>ほかの疑問は${link("ja", "faq", "よくある質問")}にまとめています。</p>
`,
  },
};
