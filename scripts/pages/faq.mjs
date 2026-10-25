// Frequently asked questions (FAQPage structured data is made from `faq` by build-pages.mjs).
import { link, DEFAULT_BPM, MAX_PDF_PAGES } from "./parts.mjs";

const dl = (items) => `<dl class="faq">
${items.map((qa) => `<dt id="${qa.id}">${qa.q}</dt>\n<dd>${qa.a}</dd>`).join("\n")}
</dl>`;

const en = [
  { id: "phone", q: "Can I use it on a phone, an iPad, Safari, or Firefox?", a: `<p>The app is tested on Chrome and Edge 137 or later on a computer. The reading engine needs a browser feature called JavaScript Promise Integration (JSPI). Browsers without it show a message instead. Chrome on Android (137 or later), Firefox (153 or later), and Safari (27 or later) have added it, but the app has not been tested on them yet, and phones and tablets often do not have enough memory for reading (about 2 GB). If it does not work, take the photo with your phone and open it on a computer.</p>` },
  { id: "free", q: "Is it free? Do I need an account?", a: `<p>It is free, with no account, no sign-up, and no ads.</p>` },
  { id: "upload", q: "Is my sheet music uploaded anywhere?", a: `<p>No. The photo, image, or PDF is read inside your browser on your computer and is never sent to a server. Photos taken with the camera are not saved. Only the last score (as MusicXML) and its tempo are kept in the browser so they are there next time. See the <a href="/sheetmusicplayer/privacy/">privacy policy</a>.</p>` },
  { id: "time", q: "How long does reading take?", a: `<p>Roughly 10 to 60 seconds per page, depending on the computer and the number of staves. The first time, the app also downloads its reading engine (about 130 MB) once; after that it starts right away and works offline.</p>` },
  { id: "what", q: "What kind of sheet music can it read?", a: `<p>Printed music in standard notation: a single melody or a piano score on two staves (grand staff) works best. Images (JPEG, PNG, WebP, …) and PDFs up to ${MAX_PDF_PAGES} pages can be read. Handwritten music, tablature, and chord charts without notes cannot be read. Scores with many staves take longer and contain more mistakes.</p>` },
  { id: "pages", q: "How do I read a piece with several pages?", a: `<p>Open a PDF: the pages are read in order and joined into one score. A photo of two facing pages is split and read left page first. The app opens one file at a time, so to read several separate photos as one piece, put them into one PDF first.</p>` },
  { id: "wrong", q: "Some notes are wrong. How do I fix them?", a: `<p>Switch to Edit and drag the notes to the right pitch and length, add missing ones, or delete extra ones. Measures marked “!” did not add up when they were read, so check those first. Many mistakes go away with a sharper, straighter photo. See ${link("en", "fix-errors", "how to fix reading mistakes")} and ${link("en", "photo-tips", "photo tips")}.</p>` },
  { id: "tempo", q: "The tempo is wrong.", a: `<p>The app reads the metronome mark at the top of the first page, or a tempo word such as <i lang="it">Allegro</i>; if it finds neither it uses ♩ = ${DEFAULT_BPM}. The number is used as quarter notes per minute, so a marking like ♩. = 60 in 6/8 plays too slow (enter 90 instead). Set the tempo by hand with −5 / +5, the number, or the slider. See ${link("en", "tempo-markings", "tempo markings and BPM")}.</p>` },
  { id: "changes", q: "Does it follow tempo changes, dynamics, or repeats?", a: `<p>The whole piece plays at one tempo with one simple instrument sound. Tempo changes in the middle (rit., a new tempo), dynamics (p, f), and grace notes are not played as written. Listen to it as a check of the notes and rhythm, not as a performance.</p>` },
  { id: "lyrics", q: "Are lyrics, slurs, and articulations kept?", a: `<p>Lyrics and chord symbols are not read. When you edit the notes, the score is rebuilt from the notes only, so slurs, articulations, and similar markings disappear from the saved file.</p>` },
  { id: "save", q: "Can I save the result? Can I get MIDI or MP3?", a: `<p>The MusicXML button saves a <code>.musicxml</code> file. Open it in a notation program such as MuseScore to print it, transpose it, or export MIDI or audio. See ${link("en", "musicxml", "what MusicXML is")}.</p>` },
  { id: "open-xml", q: "Can I open a MusicXML file I already have?", a: `<p>Yes. Choose or drop a <code>.musicxml</code>, <code>.mxl</code>, or <code>.xml</code> file and it opens right away with its tempo, without reading. Partwise MusicXML, which is what notation programs export, is supported.</p>` },
  { id: "kept", q: "Where did my last score go? How do I delete it?", a: `<p>The last score is kept in this browser and appears again when you open the app. Clear removes it. It is also removed when you clear this site's data in the browser settings, and it is not kept in private browsing.</p>` },
];

