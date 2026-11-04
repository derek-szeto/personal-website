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

  await send('Emulation.setDeviceMetricsOverride', {width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:origin+'/#contact'});
  await until("document.querySelectorAll('.contact-method').length === 4",'contact cards');
  const urls=['mailto:derekszeto09@gmail.com','tel:+12243842635','https://github.com/derek-szeto','https://www.instagram.com/derekszeto/'];
  for(const url of urls) await check('!!document.querySelector('+JSON.stringify('a.contact-method[href="'+url+'"]')+')','Contact destination: '+url);
  await check("[...document.querySelectorAll('.contact-method[target=\"_blank\"]')].every(a=>a.rel.includes('noopener'))",'External links have safe new-tab behavior');
  const captureBoard=async name=>{
    const clip=await evaluate("(()=>{const r=document.querySelector('.contact-board').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()");
    const {data}=await send('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});
    await writeFile('artifacts/'+name+'.png',Buffer.from(data,'base64'));
  };
  for(const theme of ['dark','light']) {
    await evaluate('if(document.documentElement.dataset.theme !== '+JSON.stringify(theme)+') document.querySelector(".theme-switch").click()');
    await evaluate("document.querySelector('#contact').scrollIntoView({behavior:'instant'})");
    await sleep(250);
    await captureBoard('contact-'+theme+'-desktop');
  }
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await evaluate("document.querySelector('#contact').scrollIntoView({behavior:'instant'})");
  await sleep(250);
  await check("document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('.contact-method')].every(a=>a.getBoundingClientRect().width <= innerWidth)",'Contact cards fit mobile viewport');
  await captureBoard('contact-mobile');
  await evaluate("document.querySelector('.contact-method').focus({preventScroll:true})");
  await check("document.activeElement.classList.contains('contact-method')",'Contact cards are keyboard focusable');
  if(errors.length)throw Error('Browser errors: '+errors.join(', '));
  console.log(JSON.stringify({passed:checks},null,2));
  await send('Browser.close');
} finally {
 socket?.close();
 chrome.kill();
}
