# Dificuldades e aprendizados

Relatos individuais e contribuições revisados e confirmados pela equipe.

## Carinne da Silva Borges

**Contribuição:** Organização do README, descrição dos endpoints e seleção das evidências de funcionamento.

**Dificuldade:** Distinguir os códigos 200, 201, 204 e 404 na documentação.

**Solução:** Comparação das requisições e respostas para registrar método, caminho, corpo e status de cada operação.

**Aprendizado:** Documentar uma API de forma reproduzível, incluindo exemplos e instruções de execução.

## Júlio César Lima dos Reis

**Contribuição:** Desenvolvimento das rotas de atrações e avaliações, com validação dos dados recebidos.

**Dificuldade:** Tratar campos obrigatórios, notas inválidas e registros inexistentes.

**Solução:** Organização dos controladores e verificação dos retornos HTTP em entradas válidas e inválidas.

**Aprendizado:** Implementar operações CRUD no Express, validar JSON e utilizar códigos de status adequados.

## João Pedro Strasser Santos

**Contribuição:** Modelagem das entidades, migrações e integração das consultas com Prisma e PostgreSQL.

**Dificuldade:** Representar categorias, tags reutilizáveis e avaliações sem duplicar informações.

**Solução:** Definição de relações 1:N e N:N no schema, com chaves estrangeiras e exclusão em cascata das avaliações.

**Aprendizado:** Usar migrações, consultar relações com Prisma e preservar a integridade dos dados.

## Rogério Mota de Melo

**Contribuição:** Configuração do ambiente, testes de integração e publicação da API no Render.

**Dificuldade:** Conectar a aplicação ao banco hospedado e configurar as variáveis de ambiente.

**Solução:** Configuração de DATABASE_URL, DIRECT_URL e comandos de build, seguida de testes das rotas publicadas.

**Aprendizado:** Publicar uma API, proteger credenciais e verificar o funcionamento do servidor e do banco.
