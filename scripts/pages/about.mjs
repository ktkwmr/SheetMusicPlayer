// Operator information (site information page, linked from the footer)
const ISSUES = "https://github.com/ktkwmr/SheetMusicPlayer/issues";
const REPO = "https://github.com/ktkwmr/SheetMusicPlayer";
const HOMR = "https://github.com/liebharc/homr";

export default {
  slug: "about",
  schemaType: "AboutPage",
  modified: "2026-10-22",
  en: {
    title: "About This Site",
    heading: "About this site",
    nav: "About this site",
    description: "Operator information for Sheet Music Player: who runs the site, how to contact us, disclaimer, and copyright.",
    body: () => `
<div class="table-wrap">
  <table class="text stack">
    <tbody>
      <tr><th scope="row">Site name</th><td>Sheet Music Player</td></tr>
      <tr><th scope="row">URL</th><td><a href="/sheetmusicplayer/">https://ktkwmr.com/sheetmusicplayer/</a></td></tr>
      <tr><th scope="row">Operator</th><td>ktkwmr (individual developer)</td></tr>
      <tr><th scope="row">What we offer</th><td>A free web app that reads sheet music from a photo, image, or PDF and plays it back with a cursor on the staff</td></tr>
      <tr><th scope="row">Contact</th><td><a href="${ISSUES}" rel="noopener">GitHub Issues</a></td></tr>
    </tbody>
  </table>
</div>

<h2 id="contact">Contact</h2>
<p>For questions, bug reports, and suggestions, please open an issue on <a href="${ISSUES}" rel="noopener">GitHub Issues</a>. A GitHub account (free) is required.</p>
<p>Issues are public. Do not include personal information, and only attach sheet music you are allowed to share (for example, music in the public domain or your own). If the reading went wrong, your browser, your computer, and a short description of the score (for example <code>piano, two staves, 3 pages</code>) help.</p>

<h2 id="disclaimer">Disclaimer</h2>
<ul>
  <li>The app reads sheet music automatically. We do not guarantee that the notes, rhythms, tempo, or anything else it reads, or the information on this site, are correct or complete. Check the result before you rely on it.</li>
  <li>Use only sheet music you are allowed to use. The app does not send it anywhere, but you are responsible for how you use the results (for example the saved MusicXML).</li>
  <li>We are not responsible for any loss or damage resulting from the use of this site.</li>
  <li>Links to other websites are provided for convenience. We are not responsible for their content.</li>
  <li>The content of this site may be changed or removed, and the service may be stopped, without notice.</li>
</ul>

<h2 id="copyright">Copyright</h2>
<ul>
  <li>The app reads sheet music with <a href="${HOMR}" rel="noopener">homr</a>, an open-source optical music recognition program licensed under the GNU Affero General Public License v3 (AGPL-3.0). The app's source code is published under the same <a href="${REPO}/blob/main/LICENSE" rel="noopener">AGPL-3.0</a> on <a href="${REPO}" rel="noopener">GitHub</a>.</li>
  <li>Other libraries used by the app are listed under Settings → About in the app.</li>
  <li>The text and images on this site are © 2026 ktkwmr. The sample score is a traditional melody engraved for this site.</li>
</ul>

<h2 id="privacy">Privacy</h2>
<p>How this site handles information is described in the <a href="../privacy/">privacy policy</a>.</p>
`,
  },
  ja: {
    title: "運営者情報",
    heading: "運営者情報",
    nav: "運営者情報",
    description: "Sheet Music Player の運営者情報。運営者、お問い合わせ先、免責事項、著作権について。",
    body: () => `
<div class="table-wrap">
  <table class="text stack">
    <tbody>
      <tr><th scope="row">サイト名</th><td>Sheet Music Player</td></tr>
      <tr><th scope="row">URL</th><td><a href="/sheetmusicplayer/ja/">https://ktkwmr.com/sheetmusicplayer/ja/</a></td></tr>
      <tr><th scope="row">運営者</th><td>ktkwmr（個人開発者）</td></tr>
      <tr><th scope="row">内容</th><td>楽譜の写真・画像・PDFを読み取って、五線譜の上のカーソルとともに再生する無料の Web アプリ</td></tr>
      <tr><th scope="row">お問い合わせ</th><td><a href="${ISSUES}" rel="noopener">GitHub の Issues</a></td></tr>
    </tbody>
  </table>
</div>

<h2 id="contact">お問い合わせ</h2>
<p>ご質問・不具合の報告・ご要望は、<a href="${ISSUES}" rel="noopener">GitHub の Issues</a> にお寄せください。投稿には GitHub のアカウント（無料）が必要です。</p>
<p>Issues の内容は公開されます。個人情報は書かないでください。楽譜を添付するときは、公開してよいもの（著作権の切れた曲や自作の曲など）だけにしてください。読み取りがうまくいかなかったときは、ブラウザと PC の種類、楽譜の簡単な説明（例: <code>ピアノ・大譜表・3ページ</code>）があると助かります。</p>

<h2 id="disclaimer">免責事項</h2>
<ul>
  <li>アプリは楽譜を自動で読み取ります。読み取った音符・リズム・テンポなどや、本サイトの情報が正確・完全であることを保証するものではありません。結果は確かめてからお使いください。</li>
  <li>楽譜は、使用が認められているものだけをお使いください。アプリが楽譜をどこかに送ることはありませんが、読み取り結果（保存した MusicXML など）の利用についてはご自身の責任となります。</li>
  <li>本サイトの利用によって生じた損害について、運営者は責任を負いません。</li>
  <li>本サイトからリンクしている外部サイトの内容について、運営者は責任を負いません。</li>
  <li>本サイトの内容は、予告なく変更・削除したり、提供を終了したりすることがあります。</li>
</ul>

<h2 id="copyright">著作権</h2>
<ul>
  <li>楽譜の読み取りには、オープンソースの光学楽譜認識プログラム <a href="${HOMR}" rel="noopener">homr</a>（GNU Affero General Public License v3、AGPL-3.0）を使用しています。アプリのソースコードも同じ <a href="${REPO}/blob/main/LICENSE" rel="noopener">AGPL-3.0</a> で <a href="${REPO}" rel="noopener">GitHub</a> に公開しています。</li>
  <li>そのほかにアプリが使用しているライブラリは、アプリの「設定 → このアプリについて」に掲載しています。</li>
  <li>本サイトの文章と画像の著作権は ktkwmr に帰属します（© 2026 ktkwmr）。サンプルの楽譜は、伝承曲を本サイト用に浄書したものです。</li>
</ul>

<h2 id="privacy">プライバシー</h2>
<p>本サイトでの情報の取り扱いについては<a href="../privacy/">プライバシーポリシー</a>をご覧ください。</p>
`,
  },
};
