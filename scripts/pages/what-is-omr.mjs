// How optical music recognition works, and how this app runs it (homr) inside the browser.
import { link, image } from "./parts.mjs";

const HOMR = "https://github.com/liebharc/homr";

export default {
  slug: "what-is-omr",
  published: "2026-10-24",
  en: {
    title: "What Is Optical Music Recognition (OMR) and How Does It Work?",
    heading: "What is optical music recognition (OMR), and how does it work?",
    nav: "How music recognition works",
    description: "Optical music recognition (OMR) turns a picture of sheet music into notes a computer can play and edit. How it works step by step, why music is harder to read than text, and how this app runs it in your browser.",
    body: () => `
<p class="lead">Optical music recognition (OMR) is the music version of OCR: a program looks at a picture of sheet music and works out which notes are written there, so that a computer can play, edit, or transpose them. This page explains how it works and why it is harder than reading text.</p>

<nav class="toc" aria-label="Contents"><b>Contents</b><ol>
  <li><a href="#what">What OMR does</a></li>
  <li><a href="#hard">Why music is harder than text</a></li>
  <li><a href="#steps">How it works, step by step</a></li>
  <li><a href="#learning">From hand-written rules to machine learning</a></li>
  <li><a href="#app">How this app does it</a></li>
  <li><a href="#limits">What OMR still gets wrong</a></li>
</ol></nav>

<h2 id="what">What OMR does</h2>
${image("sample-score.webp", 900, 1273, "A printed page of sheet music: Ode to Joy for piano, two staves, three systems", "Input: a page of printed music (the sample used on this site).", "shot")}
<p>The input is an image: a scan, a photo, or a PDF page. The output is the music in a form a computer understands, usually MusicXML (see ${link("en", "musicxml", "what MusicXML is")}) or MIDI. In between, the program has to find the staves, recognize every symbol, and put them together into measures, voices, and parts.</p>

<h2 id="hard">Why music is harder than text</h2>
<ul>
  <li><b>Position carries meaning.</b> The same note head means a different pitch on each line and space, and a different pitch again under another clef or key signature.</li>
  <li><b>Music is two-dimensional.</b> Text is read in one line; music has chords stacked vertically, several voices on one staff, and two staves read together on a piano score.</li>
  <li><b>Symbols overlap.</b> Note heads sit on staff lines, beams join several notes, and slurs cross everything.</li>
  <li><b>Small marks change a lot.</b> A dot after a note adds half its length; a sharp in the middle of a measure also applies to the later notes on the same line or space until the end of the measure.</li>
  <li><b>Everything must add up.</b> Apart from special cases such as a pickup measure, the notes in each measure must fill exactly the time signature, so one missed flag throws the measure off.</li>
</ul>

<h2 id="steps">How it works, step by step</h2>
<ol>
  <li><b>Preparing the image</b>: adjust the brightness and contrast, and turn the photo into dark ink on light paper.</li>
  <li><b>Finding the staves</b>: detect the five-line staves and group them into systems (for example the two staves of a piano part). In photos, the staves are also straightened when the page is curved or tilted.</li>
  <li><b>Recognizing symbols</b>: find note heads, stems, beams, rests, clefs, accidentals, bar lines, and other marks.</li>
  <li><b>Understanding the music</b>: work out the pitch of each note from its position, the clef, the key signature, and accidentals; the length from its shape, flags, beams, and dots; and divide the result into measures and voices.</li>
  <li><b>Writing the result</b>: save it as MusicXML or another format.</li>
</ol>

<h2 id="learning">From hand-written rules to machine learning</h2>
<p>OMR has been researched since the 1960s. For a long time, programs used rules written by people: remove the staff lines, measure the remaining blobs, and compare them with templates of each symbol. This works on clean, printed scans but breaks easily on photos.</p>
<p>Recent systems use neural networks. A <b>segmentation</b> network marks every pixel of the image as staff line, note head, stem, and so on, which is robust to lighting and noise. A <b>sequence model</b>, similar to those used for reading lines of text, then reads a whole staff at once and writes out the symbols in order, so it learns how symbols relate to each other instead of relying on rules.</p>

<h2 id="app">How this app does it</h2>
<p>This app uses <a href="${HOMR}" rel="noopener">homr</a>, an open-source OMR program designed for photos of sheet music taken with a camera. homr combines both ideas: a segmentation model finds the staves and symbols on the page, the staves are cut out and straightened, and a transformer model (an encoder and a decoder) reads each staff, writing its rhythm, pitch, and accidentals as a sequence. homr then builds MusicXML from those sequences.</p>
<p>homr is written in Python. The app runs it unchanged inside your browser: Python runs on WebAssembly with Pyodide, and the neural networks run with onnxruntime-web. Two of the models were shrunk to about a quarter of their size (from 32-bit numbers to 8-bit integers) with no change in the results on our test scores. That is why the first visit downloads about 130 MB, and why your sheet music never has to leave your computer.</p>
<p>The tempo marking is read separately with Tesseract, a text recognition program, because homr reads notes but not text.</p>

<h2 id="limits">What OMR still gets wrong</h2>
<p>Even good OMR makes mistakes on blurred or tilted photos, dense piano music, small accidentals, triplets, and notes far above or below the staff. It does not read handwriting well, and lyrics and chord symbols are not read by this app. That is why the app lets you listen to the result and fix it: see ${link("en", "photo-tips", "photo tips")} and ${link("en", "fix-errors", "how to fix reading mistakes")}.</p>
`,
  },
  ja: {
    title: "光学楽譜認識（OMR）とは？ 楽譜を読み取る仕組み",
    heading: "光学楽譜認識（OMR）とは？ 楽譜を読み取る仕組み",
    nav: "楽譜を読み取る仕組み（OMR）",
    description: "光学楽譜認識（OMR）は、楽譜の画像をコンピューターが再生・編集できる音符に変える技術です。読み取りの手順、楽譜が文字より読みにくい理由、このアプリがブラウザの中で読み取る仕組みを解説します。",
    body: () => `
<p class="lead">光学楽譜認識（OMR、Optical Music Recognition）は、文字の OCR の楽譜版です。プログラムが楽譜の画像を見て、どんな音符が書かれているかを割り出し、コンピューターで再生・編集・移調できるようにします。このページでは、その仕組みと、文字より難しい理由を説明します。</p>

<nav class="toc" aria-label="目次"><b>目次</b><ol>
  <li><a href="#what">OMR がすること</a></li>
  <li><a href="#hard">楽譜が文字より難しい理由</a></li>
  <li><a href="#steps">読み取りの手順</a></li>
  <li><a href="#learning">人が書く規則から機械学習へ</a></li>
  <li><a href="#app">このアプリの仕組み</a></li>
  <li><a href="#limits">OMR がまだ苦手なこと</a></li>
</ol></nav>

<h2 id="what">OMR がすること</h2>
${image("sample-score.webp", 900, 1273, "印刷された楽譜のページ。ピアノ用の「歓喜の歌」、2 段の大譜表が 3 段", "入力：印刷された楽譜のページ（このサイトで使っている見本）。", "shot")}
<p>入力は、スキャン・写真・PDF のページなどの画像です。出力は、コンピューターが扱える形の音楽で、ふつうは MusicXML（${link("ja", "musicxml", "MusicXML とは")}）か MIDI です。その間でプログラムは、五線を見つけ、記号を一つひとつ見分け、小節・声部・パートに組み立てなければなりません。</p>

<h2 id="hard">楽譜が文字より難しい理由</h2>
<ul>
  <li><b>位置に意味がある。</b>同じ符頭でも、どの線・間にあるかで音の高さが変わり、音部記号や調号が違えばまた変わります。</li>
  <li><b>楽譜は 2 次元。</b>文字は 1 行ずつ読めますが、楽譜には縦に重なる和音、1 つの五線に複数の声部、ピアノの楽譜なら同時に読む 2 段があります。</li>
  <li><b>記号が重なる。</b>符頭は五線の上に乗り、連桁はいくつもの音符をつなぎ、スラーはあらゆるものの上を横切ります。</li>
  <li><b>小さな記号の影響が大きい。</b>音符の後の付点は長さを 1.5 倍にし、小節の途中のシャープはその小節の終わりまで、同じ線・間にある後の音にも効きます。</li>
  <li><b>合計が合わなければならない。</b>弱起の小節などの例外を除き、各小節の音符は拍子ぴったりの長さになる必要があり、旗を 1 本見落とすだけで小節が崩れます。</li>
</ul>

<h2 id="steps">読み取りの手順</h2>
<ol>
  <li><b>画像を整える</b>：明るさとコントラストを調整し、明るい紙に暗いインクの画像にします。</li>
  <li><b>五線を見つける</b>：5 本線の五線を見つけ、段（ピアノなら上下 2 段の組）にまとめます。写真では、ページの曲がりや傾きに合わせて五線をまっすぐに直します。</li>
  <li><b>記号を見分ける</b>：符頭・符幹・連桁・休符・音部記号・臨時記号・小節線などを見つけます。</li>
  <li><b>音楽として解釈する</b>：音の高さを位置・音部記号・調号・臨時記号から、長さを形・旗・連桁・付点から割り出し、小節と声部に分けます。</li>
  <li><b>結果を書き出す</b>：MusicXML などの形式で保存します。</li>
</ol>

<h2 id="learning">人が書く規則から機械学習へ</h2>
<p>OMR は 1960 年代から研究されています。長い間、プログラムは人が書いた規則で動いていました。五線を消し、残った黒い塊の大きさを測り、記号ごとのひな形と比べる、という方法です。きれいな印刷のスキャンには効きますが、写真には弱いものでした。</p>
<p>最近の方式はニューラルネットワークを使います。<b>セグメンテーション</b>のネットワークが、画像の 1 ピクセルずつを五線・符頭・符幹などに分類するので、明るさのむらや汚れに強くなります。続いて、文字を 1 行ずつ読むのと同じような<b>系列モデル</b>が 1 段をまとめて読み、記号を順に書き出します。記号どうしの関係を規則ではなく学習で身につけます。</p>

<h2 id="app">このアプリの仕組み</h2>
<p>このアプリは、カメラで撮った楽譜の写真を読むために作られたオープンソースの OMR プログラム <a href="${HOMR}" rel="noopener">homr</a> を使っています。homr は上の 2 つの考え方を組み合わせています。セグメンテーションのモデルがページの五線と記号を見つけ、五線を 1 段ずつ切り出してまっすぐに直し、トランスフォーマーのモデル（エンコーダーとデコーダー）が段ごとにリズム・音の高さ・臨時記号を並びとして書き出します。homr はその並びから MusicXML を作ります。</p>
<p>homr は Python で書かれています。このアプリは、それを手を加えずにブラウザの中で動かしています。Python は Pyodide で WebAssembly の上で、ニューラルネットワークは onnxruntime-web で動きます。2 つのモデルは、数値を 32 ビットから 8 ビットの整数にして約 4 分の 1 の大きさにしましたが、テスト用の楽譜では結果は変わりませんでした。初回に約 130MB をダウンロードするのはこのためで、その代わり楽譜を PC の外に出す必要がありません。</p>
<p>homr は音符は読みますが文字は読まないので、テンポの指定は文字認識プログラムの Tesseract で別に読み取っています。</p>

<h2 id="limits">OMR がまだ苦手なこと</h2>
<p>よくできた OMR でも、ぼけた写真や傾いた写真、音の多いピアノ曲、小さな臨時記号、3連符、五線から離れた音符では間違えます。手書きは苦手で、歌詞とコードネームはこのアプリでは読み取りません。だからこのアプリでは、結果を聴いて直せるようにしています。${link("ja", "photo-tips", "撮り方のコツ")}と${link("ja", "fix-errors", "読み取りミスの直し方")}もご覧ください。</p>
`,
  },
};
