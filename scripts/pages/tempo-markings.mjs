// Tempo markings (Allegro, Andante, …) and their BPM. The "this app" column is read from the app's
// own table (TEMPO_TERMS in index.html), and every app value is checked against the usual range below.
import { wideTable } from "./layout.mjs";
import { TEMPO_TERMS, DEFAULT_BPM, BPM_RANGE, link } from "./parts.mjs";

// Usual range in BPM (quarter note = beat), as listed in common references. Sources differ a little,
// and so do the scales printed on metronomes. [low, high]; high = null means "and faster".
const TERMS = {
  grave:       { range: [25, 45],   en: "very slow, solemn",                 ja: "重々しく、きわめて遅く", kana: "グラーヴェ" },
  largo:       { range: [40, 60],   en: "slow and broad",                    ja: "幅広く、ゆるやかに",     kana: "ラルゴ" },
  lento:       { range: [45, 60],   en: "slow",                              ja: "ゆるやかに",             kana: "レント" },
  larghetto:   { range: [60, 66],   en: "rather slow (a little faster than largo)", ja: "ラルゴより少し速く", kana: "ラルゲット" },
  adagio:      { range: [66, 76],   en: "slow, at ease",                     ja: "ゆるやかに、くつろいで", kana: "アダージョ" },
  adagietto:   { range: [72, 76],   en: "a little faster than adagio",       ja: "アダージョより少し速く", kana: "アダージェット" },
  andante:     { range: [76, 108],  en: "at a walking pace",                 ja: "歩くような速さで",       kana: "アンダンテ" },
  andantino:   { range: [80, 108],  en: "a little faster than andante (usually)", ja: "アンダンテより少し速く（ふつうは）", kana: "アンダンティーノ" },
  moderato:    { range: [108, 120], en: "at a moderate speed",               ja: "中くらいの速さで",       kana: "モデラート" },
  allegretto:  { range: [112, 120], en: "moderately fast",                   ja: "やや速く",               kana: "アレグレット" },
  allegro:     { range: [120, 156], en: "fast, lively",                      ja: "速く、快活に",           kana: "アレグロ" },
  vivace:      { range: [156, 176], en: "lively and fast",                   ja: "活発に、速く",           kana: "ヴィヴァーチェ" },
  vivacissimo: { range: [172, 176], en: "very lively",                       ja: "きわめて活発に",         kana: "ヴィヴァチッシモ" },
  presto:      { range: [168, 200], en: "very fast",                         ja: "急速に",                 kana: "プレスト" },
  prestissimo: { range: [200, null], en: "as fast as possible",              ja: "できるかぎり速く",       kana: "プレスティッシモ" },
};
for (const [word, bpm] of Object.entries(TEMPO_TERMS)) {
  const t = TERMS[word];
  if (!t) throw new Error(`tempo-markings.mjs: no entry for "${word}" (added to TEMPO_TERMS in index.html?)`);
  if (bpm < t.range[0] || (t.range[1] && bpm > t.range[1])) throw new Error(`tempo-markings.mjs: the app's ${word} = ${bpm} is outside ${t.range}`);
}
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
const range = (r, lang) => (r[1] ? `${r[0]}–${r[1]}` : lang === "ja" ? `${r[0]} 以上` : `${r[0]}+`);

function termTable(lang) {
  const ja = lang === "ja";
  const head = ja
    ? "<tr><th scope=\"col\">用語</th><th scope=\"col\">BPM の目安</th><th scope=\"col\">このアプリ</th><th scope=\"col\">意味</th></tr>"
    : "<tr><th scope=\"col\">Marking</th><th scope=\"col\">Usual BPM</th><th scope=\"col\">This app</th><th scope=\"col\">Meaning</th></tr>";
  const rows = Object.entries(TERMS).map(([word, t]) => {
    const app = TEMPO_TERMS[word] ?? "–";
    return ja
      ? `<tr><th scope="row"><span lang="it">${cap(word)}</span><br><small>${t.kana}</small></th><td class="num">${range(t.range, lang)}</td><td class="num">${app}</td><td class="wrap">${t.ja}</td></tr>`
      : `<tr><th scope="row" lang="it">${cap(word)}</th><td class="num">${range(t.range, lang)}</td><td class="num">${app}</td><td class="wrap">${t.en}</td></tr>`;
  });
  return wideTable(lang, `<table>
<thead>${head}</thead>
<tbody>
${rows.join("\n")}
</tbody>
</table>`);
}

