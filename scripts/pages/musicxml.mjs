// What MusicXML is, the file types, and how to move scores between this app and notation programs.
import { link, pre } from "./parts.mjs";

// One measure of the sample score (the first notes of Ode to Joy), simplified for reading
const SNIPPET = `
<measure number="1">
  <attributes>
    <divisions>24</divisions>
    <key><fifths>0</fifths></key>
    <time><beats>4</beats><beat-type>4</beat-type></time>
    <clef><sign>G</sign><line>2</line></clef>
  </attributes>
  <note>
    <pitch><step>E</step><octave>4</octave></pitch>
    <duration>24</duration>
    <type>quarter</type>
  </note>
  <!-- … three more quarter notes: E, F, G -->
</measure>
`;

export default {
  slug: "musicxml",
  published: "2026-10-24",
  en: {
    title: "What Is MusicXML? Opening .musicxml and .mxl Files in MuseScore",
    heading: "What is MusicXML? Opening and using .musicxml and .mxl files",
    nav: "What is MusicXML?",
    description: "MusicXML is the common file format for exchanging sheet music between notation programs. What is inside, how it differs from MIDI and PDF, .musicxml vs .mxl, and how to open a score from this app in MuseScore and back.",
    body: () => `
<p class="lead">MusicXML is a file format for sheet music. Almost every notation program can open and save it, so it is the usual way to move a score from one program to another. This app saves what it reads as MusicXML, and it can open MusicXML files too.</p>

<nav class="toc" aria-label="Contents"><b>Contents</b><ol>
  <li><a href="#what">What MusicXML contains</a></li>
  <li><a href="#compare">MusicXML, MIDI, and PDF</a></li>
  <li><a href="#files">.musicxml, .mxl, and .xml</a></li>
  <li><a href="#apps">Programs that open MusicXML</a></li>
  <li><a href="#from-app">From this app to MuseScore</a></li>
  <li><a href="#to-app">From MuseScore to this app</a></li>
</ol></nav>

<h2 id="what">What MusicXML contains</h2>
<p>A MusicXML file describes the score itself: parts and staves, clefs, key and time signatures, and every note with its pitch and length, plus rests, ties, slurs, articulations, dynamics, lyrics, and text. It is plain text in XML, so you can open it in a text editor. One measure looks like this:</p>
${pre(SNIPPET)}
<p>Each note says which pitch it is (<code>E</code> in octave <code>4</code>) and how long it lasts (<code>duration</code>, counted in <code>divisions</code> per quarter note). Because the file keeps the musical meaning, a program that opens it can lay out the score again, play it, transpose it, or change it.</p>
<p>MusicXML was designed by Michael Good at Recordare from 2000, and version 1.0 was released in 2004. MakeMusic took it over in 2011, and since 2015 it has been developed by the W3C Music Notation Community Group. The current version is 4.0 (2021).</p>

<h2 id="compare">MusicXML, MIDI, and PDF</h2>
<div class="table-wrap">
<table class="text stack">
<thead><tr><th scope="col">Format</th><th scope="col">What it keeps</th><th scope="col">Good for</th></tr></thead>
<tbody>
<tr><th scope="row">MusicXML</th><td>The notation: notes, rhythms, key, clefs, and markings, as written</td><td>Moving a score between notation programs; editing it later</td></tr>
<tr><th scope="row">MIDI</th><td>A performance: which key is pressed, when, how hard, for how long</td><td>Playing back on instruments and in music software; not for exact notation</td></tr>
<tr><th scope="row">PDF</th><td>A picture of the printed pages</td><td>Printing and reading; a program has to <em>recognize</em> the notes to use them (which is what this app does)</td></tr>
</tbody>
</table>
</div>
<p>A MIDI file does not know whether a note is a G sharp or an A flat, whether a length is a dotted quarter or a quarter tied to an eighth, how notes are beamed, or which staff and voice a note belongs to, and its lengths are close to how long the keys were held. Turning MIDI into sheet music therefore always needs guessing. MusicXML keeps those details.</p>

<h2 id="files">.musicxml, .mxl, and .xml</h2>
<ul>
  <li><b><code>.musicxml</code></b>: an uncompressed MusicXML file. This is what this app saves.</li>
  <li><b><code>.mxl</code></b>: compressed MusicXML (a zip file containing the score). Smaller; many programs save this by default.</li>
  <li><b><code>.xml</code></b>: older uncompressed files often use this more general extension.</li>
</ul>
<p>This app opens all three. There are two ways to arrange the inside of a file, <i>partwise</i> (part by part) and <i>timewise</i> (measure by measure); notation programs save partwise, and that is the kind this app opens.</p>

<h2 id="apps">Programs that open MusicXML</h2>
<p>Notation programs such as MuseScore Studio (free), Dorico, and Sibelius, as well as many score viewers and practice apps, can open and save MusicXML. How much of a score survives the move depends on the programs: notes and rhythms almost always come through; layout details and unusual markings may not.</p>

<h2 id="from-app">From this app to MuseScore</h2>
<ol>
  <li>Open and read a score in this app. Fix mistakes in Edit if needed (see ${link("en", "fix-errors", "fixing reading mistakes")}).</li>
  <li>Press <b>MusicXML</b>. A <code>.musicxml</code> file is saved to your downloads.</li>
  <li>In MuseScore, choose <b>File → Open</b> and select the file (or drag it onto the window).</li>
  <li>Now you can correct what this app's editor cannot change (key, clefs, repeat signs), transpose, print, or export MIDI or audio.</li>
</ol>
<p>The app reads notes, rests, clefs, key and time signatures, and some markings, but not lyrics, chord symbols, or dynamics. If you edited the notes in this app, slurs and articulations are not in the saved file.</p>

<h2 id="to-app">From MuseScore to this app</h2>
<p>To hear a score with the cursor of this app, or to use it on a computer without MuseScore, export it: in MuseScore choose <b>File → Export</b> and pick MusicXML (<code>.musicxml</code> or <code>.mxl</code>). Then choose or drop the file in this app. It opens at once, without reading, at the tempo written in the file.</p>
`,
  },
  ja: {
    title: "MusicXMLとは？ .musicxml・.mxl ファイルの開き方と使い方",
    heading: "MusicXML とは？ .musicxml・.mxl ファイルの開き方と使い方",
    nav: "MusicXML とは",
    description: "MusicXML は楽譜ソフトの間で楽譜をやりとりするための共通のファイル形式です。中身、MIDI・PDF との違い、.musicxml と .mxl の違い、このアプリの楽譜を MuseScore で開く方法と、その逆を解説します。",
    body: () => `
<p class="lead">MusicXML は楽譜のファイル形式です。ほとんどの楽譜ソフトが開けて保存もできるので、楽譜をソフトからソフトへ移すときの標準になっています。このアプリは読み取った楽譜を MusicXML で保存でき、MusicXML のファイルを開くこともできます。</p>

<nav class="toc" aria-label="目次"><b>目次</b><ol>
  <li><a href="#what">MusicXML の中身</a></li>
  <li><a href="#compare">MusicXML・MIDI・PDF の違い</a></li>
  <li><a href="#files">.musicxml・.mxl・.xml</a></li>
  <li><a href="#apps">MusicXML を開けるソフト</a></li>
  <li><a href="#from-app">このアプリから MuseScore へ</a></li>
  <li><a href="#to-app">MuseScore からこのアプリへ</a></li>
</ol></nav>

<h2 id="what">MusicXML の中身</h2>
<p>MusicXML のファイルには、楽譜そのものが書かれています。パートと段、音部記号、調号と拍子記号、すべての音符の高さと長さ、さらに休符・タイ・スラー・アーティキュレーション・強弱記号・歌詞・文字などです。中身は XML のテキストなので、テキストエディターでも開けます。1 小節はこのようになります。</p>
${pre(SNIPPET)}
<p>音符ごとに、高さ（<code>octave</code> <code>4</code> の <code>E</code>、つまりミ）と長さ（<code>duration</code>。4分音符を <code>divisions</code> 等分した単位で数えた長さで、この例では 24 なので 4分音符 1 つ）が書かれています。音楽としての意味が残っているので、開いたソフトは楽譜を組み直したり、再生・移調・編集したりできます。</p>
<p>MusicXML は、Recordare 社のマイケル・グッドが 2000 年から設計し、2004 年に 1.0 を公開しました。2011 年に MakeMusic 社が引き継ぎ、2015 年からは W3C の Music Notation Community Group が開発しています。最新版は 4.0（2021 年）です。</p>

<h2 id="compare">MusicXML・MIDI・PDF の違い</h2>
<div class="table-wrap">
<table class="text stack">
<thead><tr><th scope="col">形式</th><th scope="col">中身</th><th scope="col">向いている用途</th></tr></thead>
<tbody>
<tr><th scope="row">MusicXML</th><td>記譜そのもの：書かれたとおりの音符・リズム・調・音部記号・記号</td><td>楽譜ソフトの間での受け渡し、あとで編集する</td></tr>
<tr><th scope="row">MIDI</th><td>演奏の記録：どの鍵盤を、いつ、どのくらいの強さで、どれだけ押したか</td><td>楽器や音楽ソフトでの再生。正確な楽譜には向かない</td></tr>
<tr><th scope="row">PDF</th><td>印刷したページの絵</td><td>印刷して読む。音符として使うには<em>読み取り</em>が必要（このアプリがしていること）</td></tr>
</tbody>
</table>
</div>
<p>MIDI には、その音がソ♯なのかラ♭なのか、付点4分音符なのか 4分音符と 8分音符のタイなのか、連桁のつなぎ方やどの段・声部の音なのか、という情報がありません。音の長さも演奏した秒数に近い値です。そのため MIDI から楽譜を作るときは、どうしても推測が入ります。MusicXML ならそうした情報も残ります。</p>

<h2 id="files">.musicxml・.mxl・.xml</h2>
<ul>
  <li><b><code>.musicxml</code></b>：圧縮していない MusicXML。このアプリが保存するのはこの形式です。</li>
  <li><b><code>.mxl</code></b>：圧縮した MusicXML（中に楽譜の入った zip ファイル）。サイズが小さく、多くのソフトはこちらで保存します。</li>
  <li><b><code>.xml</code></b>：古いファイルでは、この一般的な拡張子もよく使われています。</li>
</ul>
<p>このアプリはどれも開けます。ファイルの中の並べ方には、パートごとの <i>partwise</i> と小節ごとの <i>timewise</i> の 2 種類があり、楽譜ソフトが保存するのは partwise です。このアプリが開けるのも partwise です。</p>

<h2 id="apps">MusicXML を開けるソフト</h2>
<p>MuseScore Studio（無料）、Dorico、Sibelius などの楽譜作成ソフトや、多くの楽譜ビューアー・練習アプリが MusicXML を開いて保存できます。どこまで正確に移るかはソフトの組み合わせしだいで、音符とリズムはほぼ確実に移りますが、レイアウトの細かいところや珍しい記号は移らないことがあります。</p>

<h2 id="from-app">このアプリから MuseScore へ</h2>
<ol>
  <li>このアプリで楽譜を開いて読み取ります。必要なら「編集」で間違いを直します（${link("ja", "fix-errors", "読み取りミスの直し方")}）。</li>
  <li><b>MusicXML</b> を押すと、<code>.musicxml</code> のファイルがダウンロードフォルダに保存されます。</li>
  <li>MuseScore で <b>ファイル → 開く</b> を選んでファイルを選びます（ウィンドウにドラッグしても開けます）。</li>
  <li>このアプリの編集画面では直せないもの（調号・音部記号・繰り返し記号）の修正や、移調・印刷、MIDI・音声ファイルへの書き出しができます。</li>
</ol>
<p>このアプリが読み取るのは、音符・休符・音部記号・調号・拍子記号と一部の記号で、歌詞・コードネーム・強弱記号は読み取りません。このアプリで音符を編集した場合、スラーやアーティキュレーションは保存したファイルに入りません。</p>

<h2 id="to-app">MuseScore からこのアプリへ</h2>
<p>このアプリのカーソル付きで聴きたいときや、MuseScore の入っていない PC で使いたいときは、MuseScore で <b>ファイル → エクスポート</b> を選び、MusicXML（<code>.musicxml</code> か <code>.mxl</code>）で書き出します。そのファイルをこのアプリで選ぶかドロップすると、読み取りなしで、ファイルに書かれたテンポですぐに開きます。</p>
`,
  },
};
