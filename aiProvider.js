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
 * Provedor OpenAI
 */
class OpenAIProvider extends AIProvider {
  constructor() {
    super();
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateFlashcards(prompt) {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente que gera flashcards para estudo. Responda sempre em JSON com a estrutura: { "flashcards": [ { "tema": "string", "nivel": "iniciante|intermediario|avancado", "pergunta": "string", "resposta": "string" } ] }'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      throw new Error(`Erro ao gerar flashcards via OpenAI: ${error.message}`);
    }
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
 * Provedor AWS SageMaker
 * Use este se você tiver um endpoint customizado no SageMaker
 */
class AWSSageMakerProvider extends AIProvider {
  constructor() {
    super();
    AWS.config.update({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.client = new AWS.SageMakerRuntime();
    this.endpointName = process.env.AWS_SAGEMAKER_ENDPOINT_NAME;
  }

  async generateFlashcards(prompt) {
    try {
      const params = {
        EndpointName: this.endpointName,
        Body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 2000,
            temperature: 0.7,
          }
        }),
        ContentType: 'application/json',
      };

      const response = await this.client.invokeEndpoint(params).promise();
      const responseBody = JSON.parse(new TextDecoder().decode(response.Body));
      
      return responseBody[0].generated_text || JSON.stringify(responseBody);
    } catch (error) {
      throw new Error(`Erro ao gerar flashcards via AWS SageMaker: ${error.message}`);
    }
  }
}

/**
 * Factory para criar a instância correta do provedor
 */
function createAIProvider() {
  const provider = process.env.AI_PROVIDER || 'openai';

  switch (provider.toLowerCase()) {
    case 'openai':
      console.log('📌 Usando provedor: OpenAI');
      return new OpenAIProvider();
    
    case 'aws-bedrock':
      console.log('📌 Usando provedor: AWS Bedrock');
      return new AWSBedrockProvider();
    
    case 'aws-sagemaker':
      console.log('📌 Usando provedor: AWS SageMaker');
      return new AWSSageMakerProvider();
    
    default:
      throw new Error(`Provedor desconhecido: ${provider}`);
  }
}

module.exports = {
  createAIProvider,
  OpenAIProvider,
  AWSBedrockProvider,
  AWSSageMakerProvider,
};
