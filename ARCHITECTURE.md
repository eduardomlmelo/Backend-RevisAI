# Arquitetura Flexível de Provedores de IA

## 📌 Visão Geral

O backend foi estruturado com o **padrão Strategy** para permitir trocar entre diferentes provedores de IA sem alterar o código principal (`server.js`). Você pode facilmente alternar entre OpenAI, AWS Bedrock, AWS SageMaker ou criar seu próprio provedor customizado.

## 🔄 Como Funciona

```
server.js
   ↓
aiProvider.js (Factory)
   ↓
OpenAIProvider / AWSBedrockProvider / AWSSageMakerProvider
   ↓
IA Model
```

## 🚀 Configuração por Provedor

### 1️⃣ **OpenAI (Padrão)**

**Variável de Ambiente:**

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

**Instalação:**

```bash
npm install openai
```

**Iniciando:**

```bash
npm start
```

---

### 2️⃣ **AWS Bedrock** (Recomendado para maior flexibilidade)

Modelos disponíveis:

- `anthropic.claude-v2` (Claude 2)
- `anthropic.claude-instant-v1` (Claude Instant)
- `meta.llama2-13b-chat-v1` (Llama 2)
- `mistral.mistral-7b-instruct-v0:2` (Mistral)

**Variáveis de Ambiente:**

```env
AI_PROVIDER=aws-bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BEDROCK_MODEL_ID=anthropic.claude-v2
```

**Instalação:**

```bash
npm install aws-sdk
```

**IAM Permissions Necessários:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "arn:aws:bedrock:*::foundation-model/*"
    }
  ]
}
```

---

### 3️⃣ **AWS SageMaker** (Para modelos customizados)

Use esta opção se você treinou um modelo customizado no SageMaker.

**Variáveis de Ambiente:**

```env
AI_PROVIDER=aws-sagemaker
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SAGEMAKER_ENDPOINT_NAME=seu-endpoint-name
```

**Instalação:**

```bash
npm install aws-sdk
```

**IAM Permissions Necessários:**

```json
{
  "Effect": "Allow",
  "Action": "sagemaker:InvokeEndpoint",
  "Resource": "arn:aws:sagemaker:*:*:endpoint/*"
}
```

---

## 🔧 Como Adicionar um Novo Provedor

### Passo 1: Criar a classe no `aiProvider.js`

```javascript
class MeuProvedor extends AIProvider {
  constructor() {
    super();
    // Inicializar seu cliente/SDK
  }

  async generateFlashcards(prompt) {
    try {
      // Sua lógica aqui
      const response = await meuServico.chamarAPI(prompt);
      return response;
    } catch (error) {
      throw new Error(
        `Erro ao gerar flashcards via MeuProvedor: ${error.message}`,
      );
    }
  }
}
```

### Passo 2: Adicionar caso no factory

```javascript
function createAIProvider() {
  const provider = process.env.AI_PROVIDER || "openai";

  switch (provider.toLowerCase()) {
    case "openai":
      return new OpenAIProvider();

    case "aws-bedrock":
      return new AWSBedrockProvider();

    case "meu-provedor": // ← Adicionar aqui
      return new MeuProvedor();

    default:
      throw new Error(`Provedor desconhecido: ${provider}`);
  }
}
```

### Passo 3: Configurar `.env`

```env
AI_PROVIDER=meu-provedor
# Suas variáveis de configuração
```

---

## 📊 Comparação de Provedores

| Aspecto           | OpenAI         | AWS Bedrock            | AWS SageMaker |
| ----------------- | -------------- | ---------------------- | ------------- |
| **Setup**         | Fácil          | Médio                  | Complexo      |
| **Custo**         | Pago por uso   | Pago por uso           | Pago por hora |
| **Modelos**       | GPT-3.5, GPT-4 | Claude, Llama, Mistral | Customizado   |
| **Latência**      | Baixa          | Baixa                  | Muito baixa   |
| **Flexibilidade** | Baixa          | Alta                   | Muito alta    |

---

## 🧪 Testando o Provedor

**Verificar saúde do servidor:**

```bash
curl http://localhost:5000/api/health
```

**Gerar flashcards:**

```bash
curl -X POST http://localhost:5000/api/generate-flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Gere 3 flashcards sobre Biologia Celular",
    "userId": "user123"
  }'
```

---

## 🔐 Boas Práticas

1. **Nunca commitar `.env`** - Use `.env.example` para documentar variáveis necessárias
2. **Usar AWS Secrets Manager** em produção para gerenciar credenciais
3. **Validar respostas da IA** antes de salvar no Firebase
4. **Implementar rate limiting** para evitar abuso
5. **Registrar (logging) todas as chamadas** para debug e auditoria

---

## 🐛 Troubleshooting

### Erro: "Provedor desconhecido"

- Verifique o valor de `AI_PROVIDER` no `.env`
- Certifique-se de que as dependências necessárias foram instaladas

### Erro: "Invalid API Key"

- Verifique se a chave está correta e ativa
- Verifique permissões da chave (escopo, regiões, etc.)

### Erro: "JSON parse error"

- O modelo pode estar retornando um formato inesperado
- Tente ajustar o prompt do sistema ou o modelo utilizado

---

## 📚 Recursos Úteis

- [OpenAI API](https://platform.openai.com/docs)
- [AWS Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
- [AWS SageMaker Runtime](https://docs.aws.amazon.com/sagemaker/latest/dg/runtime.html)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/)
