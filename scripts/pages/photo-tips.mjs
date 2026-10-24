// How to photograph / scan sheet music. The comparison table comes from scripts/pages/data/photo-results.json,
// written by scripts/render-guide-images.mjs (the same page made tilted, blurred, … and read by the app).
import { readFileSync } from "node:fs";
import { image, link, DEFAULT_BPM, MAX_PDF_PAGES } from "./parts.mjs";

const DATA = JSON.parse(readFileSync(new URL("./data/photo-results.json", import.meta.url), "utf8"));
const R = DATA.results;
const ORDER = ["clean", "tilt", "perspective", "shadow", "blur", "small"];
for (const k of ORDER) if (!R[k]) throw new Error(`photo-results.json: "${k}" is missing (run scripts/render-guide-images.mjs)`);
const TOTAL = R.clean.originalNotes;

const LABEL = {
  clean: { en: "Straight, sharp, even light", ja: "まっすぐ・くっきり・明るさが均一" },
  tilt: { en: "Page tilted by 10°", ja: "ページが 10° 傾いている" },
  perspective: { en: "Taken at an angle (top narrower)", ja: "斜めから撮った（上がすぼまる）" },
  shadow: { en: "Shadow over the top of the page", ja: "ページの上に影がかかる" },
  blur: { en: "Out of focus", ja: "ピントが合っていない" },
  small: { en: "Page small in the photo (465 px wide)", ja: "写真の中でページが小さい（幅 465 ピクセル）" },
};

// Cards on phones (table.stack), a table on wider screens
function resultTable(lang) {
  const ja = lang === "ja";
  const L = ja
    ? { photo: "写真", match: "音符の一致率", notes: `読み取った音符（元は ${TOTAL}）`, flagged: "「!」の小節", tempo: "テンポ（元は ♩ = 108）" }
    : { photo: "Photo", match: "Notes right", notes: `Notes read (of ${TOTAL})`, flagged: "“!” measures", tempo: "Tempo (♩ = 108 on the page)" };
  const tempo = (r) => (r.tempoSource === "ocr" ? (ja ? `♩ = ${r.bpm}（正しい）` : `♩ = ${r.bpm} (right)`) : ja ? `見つからず（♩ = ${DEFAULT_BPM}）` : `not found (♩ = ${DEFAULT_BPM})`);
  const rows = ORDER.map((k) => {
    const r = R[k];
    if (r.error) return `<tr><th scope="row">${LABEL[k][lang]}</th><td colspan="4">${ja ? "読み取れず" : "could not be read"}</td></tr>`;
    return `<tr><th scope="row">${LABEL[k][lang]}</th><td data-label="${L.match}"><b>${r.match}%</b></td><td data-label="${L.notes}">${r.notes}</td><td data-label="${L.flagged}">${r.flagged}</td><td data-label="${L.tempo}">${tempo(r)}</td></tr>`;
  });
  return `<div class="table-wrap">
<table class="text stack">
<thead><tr><th scope="col">${L.photo}</th><th scope="col">${L.match}</th><th scope="col">${L.notes}</th><th scope="col">${L.flagged}</th><th scope="col">${L.tempo}</th></tr></thead>
<tbody>
${rows.join("\n")}
</tbody>
</table>
</div>`;
}

const gallery = (lang) => `<div class="gallery">
${ORDER.map((k) => image(`photo-${k}.webp`, 360, 509, LABEL[k][lang], `${LABEL[k][lang]}${lang === "ja" ? "：" : ": "}${R[k].match}%`, "shot small")).join("\n")}
</div>`;

const worstTilt = R.tilt.match, worstBlur = R.blur.match;
// The text below describes these results; if a new run changes them, rewrite the text
const check = (ok, what) => { if (!ok) throw new Error(`photo-tips.mjs: the results changed (${what}); update the article text`); };
check(R.clean.match === 100 && R.clean.tempoSource === "ocr", "clean is not perfect");
check(ORDER.every((k) => R[k].match >= worstBlur), "blur is not the worst");
check(worstTilt < 100, "tilt reads every note");
check(R.shadow.match === 100 && R.shadow.tempoSource !== "ocr", "shadow");
check(R.perspective.match === 100 && R.small.match === 100, "perspective / small");

