# Pendências para finalizar a submissão

A parte técnica foi documentada e verificada. Estes dados não existem nos arquivos e precisam ser confirmados pela equipe:

- Nome da equipe e data final da entrega.
- Instituição, curso, disciplina e professor.
- Matrícula e contribuição de todos os integrantes. Nomes confirmados: Carinne Borges da Silva; Júlio César Lima dos Reis; João Pedro Strasser Santos; Rogério Mota de Melo.
- Dificuldade concreta, solução e aprendizado de cada integrante.
- URL da API publicada. Repositório público criado: https://github.com/ark-pkr/balsas-experience-api.
- Captura da API pública respondendo a uma requisição.
- Nome do único integrante responsável pela submissão.

Não submeter o PDF de rascunho. Depois de confirmar os dados, atualizar README e relatório, inserir a captura pública e gerar o PDF final com o nome exigido.

## Arquivos e reprodução

- `docs/evidencias/registros-http.json`: requisições e respostas reais completas, sem credenciais.
- `docs/evidencias/*.png`: capturas da visualização dos registros do cliente HTTP Node.js/fetch.
- `node tools/capture-evidence.mjs`: coleta novamente as quatro evidências locais, criando e removendo uma atração temporária. Não executa seed.
- `node tools/build-delivery.mjs`: gera o relatório HTML e o PDF de rascunho. Requer Google Chrome instalado no Windows; outro caminho pode ser informado pela variável `CHROME_PATH`.
- `output/pdf/relatorio-entrega.html`: fonte visual do documento, editável.

Os perfis temporários do navegador ficam em `tmp/`, que é ignorado pelo Git. Não publicar `.env`.
