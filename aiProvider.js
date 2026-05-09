/**
 * Abstração para diferentes provedores de IA
 * Permite trocar entre OpenAI, AWS Bedrock, SageMaker, etc. sem alterar o código principal
 */

const OpenAI = require('openai');
const AWS = require('aws-sdk');
require('dotenv').config();

/**
 * Interface base para provedores de IA
 * Todos os provedores devem implementar este padrão
 */
class AIProvider {
  async generateFlashcards(prompt) {
    throw new Error('generateFlashcards() deve ser implementado no provedor');
  }
}



/**
 * Provedor AWS Bedrock
 * Use este para Claude, Llama, Mistral ou outros modelos do Bedrock
 */
class AWSBedrockProvider extends AIProvider {
  constructor() {
    super();
    AWS.config.update({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.client = new AWS.BedrockRuntime();
    this.modelId = process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-v2';
  }

  async generateFlashcards(prompt) {
    try {
      // Converter para .md
      const systemPrompt = 'Você é um assistente que gera flashcards para estudo. Responda sempre em JSON com a estrutura: { "flashcards": [ { "tema": "string", "nivel": "iniciante|intermediario|avancado", "pergunta": "string", "resposta": "string" } ] }';
      
      const params = {
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          prompt: `${systemPrompt}\n\nUsuário: ${prompt}`,
          max_tokens_to_sample: 2000,
          temperature: 0.7,
        })
      };

      const response = await this.client.invokeModel(params).promise();
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return responseBody.completion;
    } catch (error) {
      throw new Error(`Erro ao gerar flashcards via AWS Bedrock: ${error.message}`);
    }
  }
}


/**
 * Factory para criar a instância correta do provedor
 */
function createAIProvider() {
  const provider = process.env.AI_PROVIDER;

  switch (provider.toLowerCase()) {
    case 'aws-bedrock':
      console.log('📌 Usando provedor: AWS Bedrock');
      return new AWSBedrockProvider();
    default:
      throw new Error(`Provedor desconhecido: ${provider}`);
  }
}

module.exports = {
  createAIProvider,
  AWSBedrockProvider
};
