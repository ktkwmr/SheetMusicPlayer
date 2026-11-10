// Frequently asked questions (FAQPage structured data is made from `faq` by build-pages.mjs).
import { link, DEFAULT_BPM, MAX_FILES } from "./parts.mjs";

const dl = (items) => `<dl class="faq">
${items.map((qa) => `<dt id="${qa.id}">${qa.q}</dt>\n<dd>${qa.a}</dd>`).join("\n")}
</dl>`;

const en = [
  { id: "phone", q: "Can I use it on a phone, an iPad, Safari, or Firefox?", a: `<p>The app is tested on Chrome and Edge 137 or later on a computer, Safari on iPhone (iOS 27.2), and Chrome on Android (137 or later). The reading engine needs a browser feature called JavaScript Promise Integration (JSPI). Browsers without it show a message instead. On an iPhone, update to iOS 27.2 or later. Firefox (153 or later) and Safari on a Mac or iPad (27 or later) have it too, but the app has not been tested on them yet, and older phones and tablets may not have enough memory for reading (about 2 GB). If it does not work, take the photo with your phone and open it on a computer.</p>` },
  { id: "free", q: "Is it free? Do I need an account?", a: `<p>It is free, with no account, no sign-up, and no ads.</p>` },
  { id: "upload", q: "Is my sheet music uploaded anywhere?", a: `<p>No. The photo, image, or PDF is read inside your browser and is never sent to a server. Photos taken with the camera are not saved. Only the notes of the last 10 scores you opened (as MusicXML), with their titles, tempo, and transposition, are kept in the browser so you can open them again. See the <a href="/sheetmusicplayer/privacy/">privacy policy</a>.</p>` },
  { id: "time", q: "How long does reading take?", a: `<p>Roughly 10 to 60 seconds per page, depending on the device and the number of staves. The first time, the app also downloads its reading engine (about 130 MB) once; after that it starts right away and works offline.</p>` },
  { id: "what", q: "What kind of sheet music can it read?", a: `<p>Printed music in standard notation: a single melody or a piano score on two staves (grand staff) works best. Images (JPEG, PNG, WebP, …) and PDFs can be read, up to ${MAX_FILES} files at a time as one score. Handwritten music, tablature, and chord charts without notes cannot be read. Scores with many staves take longer and contain more mistakes.</p>` },
  { id: "pages", q: "How do I read a piece with several pages?", a: `<p>Add the photos (or PDFs) to the list one after another, up to ${MAX_FILES} files, check the order (drag the handle to change it), and press “Read the score”: the pages are read in order and joined into one score. The pages of a PDF are read in order, and a photo of two facing pages is split and read left page first. Reading takes about a minute per page; with many pages the browser may run out of memory, especially on a phone. Then read fewer pages at a time.</p>` },
  { id: "wrong", q: "Some notes are wrong. How do I fix them?", a: `<p>Switch to Edit and drag the notes to the right pitch and length, add missing ones, or delete extra ones. Measures marked “!” did not add up when they were read, so check those first. Many mistakes go away with a sharper, straighter photo. See ${link("en", "fix-errors", "how to fix reading mistakes")} and ${link("en", "photo-tips", "photo tips")}.</p>` },
  { id: "tempo", q: "The tempo is wrong.", a: `<p>The app reads the metronome mark at the top of the first page, or a tempo word such as <i lang="it">Allegro</i>; if it finds neither it uses ♩ = ${DEFAULT_BPM}. The number is used as quarter notes per minute, so a marking like ♩. = 60 in 6/8 plays too slow (enter 90 instead). Set the tempo by hand with −5 / +5, the number, or the slider. See ${link("en", "tempo-markings", "tempo markings and BPM")}.</p>` },
  { id: "changes", q: "Does it follow tempo changes, dynamics, or repeats?", a: `<p>The whole piece plays at one tempo with one simple instrument sound. Tempo changes in the middle (rit., a new tempo), dynamics (p, f), and grace notes are not played as written. Listen to it as a check of the notes and rhythm, not as a performance.</p>` },
  { id: "lyrics", q: "Are lyrics, slurs, and articulations kept?", a: `<p>Lyrics and chord symbols are not read. When you edit the notes, the score is rebuilt from the notes only, so slurs, articulations, and similar markings disappear from the saved file.</p>` },
  { id: "practice", q: "Can I repeat one passage, or practise only my part?", a: `<p>Yes. With the buttons under the tempo, <b>Loop</b> plays the measures you choose over and over, and the <b>Metronome</b> and <b>Count-in</b> help you keep time. For scores with more than one staff (piano, choir, …), tap a part to make it louder (the others soft) or to mute it, so you can hear your part clearly or play or sing it yourself with the rest. Slow the tempo down while you learn it. See ${link("en", "guide", "the guide")}.</p>` },
  { id: "transpose", q: "Can I transpose the music to another key?", a: `<p>Yes. <b>Transpose</b>, under the tempo, moves the music up or down a semitone at a time, up to an octave. The key signature changes with it, and the MusicXML, MIDI, and MP3 you save are transposed too. For a B♭ instrument such as a trumpet or clarinet, transpose up 2 (a major second); for an E♭ alto saxophone, up 9 (a major sixth), or down 3 for the same notes an octave lower.</p>` },
  { id: "save", q: "Can I save the result? Can I get MIDI or MP3?", a: `<p>Yes. The buttons under the score save an MP3 of what you hear (with the current tempo, transposition, and louder or muted parts), a MIDI file (one track per staff), or a MusicXML file (to open in MuseScore and other notation programs). <b>Share</b> sends the app's link and the MusicXML file through your device's share menu. See ${link("en", "musicxml", "what MusicXML is")}.</p>` },
  { id: "open-xml", q: "Can I open a MusicXML file I already have?", a: `<p>Yes. Choose or drop a <code>.musicxml</code>, <code>.mxl</code>, or <code>.xml</code> file and it opens right away with its tempo, without reading. Partwise MusicXML, which is what notation programs export, is supported.</p>` },
  { id: "kept", q: "Where did my last score go? How do I delete it?", a: `<p>The score you had open appears again when you open the app, and the last 10 scores are listed under <b>Recent scores</b> in the left panel. <b>Clear history</b> removes that list (the open score stays), and <b>Clear</b> removes the open score. They are also removed when you clear this site's data in the browser settings, and they are not kept in private browsing.</p>` },
];

