const express = require('express');
const cors = require('cors');
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