const ja = [
  { id: "phone", q: "スマホや iPad、Safari、Firefox で使えますか？", a: `<p>動作を確認しているのは、PC の Chrome・Edge（137 以降）です。読み取りエンジンには JavaScript Promise Integration（JSPI）というブラウザの機能が必要で、この機能がないブラウザでは案内を表示します。Android の Chrome（137 以降）、Firefox（153 以降）、Safari（27 以降）にもこの機能が入りましたが、これらでの動作はまだ確かめていません。また、スマホやタブレットは読み取りに必要なメモリ（約 2GB）が足りないことがよくあります。うまくいかないときは、写真をスマホで撮って PC で開いてください。</p>` },
  { id: "free", q: "無料ですか？ 登録は必要ですか？", a: `<p>無料です。アカウント登録は要らず、広告もありません。</p>` },
  { id: "upload", q: "楽譜はどこかにアップロードされますか？", a: `<p>されません。写真・画像・PDF は PC のブラウザの中で読み取り、サーバーには送りません。カメラで撮った写真も保存しません。次に開いたときのために、最後の楽譜（MusicXML）とテンポだけをブラウザに保存します。<a href="/sheetmusicplayer/ja/privacy/">プライバシーポリシー</a>もご覧ください。</p>` },
  { id: "time", q: "読み取りにはどのくらい時間がかかりますか？", a: `<p>PC の性能と段の数によって、1 ページ 10〜60 秒ほどです。初回だけ、読み取りエンジン（約 130MB）のダウンロードが入ります。2 回目からはすぐに始まり、オフラインでも使えます。</p>` },
  { id: "what", q: "どんな楽譜を読み取れますか？", a: `<p>印刷された五線譜です。単旋律の楽譜や、ピアノの大譜表（2 段）がいちばん向いています。画像（JPEG・PNG・WebP など）と、${MAX_PDF_PAGES} ページまでの PDF を読み取れます。手書きの楽譜、タブ譜、音符のないコード譜は読み取れません。段の多い楽譜は時間がかかり、間違いも増えます。</p>` },
  { id: "pages", q: "何ページもある曲はどうすればいいですか？", a: `<p>PDF で開いてください。ページ順に読み取って 1 つの楽譜につなげます。見開き 2 ページを 1 枚に撮った写真は、左右に分けて左のページから読み取ります。一度に開けるファイルは 1 つなので、別々の写真を 1 曲として読ませたいときは、先に 1 つの PDF にまとめてください。</p>` },
  { id: "wrong", q: "音符が間違っています。どう直せばいいですか？", a: `<p>「編集」に切り替えて、音符をドラッグして正しい高さ・長さにしたり、足りない音符を追加したり、余分な音符を削除したりします。「!」の付いた小節は拍の合計が合わなかった小節なので、先に確かめてください。はっきりした、まっすぐな写真で撮り直すと減る間違いも多くあります。${link("ja", "fix-errors", "読み取りミスの直し方")}と${link("ja", "photo-tips", "撮り方のコツ")}をご覧ください。</p>` },
  { id: "tempo", q: "テンポが違います。", a: `<p>アプリは 1 ページ目の上にあるメトロノーム記号か、<i lang="it">Allegro</i> などの速度記号を読み取り、どちらもなければ ♩ = ${DEFAULT_BPM} にします。数字は「4分音符が 1 分間にいくつ」として使うので、6/8 拍子の ♩. = 60 のような指定では遅くなります（90 を入れてください）。−5／+5、数字の入力、スライダーで手で設定できます。${link("ja", "tempo-markings", "速度記号と BPM の一覧")}もご覧ください。</p>` },
  { id: "changes", q: "テンポの変化や強弱、繰り返しどおりに再生されますか？", a: `<p>曲全体を 1 つのテンポ、1 つのシンプルな音色で再生します。途中のテンポの変化（rit.・新しいテンポ）、強弱（p・f）、装飾音は楽譜どおりには鳴りません。演奏としてではなく、音とリズムの確認として聴いてください。</p>` },
  { id: "lyrics", q: "歌詞やスラー、アーティキュレーションは残りますか？", a: `<p>歌詞とコードネームは読み取りません。音符を編集すると、音符だけから楽譜を作り直すので、スラーやアーティキュレーションなどの記号は保存したファイルから消えます。</p>` },
  { id: "save", q: "結果を保存できますか？ MIDI や MP3 にできますか？", a: `<p>「MusicXML」ボタンで <code>.musicxml</code> のファイルに保存できます。MuseScore などの楽譜ソフトで開けば、印刷・移調や、MIDI・音声ファイルへの書き出しができます。${link("ja", "musicxml", "MusicXML とは")}もご覧ください。</p>` },
  { id: "open-xml", q: "手元の MusicXML ファイルを開けますか？", a: `<p>開けます。<code>.musicxml</code>・<code>.mxl</code>・<code>.xml</code> のファイルを選ぶかドロップすると、読み取りなしで、ファイルに書かれたテンポですぐに開きます。楽譜ソフトが書き出す partwise 形式の MusicXML に対応しています。</p>` },
  { id: "kept", q: "前回の楽譜はどこにありますか？ 消すには？", a: `<p>最後に開いた楽譜はこのブラウザに保存され、次にアプリを開くと表示されます。「クリア」で消せます。ブラウザの設定でこのサイトのデータを削除しても消えます。プライベートブラウズでは保存されません。</p>` },
];

export default {
  slug: "faq",
  faq: true,
  published: "2026-10-24",
  en: {
    title: "Sheet Music Player FAQ: Browsers, Accuracy, Tempo, Saving",
    heading: "Frequently asked questions",
    nav: "FAQ",
    description: "Answers about Sheet Music Player: which browsers work, whether your music is uploaded, how long reading takes, what it can read, fixing wrong notes and tempo, and saving as MusicXML, MIDI, or audio.",
    faq: en,
    body: () => `
<p class="lead">Common questions about reading and playing sheet music with this app. For the steps, see the ${link("en", "guide", "guide")}.</p>
${dl(en)}
`,
  },
  ja: {
    title: "よくある質問（対応ブラウザ・読み取りの精度・テンポ・保存）",
    heading: "よくある質問",
    nav: "よくある質問",
    description: "Sheet Music Player のよくある質問。対応ブラウザ（スマホ・Safari）、楽譜がアップロードされないか、読み取り時間、読める楽譜、音符やテンポの直し方、MusicXML・MIDI・MP3 での保存について。",
    faq: ja,
    body: () => `
<p class="lead">このアプリで楽譜を読み取って再生するときの、よくある質問をまとめました。手順は${link("ja", "guide", "使い方ガイド")}をご覧ください。</p>
${dl(ja)}
`,
  },
};
