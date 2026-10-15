# Balsas Experience API

API REST para consultar e gerenciar atrações turísticas de Balsas-MA, com categorias, tags e avaliações. Serve como fonte de dados para aplicações de turismo destinadas a moradores e visitantes, reunindo um catálogo pesquisável em PostgreSQL.

## Equipe e links

Integrantes informados pela equipe. Matrículas e contribuições ainda precisam ser confirmadas.

| Nome completo | Matrícula | Contribuição |
| --- | --- | --- |
| Carinne Borges da Silva | A informar | A informar |
| Júlio César Lima dos Reis | A informar | A informar |
| João Pedro Strasser Santos | A informar | A informar |
| Rogério Mota de Melo | A informar | A informar |

- Nome da equipe: **a informar**.
- Repositório público no GitHub: [ark-pkr/balsas-experience-api](https://github.com/ark-pkr/balsas-experience-api).
- API publicada: **URL a informar**.
- Documento de entrega: pasta `output/pdf/`. Enquanto houver pendências, o PDF é um rascunho.

## Tecnologias utilizadas

| Tecnologia | Versão verificada | Finalidade |
| --- | --- | --- |
| Node.js | 24.13.1 | Executar JavaScript no servidor |
| Express | 5.2.1 | Rotas HTTP e tratamento de requisições |
| Prisma CLI e Client | 7.10.0 | Modelo, migrações e consultas |
| @prisma/adapter-pg | 7.10.0 | Integrar Prisma ao driver PostgreSQL |
| PostgreSQL | 18.6 | Persistência relacional |
| pg | 8.23.1 | Driver PostgreSQL |
| dotenv | 18.0.5 | Carregar variáveis de ambiente |
| npm | 11.17.0 | Dependências e scripts |

## Pré-requisitos

Node.js 24 LTS (versão utilizada na verificação), npm, Git e um banco PostgreSQL acessível, local ou hospedado, por exemplo no Neon.

## Instalar e configurar

Clone o repositório público:

```sh
git clone https://github.com/ark-pkr/balsas-experience-api.git
cd balsas-experience-api
npm ci
```

Execute os comandos na raiz, onde estão `package.json`, `prisma7.config.ts` e `prisma/`. O código HTTP está em `balsas-experience-api/src/`.

Copie `.env.example` para `.env` e preencha as credenciais somente no arquivo `.env`:

```dotenv
DATABASE_URL="postgresql://USUARIO:SENHA_FICTICIA@HOST-POOLER/neondb?sslmode=require"
DIRECT_URL="postgresql://USUARIO:SENHA_FICTICIA@HOST-DIRETO/neondb?sslmode=require&connect_timeout=30"
PORT=3000
```

As senhas acima são fictícias. O `.env` está ignorado pelo Git. A aplicação usa `DATABASE_URL`; o Prisma CLI usa `DIRECT_URL` ou, na ausência dela, `DATABASE_URL`.

## Migrações, carga inicial e servidor

```sh
npx prisma generate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts
npm run seed
npm start
```

**Execute o seed somente em banco novo ou descartável:** ele apaga os dados e insere oito atrações e três avaliações de exemplo. Se o banco já estiver preenchido, pule `npm run seed`.

Acesse `http://localhost:3000/health` e `http://localhost:3000/atracoes`. Para reinício automático, use `npm run dev`. Novas migrações em desenvolvimento: `npx prisma migrate dev --config prisma7.config.ts --name nome_da_alteracao`.

## Modelo de dados

| Tabela | Campos |
| --- | --- |
| Categoria | id: inteiro, PK automática; nome: texto único |
| Tag | id: inteiro, PK automática; nome: texto único |
| Atracao | id: inteiro, PK automática; nome e descricao: texto; cidade: texto, padrão Balsas; estado: texto, padrão MA; distanciaCentroKm: inteiro opcional; criadaEm: data/hora automática; categoriaId: FK obrigatória |
| Avaliacao | id: inteiro, PK automática; visitante: texto; nota: inteiro; comentario: texto opcional; criadaEm: data/hora automática; atracaoId: FK obrigatória |
| _AtracaoToTag | A: FK para Atracao; B: FK para Tag; chave primária composta (A, B) |

Categoria tem várias atrações; Atracao tem várias avaliações; Atracao e Tag têm relação muitos-para-muitos. As tags ficam em uma tabela separada para reutilizar nomes entre atrações, evitar duplicações e permitir filtros relacionais.

Excluir uma atração remove suas avaliações e vínculos com tags em cascata. Categorias e tags permanecem cadastradas. A nota de 1 a 5 é validada pela API.

## Endpoints

| Método | Caminho | Função | Status esperado |
| --- | --- | --- | --- |
| GET | / | Identificação da API | 200 |
| GET | /health | Estado do processo HTTP; não verifica o banco | 200 |
| GET | /atracoes | Listar por nome, com categoria e tags | 200 |
| GET | /atracoes?categoria=Lazer&tag=lazer&q=rio | Combinar filtros de categoria, tag e texto | 200 |
| GET | /atracoes/:id | Detalhar, com avaliações, média e total | 200, 404 |
| GET | /categorias | Categorias e contagem de atrações | 200 |
| POST | /atracoes | Criar atração | 201, 400, 409 |
| PUT | /atracoes/:id | Substituir dados e tags | 200, 400, 404, 409 |
| DELETE | /atracoes/:id | Remover atração e avaliações | 204, 404 |
| POST | /atracoes/:id/avaliacoes | Registrar avaliação | 201, 400, 404 |

Falhas inesperadas podem retornar 500. Os filtros ignoram maiúsculas/minúsculas. POST e PUT exigem `nome`, `descricao` e `categoria`; `cidade`, `estado`, `distanciaCentroKm` e `tags` são opcionais. PUT substitui a lista de tags e restaura os padrões dos campos opcionais omitidos.

### Exemplos de requisição

Use `curl.exe` no PowerShell ou `curl` no Linux/macOS:

```sh
curl -i http://localhost:3000/
curl -i http://localhost:3000/health
curl -i http://localhost:3000/atracoes
curl -i "http://localhost:3000/atracoes?tag=rio"
curl -i http://localhost:3000/atracoes/2147483647
curl -i http://localhost:3000/categorias
```

Exemplo completo de criação:

```http
POST /atracoes HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "nome": "Atração de exemplo",
  "descricao": "Registro ilustrativo para demonstrar a API.",
  "categoria": "Lazer",
  "cidade": "Balsas",
  "estado": "MA",
  "distanciaCentroKm": 2,
  "tags": ["lazer"]
}
```

Resposta ilustrativa: IDs e data variam conforme o banco.

```http
HTTP/1.1 201 Created
Location: /atracoes/123
Content-Type: application/json

{
  "id": 123,
  "nome": "Atração de exemplo",
  "descricao": "Registro ilustrativo para demonstrar a API.",
  "cidade": "Balsas",
  "estado": "MA",
  "distanciaCentroKm": 2,
  "criadaEm": "2026-10-15T12:00:00.000Z",
  "categoriaId": 1,
  "categoria": { "id": 1, "nome": "Lazer" },
  "tags": [{ "id": 1, "nome": "lazer" }]
}
```

Substitua `123` pelo ID retornado na criação:

```http
GET /atracoes/123 HTTP/1.1
Host: localhost:3000
```

```http
PUT /atracoes/123 HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{"nome":"Atração atualizada","descricao":"Nova descrição","categoria":"Lazer","tags":["lazer"]}
```

```http
POST /atracoes/123/avaliacoes HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{"visitante":"Visitante de exemplo","nota":5,"comentario":"Gostei do passeio."}
```

```http
DELETE /atracoes/123 HTTP/1.1
Host: localhost:3000
```

Remoção bem-sucedida: `204 No Content`, sem corpo. Busca por ID inexistente: `404`, com `{"erro":"Atração não encontrada"}`.

## Testes e evidências

```sh
npm test
```

O teste inicia uma API temporária na porta 3108 e depende de um banco com a carga inicial. Cria, atualiza, avalia e remove uma atração temporária; não executa o seed. Na verificação de 15/10/2026, os 15 cenários passaram, incluindo média e exclusão em cascata.

Os registros HTTP e capturas locais ficam em `docs/evidencias/`. A evidência pública depende da URL de publicação.

## Publicação no Render

O repositório contém `render.yaml` com a configuração de um Web Service gratuito e Node.js 24.13.1. Para iniciar a configuração, use [Deploy to Render](https://render.com/deploy?repo=https://github.com/ark-pkr/balsas-experience-api). O fluxo exige uma conta Render e os valores de `DATABASE_URL` e `DIRECT_URL` no painel; o arquivo não contém credenciais reais. Esse link configura o serviço, mas não é o endereço da API publicada.

1. Publique este projeto em um repositório público no GitHub, sem `.env` nem `node_modules`.
2. Crie um Web Service no Render conectado ao repositório, usando a raiz do projeto.
3. Build Command: `npm ci && npm run build`. Start Command: `npm start`.
4. Cadastre `DATABASE_URL` e `DIRECT_URL` como variáveis secretas.
5. O build gera o cliente Prisma e aplica migrações. O seed é separado e só deve ser executado se o banco estiver vazio.
6. Verifique `/health` e `/atracoes` na URL pública e capture o funcionamento.
7. Atualize os links do README e do PDF antes de submeter.

O servidor escuta `0.0.0.0` e usa a `PORT` da hospedagem, ou 3000 localmente.

## Entrega acadêmica

Cada integrante deve confirmar sua contribuição, dificuldade e aprendizado real. Apenas um integrante envia o PDF pelo portal, com o nome `balsas-experience-api-equipe-<nome-da-equipe>.pdf`. O PDF deve conter os dez tópicos pedidos, os links públicos e as evidências locais e públicas.
