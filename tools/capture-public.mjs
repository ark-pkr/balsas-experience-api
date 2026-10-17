import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const base = 'https://balsas-experience-api-lgdm.onrender.com';
const records = [];
for (const path of ['/health', '/categorias', '/atracoes', '/atracoes/2147483647']) {
  const start = Date.now();
  const response = await fetch(base + path, { signal: AbortSignal.timeout(60000) });
  const body = await response.json();
  records.push({ method: 'GET', url: base + path, status: response.status,
    timestamp: new Date().toISOString(), durationMs: Date.now() - start,
    responseHeaders: Object.fromEntries(response.headers), responseBody: body });
}
await mkdir('docs/evidencias', { recursive: true });
await writeFile('docs/evidencias/registros-publicos.json', JSON.stringify({ client: 'Node.js fetch', records }, null, 2));
for (const record of records) console.log(record.url, record.status);
if (records.map(r => r.status).join() !== '200,200,200,404') throw new Error('Status público inesperado');
const record = records[1];
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const html = `<!doctype html><meta charset="utf-8"><style>body{font:20px/1.5 Arial;background:#edf2f7;color:#17354e;padding:40px}main{background:white;padding:35px;border-radius:12px}h1{font-size:28px}pre{font:19px/1.5 Consolas;white-space:pre-wrap;background:#eff4f8;padding:24px}.url{overflow-wrap:anywhere}small{font-size:16px}</style><main><small>BALSAS EXPERIENCE API · CLIENTE HTTP NODE.JS / FETCH</small><h1>API publicada no Render</h1><p class="url">GET ${record.url}</p><h2>HTTP ${record.status} OK</h2><pre>${esc(JSON.stringify(record.responseBody, null, 2))}</pre><small>Resposta real capturada em ${record.timestamp}<br>Tempo: ${record.durationMs} ms · Registro completo: registros-publicos.json</small></main>`;
const path = resolve('docs/evidencias/5-publicada.html');
await writeFile(path, html);
await mkdir('tmp/browser/publicada', { recursive: true });
const proc = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${resolve('tmp/browser/publicada')}`,
    '--window-size=1200,1100', '--hide-scrollbars', `--screenshot=${resolve('docs/evidencias/5-publicada.png')}`, pathToFileURL(path).href], { stdio: 'ignore' });
const [code] = await once(proc, 'exit');
if (code) throw new Error(`Chrome: ${code}`);
