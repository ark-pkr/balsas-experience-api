import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

// Gera o relatório com evidências reais e sinaliza os dados individuais pendentes.
const data = JSON.parse(await readFile('docs/evidencias/registros-http.json', 'utf8'));
const out = resolve('output/pdf');
await mkdir(out, { recursive: true });
await mkdir('tmp/browser/pdf', { recursive: true });
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const code = value => `<pre>${escape(value)}</pre>`;
const table = (headers, rows) => `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const pending = text => `<div class="pending">${text}</div>`;
const header = '<header>BALSAS EXPERIENCE API <span>Entrega de laboratório · 17/10/2026</span></header>';
const pages = [];
const members = ['Carinne Borges da Silva', 'Júlio César Lima dos Reis', 'João Pedro Strasser Santos', 'Rogério Mota de Melo'];
const teamSuggestions = JSON.parse(await readFile('docs/equipe-sugestoes.json', 'utf8'));
function page(body) { pages.push(`<section class="page">${header}${body}<footer>Balsas Experience API · Relatório de laboratório <span>${pages.length + 1}</span></footer></section>`); }

page(`<div class="kicker">API REST · NODE.JS + POSTGRESQL</div><h1>Balsas Experience API</h1>
${pending('Revisão da entrega: API publicada e verificada em 17/10/2026. Faltam o nome da equipe, matrículas e confirmação dos relatos individuais.')}
<h2>1. Identificação</h2>${table(['Campo', 'Informação'], [
  ['Instituição', 'UNIBALSAS - Centro Universitário de Balsas'], ['Curso', 'Análise e Desenvolvimento de Sistemas'],
  ['Disciplina', 'Programação para Web'], ['Professor', 'Marcos Deivd de Spusa Ramos (grafia informada)'],
  ['Projeto', 'Balsas Experience API'], ['Data do documento', '17/10/2026'],
])}
<h2>2. A equipe</h2><p>Nome da equipe: <strong>a informar</strong>. Todos os integrantes precisam constar abaixo.</p>
<p>Contribuições sugeridas para revisão dos integrantes; ainda não confirmadas.</p>
${table(['Nome completo', 'Matrícula', 'Contribuição proposta'], teamSuggestions.map(m => [m.nome, 'A informar', m.contribuicao]))}
<h2>3. Descrição do projeto</h2>
<p>A Balsas Experience API disponibiliza um catálogo de atrações turísticas de Balsas-MA. Permite consultar atrações, filtrar por categoria, tag e texto, acessar detalhes e registrar avaliações de visitantes. Também oferece operações para criar, atualizar e remover atrações.</p>
<p>Serve como fonte de dados para sites e aplicativos voltados a moradores e turistas. O projeto reúne informações dispersas em uma estrutura consultável e persistente: categorias organizam o catálogo, tags permitem cruzar interesses e avaliações registram a experiência dos visitantes.</p>
`);
page(`<h2>4. Tecnologias utilizadas</h2><p>Versões de referência do ambiente local e dependências. A versão do banco publicada não foi consultada.</p>
${table(['Tecnologia', 'Versão verificada', 'Finalidade'], [
  ['Node.js', '24.13.1', 'Ambiente de execução JavaScript'], ['Express', '5.2.1', 'Rotas e respostas HTTP'],
  ['Prisma CLI / Client', '7.10.0', 'Modelagem, migrações e consultas'], ['PostgreSQL', '18.6', 'Banco de dados relacional'],
  ['@prisma/adapter-pg', '7.10.0', 'Adaptador Prisma para PostgreSQL'], ['pg', '8.23.1', 'Driver PostgreSQL'],
  ['dotenv', '18.0.5', 'Carregamento das variáveis de ambiente'], ['npm', '11.17.0', 'Dependências e scripts'],
])}`);

page(`<h2>5. Modelo de dados</h2><p>PK = chave primária; FK = chave estrangeira. IDs inteiros são gerados automaticamente; campos sem indicação de opcional são obrigatórios.</p>
${table(['Tabela', 'Campos e restrições'], [
  ['Categoria', 'id: Int, PK; nome: String, único'],
  ['Tag', 'id: Int, PK; nome: String, único'],
  ['Atracao', 'id: Int, PK; nome: String; descricao: String; cidade: String (padrão Balsas); estado: String (padrão MA); distanciaCentroKm: Int opcional; criadaEm: DateTime (agora); categoriaId: Int, FK → Categoria.id'],
  ['Avaliacao', 'id: Int, PK; visitante: String; nota: Int; comentario: String opcional; criadaEm: DateTime (agora); atracaoId: Int, FK → Atracao.id'],
  ['_AtracaoToTag', 'A: Int, FK → Atracao.id; B: Int, FK → Tag.id. PK composta (A, B). Tabela de associação gerenciada pelo Prisma.'],
])}
<p><strong>Relações:</strong> Categoria 1:N Atracao; Atracao 1:N Avaliacao; Atracao N:N Tag. Excluir uma atração remove suas avaliações e associações com tags em cascata; categorias e tags são preservadas. A API valida notas inteiras entre 1 e 5.</p>
<p><strong>Por que separar tags?</strong> Uma tabela própria permite reutilizar a mesma tag em várias atrações, evitar duplicação de nomes e aplicar filtros por relacionamento.</p>
<h2>6. Endpoints da API</h2>
${table(['Método', 'Caminho', 'O que faz', 'Status'], [
  ['GET', '/', 'Identificação do serviço', '200'], ['GET', '/health', 'Estado do processo HTTP', '200'],
  ['GET', '/atracoes', 'Listagem por nome; categoria e tags incluídas', '200'],
  ['GET', '/atracoes?categoria=Lazer<br>&amp;tag=lazer&amp;q=rio', 'Filtros combinados, sem diferenciar maiúsculas', '200'],
  ['GET', '/atracoes/:id', 'Detalhes, avaliações, média e total', '200 / 404'],
  ['GET', '/categorias', 'Categorias e contagem de atrações', '200'],
  ['POST', '/atracoes', 'Criar atração', '201 / 400 / 409'],
  ['PUT', '/atracoes/:id', 'Substituir dados e tags', '200 / 400 / 404 / 409'],
  ['DELETE', '/atracoes/:id', 'Excluir atração e avaliações', '204 / 404'],
  ['POST', '/atracoes/:id/avaliacoes', 'Criar avaliação de visitante', '201 / 400 / 404'],
])}
<p>Falhas inesperadas podem retornar 500. /health não verifica o banco. POST e PUT exigem nome, descricao e categoria. Cidade, estado, distância e tags são opcionais. PUT substitui tags e restaura os padrões dos campos opcionais omitidos.</p>`);

const created = data.records.find(r => r.status === 201);
page(`<h2>6. Endpoints da API <small>· exemplo completo</small></h2>
<p>Requisição e resposta reais do cliente HTTP Node.js/fetch, capturadas em ambiente local em 15/10/2026. O registro temporário foi removido após a coleta.</p>
<h3>Requisição</h3>${code('POST /atracoes HTTP/1.1\nHost: 127.0.0.1:3110\nContent-Type: application/json\n\n' + JSON.stringify(created.requestBody, null, 2))}
<h3>Resposta</h3>${code('HTTP/1.1 201 Created\nLocation: ' + created.responseHeaders.location + '\nContent-Type: ' + created.responseHeaders['content-type'] + '\n\n' + JSON.stringify(created.responseBody, null, 2))}
<p>Busca inexistente: <code>GET /atracoes/2147483647</code> retorna 404 com <code>{"erro":"Atração não encontrada"}</code>. Remoção bem-sucedida retorna 204 sem corpo.</p>`);

page(`<h2>7. Como executar o projeto</h2>
<p><strong>Pré-requisitos:</strong> Node.js 24 LTS, npm, Git e acesso a um PostgreSQL local ou hospedado. Execute os comandos na raiz do repositório.</p>
<h3>1. Clonar e instalar</h3>${code('git clone https://github.com/ark-pkr/balsas-experience-api.git\ncd balsas-experience-api\nnpm ci')}
<p>O repositório público está indicado na seção 9.</p>
<h3>2. Configurar o ambiente</h3><p>Copie .env.example para .env e substitua os exemplos pelas credenciais do seu banco. Não publique o .env.</p>
${code('DATABASE_URL="postgresql://USUARIO:SENHA_FICTICIA@HOST-POOLER/neondb?sslmode=require"\nDIRECT_URL="postgresql://USUARIO:SENHA_FICTICIA@HOST-DIRETO/neondb?sslmode=require&connect_timeout=30"\nPORT=3000')}
<p>A aplicação usa DATABASE_URL. O Prisma CLI usa DIRECT_URL ou, se ausente, DATABASE_URL. As senhas acima são fictícias.</p>
<h3>3. Gerar cliente, migrar e popular</h3>${code('npx prisma generate --config prisma7.config.ts\nnpx prisma migrate deploy --config prisma7.config.ts\nnpm run seed')}
<p><strong>Atenção ao seed:</strong> apaga os dados existentes antes de inserir oito atrações e três avaliações. Use apenas em banco novo ou descartável; pule essa etapa se o banco já estiver populado.</p>
<h3>4. Iniciar e verificar</h3>${code('npm start\n# Em desenvolvimento, alternativamente: npm run dev\n# Em outro terminal:\ncurl -i http://localhost:3000/health\ncurl -i http://localhost:3000/atracoes\nnpm test')}
<p>No PowerShell, use curl.exe. Os testes usam a porta 3108 e criam/removem uma atração temporária. Os 15 cenários passaram na verificação local.</p>
<h3>Publicação preparada</h3><p>O arquivo render.yaml configura um Web Service no Render com Node.js 24.13.1. Build: <code>npm ci --include=dev &amp;&amp; npm run build</code>; início: <code>npm start</code>. Cadastrar DATABASE_URL e DIRECT_URL no painel. O build aplica migrações e não executa seed. A hospedagem fornece PORT.</p>`);

for (let i = 0; i < data.records.length; i++) {
  const r = data.records[i];
  const img = pathToFileURL(resolve('docs/evidencias', `${i + 1}-${r.status}.png`)).href;
  page(`<h2>${i === 0 ? '8. Evidências de funcionamento' : '8. Evidências de funcionamento <small>· continuação</small>'}</h2>
  <h3>${escape(r.title)} · HTTP ${r.status}</h3>
  <p>Captura da visualização do registro real do cliente HTTP Node.js/fetch. Ambiente local, em 15/10/2026. A resposta completa e os cabeçalhos estão em docs/evidencias/registros-http.json.</p>
  <img class="evidence" src="${img}">
  <p class="caption">${escape(r.method + ' ' + r.url)} · Status recebido: ${r.status}. ${i === 0 ? 'A captura mostra o primeiro item da listagem; o JSON integral foi preservado.' : ''}</p>`);
}

page(`<h2>8. Evidências de funcionamento <small>· API publicada</small></h2>
<p>Verificação real em 17/10/2026: GET /health, /categorias e /atracoes retornaram HTTP 200; GET /atracoes/2147483647 retornou 404. As consultas de categorias e atrações confirmam o acesso ao banco publicado.</p><img class="evidence" style="max-height:165mm" src="${pathToFileURL(resolve('docs/evidencias/5-publicada.png')).href}"><p class="caption">Captura da visualização da resposta real do cliente HTTP Node.js/fetch. Registros integrais: docs/evidencias/registros-publicos.json.</p>
<h2>9. Links</h2>
${table(['Destino', 'Endereço'], [['Repositório público no GitHub', '<a href="https://github.com/ark-pkr/balsas-experience-api">https://github.com/ark-pkr/balsas-experience-api</a>'], ['API publicada', '<a href="https://balsas-experience-api-lgdm.onrender.com/categorias">https://balsas-experience-api-lgdm.onrender.com/categorias</a>']])}
`);

page(`<h2>10. Dificuldades e aprendizados</h2>
<p>Sugestões para revisão da equipe. Cada integrante deve ajustar e confirmar seu relato conforme sua experiência real.</p>
${table(['Integrante', 'Dificuldade sugerida', 'Solução sugerida', 'Aprendizado sugerido'], teamSuggestions.map(m => [m.nome, m.dificuldade, m.solucao, m.aprendizado]))}
<p>Para cada integrante: descreva um problema concreto, a tentativa que resolveu o problema e o conhecimento adquirido. Exemplos de assuntos que podem ser abordados, se realmente ocorreram: conexão com PostgreSQL, variáveis de ambiente, adaptação ao Prisma 7, relações entre tabelas, migrações, validação de JSON e publicação.</p>
<h3>Conceitos técnicos demonstrados pelo projeto</h3>
<p><strong>Prisma 7:</strong> o cliente usa o adaptador PrismaPg para acessar PostgreSQL. <strong>Modelagem:</strong> tags reutilizáveis são associadas às atrações em uma relação N:N. <strong>Integridade:</strong> a exclusão em cascata evita avaliações sem atração. <strong>HTTP:</strong> criação retorna 201 e Location; remoção retorna 204 sem corpo; registro ausente retorna 404.</p>
<p>Esses conceitos são verificáveis no código; a experiência pessoal de cada integrante será inserida após a confirmação em docs/RELATOS-EQUIPE.md.</p>
<h3>Verificação técnica realizada nesta revisão</h3>
<p>A revisão local anterior registrou 15 cenários automatizados aprovados. Foram coletados registros reais de listagem 200, busca 404, criação 201 e remoção 204, usando o banco PostgreSQL 18.6 configurado. O seed não foi executado nesta revisão.</p>
<h3>Antes de enviar pelo portal</h3>
<ol><li>Confirmar a identificação acadêmica, a grafia do professor e as contribuições individuais.</li><li>Conferir os links públicos da API e do repositório.</li><li>Confirmar os aprendizados reais de cada integrante e as matrículas.</li><li>Gerar novamente o PDF e nomeá-lo balsas-experience-api-equipe-&lt;nome-da-equipe&gt;.pdf.</li><li>Combinar quem será o único integrante responsável pela submissão e enviar somente o PDF.</li></ol>`);

const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Balsas Experience API - Relatório de entrega</title><style>
@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;color:#1c2c40;font:10.3pt/1.45 Arial,sans-serif;background:#e9eef4}
.page{position:relative;width:210mm;height:297mm;padding:15mm 16mm 17mm;background:white;break-after:page;overflow:hidden}.page:last-child{break-after:auto}
header{font-size:8pt;letter-spacing:.8px;color:#42637f;border-bottom:1px solid #bccbd9;padding-bottom:8px;margin-bottom:16px}header span{float:right;letter-spacing:0}
.kicker{font-size:9pt;color:#42637f;letter-spacing:1px}h1{font-size:27pt;line-height:1.1;margin:8px 0 15px;color:#123c5c}h2{font-size:15pt;color:#123c5c;margin:17px 0 9px}h3{font-size:11pt;color:#244d6c;margin:14px 0 6px}small{font-size:10pt;font-weight:normal}
p{margin:7px 0}table{width:100%;border-collapse:collapse;font-size:9pt;margin:8px 0}th{background:#173c58;color:white;text-align:left;padding:7px}td{border-bottom:1px solid #d7e0e8;padding:6px 7px;vertical-align:top}tr:nth-child(even){background:#f3f6f9}
pre{font:9pt/1.42 Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere;background:#f0f4f8;padding:12px;border-left:3px solid #537e9d;margin:7px 0}code{font-family:Consolas,monospace;font-size:9pt;overflow-wrap:anywhere}.pending{background:#fff2db;border-left:4px solid #b97a13;padding:10px 12px;font-size:9.5pt;margin:10px 0}.evidence{display:block;width:100%;max-height:222mm;object-fit:contain;border:1px solid #d7e0e8;margin-top:10px}.caption{font-size:9pt;color:#4a6072}footer{position:absolute;bottom:9mm;left:16mm;right:16mm;border-top:1px solid #ccd7e0;padding-top:6px;font-size:8pt;color:#60758a}footer span{float:right}li{margin-bottom:8px}
.page:first-child{font-size:9.5pt;line-height:1.35}.page:first-child table{font-size:8.2pt}.page:first-child th{padding:4px 7px}.page:first-child td{padding:3px 7px}.page:first-child h2{margin-top:11px;font-size:14pt}.page:first-child h1{font-size:25pt;margin-bottom:10px}.page:first-child p{margin:6px 0}
.page:last-child{font-size:9.5pt;line-height:1.35}.page:last-child h2{margin-top:12px}.page:last-child h3{margin-top:10px}.page:last-child table{font-size:8.5pt}.page:last-child td{padding:5px 7px}.page:last-child li{margin-bottom:5px}
@media screen{.page{margin:12px auto;box-shadow:0 2px 10px #aab7c7}}@media print{body{background:white}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>${pages.join('')}</html>`;
const htmlPath = resolve(out, 'relatorio-entrega.html');
await writeFile(htmlPath, html);
const pdfPath = resolve(out, 'balsas-experience-api-equipe-a-definir.pdf');
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${resolve('tmp/browser/pdf')}`, '--no-pdf-header-footer',
  `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href], { stdio: 'ignore' });
const [exitCode] = await once(browser, 'exit');
if (exitCode !== 0) throw new Error(`Chrome retornou ${exitCode}`);
console.log(pdfPath);
