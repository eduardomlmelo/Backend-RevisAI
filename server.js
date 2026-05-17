const express = require('express');
const cors = require('cors');
const { db, admin } = require('./firebaseAdmin');
require('dotenv').config();
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


function parseFlashcardsMarkdown(markdown) {
  const cards = [];
  const blocks = markdown.split('---').filter(block => block.trim());

  for (const block of blocks) {
    const perguntaMatch = block.match(/\*\*Pergunta:\*\*\s*(.+)/);
    const respostaMatch = block.match(/\*\*Resposta:\*\*\s*([\s\S]+?)(?=\n\n|$)/);

    if (perguntaMatch && respostaMatch) {
      cards.push({
        question: perguntaMatch[1].trim(),
        answer: respostaMatch[1].trim(),
      });
    }
  }

  return cards;
}

/**
 * POST /api/generate-flashcards
 * Recebe um prompt do usuário, gera flashcards via IA e salva no Firebase
 */
app.post('/api/generate-flashcards', async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'O campo "content" é obrigatório.' });
  }

  const client = new LambdaClient({
    region: "us-east-2",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  // Formato que o Lambda (API Gateway proxy) espera
  const payload = JSON.stringify({
    httpMethod: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    isBase64Encoded: false,

  });

  const command = new InvokeCommand({
    FunctionName: "flashcard-api",
    Payload: Buffer.from(payload),
    InvocationType: "RequestResponse",
  });

  try {
    const response = await client.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());

    console.log("Resposta do Lambda:", result);

    // Lambda retorna { statusCode, body } — extraia o body real
    const body = parseFlashcardsMarkdown(result.body);

    res.status(result.statusCode || 200).json(body);
  } catch (error) {
    console.error("Erro ao invocar Lambda:", error);
    res.status(500).json({
      error: "Falha na comunicação com o serviço de geração.",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

/**
 * PUT /api/flashcards/:id
 * Edita um flashcard existente, atualizando o conceito (question) e/ou a resposta (answer).
 */
app.put('/api/flashcards/:id', async (req, res) => {
  const { id } = req.params; // Pega o ID da URL
  const { question, answer } = req.body; // Pega os novos dados enviados pelo frontend

  // 1. Validação simples: verificar se há dados para atualizar
  if (!question && !answer) {
    return res.status(400).json({
      error: 'Nenhum dado fornecido. Envie "question" ou "answer" para atualizar.'
    });
  }

  try {
    // 2. Referência ao documento do flashcard no Firestore
    // Assumindo que você salva os flashcards numa coleção chamada 'flashcards'
    const flashcardRef = db.collection('flashcards').doc(id);

    // 3. (Opcional) Verificar se o flashcard existe antes de tentar atualizar
    const doc = await flashcardRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Flashcard não encontrado.' });
    }

    // 4. Montar o objeto com as informações a serem atualizadas
    const updateData = {};
    if (question) updateData.question = question;
    if (answer) updateData.answer = answer;

    // Dica extra: você pode salvar a data da última alteração
    updateData.updatedAt = new Date().toISOString();

    // 5. Persistir as alterações no Firestore
    await flashcardRef.update(updateData);

    // 6. Retornar resposta de sucesso para o frontend
    res.status(200).json({
      message: 'Flashcard atualizado com sucesso.',
      id,
      ...updateData
    });

  } catch (error) {
    console.error("Erro ao atualizar flashcard:", error);
    res.status(500).json({
      error: "Falha ao atualizar o flashcard no banco de dados.",
      details: error.message,
    });
  }
});


/**
 * DELETE /api/flashcards/:id
 * Exclui um flashcard existente pelo seu ID.
 */
app.delete('/api/flashcards/:id', async (req, res) => {
  const { id } = req.params; // Pega o ID da URL

  try {
    // 1. Referência ao documento do flashcard no Firestore
    const flashcardRef = db.collection('flashcards').doc(id);

    // 2. (Opcional) Verificar se o flashcard existe antes de tentar deletar
    // Se você não ligar de tentar deletar algo que já não existe, pode pular essa parte
    const doc = await flashcardRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Flashcard não encontrado para exclusão.' });
    }

    // 3. Excluir o documento no Firestore
    await flashcardRef.delete();

    // 4. Retornar uma resposta de sucesso
    res.status(200).json({
      message: 'Flashcard excluído com sucesso.',
      id
    });

  } catch (error) {
    console.error("Erro ao excluir flashcard:", error);
    res.status(500).json({
      error: "Falha ao excluir o flashcard no banco de dados.",
      details: error.message,
    });
  }
});
