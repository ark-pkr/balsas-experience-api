import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { prisma } from '../balsas-experience-api/src/prisma.js';

const port = 3108;
const server = spawn(process.execPath, ['balsas-experience-api/src/app.js'], {
  cwd: new URL('../', import.meta.url),
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let createdId;
async function request(path, method = 'GET', body) {
  return fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
try {
  await Promise.race([
    once(server.stdout, 'data'),
    once(server, 'exit').then(() => { throw new Error('Servidor encerrou antes de iniciar'); }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Servidor não iniciou')), 10000).unref()),
  ]);
  let response = await request('/health');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
  response = await request('/atracoes');
  assert.equal(response.status, 200);
  const attractions = await response.json();
  assert.ok(attractions.length > 0, 'Execute o seed em um banco novo antes do teste');
  assert.ok(attractions.every(a => a.categoria.nome && Array.isArray(a.tags)));
  response = await request(`/atracoes/${attractions[0].id}`);
  assert.equal(response.status, 200);
  const detail = await response.json();
  assert.ok(Array.isArray(detail.avaliacoes));
  assert.equal(typeof detail.totalAvaliacoes, 'number');
  const missingId = 2147483647;
  assert.equal((await request(`/atracoes/${missingId}`)).status, 404);
  for (const query of ['categoria=Natureza%20e%20Aventura', 'tag=cachoeira', 'q=rio']) {
    response = await request(`/atracoes?${query}`);
    assert.equal(response.status, 200);
    assert.ok((await response.json()).length > 0);
  }
  response = await request('/categorias');
  assert.equal(response.status, 200);
  const categories = await response.json();
  assert.ok(categories.every(c => Number.isInteger(c.atracoes)));
  const body = { nome: `Teste API ${Date.now()}`, descricao: 'Atração temporária de teste', categoria: 'Lazer', tags: ['lazer', 'família'] };
  response = await request('/atracoes', 'POST', body);
  assert.equal(response.status, 201);
  const created = await response.json();
  createdId = created.id;
  assert.equal(response.headers.get('location'), `/atracoes/${createdId}`);
  assert.equal(await prisma.categoria.count(), categories.length);
  assert.equal((await request('/atracoes', 'POST', { nome: '' })).status, 400);
  response = await request(`/atracoes/${createdId}`, 'PUT', { ...body, tags: ['lazer'] });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).tags.map(t => t.nome), ['lazer']);
  assert.equal((await request(`/atracoes/${createdId}/avaliacoes`, 'POST', { visitante: 'Teste', nota: 5 })).status, 201);
  assert.equal((await request(`/atracoes/${createdId}/avaliacoes`, 'POST', { visitante: 'Teste', nota: 7 })).status, 400);
  response = await request(`/atracoes/${createdId}`);
  const rated = await response.json();
  assert.equal(rated.notaMedia, 5);
  assert.equal(rated.totalAvaliacoes, 1);
  assert.equal((await request(`/atracoes/${createdId}`, 'DELETE')).status, 204);
  assert.equal(await prisma.avaliacao.count({ where: { atracaoId: createdId } }), 0);
  assert.equal((await request(`/atracoes/${createdId}`, 'DELETE')).status, 404);
  console.log('Os 15 cenários do laboratório passaram, incluindo média e exclusão em cascata.');
} finally {
  if (createdId) await prisma.atracao.deleteMany({ where: { id: createdId } });
  await prisma.$disconnect();
  server.kill();
}
