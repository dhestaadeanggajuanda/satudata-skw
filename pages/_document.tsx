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
        {/* Default PortalJS branding — PLACEHOLDER. Replace the files in `public/`
            (favicon.ico, icon.svg, apple-touch-icon.png, icon-512.png) with your
            own brand marks; these links can stay as-is once the files are swapped. */}
        <link rel="icon" type="image/png" href="/favicon.png" />
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