// How long a 4/4 measure and a 32-measure piece last at a few tempos
const SAMPLE_BPMS = [60, 80, 100, 120, 144];
function durationTable(lang) {
  const ja = lang === "ja";
  const fmt = (s) => {
    if (s < 60) return ja ? `${+s.toFixed(1)}秒` : `${+s.toFixed(1)} s`;
    const m = Math.floor(s / 60), r = Math.round(s - m * 60);
    return ja ? `${m}分${r}秒` : `${m} min ${r} s`;
  };
  const rows = SAMPLE_BPMS.map((bpm) => {
    const beat = 60 / bpm, bar = beat * 4, piece = bar * 32;
    return `<tr><th scope="row">♩ = ${bpm}</th><td class="num">${fmt(beat)}</td><td class="num">${fmt(bar)}</td><td class="num">${fmt(piece)}</td></tr>`;
  });
  const head = ja
    ? "<tr><th scope=\"col\">テンポ</th><th scope=\"col\">1 拍</th><th scope=\"col\">4/4 の 1 小節</th><th scope=\"col\">32 小節</th></tr>"
    : "<tr><th scope=\"col\">Tempo</th><th scope=\"col\">One beat</th><th scope=\"col\">One 4/4 measure</th><th scope=\"col\">32 measures</th></tr>";
  return wideTable(lang, `<table>
<thead>${head}</thead>
<tbody>
${rows.join("\n")}
</tbody>
</table>`);
}

// Metronome marks on other note values, converted to quarter notes per minute (what the app's tempo field uses)
const UNITS = [
  { sym: "♪ = 120", en: "eighth note", ja: "8分音符", factor: 0.5, n: 120 },
  { sym: "♩. = 60", en: "dotted quarter (6/8, 9/8, 12/8)", ja: "付点4分音符（6/8・9/8・12/8 拍子）", factor: 1.5, n: 60 },
  { sym: { en: "half note = 60", ja: "2分音符 = 60" }, en: "half note (2/2, cut time)", ja: "2分音符（2/2 拍子）", factor: 2, n: 60 },
  { sym: { en: "dotted half = 50", ja: "付点2分音符 = 50" }, en: "dotted half (fast 3/4, one beat per measure)", ja: "付点2分音符（速い 3/4 拍子を 1 小節 1 拍で）", factor: 3, n: 50 },
];
function unitTable(lang) {
  const ja = lang === "ja";
  const rows = UNITS.map((u) => `<tr><th scope="row">${typeof u.sym === "string" ? u.sym : u.sym[lang]}</th><td class="num">× ${u.factor}</td><td class="num">♩ = ${u.n * u.factor}</td><td class="wrap">${ja ? u.ja : u.en}</td></tr>`);
  const head = ja
    ? "<tr><th scope=\"col\">楽譜の指定</th><th scope=\"col\">計算</th><th scope=\"col\">テンポ欄に入れる値</th><th scope=\"col\">拍の単位</th></tr>"
    : "<tr><th scope=\"col\">On the page</th><th scope=\"col\">Multiply</th><th scope=\"col\">Enter in the app</th><th scope=\"col\">Beat unit</th></tr>";
  return wideTable(lang, `<table>
<thead>${head}</thead>
<tbody>
${rows.join("\n")}
</tbody>
</table>`);
}

