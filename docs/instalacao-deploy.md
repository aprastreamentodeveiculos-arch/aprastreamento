# 🚀 Guia de Instalação, Configuração e Deploy

Este documento serve como manual operacional para engenheiros de software que necessitam inicializar a plataforma **AP RASTRO** em ambiente de desenvolvimento local ou realizar implantações nos ambientes produtivos.

---

## 🔑 Dicionário de Variáveis de Ambiente (`.env`)

A aplicação requer variáveis específicas em ambos os lados para estabelecer comunicações e segurança.

### Backend (`backend/.env`)
Crie um arquivo `.env` na raiz do diretório `/backend` com base no modelo `.env.example`:

| Variável | Tipo | Valor Padrão / Sugerido | Descrição |
| :--- | :--- | :--- | :--- |
| `PORT` | Number | `5000` | Porta local HTTP em que o Express escutará. |
| `MONGO_URI` | String | `mongodb+srv://...` | String de conexão para o cluster do MongoDB Atlas. |
| `JWT_SECRET` | String | `chave-secreta-aprastro` | Chave de assinatura criptográfica dos tokens JWT. |
| `FRONTEND_URL` | String | `http://localhost:5173` | URL de origem do cliente React para validação do CORS. |
| `IS_LOCAL_DB` | Boolean | `true` | Se `true`, desativa transações atômicas para permitir rodar em MongoDB locais sem Replica Set. Setar como `false` em produção. |

### Frontend (`frontend/.env`)
Crie um arquivo `.env` na raiz do diretório `/frontend`:

| Variável | Tipo | Valor Padrão / Sugerido | Descrição |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | String | `http://localhost:5000` | URL do servidor de API onde o frontend fará as chamadas REST. |

---

## 💻 Setup e Execução do Ambiente Local

### Pré-requisitos:
-   **Node.js**: Versão `>= 20.0.0` instalada.
-   **MongoDB**: Um banco de dados local rodando ou conta no MongoDB Atlas.
-   **NPM** ou **Yarn**: Para gerenciamento de pacotes.

### 1. Preparação do Servidor Backend
Navegue até a pasta do backend, instale as dependências e inicie o servidor:
```bash
cd backend
npm install
npm run dev
```
> [!NOTE]
> O script `npm run dev` utiliza o `ts-node-dev` para reiniciar automaticamente o servidor Express a cada modificação nos arquivos TypeScript (`.ts`).

### 2. Inserção de Cargas Iniciais (Seed)
Caso precise popular o banco de dados local com registros de teste (clientes fictícios, planos, equipamentos padrão), rode os scripts de carga de banco:
```bash
# Executa a população do banco de dados com dados de teste
npx ts-node seed.ts
```
Se precisar registrar um usuário administrador padrão manualmente de forma rápida:
```bash
# Injeta o usuário admin direto no MongoDB
npx ts-node inject_admin.ts
```

### 3. Preparação do Frontend (Client)
Em outro terminal, acesse a pasta do frontend, instale as dependências e inicialize o servidor de desenvolvimento:
```bash
cd frontend
npm install
npm run dev
```
> O Vite irá subir a aplicação no endereço padrão `http://localhost:5173`. Acesse esta URL no navegador.

---

## ☁️ Pipeline de Deploy em Produção

O AP RASTRO está pré-configurado para sofrer deploy contínuo em duas plataformas de nuvem:

### A. Backend no Render
O repositório possui suporte à Infraestrutura como Código do Render através do arquivo `render.yaml` na raiz do projeto.

#### Procedimento manual de Deploy:
1.  Crie uma conta no **Render** e conecte seu repositório Git.
2.  Adicione um novo **Web Service**.
3.  Configure os seguintes campos:
    -   **Runtime**: `Node`
    -   **Root Directory**: `backend`
    -   **Build Command**: `npm install --production=false && npm run build`
    -   **Start Command**: `npm start`
4.  No menu de variáveis de ambiente (`Environment`), insira os pares de chave-valor mapeados no arquivo `render.yaml` (especialmente a variável `MONGO_URI` com credenciais de produção e o `FRONTEND_URL` apontando para a produção da Vercel).

> [!WARNING]
> **Persistência de Imagens**: O Render destrói o sistema de arquivos local a cada deploy. Para preservar as fotos das ordens de serviço enviadas pelos técnicos no diretório `/backend/uploads`, é essencial anexar um **Persistent Volume** (ex: montado em `/opt/render/project/src/backend/uploads`) através do painel do Render, ou migrar a lógica de upload para um serviço de Cloud Storage (ex: AWS S3 ou Cloudinary).

---

### B. Frontend na Vercel
O deploy do cliente React é feito de forma nativa e automática pela Vercel ao detectar alterações na ramificação principal.

#### Configurações essenciais do deploy:
*   **Framework Preset**: `Vite`
*   **Root Directory**: `frontend`
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`
*   **Environment Variables**: Adicione a variável `VITE_API_URL` com a URL do backend hospedado no Render (ex: `https://aprastreamento-api.onrender.com`).

#### Tratamento de Erros 404 de Rotas SPA
Como o React gerencia as rotas no lado do cliente, recarregar a página em um caminho diferente de `/` (ex: `/dashboard`) fará o servidor de CDN buscar um arquivo físico que não existe, resultando em erro 404. 
A plataforma previne isso utilizando as diretivas do arquivo `frontend/vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
Isso garante que toda requisição de página seja redirecionada silenciosamente para o arquivo base `index.html`, onde a lógica de roteamento do React assume o controle.
