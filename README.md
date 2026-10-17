# Balsas Experience API

API REST de atrações turísticas de Balsas-MA, construída com Node.js e Express e integrada ao PostgreSQL por meio do Prisma ORM. Oferece um catálogo pesquisável por texto, categoria e tag, além de cadastro de atrações e avaliações de visitantes.

Centraliza informações para sites e aplicativos destinados a turistas e moradores. Categorias organizam as atrações; tags permitem cruzar interesses; avaliações registram a experiência dos visitantes.

## API publicada e repositório

- API: https://balsas-experience-api-lgdm.onrender.com
- Categorias: https://balsas-experience-api-lgdm.onrender.com/categorias
- Atrações: https://balsas-experience-api-lgdm.onrender.com/atracoes
- Repositório público: https://github.com/ark-pkr/balsas-experience-api

Em 17/10/2026, as rotas /health, /categorias e /atracoes responderam 200; /atracoes/2147483647 respondeu 404. Registros completos em [registros-publicos.json](docs/evidencias/registros-publicos.json).

## Identificação e equipe

Instituição: UNIBALSAS - Centro Universitário de Balsas. Curso: Análise e Desenvolvimento de Sistemas (conforme documento existente). Disciplina: Programação para Web. Professor: Marcos Deivd de Spusa Ramos (grafia informada). Data: 17/10/2026.

Nome da equipe e matrículas: não informados. Contribuições abaixo são propostas existentes, sujeitas à confirmação dos integrantes.

| Nome completo | Matrícula | Contribuição proposta |
| --- | --- | --- |
| Carinne Borges da Silva | A informar | Organização da documentação e descrição dos endpoints. |
| Júlio César Lima dos Reis | A informar | Desenvolvimento das rotas e validação dos dados recebidos. |
| João Pedro Strasser Santos | A informar | Modelagem do banco e integração com Prisma. |
| Rogério Mota de Melo | A informar | Configuração do ambiente, testes e publicação no Render. |

## Tecnologias

| Tecnologia | Versão de referência | Uso |
| --- | --- | --- |
| Node.js | 24.13.1 | Execução do JavaScript no servidor |
| npm | 11.17.0 | Instalação e scripts; referência da revisão anterior |
| Express | 5.2.1 | Rotas e respostas HTTP |
| Prisma CLI / Client | 7.10.0 | Modelagem, migrações e consultas |
| PostgreSQL | 18.6 | Persistência relacional; versão registrada na coleta local |
| @prisma/adapter-pg | 7.10.0 | Integração Prisma/PostgreSQL |
| pg | 8.23.1 | Driver de acesso ao banco |
| dotenv | 18.0.5 | Leitura do arquivo .env |

As dependências exatas estão no package-lock.json; as versões do servidor e banco publicados podem diferir das referências locais.

## Pré-requisitos

Node.js 24 LTS, npm, Git e um banco PostgreSQL acessível e vazio para a instalação inicial. Execute os comandos na raiz, onde estão package.json e prisma7.config.ts, e não na subpasta de código.

## Instalação e configuração

~~~sh
git clone https://github.com/ark-pkr/balsas-experience-api.git
cd balsas-experience-api
npm ci
~~~

Copie .env.example para .env (no PowerShell: Copy-Item .env.example .env) e preencha suas credenciais. Exemplo local, sem senha real:

~~~dotenv
DATABASE_URL="postgresql://USUARIO:SENHA_FICTICIA@localhost:5432/balsas_experience?schema=public"
DIRECT_URL="postgresql://USUARIO:SENHA_FICTICIA@localhost:5432/balsas_experience?schema=public"
PORT=3000
~~~

DATABASE_URL é usada pela aplicação. DIRECT_URL é usada pelo Prisma CLI e pode ser omitida quando a mesma conexão serve para consultas e migrações. Para bancos hospedados, use os endereços fornecidos pelo provedor e os parâmetros TLS necessários. O banco deve existir antes das migrações. Nunca publique .env ou credenciais reais.

## Migrações, população e execução

~~~sh
npx prisma generate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts
npm run seed
npm start
~~~

O seed **apaga os dados existentes** e insere oito atrações e três avaliações. Execute somente em banco novo ou descartável. Em um banco já populado, pule o seed. Para desenvolvimento: npm run dev. Servidor local: http://localhost:3000.

Para criar novas migrações durante o desenvolvimento: npx prisma migrate dev --config prisma7.config.ts --name nome_da_mudanca.

## Modelo de dados

- Categoria: id (PK), nome (único); possui várias atrações.
- Tag: id (PK), nome (único); relaciona-se com várias atrações.
- Atracao: id (PK), nome, descricao, cidade (padrão Balsas), estado (padrão MA), distanciaCentroKm (opcional), criadaEm e categoriaId (FK).
- Avaliacao: id (PK), visitante, nota, comentario (opcional), criadaEm e atracaoId (FK).
- _AtracaoToTag: associação N:N gerenciada pelo Prisma, com chaves A e B e chave primária composta.

Tags ficam em tabela separada para reutilizar nomes entre atrações, evitar duplicação e permitir filtros por relacionamento. A exclusão de uma atração remove suas avaliações e associações; preserva categorias e tags. Veja [schema.prisma](prisma/schema.prisma).

