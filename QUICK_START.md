# 🚀 Guia Rápido: Trocando Entre Provedores de IA

## Situação Atual

✅ Backend estruturado com **OpenAI** como padrão
✅ Pronto para trocar para **AWS Bedrock** ou **AWS SageMaker**

---

## ⚡ Como Trocar Para AWS Bedrock

### 1. Instalar dependências AWS

```bash
npm install aws-sdk
```

### 2. Atualizar `.env`

```env
AI_PROVIDER=aws-bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxxxxxxx
AWS_BEDROCK_MODEL_ID=anthropic.claude-v2
```

### 3. Reiniciar servidor

```bash
npm start
```

Pronto! O servidor agora usa **Claude via AWS Bedrock** em vez de OpenAI.

---

## 📋 Modelos Disponíveis no AWS Bedrock

| ID do Modelo                         | Descrição                    |
| ------------------------------------ | ---------------------------- |
| `anthropic.claude-v2`                | Claude 2 (mais capaz)        |
| `anthropic.claude-instant-v1`        | Claude Instant (mais rápido) |
| `meta.llama2-13b-chat-v1`            | Llama 2 13B                  |
| `mistral.mistral-7b-instruct-v0:2`   | Mistral 7B                   |
| `cohere.command-light-text-v14:7:4k` | Cohere Command Light         |

---

## 🔄 Como Trocar Para AWS SageMaker

### 1. Ter um endpoint do SageMaker ativo

```
https://runtime.sagemaker.REGION.amazonaws.com/endpoints/seu-endpoint/invocations
```

### 2. Atualizar `.env`

```env
AI_PROVIDER=aws-sagemaker
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxxxxxxx
AWS_SAGEMAKER_ENDPOINT_NAME=seu-endpoint-name
```

### 3. Reiniciar servidor

```bash
npm start
```

---

## ✅ Verificar Qual Provedor Está Ativo

```bash
curl http://localhost:5000/api/health
```

Resposta:

```json
{
  "status": "ok",
  "provider": "aws-bedrock"
}
```

---

## 🔧 Adicionar um Novo Provedor (Template)

Se quiser usar outro serviço (Hugging Face, Together AI, etc.):

### 1. Criar classe em `aiProvider.js`

```javascript
class MeuProvedor extends AIProvider {
  constructor() {
    super();
    this.client = new MeuSDK({
      apiKey: process.env.MEU_API_KEY,
    });
  }

  async generateFlashcards(prompt) {
    const response = await this.client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
    });
    return JSON.stringify({
      flashcards: parseFlashcards(response),
    });
  }
}
```

### 2. Adicionar ao factory

```javascript
case 'meu-provedor':
  return new MeuProvedor();
```

### 3. Usar

```env
AI_PROVIDER=meu-provedor
MEU_API_KEY=xxxxx
```

---

## 📞 Suporte

- Documentação completa: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Erros? Verifique o console com `npm run dev` para logs detalhados
- Não se esqueça de instalar dependências quando trocar de provedor!
