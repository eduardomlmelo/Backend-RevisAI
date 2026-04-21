const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { db, admin } = require('./firebaseAdmin');
const { createAIProvider } = require('./aiProvider');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar o provedor de IA dinamicamente
let aiProvider;
try {
  aiProvider = createAIProvider();
} catch (error) {
  console.error('❌ Erro ao inicializar provedor de IA:', error.message);
  process.exit(1);
}

/**
 * POST /api/generate-flashcards
 * Recebe um prompt do usuário, gera flashcards via IA e salva no Firebase
 */
app.post('/api/generate-flashcards', async (req, res) => {
  try {
    const { prompt, userId } = req.body;

    // Validação de entrada
    if (!prompt || !userId) {
      return res.status(400).json({ 
        error: 'Prompt e userId são obrigatórios' 
      });
    }

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Prompt deve ser uma string não vazia' 
      });
    }

    console.log(`📝 Gerando flashcards para usuário: ${userId}`);

    // Gerar resposta com o provedor de IA configurado
    const responseText = await aiProvider.generateFlashcards(prompt);
    
    // Parsear resposta JSON
    let flashcardsData;
    try {
      flashcardsData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erro ao parsear resposta da IA:', parseError.message);
      return res.status(500).json({ 
        error: 'Erro ao processar resposta da IA. Verifique o formato retornado.' 
      });
    }

    // Validar estrutura da resposta
    if (!flashcardsData.flashcards || !Array.isArray(flashcardsData.flashcards)) {
      return res.status(500).json({ 
        error: 'Resposta da IA não contém array "flashcards"' 
      });
    }

    // Salvar no Firestore
    const docRef = await db.collection('flashcards').add({
      userId,
      prompt,
      flashcards: flashcardsData.flashcards,
      provider: process.env.AI_PROVIDER || 'openai',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Flashcards salvos com ID: ${docRef.id}`);

    res.status(201).json({ 
      id: docRef.id, 
      flashcards: flashcardsData.flashcards 
    });

  } catch (error) {
    console.error('❌ Erro ao gerar flashcards:', error.message);
    res.status(500).json({ 
      error: 'Erro ao gerar flashcards. Tente novamente mais tarde.' 
    });
  }
});

/**
 * GET /api/flashcards/:userId
 * Retorna todos os flashcards de um usuário
 */
app.get('/api/flashcards/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        error: 'userId é obrigatório' 
      });
    }

    console.log(`🔍 Buscando flashcards para usuário: ${userId}`);

    const snapshot = await db.collection('flashcards')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const flashcards = [];
    snapshot.forEach(doc => {
      flashcards.push({ 
        id: doc.id, 
        ...doc.data() 
      });
    });

    console.log(`✅ ${flashcards.length} flashcard(s) encontrado(s)`);

    res.json({ 
      userId, 
      count: flashcards.length,
      data: flashcards 
    });

  } catch (error) {
    console.error('❌ Erro ao buscar flashcards:', error.message);
    res.status(500).json({ 
      error: 'Erro ao buscar flashcards' 
    });
  }
});

/**
 * GET /api/health
 * Verifica se o servidor e o provedor de IA estão funcionando
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    provider: process.env.AI_PROVIDER || 'openai'
  });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📌 Provedor de IA: ${process.env.AI_PROVIDER || 'openai'}`);
});