export default {
  slug: "photo-tips",
  published: "2026-10-24",
  en: {
    title: "How to Photograph or Scan Sheet Music for Better Recognition",
    heading: "How to photograph or scan sheet music for better results",
    nav: "Photo tips for sheet music",
    description: "We read the same page photographed six ways (tilted, at an angle, shadowed, blurred, small) and compared the results note by note. Tips for taking photos and scans of sheet music that read correctly.",
    body: () => `
<p class="lead">How well the app reads your sheet music depends more on the photo than on anything else. To show how much, we made six versions of the same page, with the usual problems of a quick phone photo, read each of them in the app, and compared the result with the original note by note.</p>

<nav class="toc" aria-label="Contents"><b>Contents</b><ol>
  <li><a href="#test">The test: one page, six photos</a></li>
  <li><a href="#tips">Tips for a good photo</a></li>
  <li><a href="#scan">Scans and PDFs</a></li>
  <li><a href="#after">After reading</a></li>
</ol></nav>

<h2 id="test">The test: one page, six photos</h2>
<p>The page is a two-staff arrangement of <i>Ode to Joy</i> (${TOTAL} notes in 16 measures, marked Moderato ♩ = 108). The tilt, angle, shadow, blur, and small size were made from the same picture, so the only difference is the problem itself.</p>
${gallery("en")}
${resultTable("en")}
<p class="cap">“Notes right” is the share of notes read with the right pitch and length, in the right order, on each staff (extra notes count against it). Measured with this app's reading engine.</p>
<p>What the results show:</p>
<ul>
  <li><b>Blur is the worst problem</b> (${worstBlur}%): note heads run into the staff lines, so the pitch and the rhythm both go wrong, and several measures no longer add up.</li>
  <li><b>A tilted page loses notes</b> (${worstTilt}%). Straightening the page in the photo, or holding the camera parallel to it, avoids this.</li>
  <li><b>A shadow did not hurt the notes here, but the tempo marking in the shadow was missed.</b> Text is more fragile than notes.</li>
  <li>A moderate angle and a small but sharp page were read correctly. The engine straightens the staves and adjusts the contrast by itself, but only up to a point.</li>
</ul>
<p>This is one simple page; a dense piano score or a real photo with several problems at once loses more. The order of the problems, though, is a good guide.</p>

<h2 id="tips">Tips for a good photo</h2>
<ol>
  <li><b>Focus first.</b> Tap the music on the screen to focus, hold still, and check that the note heads are sharp when you zoom in. Use both hands or rest your elbows on the table.</li>
  <li><b>Hold the camera parallel to the page.</b> Look straight down from above the middle of the page, so the page is a rectangle and the staves are horizontal.</li>
  <li><b>Fill the frame with one page.</b> The whole page should be in the photo, but with little else around it. Take one page per photo; a book's two facing pages in one photo also works.</li>
  <li><b>Use even light.</b> Daylight from a window or a ceiling light works well. Avoid your own shadow and the shadow of the phone; move so the light comes from the side. Avoid the flash, which leaves a bright spot.</li>
  <li><b>Flatten the page.</b> Press a book open at the edges, or put a sheet on the table. Curved staves near the spine are harder to read.</li>
  <li><b>Keep the top of the first page in the photo.</b> That is where the tempo marking is.</li>
</ol>
<p>The app reads printed music. Handwritten scores, tablature, and very small notes (such as a pocket score) are not read reliably.</p>

<h2 id="scan">Scans and PDFs</h2>
<p>A flat scan avoids almost every problem above, so use one when you can. 300 dpi in grayscale or black and white is plenty. A PDF from a scanner app on a phone (which straightens and crops the page) also works well. If you have a PDF made by a notation program, open it directly: it is sharper than any photo. Up to the first ${MAX_PDF_PAGES} pages of a PDF are read.</p>

<h2 id="after">After reading</h2>
<p>Play the result while you follow the page. If a few notes are wrong, fix them in the editor (see ${link("en", "fix-errors", "how to fix reading mistakes")}); if many are wrong, a new photo is usually faster. If the tempo was missed, set it by hand (see ${link("en", "tempo-markings", "tempo markings and BPM")}).</p>
`,
  },
  ja: {
    title: "楽譜をきれいに読み取る撮り方・スキャンのコツ（6通りの写真で比較）",
    heading: "楽譜をきれいに読み取る撮り方・スキャンのコツ",
    nav: "楽譜の撮り方のコツ",
    description: "同じ楽譜を、傾き・斜め・影・ピンぼけ・小さく写る、の 6 通りで撮った画像をアプリで読み取り、音符ごとに比べました。正しく読み取れる楽譜の写真・スキャンの撮り方を解説します。",
    body: () => `
<p class="lead">アプリが楽譜を正しく読み取れるかは、何より写真で決まります。どのくらい差が出るかを確かめるため、同じ楽譜からスマホでさっと撮ったときによくある失敗を再現した 6 通りの画像を作り、アプリで読み取って、元の楽譜と音符ごとに比べました。</p>

<nav class="toc" aria-label="目次"><b>目次</b><ol>
  <li><a href="#test">実験：同じ楽譜を 6 通りの写真で</a></li>
  <li><a href="#tips">うまく撮るコツ</a></li>
  <li><a href="#scan">スキャンと PDF</a></li>
  <li><a href="#after">読み取ったあとで</a></li>
</ol></nav>

<h2 id="test">実験：同じ楽譜を 6 通りの写真で</h2>
<p>使ったのは「歓喜の歌」を 2 段の楽譜にしたもの（16 小節・${TOTAL} 音、Moderato ♩ = 108）です。傾き・斜め・影・ぼけ・小ささは同じ画像から作ったので、違いはその失敗だけです。</p>
${gallery("ja")}
${resultTable("ja")}
<p class="cap">「音符の一致率」は、段ごとに、音の高さと長さが正しい音符が正しい順番で読めた割合（余分な音符も減点）。このアプリの読み取りエンジンで測定。</p>
<p>結果から分かること：</p>
<ul>
  <li><b>いちばん悪いのはピンぼけ</b>（${worstBlur}%）。符頭が五線とにじんで、音の高さもリズムも崩れ、拍の合わない小節がいくつもできました。</li>
  <li><b>ページが傾くと音符を落とします</b>（${worstTilt}%）。カメラをページと平行に構えれば防げます。</li>
  <li><b>影は音符には影響しませんでしたが、影の中のテンポの指定は見落としました。</b>文字は音符より崩れやすいようです。</li>
  <li>ほどほどの斜めや、小さくてもくっきりした写真は正しく読めました。エンジンは段のゆがみやコントラストをある程度は自分で補正しますが、限度があります。</li>
</ul>
<p>これは簡単な 1 ページでの結果で、音の多いピアノ曲や、いくつもの失敗が重なった実際の写真ではもっと崩れます。それでも、どの失敗が効くかの目安にはなります。</p>

<h2 id="tips">うまく撮るコツ</h2>
<ol>
  <li><b>まずピントを合わせる。</b>画面の楽譜をタップしてピントを合わせ、手を止めて撮ります。拡大して符頭がくっきりしているか確かめてください。両手で持つか、ひじを机につくとぶれません。</li>
  <li><b>カメラをページと平行に。</b>ページの真ん中の真上から見下ろして、ページが長方形に、五線が水平に写るようにします。</li>
  <li><b>1 ページで画面を埋める。</b>ページ全体を入れつつ、まわりはなるべく写さないようにします。1 枚に 1 ページが基本で、本の見開き 2 ページを 1 枚に撮っても読めます。</li>
  <li><b>明るさを均一に。</b>窓からの昼の光や天井の照明が向いています。自分やスマホの影が落ちないよう、光が横から来る位置で撮ります。フラッシュは光が反射するので避けます。</li>
  <li><b>ページを平らに。</b>本は端を押さえて開き、1 枚の楽譜は机に置きます。綴じ目の近くで曲がった五線は読みにくくなります。</li>
  <li><b>1 ページ目の上の部分も入れる。</b>テンポの指定はそこに書かれています。</li>
</ol>
<p>読み取れるのは印刷された楽譜です。手書きの楽譜、タブ譜、ポケットスコアのような音符がとても小さい楽譜はうまく読めません。</p>

<h2 id="scan">スキャンと PDF</h2>
<p>平らに置いてスキャンすれば、上の失敗はほとんど起きないので、できればスキャンを使ってください。グレースケールか白黒で 300dpi あれば十分です。スマホのスキャンアプリ（ページをまっすぐに直して切り抜いてくれるもの）で作った PDF もよく読めます。楽譜ソフトで作った PDF があれば、どんな写真よりくっきりしているので、そのまま開いてください。PDF は最初の ${MAX_PDF_PAGES} ページまで読み取ります。</p>

<h2 id="after">読み取ったあとで</h2>
<p>元の楽譜を目で追いながら再生してください。間違いが少しなら編集画面で直し（${link("ja", "fix-errors", "読み取りミスの直し方")}）、たくさんあるなら撮り直すほうがたいてい早く済みます。テンポを見落としたときは手で設定してください（${link("ja", "tempo-markings", "速度記号と BPM の一覧")}）。</p>
`,
  },
};
