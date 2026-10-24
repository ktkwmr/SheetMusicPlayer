// Finding and fixing reading mistakes in the editor.
import { shot, link } from "./parts.mjs";

export default {
  slug: "fix-errors",
  published: "2026-10-24",
  en: {
    title: "How to Find and Fix Sheet Music Reading (OMR) Mistakes",
    heading: "How to find and fix reading mistakes",
    nav: "Fixing reading mistakes",
    description: "Optical music recognition is never perfect. How to find wrong notes quickly by listening, what the “!” measures mean, and how to fix wrong pitches, rhythms, missing notes, and multi-measure rests in the piano-roll editor.",
    body: () => `
<p class="lead">Reading sheet music automatically (optical music recognition) is never perfect: a sharp can be missed, a dotted note can lose its dot, or a note can end up one step too high. This page shows how to find those mistakes quickly and fix them in the app's editor.</p>

<nav class="toc" aria-label="Contents"><b>Contents</b><ol>
  <li><a href="#find">Find mistakes by listening</a></li>
  <li><a href="#flag">Start with the measures marked “!”</a></li>
  <li><a href="#editor">How the editor works</a></li>
  <li><a href="#common">Common mistakes and how to fix them</a></li>
  <li><a href="#limits">What the editor cannot change</a></li>
  <li><a href="#save">Save your corrections</a></li>
</ol></nav>

<h2 id="find">Find mistakes by listening</h2>
<p>Play the score while following the printed page. A wrong pitch or rhythm is much easier to hear than to see.</p>
<ul>
  <li><b>Slow down.</b> Lower the tempo (−5 or the slider) so that you can follow every note.</li>
  <li><b>Click a note</b> to move the cursor there, then press Play to listen from that point. Use it to repeat a suspicious passage.</li>
  <li><b>Compare measure by measure.</b> The measure numbers on the score help you find the same place on the page.</li>
</ul>
<p>If almost everything is wrong, fixing note by note takes longer than taking a better photo. See ${link("en", "photo-tips", "how to photograph sheet music")}.</p>

<h2 id="flag">Start with the measures marked “!”</h2>
${shot("en", "app-edit", "The editor with measure 4 highlighted and marked with an exclamation mark because one note is missing", "Measure 4 is marked “!”: one note is missing, so the measure is a quarter note short.")}
<p>Every measure must add up to the time signature: four quarter notes in 4/4, three in 3/4, and so on. When a measure the app read has too many or too few beats, it is highlighted and marked <b>!</b> in the editor. This almost always means a note was missed, added, or given the wrong length. Measures that add up can still have a wrong pitch, so listen to those too.</p>

<h2 id="editor">How the editor works</h2>
<p>Switch to <b>Edit</b>. Each note is a box on a piano roll: the keyboard on the left shows the pitch, and time runs from left to right. For a piano score, choose the <b>upper</b> or <b>lower</b> staff at the top.</p>
<div class="table-wrap">
<table class="text stack">
<thead><tr><th scope="col">To do this</th><th scope="col">Do this</th></tr></thead>
<tbody>
<tr><th scope="row">Change the pitch</th><td>Drag the note up or down, or select it and press <kbd>↑</kbd> <kbd>↓</kbd> (with <kbd>Shift</kbd>: one octave)</td></tr>
<tr><th scope="row">Move it in time</th><td>Drag it left or right, or press <kbd>←</kbd> <kbd>→</kbd></td></tr>
<tr><th scope="row">Change the length</th><td>Drag its right edge</td></tr>
<tr><th scope="row">Add a note</th><td>Click an empty spot</td></tr>
<tr><th scope="row">Delete a note</th><td>Right-click it, or select it and press <kbd>Delete</kbd></td></tr>
<tr><th scope="row">Select several</th><td>Drag across an empty area, then move or delete them together</td></tr>
<tr><th scope="row">Snap to</th><td>Grid: quarter, eighth, sixteenth notes, or eighth-note triplets</td></tr>
<tr><th scope="row">Add or delete measures</th><td>Click a measure number at the top, then “Add after” (with the number of measures) or “Delete”</td></tr>
<tr><th scope="row">Undo / redo</th><td>The arrow buttons, or <kbd>Ctrl</kbd>+<kbd>Z</kbd></td></tr>
</tbody>
</table>
</div>
<p>Switch back to <b>Score</b> to see the corrected staff and play it again.</p>

<h2 id="common">Common mistakes and how to fix them</h2>
<p>These are the kinds of mistakes music recognition programs often make, and the quickest fix for each.</p>
<div class="table-wrap">
<table class="text stack">
<thead><tr><th scope="col">Mistake</th><th scope="col">Typical cause</th><th scope="col">Fix</th></tr></thead>
<tbody>
<tr><th scope="row">A note one step too high or low</th><td>Notes on ledger lines far above or below the staff, or a note head between lines in a blurred photo</td><td>Drag it up or down to the right key</td></tr>
<tr><th scope="row">A missing sharp, flat, or natural</th><td>Small accidentals; an accidental also applies to the rest of the measure</td><td>Select the note and press <kbd>↑</kbd> or <kbd>↓</kbd> once (one semitone)</td></tr>
<tr><th scope="row">Every F (or every B, …) is wrong</th><td>The key signature was misread</td><td>Fix the notes, or correct the key signature in a notation program</td></tr>
<tr><th scope="row">Wrong length; the measure is marked “!”</th><td>A missed dot, flag, or beam, or a triplet read as plain eighths</td><td>Drag the right edge; use the triplet grid for triplets</td></tr>
<tr><th scope="row">A note is missing or extra</th><td>Notes in a dense chord, or a mark on the paper taken for a note</td><td>Click to add, right-click to delete</td></tr>
<tr><th scope="row">Too few measures after a long rest</th><td>A multi-measure rest (a thick bar with a number) read as a single measure</td><td>Click that measure's number and “Add after” the missing number of measures</td></tr>
<tr><th scope="row">One octave off</th><td>An 8va line, or a clef change that was missed</td><td>Select the notes and press <kbd>Shift</kbd>+<kbd>↑</kbd> or <kbd>↓</kbd></td></tr>
</tbody>
</table>
</div>

<h2 id="limits">What the editor cannot change</h2>
<p>The editor changes notes and measures. It does not change the key signature, the time signature, clefs, bar lines, repeat signs, or text. If those are wrong, save the score as MusicXML and fix them in a notation program such as MuseScore (see ${link("en", "musicxml", "what MusicXML is")}). Lyrics and chord symbols are not read in the first place.</p>

<h2 id="save">Save your corrections</h2>
<p>When you switch back to Score (or save), the corrections are kept in the browser along with the score. To keep a copy as a file, press <b>MusicXML</b>. When the notes are edited, the score is rebuilt from the notes, so slurs, articulations, and similar markings are not kept in the saved file.</p>
`,
  },
  ja: {
    title: "楽譜の読み取りミス（OMR）の見つけ方と直し方",
    heading: "読み取りミスの見つけ方と直し方",
    nav: "読み取りミスの直し方",
    description: "楽譜の自動読み取り（光学楽譜認識）に間違いはつきもの。聴いて素早く見つけるコツ、「!」の付いた小節の意味、音の高さ・長さの間違いや音符の抜け、複数小節休符を編集画面で直す方法を解説します。",
    body: () => `
<p class="lead">楽譜の自動読み取り（光学楽譜認識）は完璧ではありません。シャープを見落としたり、付点が消えたり、音が 1 つ高くなったりすることがあります。このページでは、そうした間違いを素早く見つけて、アプリの編集画面で直す方法を説明します。</p>

<nav class="toc" aria-label="目次"><b>目次</b><ol>
  <li><a href="#find">聴いて間違いを見つける</a></li>
  <li><a href="#flag">「!」の付いた小節から確かめる</a></li>
  <li><a href="#editor">編集画面の使い方</a></li>
  <li><a href="#common">よくある間違いと直し方</a></li>
  <li><a href="#limits">編集画面で直せないもの</a></li>
  <li><a href="#save">直した楽譜を保存する</a></li>
</ol></nav>

<h2 id="find">聴いて間違いを見つける</h2>
<p>元の楽譜を目で追いながら再生してください。音の高さやリズムの間違いは、見るより聴くほうがずっと見つけやすいものです。</p>
<ul>
  <li><b>テンポを落とす。</b>−5 やスライダーでテンポを下げると、1 音ずつ追えます。</li>
  <li><b>音符をクリックする。</b>カーソルがそこに移り、「再生」でそこから聴けます。怪しいところを繰り返し聴くのに使えます。</li>
  <li><b>小節ごとに見比べる。</b>楽譜に出る小節番号で、元の楽譜の同じ場所を探せます。</li>
</ul>
<p>ほとんど全部が違っているときは、1 音ずつ直すより撮り直すほうが早く済みます。${link("ja", "photo-tips", "楽譜の撮り方のコツ")}をご覧ください。</p>

<h2 id="flag">「!」の付いた小節から確かめる</h2>
${shot("ja", "app-edit", "4 小節目の音符が 1 つ抜けているため、4 小節目が色づけされ「!」が付いた編集画面", "4 小節目に「!」が付いています。音符が 1 つ抜けて、4分音符 1 つ分足りません。")}
<p>どの小節も、拍の合計は拍子と同じになるはずです（4/4 拍子なら 4分音符 4 つ分、3/4 拍子なら 3 つ分）。読み取った小節の拍が多すぎたり少なすぎたりすると、編集画面でその小節に色が付き、<b>!</b> が表示されます。たいていは、音符の見落とし・余分な音符・長さの読み違いのどれかです。拍が合っている小節にも音の高さの間違いはあり得るので、そちらも聴いて確かめてください。</p>

<h2 id="editor">編集画面の使い方</h2>
<p><b>編集</b>に切り替えると、音符がピアノロールの上の四角で表示されます。左の鍵盤が音の高さ、左から右が時間です。ピアノの楽譜では、上の「段」で<b>上段</b>・<b>下段</b>を切り替えます。</p>
<div class="table-wrap">
<table class="text stack">
<thead><tr><th scope="col">したいこと</th><th scope="col">操作</th></tr></thead>
<tbody>
<tr><th scope="row">音の高さを変える</th><td>音符を上下にドラッグ。または選んで <kbd>↑</kbd> <kbd>↓</kbd>（<kbd>Shift</kbd> を押しながらで 1 オクターブ）</td></tr>
<tr><th scope="row">タイミングをずらす</th><td>左右にドラッグ。または <kbd>←</kbd> <kbd>→</kbd></td></tr>
<tr><th scope="row">長さを変える</th><td>四角の右端をドラッグ</td></tr>
<tr><th scope="row">音符を追加する</th><td>空いている所をクリック</td></tr>
<tr><th scope="row">音符を削除する</th><td>右クリック。または選んで <kbd>Delete</kbd></td></tr>
<tr><th scope="row">まとめて選ぶ</th><td>空いている所をドラッグして囲み、まとめて移動・削除</td></tr>
<tr><th scope="row">マス目</th><td>4分音符・8分音符・16分音符・3連8分音符から選ぶ</td></tr>
<tr><th scope="row">小節を追加・削除する</th><td>上の小節番号をクリックし、数を入れて「後ろに追加」、または「削除」</td></tr>
<tr><th scope="row">元に戻す・やり直す</th><td>矢印のボタン。または <kbd>Ctrl</kbd>+<kbd>Z</kbd></td></tr>
</tbody>
</table>
</div>
<p><b>楽譜</b>に戻ると、直した五線譜が表示され、そのまま再生できます。</p>

<h2 id="common">よくある間違いと直し方</h2>
<p>楽譜の読み取りソフトで起こりやすい間違いと、いちばん早い直し方です。</p>
<div class="table-wrap">
<table class="text stack">
<thead><tr><th scope="col">間違い</th><th scope="col">よくある原因</th><th scope="col">直し方</th></tr></thead>
<tbody>
<tr><th scope="row">音が 1 つ高い・低い</th><td>五線から離れた加線の音符や、ぼけた写真で線と線の間にある符頭</td><td>上下にドラッグして正しい鍵盤へ</td></tr>
<tr><th scope="row">シャープ・フラット・ナチュラルが抜ける</th><td>臨時記号が小さい。臨時記号はその小節の終わりまで効く</td><td>音符を選んで <kbd>↑</kbd> か <kbd>↓</kbd> を 1 回（半音）</td></tr>
<tr><th scope="row">ファ（またはシなど）がすべて違う</th><td>調号の読み違い</td><td>音符を直すか、楽譜ソフトで調号を直す</td></tr>
<tr><th scope="row">長さが違い、小節に「!」が付く</th><td>付点・旗・連桁の見落とし、3連符をふつうの 8分音符と読んだ</td><td>右端をドラッグ。3連符はマス目を「3連8分音符」に</td></tr>
<tr><th scope="row">音符が足りない・多い</th><td>音の多い和音、紙の汚れを音符と読んだ</td><td>クリックで追加、右クリックで削除</td></tr>
<tr><th scope="row">長い休みの後で小節が足りない</th><td>複数小節休符（数字の付いた太い横線）を 1 小節として読んだ</td><td>その小節番号をクリックし、足りない数だけ「後ろに追加」</td></tr>
<tr><th scope="row">1 オクターブずれる</th><td>8va の線や、途中の音部記号の変更の見落とし</td><td>音符を選んで <kbd>Shift</kbd>+<kbd>↑</kbd> か <kbd>↓</kbd></td></tr>
</tbody>
</table>
</div>

<h2 id="limits">編集画面で直せないもの</h2>
<p>編集画面で直せるのは音符と小節です。調号・拍子記号・音部記号・小節線・繰り返し記号・文字は直せません。これらが違うときは、MusicXML で保存して MuseScore などの楽譜ソフトで直してください（${link("ja", "musicxml", "MusicXML とは")}）。歌詞とコードネームは、もともと読み取りません。</p>

<h2 id="save">直した楽譜を保存する</h2>
<p>「楽譜」に戻ったとき（または保存したとき）に、直した内容が楽譜と一緒にブラウザに保存されます。ファイルとして残すときは <b>MusicXML</b> を押してください。音符を編集すると、音符から楽譜を作り直すので、スラーやアーティキュレーションなどの記号は保存したファイルに残りません。</p>
`,
  },
};