const ja = [
  { id: "phone", q: "スマホや iPad、Safari、Firefox で使えますか？", a: `<p>動作を確認しているのは、PC の Chrome・Edge（137 以降）、iPhone の Safari（iOS 27.2）、Android の Chrome（137 以降）です。読み取りエンジンには JavaScript Promise Integration（JSPI）というブラウザの機能が必要で、この機能がないブラウザでは案内を表示します。iPhone は iOS 27.2 以降に更新してください。Firefox（153 以降）、Mac や iPad の Safari（27 以降）にもこの機能はありますが、これらでの動作はまだ確かめていません。また、古いスマホやタブレットは読み取りに必要なメモリ（約 2GB）が足りないことがあります。うまくいかないときは、写真をスマホで撮って PC で開いてください。</p>` },
  { id: "free", q: "無料ですか？ 登録は必要ですか？", a: `<p>無料です。アカウント登録は要らず、広告もありません。</p>` },
  { id: "upload", q: "楽譜はどこかにアップロードされますか？", a: `<p>されません。写真・画像・PDF はブラウザの中で読み取り、サーバーには送りません。カメラで撮った写真も保存しません。もう一度開けるよう、最近開いた 10 曲の音符（MusicXML）とタイトル・テンポ・移調の設定だけをブラウザに保存します。<a href="/sheetmusicplayer/ja/privacy/">プライバシーポリシー</a>もご覧ください。</p>` },
  { id: "time", q: "読み取りにはどのくらい時間がかかりますか？", a: `<p>端末の性能と段の数によって、1 ページ 10〜60 秒ほどです。初回だけ、読み取りエンジン（約 130MB）のダウンロードが入ります。2 回目からはすぐに始まり、オフラインでも使えます。</p>` },
  { id: "what", q: "どんな楽譜を読み取れますか？", a: `<p>印刷された五線譜です。単旋律の楽譜や、ピアノの大譜表（2 段）がいちばん向いています。画像（JPEG・PNG・WebP など）と PDF を読み取れます。一度に ${MAX_FILES} 個までのファイルを 1 つの楽譜として読み取れます。手書きの楽譜、タブ譜、音符のないコード譜は読み取れません。段の多い楽譜は時間がかかり、間違いも増えます。</p>` },
  { id: "pages", q: "何ページもある曲はどうすればいいですか？", a: `<p>写真（または PDF）を続けて選んで一覧に ${MAX_FILES} 個まで追加し、順番を確かめて（ハンドルをドラッグすると変えられます）「楽譜を読み取る」を押してください。並んだ順に読み取って 1 つの楽譜につなげます。PDF はページ順に読み取り、見開き 2 ページを 1 枚に撮った写真は左右に分けて左のページから読み取ります。1 ページに 1 分ほどかかり、ページが多いと（特にスマートフォンでは）メモリが足りなくなることがあります。そのときはページを減らして読み取ってください。</p>` },
  { id: "wrong", q: "音符が間違っています。どう直せばいいですか？", a: `<p>「編集」に切り替えて、音符をドラッグして正しい高さ・長さにしたり、足りない音符を追加したり、余分な音符を削除したりします。「!」の付いた小節は拍の合計が合わなかった小節なので、先に確かめてください。はっきりした、まっすぐな写真で撮り直すと減る間違いも多くあります。${link("ja", "fix-errors", "読み取りミスの直し方")}と${link("ja", "photo-tips", "撮り方のコツ")}をご覧ください。</p>` },
  { id: "tempo", q: "テンポが違います。", a: `<p>アプリは 1 ページ目の上にあるメトロノーム記号か、<i lang="it">Allegro</i> などの速度記号を読み取り、どちらもなければ ♩ = ${DEFAULT_BPM} にします。数字は「4分音符が 1 分間にいくつ」として使うので、6/8 拍子の ♩. = 60 のような指定では遅くなります（90 を入れてください）。−5／+5、数字の入力、スライダーで手で設定できます。${link("ja", "tempo-markings", "速度記号と BPM の一覧")}もご覧ください。</p>` },
  { id: "changes", q: "テンポの変化や強弱、繰り返しどおりに再生されますか？", a: `<p>曲全体を 1 つのテンポ、1 つのシンプルな音色で再生します。途中のテンポの変化（rit.・新しいテンポ）、強弱（p・f）、装飾音は楽譜どおりには鳴りません。演奏としてではなく、音とリズムの確認として聴いてください。</p>` },
  { id: "lyrics", q: "歌詞やスラー、アーティキュレーションは残りますか？", a: `<p>歌詞とコードネームは読み取りません。音符を編集すると、音符だけから楽譜を作り直すので、スラーやアーティキュレーションなどの記号は保存したファイルから消えます。</p>` },
  { id: "practice", q: "一部分だけをくり返したり、自分のパートだけ練習したりできますか？", a: `<p>できます。テンポの下の<b>ループ</b>で、選んだ小節をくり返し再生できます。<b>メトロノーム</b>と<b>カウントイン</b>もあります。ピアノや合唱など段が 2 つ以上ある楽譜では、パートをタップして強調（ほかのパートを小さく）したり消音したりできるので、自分のパートをはっきり聴いたり、ほかのパートに合わせて自分で弾いたり歌ったりできます。覚えるまではテンポを落とすのもおすすめです。${link("ja", "guide", "使い方ガイド")}もご覧ください。</p>` },
  { id: "transpose", q: "別の調に移調できますか？", a: `<p>できます。テンポの下の<b>移調</b>で、半音ずつ上下 1 オクターブまで移調できます。調号も変わり、保存する MusicXML・MIDI・MP3 も移調した音になります。トランペットやクラリネットなど B♭ の楽器用には上に 2（長 2 度）、E♭ のアルトサックス用には上に 9（長 6 度。1 オクターブ下でよければ下に 3）です。</p>` },
  { id: "save", q: "結果を保存できますか？ MIDI や MP3 にできますか？", a: `<p>できます。楽譜の下のボタンで、MP3（今のテンポ・移調・パートの強調や消音のとおりの音）、MIDI（段ごとに 1 トラック）、MusicXML（MuseScore などの楽譜ソフトで開けます）を保存できます。<b>共有</b>では、アプリのリンクと MusicXML のファイルを端末の共有メニューで送れます。${link("ja", "musicxml", "MusicXML とは")}もご覧ください。</p>` },
  { id: "open-xml", q: "手元の MusicXML ファイルを開けますか？", a: `<p>開けます。<code>.musicxml</code>・<code>.mxl</code>・<code>.xml</code> のファイルを選ぶかドロップすると、読み取りなしで、ファイルに書かれたテンポですぐに開きます。楽譜ソフトが書き出す partwise 形式の MusicXML に対応しています。</p>` },
  { id: "kept", q: "前回の楽譜はどこにありますか？ 消すには？", a: `<p>開いていた楽譜は、次にアプリを開くとそのまま表示されます。最近開いた 10 曲は、左のパネルの<b>最近の楽譜</b>に並びます。<b>履歴を消去</b>で一覧を消し（開いている楽譜は残ります）、<b>クリア</b>で開いている楽譜を消せます。ブラウザの設定でこのサイトのデータを削除しても消えます。プライベートブラウズでは保存されません。</p>` },
];