export default {
  slug: "tempo-markings",
  published: "2026-10-24",
  en: {
    title: "Tempo Markings and BPM: Allegro, Andante, Moderato Chart",
    heading: "Tempo markings and BPM: what Allegro, Andante, and Moderato mean",
    nav: "Tempo markings and BPM",
    description: "A chart of Italian tempo markings (Grave to Prestissimo) with their meaning and usual BPM, how to read metronome marks like ♩ = 100 and ♩. = 60, and words that change the tempo (rit., accel., a tempo).",
    body: () => `
<p class="lead">The speed of a piece is written at the top of the first page, either as an Italian word such as <i lang="it">Allegro</i>, as a metronome mark such as ♩ = 120, or both. This page lists the common words with their usual BPM and explains how to turn any marking into a number you can set on a metronome or in a player.</p>

<nav class="toc" aria-label="Contents"><b>Contents</b><ol>
  <li><a href="#bpm">BPM and metronome marks</a></li>
  <li><a href="#chart">Tempo markings chart</a></li>
  <li><a href="#units">When the beat is not a quarter note</a></li>
  <li><a href="#modifiers">Words that modify or change the tempo</a></li>
  <li><a href="#app">How this app sets the tempo</a></li>
</ol></nav>

<h2 id="bpm">BPM and metronome marks</h2>
<p><b>BPM</b> (beats per minute) is the number of beats in one minute. <code>♩ = 60</code> means sixty quarter notes per minute, one per second; <code>♩ = 120</code> is twice as fast. Older editions write <code>M.M. ♩ = 60</code>, after Maelzel's metronome, and <code>♩ = c. 60</code> (<i lang="la">circa</i>) means "about 60".</p>
<p>From the BPM you can work out how long the music lasts: one beat is 60 ÷ BPM seconds, and a 4/4 measure is four beats.</p>
${durationTable("en")}
<p class="cap">Lengths at a few tempos (4/4, played straight through without repeats).</p>

<h2 id="chart">Tempo markings chart</h2>
<p>The words describe a character as much as a speed, so the numbers are only a guide. The ranges below are the ones most references give; metronome scales and other books differ by a few BPM; the same word is also taken faster or slower depending on the period, the composer, and the piece. "This app" is the tempo the app uses when it finds only the word on the page.</p>
${termTable("en")}
<p class="cap">From slowest to fastest. When a word is combined with another (<i lang="it">Allegro moderato</i>), the speed is between the two.</p>

<h2 id="units">When the beat is not a quarter note</h2>
<p>A metronome mark counts whatever note is shown before the equals sign. In 6/8 the beat is usually a dotted quarter, and in 2/2 (cut time) it is a half note. To compare tempos, or to set a player that counts quarter notes, multiply by the length of the beat in quarter notes.</p>
${unitTable("en")}
<p class="cap">A dotted note is 1.5 times the plain note: a dotted quarter is 1.5 quarter notes.</p>

<h2 id="modifiers">Words that modify or change the tempo</h2>
<div class="table-wrap">
<table class="text stack">
<thead><tr><th scope="col">Word</th><th scope="col">Meaning</th></tr></thead>
<tbody>
<tr><th scope="row" lang="it">molto, assai</th><td>very (<i lang="it">Allegro molto</i>: very fast)</td></tr>
<tr><th scope="row" lang="it">poco, un poco</th><td>a little</td></tr>
<tr><th scope="row" lang="it">ma non troppo</th><td>but not too much (<i lang="it">Allegro ma non troppo</i>)</td></tr>
<tr><th scope="row" lang="it">con moto</th><td>with motion, a little faster (<i lang="it">Andante con moto</i>)</td></tr>
<tr><th scope="row" lang="it">più mosso / meno mosso</th><td>faster / slower than before, from here on</td></tr>
<tr><th scope="row" lang="it">ritardando (rit., ritard.), rallentando (rall.)</th><td>gradually slower</td></tr>
<tr><th scope="row" lang="it">accelerando (accel.)</th><td>gradually faster</td></tr>
<tr><th scope="row" lang="it">a tempo, Tempo I (primo)</th><td>back to the tempo before the change / the first tempo</td></tr>
<tr><th scope="row" lang="it">rubato</th><td>freely, stretching and pressing the time</td></tr>
<tr><th scope="row">fermata</th><td>hold this note or rest longer than written</td></tr>
</tbody>
</table>
</div>

<h2 id="app">How this app sets the tempo</h2>
<p>When you open a photo or PDF, the app looks at the top part of the first page for a metronome mark (the number after <code>=</code>) and uses it. If there is none, it looks for one of the words in the chart and uses the value in the "This app" column. If it finds neither, it plays at ♩ = ${DEFAULT_BPM}. You can change the tempo at any time with −5 / +5, by typing a number, or with the slider (${BPM_RANGE[0]}–${BPM_RANGE[1]}).</p>
<ul>
  <li>The number is always used as quarter notes per minute. For <code>♩. = 60</code> or a half-note beat, enter the converted value from the table above.</li>
  <li>The whole piece is played at one tempo. Changes later in the piece (<i lang="it">rit.</i>, a new tempo, fermatas) are not followed; change the tempo by hand while it plays if you need to.</li>
  <li>A MusicXML file opens at the tempo written in it.</li>
</ul>
<p>The tempo is read with text recognition, so a marking in an unusual font, or a photo that is blurred or dark, may be missed. See ${link("en", "photo-tips", "how to photograph sheet music")} and the ${link("en", "guide", "guide")}.</p>
`,
  },
  ja: {
    title: "速度記号の意味とBPMの目安一覧（アレグロ・アンダンテ・モデラートなど）",
    heading: "速度記号の意味と BPM の目安（アレグロ・アンダンテ・モデラートなど）",
    nav: "速度記号と BPM の一覧",
    description: "アレグロ、アンダンテ、モデラートなどの速度記号の読み方・意味・BPM の目安を一覧に。♩ = 100 や ♩. = 60 の読み方、rit.・accel.・a tempo などテンポを変える言葉も解説します。",
    body: () => `
<p class="lead">曲の速さは、1 ページ目の上に <i lang="it">Allegro</i> のようなイタリア語（速度標語）か、♩ = 120 のようなメトロノーム記号、またはその両方で書かれています。このページでは、よく使う速度記号の意味と BPM の目安をまとめ、どんな指定でもメトロノームや再生アプリに入れる数字に直せるように説明します。</p>

<nav class="toc" aria-label="目次"><b>目次</b><ol>
  <li><a href="#bpm">BPM とメトロノーム記号</a></li>
  <li><a href="#chart">速度記号の一覧</a></li>
  <li><a href="#units">拍が 4分音符でないとき</a></li>
  <li><a href="#modifiers">速さを補ったり変えたりする言葉</a></li>
  <li><a href="#app">このアプリのテンポの決め方</a></li>
</ol></nav>

<h2 id="bpm">BPM とメトロノーム記号</h2>
<p><b>BPM</b>（beats per minute）は 1 分間の拍の数です。<code>♩ = 60</code> は 1 分間に 4分音符が 60 回、つまり 1 秒に 1 拍で、<code>♩ = 120</code> はその 2 倍の速さです。古い楽譜では、メルツェルのメトロノームにちなんで <code>M.M. ♩ = 60</code> と書いたり、「約」を意味する <code>♩ = c. 60</code>（<i lang="la">circa</i>）と書いたりします。</p>
<p>BPM が分かれば、演奏時間も計算できます。1 拍は「60 ÷ BPM」秒、4/4 拍子の 1 小節はその 4 倍です。</p>
${durationTable("ja")}
<p class="cap">いくつかのテンポでの長さ（4/4 拍子、繰り返しなしで通した場合）。</p>

<h2 id="chart">速度記号の一覧</h2>
<p>速度記号は速さだけでなく曲の性格も表すので、数字はあくまで目安です。下の範囲は多くの資料に載っているもので、メトロノームの目盛りや本によって数 BPM ずつ違います。同じ言葉でも、時代・作曲家・曲によって速めにも遅めにも取られます。「このアプリ」は、楽譜に速度記号だけが書かれていたときにアプリが使うテンポです。</p>
${termTable("ja")}
<p class="cap">遅い順。2 つの言葉を組み合わせたとき（<i lang="it">Allegro moderato</i> など）は、その間の速さになります。</p>

<h2 id="units">拍が 4分音符でないとき</h2>
<p>メトロノーム記号は「=」の前に書かれた音符を 1 拍として数えます。6/8 拍子ではふつう付点4分音符、2/2 拍子では 2分音符が 1 拍です。4分音符で数える再生アプリに入れるときや、ほかの曲と速さを比べるときは、その音符が 4分音符いくつ分かを掛けます。</p>
${unitTable("ja")}
<p class="cap">付点の付いた音符は、元の音符の 1.5 倍の長さです（付点4分音符 = 4分音符 1.5 個）。</p>

<h2 id="modifiers">速さを補ったり変えたりする言葉</h2>
<div class="table-wrap">
<table class="text stack">
<thead><tr><th scope="col">言葉</th><th scope="col">意味</th></tr></thead>
<tbody>
<tr><th scope="row" lang="it">molto、assai</th><td>とても（<i lang="it">Allegro molto</i>：とても速く）</td></tr>
<tr><th scope="row" lang="it">poco、un poco</th><td>少し</td></tr>
<tr><th scope="row" lang="it">ma non troppo</th><td>しかし、はなはだしくなく（<i lang="it">Allegro ma non troppo</i>）</td></tr>
<tr><th scope="row" lang="it">con moto</th><td>動きをもって、少し速めに（<i lang="it">Andante con moto</i>）</td></tr>
<tr><th scope="row" lang="it">più mosso ／ meno mosso</th><td>ここから、今までより速く ／ 遅く</td></tr>
<tr><th scope="row" lang="it">ritardando（rit.、ritard.）、rallentando（rall.）</th><td>だんだん遅く</td></tr>
<tr><th scope="row" lang="it">accelerando（accel.）</th><td>だんだん速く</td></tr>
<tr><th scope="row" lang="it">a tempo、Tempo I（primo）</th><td>変える前の速さに戻る ／ 最初の速さに戻る</td></tr>
<tr><th scope="row" lang="it">rubato</th><td>テンポを自由に伸び縮みさせて</td></tr>
<tr><th scope="row">フェルマータ</th><td>その音符や休符をほどよく延ばす</td></tr>
</tbody>
</table>
</div>

<h2 id="app">このアプリのテンポの決め方</h2>
<p>写真や PDF を開くと、アプリは 1 ページ目の上の部分からメトロノーム記号（「=」の後の数字）を探して、そのテンポで再生します。見つからなければ一覧の速度記号を探し、「このアプリ」の列の値を使います。どちらもなければ ♩ = ${DEFAULT_BPM} です。テンポは −5／+5、数字の入力、スライダー（${BPM_RANGE[0]}〜${BPM_RANGE[1]}）でいつでも変えられます。</p>
<ul>
  <li>数字はいつも「4分音符が 1 分間にいくつ」として使います。<code>♩. = 60</code> や 2分音符の指定のときは、上の表で換算した値を入れてください。</li>
  <li>曲全体を 1 つのテンポで再生します。途中の rit.・テンポの変更・フェルマータには従わないので、必要なら再生しながら手で変えてください。</li>
  <li>MusicXML のファイルは、ファイルに書かれたテンポで開きます。</li>
</ul>
<p>テンポは文字認識で読み取るので、変わった書体の指定や、ぼけた・暗い写真では見落とすことがあります。${link("ja", "photo-tips", "楽譜の撮り方のコツ")}と${link("ja", "guide", "使い方ガイド")}もご覧ください。</p>
`,
  },
};
