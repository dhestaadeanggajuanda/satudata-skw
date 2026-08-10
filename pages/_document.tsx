import { Html, Head, Main, NextScript } from 'next/document'

// Terapkan tema & preferensi aksesibilitas SEBELUM paint untuk menghindari flicker.
// Membaca localStorage yang ditulis oleh ThemeToggle & AccessibilityWidget.
const initScript = `(function(){try{
  var d=document.documentElement;
  var t=localStorage.getItem('theme');
  if(t==='dark'||(!t&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)){d.classList.add('dark');}
  ['a11y-contrast','a11y-links','a11y-readable','a11y-reduce-motion'].forEach(function(f){
    if(localStorage.getItem(f)==='1'){d.classList.add(f);}
  });
  var fs=parseInt(localStorage.getItem('a11y-font')||'0',10);
  var map=['100%','110%','120%','130%'];
  if(fs>0&&fs<map.length){d.style.fontSize=map[fs];}
}catch(e){}})();`

export default function Document() {
  return (
    <Html lang="id">
      <Head>
        {/* Ikon situs: lambang Kota Singkawang, dibuat dari public/logo-singkawang.png.
            favicon.ico berisi 16/32/48 px; apple-touch-icon berlatar putih karena iOS
            tidak mendukung transparansi. (public/icon.svg masih placeholder PortalJS
            dan belum dipakai di mana pun.) */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="description" content="Portal Satu Data Kota Singkawang." />
        <meta name="theme-color" content="#0c2445" />
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
