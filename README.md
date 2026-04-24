# 🧠 ExamForge — Guia 

Este documento apresenta o passo a passo para configurar e rodar o backend e o frontend do projeto **ExamForge**.

### 📥 1. Clonar o Repositório

```bash
git clone https://github.com/eduardomlmelo/Backend-RevisAI.git
```

-----

### 📁 2. Configuração do Backend

Primeiro, acesse a pasta do backend:

```bash
cd Backend-RevisAI
```

#### 🌱 3. Criar o Ambiente Virtual

Escolha o comando de acordo com o seu sistema operacional:

  * **🪟 Windows:**

    ```bash
    python -m venv venv
    venv\Scripts\activate
    ```

  * **🐧 Linux / Mac:**

    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

#### 📦 4. Instalar as Dependências

Com o ambiente virtual ativado, execute:

```bash
pip install -r requirements.txt
```

#### 🔑 5. Configurar Variáveis de Ambiente (.env)

> **Importante:** Para que o sistema funcione corretamente, você deve criar um arquivo chamado `.env` dentro da pasta `backend`.

Abra este arquivo e adicione a seguinte linha (substituindo pelo valor real da sua chave):

```env
AWS_KEY=sua chave aqui
```

#### ▶️ 6. Rodar o Backend

Inicie o servidor localmente:

```bash

```

O backend estará disponível em: `http://127.0.0.1:8000`

-----

### 🎨 7. Configuração do Frontend

Abra um **novo terminal** para não fechar o backend e navegue até a pasta do frontend:

```bash
cd Frontend-RevisAI
```

> ⚠️ **Nota:** É necessário ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

#### Instalar dependências:

```bash
npm install
```

#### Executar o frontend:

```bash
npm run dev
```

A interface abrirá em um endereço semelhante a: `http://localhost:5173`

-----

### 🔍 8. Como Testar o Sistema

Para testar o fluxo completo corretamente:

1.  Mantenha o **Backend** rodando em um terminal.
2.  Mantenha o **Frontend** rodando em outro terminal.

**Fluxo de funcionamento:**
Frontend envia requisições ➡️ Backend processa (usando a API Key configurada) ➡️ Resposta aparece na tela.

