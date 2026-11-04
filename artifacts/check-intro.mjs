import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = process.env.INTRO_TEST_ORIGIN || 'http://127.0.0.1:5174';
const profile = await mkdtemp(join(tmpdir(), 'derek-intro-'));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=9337', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const checks = [];
let socket;
try {
  let tabs;
  for (let i = 0; i < 50; i++) {
    try { tabs = await (await fetch('http://127.0.0.1:9337/json')).json(); if (tabs.some(tab => tab.type === 'page')) break; } catch {}
    await sleep(100);
  }
  const page = tabs?.find(tab => tab.type === 'page');
  if (!page) throw new Error('Headless Chrome did not become available.');
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method && listeners.has(message.method)) {
      for (const resolve of listeners.get(message.method)) resolve(message.params);
      listeners.delete(message.method);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (!message.id) return;
    const entry = pending.get(message.id);
    if (!entry) return;
    clearTimeout(entry.timeout);
    pending.delete(message.id);
    message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const next = ++id;
    const timeout = setTimeout(() => { pending.delete(next); reject(new Error(`Timed out: ${method}`)); }, 15000);
    pending.set(next, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id: next, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const reload = async () => {
    const loaded = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Page did not finish loading')), 15000);
      listeners.set('Page.loadEventFired', [() => { clearTimeout(timeout); resolve(); }]);
    });
    await send('Page.reload');
    await loaded;
  };
  const until = async (expression, label, limit = 80) => {
    for (let i = 0; i < limit; i++) { if (await evaluate(expression)) return; await sleep(100); }
    throw new Error(`Failed: ${label}`);
  };
  const check = async (expression, label) => {
    if (!await evaluate(expression)) {
      console.error(await evaluate("JSON.stringify({url:location.href,ready:document.readyState,intro:!!document.querySelector('.intro-screen'),body:document.body.innerText.slice(0,1000)})"));
      throw new Error(`Failed: ${label}`);
    }
    checks.push(label);
  };
  const screenshot = async name => {
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(`artifacts/${name}.png`, Buffer.from(data, 'base64'));
  };
  await mkdir('artifacts', { recursive: true });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${origin}/` });
  await until("!!document.querySelector('.intro-screen')", 'initial intro');
  await check("document.querySelector('.site-content').inert && document.activeElement.classList.contains('intro-skip')", 'Background inert and skip focused');
  await sleep(750);
  await screenshot('intro-desktop');
  await until("!document.querySelector('.intro-screen')", 'automatic exit');
  await check("!document.querySelector('.site-content').inert && document.body.style.overflow !== 'hidden' && document.activeElement.id === 'main-content'", 'Automatic exit restores scrolling and focus');
  await screenshot('intro-home');
  await check("getComputedStyle(document.body).fontFamily.includes('Work Sans') && getComputedStyle(document.querySelector('.project-content')).paddingLeft === '24px'", 'Tailwind typography and spacing are applied');
  await check("document.querySelectorAll('.explore-card').length === 6 && document.querySelectorAll('.botanical').length >= 8", 'Six directory links and botanical artwork render');
  await evaluate("if(document.documentElement.dataset.theme !== 'light') document.querySelector('.theme-switch').click()");
  await sleep(250);
  await screenshot('tailwind-light-desktop');
  await evaluate("document.querySelector('.theme-switch').click()");
  await sleep(250);
  await check("document.documentElement.dataset.theme === 'dark' && getComputedStyle(document.body).backgroundColor === 'rgb(12, 35, 42)'", 'Dark theme colors remain correct');
  await screenshot('tailwind-dark-desktop');
  await until("document.querySelector('.hero-portrait img')?.complete && document.querySelector('.hero-portrait img').naturalWidth===919", 'Derek portrait loads');
  await check("document.querySelector('.hero-portrait img').naturalHeight===1015 && document.querySelector('.hero-portrait img').getAttribute('fetchpriority')==='high'", 'Home features the prioritized Derek portrait');
  await screenshot('home-portrait-desktop');
  await evaluate("document.querySelector('.explore-directory').scrollIntoView({block:'center',behavior:'instant'})");
  await sleep(250);
  const directoryPoint = await evaluate("(()=>{const r=document.querySelector('.explore-card[href=\"#/projects\"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...directoryPoint });
  await check("!document.querySelector('.pixel-sheep, .directory-sheep, .sheep-character, [data-part]')", 'No sheep models appear in the page');
  await evaluate("document.querySelector('.directory-pause').click()");
  await check("document.querySelector('.explore-directory').dataset.paused === 'true'", 'Plant animation pause works');
  await evaluate("document.querySelector('.directory-pause').click();window.scrollTo({top:0,behavior:'instant'})");
  await reload();
  await sleep(1000);
  await check("!!document.querySelector('#home') && !document.querySelector('.intro-screen')", 'Intro plays once per tab session');
  await evaluate("document.querySelector('.intro-replay').click()");
  await until("!!document.querySelector('.intro-screen')", 'replay');
  await evaluate("document.querySelector('.intro-skip').click()");
  await until("!document.querySelector('.intro-screen')", 'skip exit');
  checks.push('Replay and Skip work');
  await evaluate("document.querySelector('.intro-replay').click()");
  await until("!!document.querySelector('.intro-screen')", 'Escape replay');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
  await until("!document.querySelector('.intro-screen')", 'Escape exit');
  checks.push('Escape skips intro');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await evaluate("sessionStorage.removeItem('derek-intro-seen')");
  await reload();
  await sleep(1000);
  await check("!!document.querySelector('#home') && !document.querySelector('.intro-screen') && getComputedStyle(document.querySelector('.intro-replay')).display === 'none'", 'Reduced motion bypasses intro');
  await check("getComputedStyle(document.querySelector('.hero-plants .plant-frond')).animationName === 'none'", 'Botanical animation respects reduced motion');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await send('Page.navigate', { url: `${origin}/#photos` });
  await until("location.hash === '#photos' && !!document.querySelector('#photos')", 'photo navigation');
  await reload();
  await until("location.hash === '#photos' && !!document.querySelector('#photos')", 'photo reload');
  await check("!!document.querySelector('#photos') && !document.querySelector('.intro-screen')", 'Photo deep links bypass intro');
  await send('Page.navigate', { url: `${origin}/#/projects` });
  await until("location.hash === '#/projects' && !!document.querySelector('#projects-title')", 'project navigation');
  await reload();
  await until("location.hash === '#/projects' && !!document.querySelector('#projects-title')", 'project reload');
  await check("document.querySelector('#projects-title')?.textContent === 'Projects' && !document.querySelector('.intro-screen')", 'Project page bypasses intro');
  await evaluate("document.querySelector('.quest-details').click()");
  await until("!!document.querySelector('.quest-dialog')", 'project dialog');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
  await until("!document.querySelector('.quest-dialog')", 'project dialog closes');
  checks.push('Project dialogs remain keyboard accessible');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: `${origin}/` });
  await until("!location.hash && !!document.querySelector('#home')", 'mobile home navigation');
  await evaluate("sessionStorage.removeItem('derek-intro-seen')");
  await reload();
  await until("!!document.querySelector('.intro-screen')", 'mobile intro');
  await sleep(750);
  await screenshot('intro-mobile');
  await check("document.querySelector('.intro-skip').getBoundingClientRect().right <= innerWidth && document.querySelector('#intro-title').getBoundingClientRect().width <= innerWidth", 'Mobile title and skip fit screen');
  await until("!document.querySelector('.intro-screen')", 'mobile exit');
  await check("document.documentElement.scrollWidth <= innerWidth", 'Mobile layout has no horizontal overflow');
  await screenshot('tailwind-mobile');
  await evaluate("document.querySelector('#menu-toggle').click()");
  await check("document.querySelector('#menu-toggle').getAttribute('aria-expanded') === 'true'", 'Mobile navigation opens');
  await evaluate("document.querySelector('#navigation-links a[href=\"#/interests\"]').click()");
  await until("location.hash === '#/interests'", 'interests navigation');
  await check("document.querySelector('#menu-toggle').getAttribute('aria-expanded') === 'false' && !!document.querySelector('.interests-page')", 'Mobile navigation reaches interests and closes');
  if (errors.length) throw new Error(`Browser errors: ${errors.join(', ')}`);
  checks.push('No browser runtime errors');
  await writeFile('artifacts/intro-check-results.json', JSON.stringify({ passed: checks }, null, 2));
  console.log(JSON.stringify({ passed: checks }, null, 2));
  await send('Browser.close');
} finally {
  socket?.close();
  chrome.kill();
}