## Endpoints

| Método | Caminho | Descrição | Status esperado |
| --- | --- | --- | --- |
| GET | / | Identificação da API | 200 |
| GET | /health | Estado do processo HTTP | 200 |
| GET | /categorias | Categorias com contagem de atrações | 200 |
| GET | /atracoes | Lista; aceita categoria, tag e q | 200 |
| GET | /atracoes/:id | Detalhes, avaliações, média e total | 200, 404 |
| POST | /atracoes | Cria atração | 201, 400, 409 |
| PUT | /atracoes/:id | Substitui dados e tags | 200, 400, 404, 409 |
| DELETE | /atracoes/:id | Remove atração | 204, 404 |
| POST | /atracoes/:id/avaliacoes | Registra avaliação | 201, 400, 404 |

Falhas inesperadas podem retornar 500. /health verifica o processo HTTP; /categorias e /atracoes exercitam o banco. As rotas de escrita não exigem autenticação nesta versão acadêmica.

POST e PUT exigem nome, descricao e categoria (nome da categoria, não ID). Os campos cidade, estado, distanciaCentroKm e tags são opcionais. PUT substitui as tags e restaura os padrões dos campos opcionais omitidos. Avaliações exigem visitante e nota inteira de 1 a 5; comentario é opcional.

## Exemplos de requisição

Use curl.exe no PowerShell. As escritas de exemplo abaixo usam o servidor local.

~~~sh
curl -i "https://balsas-experience-api-lgdm.onrender.com/categorias"
curl -i "https://balsas-experience-api-lgdm.onrender.com/atracoes?categoria=Lazer&tag=lazer&q=rio"
curl -i "https://balsas-experience-api-lgdm.onrender.com/atracoes/2147483647"
curl -i http://localhost:3000/atracoes/1
curl -i -X POST http://localhost:3000/atracoes -H "Content-Type: application/json" -d '{"nome":"Passeio de exemplo","descricao":"Registro de teste","categoria":"Lazer","tags":["lazer"]}'
curl -i -X PUT http://localhost:3000/atracoes/ID_CRIADO -H "Content-Type: application/json" -d '{"nome":"Passeio atualizado","descricao":"Descrição revisada","categoria":"Lazer","tags":["lazer"]}'
curl -i -X POST http://localhost:3000/atracoes/ID_CRIADO/avaliacoes -H "Content-Type: application/json" -d '{"visitante":"Visitante de teste","nota":5,"comentario":"Ótima experiência"}'
curl -i -X DELETE http://localhost:3000/atracoes/ID_CRIADO
~~~

Substitua ID_CRIADO pelo id devolvido na criação. Os exemplos de shell são para Bash; para um cliente HTTP com JSON independente do shell, use [requisicoes.http](docs/requisicoes.http).

Exemplo completo de consulta publicada:

~~~http
GET /categorias HTTP/1.1
Host: balsas-experience-api-lgdm.onrender.com
Accept: application/json
~~~

~~~http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

[
  {
    "id": 1,
    "nome": "Histórico e Urbano",
    "atracoes": 4
  },
  {
    "id": 2,
    "nome": "Lazer",
    "atracoes": 1
  },
  {
    "id": 3,
    "nome": "Natureza e Aventura",
    "atracoes": 3
  }
]
~~~

Uma busca inexistente retorna 404 com {"erro":"Atração não encontrada"}. Uma criação válida retorna 201, o objeto criado e o cabeçalho Location: /atracoes/ID. Uma exclusão bem-sucedida retorna 204 sem corpo.

## Verificação e evidências

~~~sh
npm test
node tools/capture-public.mjs
~~~

Os testes de integração dependem do banco configurado em .env, usam a porta 3108 e criam/removem um registro temporário. Não executam seed. Evidências locais de 200, 404, 201 e 204 estão em docs/evidencias; a captura 5-publicada.png mostra a resposta real da API publicada. As capturas são visualizações dos registros do cliente HTTP Node.js/fetch; os JSON integrais também estão preservados.

## Hospedagem

Render: configuração em render.yaml, build npm ci --include=dev && npm run build, início npm start. Configurar DATABASE_URL e DIRECT_URL no painel; PORT é fornecida pela hospedagem. O build gera o cliente e aplica migrações; não executa seed.

## Dificuldades e aprendizados

Os relatos individuais propostos estão em [RELATOS-EQUIPE.md](docs/RELATOS-EQUIPE.md) e precisam ser confirmados pelos integrantes. O código demonstra integração do Prisma 7 com PrismaPg, relações 1:N e N:N, migrações, exclusão em cascata e respostas HTTP 201/204/404. Esses resultados técnicos não substituem os relatos pessoais exigidos na atividade.

## Relatório e entrega

PDF atualizado: [relatório](output/pdf/balsas-experience-api-equipe-a-definir.pdf). Antes da submissão, preencher as matrículas, confirmar o nome da equipe e os relatos individuais, conferir a grafia do professor e renomear para balsas-experience-api-equipe-NOME-DA-EQUIPE.pdf. Apenas um integrante envia somente o PDF pelo portal, até 17/10/2026 às 23h30.
