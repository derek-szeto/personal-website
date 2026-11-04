import { useId } from 'react';

// An original SVG prop inspired by KAY/O's teal FLASH/drive and orange lever.
export default function FlashDriveProp() {
  const id = useId();
  return <svg className="flashdrive-prop" viewBox="0 0 180 300" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-core`} x1="47" y1="150" x2="140" y2="156" gradientUnits="userSpaceOnUse"><stop stopColor="#126b76" /><stop offset=".22" stopColor="#35c7c8" /><stop offset=".52" stopColor="#40e7e3" /><stop offset=".77" stopColor="#198eae" /><stop offset="1" stopColor="#174e6e" /></linearGradient>
      <linearGradient id={`${id}-metal`} x1="39" y1="35" x2="142" y2="104" gradientUnits="userSpaceOnUse"><stop stopColor="#f0f6fa" /><stop offset=".35" stopColor="#c2d2dc" /><stop offset=".6" stopColor="#f7fcff" /><stop offset="1" stopColor="#738898" /></linearGradient>
      <linearGradient id={`${id}-base`} x1="49" y1="233" x2="143" y2="270" gradientUnits="userSpaceOnUse"><stop stopColor="#a1b7c5" /><stop offset=".4" stopColor="#485e72" /><stop offset="1" stopColor="#1b2d43" /></linearGradient>
      <linearGradient id={`${id}-lever`} x1="34" y1="44" x2="70" y2="255" gradientUnits="userSpaceOnUse"><stop stopColor="#ffbb7e" /><stop offset=".18" stopColor="#e08242" /><stop offset="1" stopColor="#a94f24" /></linearGradient>
    </defs>
    <path d="m84 35-14-24-16 6 5 15-24 15c-8 5-10 13-8 24l12 168 16 19 10-7-12-20L43 72l36-18Z" fill={`url(#${id}-lever)`} stroke="#8d4728" strokeWidth="2" />
    <path d="m70 11 14 24-6 3-12-19-9 4-3-6Z" fill="#ffd0a6" />
    <path d="M35 55 43 72l10 159 12 20-10 7-6-13-9-13-9-160Z" fill="#ae592c" opacity=".65" />
    <path d="M75 35h37l8 29-40 7Z" fill="#243447" stroke="#9db1bf" strokeWidth="2" />
    <path d="m84 38 6 27 11-1-4-27Z" fill="#647d8d" />
    <path d="M48 85c17-17 74-19 92-1v149c-18 22-72 23-92 1Z" fill={`url(#${id}-core)`} stroke="#62bec8" strokeWidth="1.5" />
    <path d="M116 83c9-2 17-1 24 1v149c-6 8-15 12-24 15Z" fill="#0b4b68" opacity=".4" />
    <path d="M65 100v119c0 8 6 13 12 16V99Z" fill="#b3fff2" opacity=".12" />
    <path className="flashdrive-energy" d="M82 111v77l12 13h19m-38-77v78l14 15h15m-2-108v45l10 10v26" stroke="#b5fffa" strokeWidth="2" strokeLinecap="round" opacity=".35" />
    <path d="m45 86 7-30 23-20 38-1 25 23 7 28-14 15-70 7Z" fill={`url(#${id}-metal)`} stroke="#243c50" strokeWidth="2" />
    <path d="m52 56 24-20 8 28-23 31-16-9Z" fill="#8dabbc" />
    <path d="m84 64 29-29 25 23 7 28-14 15Z" fill="#e2ecf2" />
    <path d="m45 86 16 9 70-8 14-1-1 13-15 10-68 7-17-15Z" fill="#283a4e" />
    <path d="m61 95 70-8" stroke="#fff" strokeOpacity=".6" />
    <path d="m43 229 13-8 84-5 10 18-3 25-17 16-73 4-14-20Z" fill={`url(#${id}-base)`} stroke="#172b3e" strokeWidth="2" />
    <path d="m56 221 7 21 68-6 9-20 10 18-13 16-80 7-14-15v-13Z" fill="#c4d4df" />
    <path d="m57 257 80-7-7 25-73 4-14-20Z" fill="#263a50" />
    <path d="m137 250 13-16-3 25-17 16Z" fill="#13273c" />
    <path d="m89 248 22-2 1 13-22 2Z" fill="#d8894e" stroke="#eeb986" />
    <path d="m91 251 17-1" stroke="#ffcf9c" strokeWidth="2" />
    <circle cx="56" cy="89" r="2.3" fill="#233c50" />
    <circle cx="133" cy="84" r="2.3" fill="#233c50" />
    <path d="m120 125 9-1m-9 9 9-1m-9 9 9-1" stroke="#9de9ed" strokeWidth="1.5" opacity=".6" />
    <text transform="translate(91 188) rotate(-90)" fill="#d8ffff" fillOpacity=".8" fontFamily="monospace" fontSize="8" letterSpacing="1.2">FLASH/drive</text>
    <path d="M62 151v39m0 6v7" stroke="#9cffed" strokeWidth="2" strokeLinecap="round" opacity=".65" />
  </svg>;
}
