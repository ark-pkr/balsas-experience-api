import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { prisma } from '../balsas-experience-api/src/prisma.js';

const output = resolve('docs/evidencias');
await mkdir(output, { recursive: true });
await mkdir('tmp/browser', { recursive: true });
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = 'http://127.0.0.1:3110';
const server = spawn(process.execPath, ['balsas-experience-api/src/app.js'], {
  env: { ...process.env, PORT: '3110' }, stdio: ['ignore', 'pipe', 'pipe'],
});
const records = [];
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
let createdId;
async function request(title, path, expected, method = 'GET', body) {
  const started = performance.now();
  const response = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await response.text();
  const record = {
    title, timestamp: new Date().toISOString(), method, url: base + path,
    requestBody: body ?? null, status: response.status, statusText: response.statusText,
    durationMs: Math.round(performance.now() - started),
    responseHeaders: Object.fromEntries(response.headers),
    responseBody: raw ? JSON.parse(raw) : null,
  };
  records.push(record);
  if (response.status !== expected) throw new Error(`${title}: esperado ${expected}, recebido ${response.status}`);
  return record;
}
try {
  await Promise.race([
    once(server.stdout, 'data'),
    once(server, 'exit').then(() => { throw new Error('Servidor encerrou'); }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Servidor não iniciou')), 15000).unref()),
  ]);
  const database = await prisma.$queryRaw`SELECT version() AS version`;
  const category = await prisma.categoria.findFirst({ orderBy: { id: 'asc' } });
  if (!category) throw new Error('O banco precisa estar populado. O seed não será executado automaticamente.');
  await request('Listagem de atrações', '/atracoes', 200);
  await request('Busca por ID inexistente', '/atracoes/2147483647', 404);
  const created = await request('Criação de atração temporária', '/atracoes', 201, 'POST', {
    nome: `Evidência de entrega ${Date.now()}`, descricao: 'Registro temporário para verificar a entrega acadêmica.',
    categoria: category.nome, cidade: 'Balsas', estado: 'MA', distanciaCentroKm: 0, tags: [],
  });
  createdId = created.responseBody.id;
  await request('Remoção da atração temporária', `/atracoes/${createdId}`, 204, 'DELETE');
  await writeFile(resolve(output, 'registros-http.json'), JSON.stringify({
    client: 'Node.js fetch (cliente HTTP)', environment: 'local',
    databaseVersion: database[0].version, records,
  }, null, 2));
  for (const [index, record] of records.entries()) {
    const response = Array.isArray(record.responseBody) ? record.responseBody.slice(0, 1) : record.responseBody;
    const note = Array.isArray(record.responseBody)
      ? `Exibindo o primeiro de ${record.responseBody.length} registros. Resposta integral em registros-http.json.` : '';
    const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{margin:0;padding:32px;background:#eef2f6;color:#17243a;font:18px Arial}
      main{background:white;border:1px solid #d3dbe5;border-radius:12px;padding:28px;max-width:1130px}
      h1{font-size:27px;margin:10px 0 22px}.eyebrow{color:#46607d;font-size:15px;letter-spacing:1px}
      .request{background:#162a42;color:white;padding:17px;border-radius:7px;font:18px monospace;overflow-wrap:anywhere}
      .status{margin:20px 0;font-weight:bold;color:${record.status === 404 ? '#a44215' : '#116044'}}
      h2{font-size:18px;margin:20px 0 8px}pre{font:16px/1.35 Consolas,monospace;white-space:pre-wrap;background:#f4f7fa;padding:15px;margin:0;border-radius:6px}
      .meta{font-size:14px;color:#526379;margin-top:14px}p{font-size:15px}</style>
      <main><div class="eyebrow">BALSAS EXPERIENCE API · CLIENTE HTTP NODE.JS / FETCH</div>
      <h1>${escape(record.title)}</h1><div class="request">${record.method} ${escape(record.url)}</div>
      <div class="status">HTTP ${record.status} ${escape(record.statusText)} · ${record.durationMs} ms</div>
      ${record.requestBody ? '<h2>Corpo enviado · application/json</h2><pre>' + escape(JSON.stringify(record.requestBody, null, 2)) + '</pre>' : ''}
      <h2>Resposta recebida${record.responseBody ? ' · application/json' : ''}</h2>
      <pre>${record.responseBody ? escape(JSON.stringify(response, null, 2)) : '(sem corpo, conforme HTTP 204)'}</pre>
      <p>${escape(note)}</p><div class="meta">Capturado em ${escape(record.timestamp)} · Ambiente local · Registro real de requisição e resposta.</div></main></html>`;
    const name = `${index + 1}-${record.status}`;
    const htmlPath = resolve(output, `${name}.html`);
    await writeFile(htmlPath, html);
    const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      `--user-data-dir=${resolve('tmp/browser/evidence-' + index)}`, '--window-size=1200,1200', '--hide-scrollbars',
      `--screenshot=${resolve(output, name + '.png')}`, pathToFileURL(htmlPath).href], { stdio: 'ignore' });
    const [code] = await once(browser, 'exit');
    if (code !== 0) throw new Error(`Chrome encerrou com código ${code}`);
  }
  console.log('Registros reais e quatro capturas locais salvos em docs/evidencias/.');
  console.log('PostgreSQL:', database[0].version);
} finally {
  if (createdId) await prisma.atracao.deleteMany({ where: { id: createdId } });
  await prisma.$disconnect();
  server.kill();
}