export default {
  slug: "faq",
  faq: true,
  published: "2026-10-24",
  en: {
    title: "Sheet Music Player FAQ: Browsers, Accuracy, Practice, Saving",
    heading: "Frequently asked questions",
    nav: "FAQ",
    description: "Answers about Sheet Music Player: which browsers work, whether your music is uploaded, how long reading takes, what it can read, fixing wrong notes and tempo, looping and part practice, transposing, and saving as MusicXML, MIDI, or MP3.",
    faq: en,
    body: () => `
<p class="lead">Common questions about reading and playing sheet music with this app. For the steps, see the ${link("en", "guide", "guide")}.</p>
${dl(en)}
`,
  },
  ja: {
    title: "よくある質問（対応ブラウザ・読み取りの精度・練習・保存）",
    heading: "よくある質問",
    nav: "よくある質問",
    description: "Sheet Music Player のよくある質問。対応ブラウザ（スマホ・Safari）、楽譜がアップロードされないか、読み取り時間、読める楽譜、音符やテンポの直し方、ループやパート練習、移調、MusicXML・MIDI・MP3 での保存について。",
    faq: ja,
    body: () => `
<p class="lead">このアプリで楽譜を読み取って再生するときの、よくある質問をまとめました。手順は${link("ja", "guide", "使い方ガイド")}をご覧ください。</p>
${dl(ja)}
`,
  },
};
