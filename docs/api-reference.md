# 🔌 Referência Completa da API

Esta página serve como guia de referência técnico para os endpoints REST expostos pela API do **AP RASTRO**. 

A URL base padrão da API é `/api`. Em desenvolvimento local, corresponde a `http://localhost:5000/api`. Em produção, aponta para `https://aprastreamento-api.onrender.com/api`.

---

## 🔑 Módulo de Autenticação (`/auth`)

### 1. Efetuar Login no Painel
Realiza a autenticação de operadores e técnicos, devolvendo o token JWT assinado para sessões seguras.
-   **Método**: `POST`
-   **Rota**: `/auth/login`
-   **Headers**: `Content-Type: application/json`
-   **Corpo da Requisição**:
    ```json
    {
      "email": "operador@aprastro.com",
      "senha": "senha_segura"
    }
    ```
-   **Resposta de Sucesso (200 OK)**:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "usuario": {
        "_id": "64b0fca30e137b1275ff0d1a",
        "nome": "João Operador",
        "email": "operador@aprastro.com",
        "role": "admin",
        "tecnicoId": null
      }
    }
    ```
-   **Respostas de Erro**:
    -   `401 Unauthorized` (Credenciais incorretas).
    -   `403 Forbidden` (Usuário inativo no painel).

---

## 👤 Módulo de Usuários (`/usuarios`)

### 1. Listar Usuários
-   **Método**: `GET`
-   **Rota**: `/usuarios`

### 2. Criar Usuário
-   **Método**: `POST`
-   **Rota**: `/usuarios`
-   **Corpo da Requisição**:
    ```json
    {
      "nome": "Carlos Técnico",
      "email": "carlos.tecnico@aprastro.com",
      "senha": "senha_provisoria",
      "role": "tecnico",
      "tecnicoId": "64b0fca30e137b1275ff0d90"
    }
    ```

### 3. Atualizar Usuário
-   **Método**: `PUT`
-   **Rota**: `/usuarios/:id`

### 4. Remover Usuário
-   **Método**: `DELETE`
-   **Rota**: `/usuarios/:id`

---

## 📈 Módulo de Planos (`/planos`)

### 1. Listar Planos
Retorna a lista de planos cadastrados.
-   **Método**: `GET`
-   **Rota**: `/planos`
-   **Parâmetros de Query**:
    -   `apenasAtivos` (Boolean, opcional): Filtrar apenas planos ativos para novas vendas.

### 2. Criar Novo Plano
-   **Método**: `POST`
-   **Rota**: `/planos`
-   **Corpo da Requisição (exemplo tipo ESCALONADO_FROTA)**:
    ```json
    {
      "nome": "Plano Frota Escalonada Premium",
      "tipoCobranca": "ESCALONADO_FROTA",
      "periodicidade": "MENSAL",
      "faixasPreco": [
        { "de": 1, "ate": 10, "valor": 55.00 },
        { "de": 11, "ate": 50, "valor": 45.00 },
        { "de": 51, "valor": 38.00 }
      ],
      "fidelidadeMeses": 12,
      "descontoFidelidadePct": 10,
      "descricao": "Desconto progressivo por volume de frota."
    }
    ```

---

## 👥 Módulo de Clientes (`/clientes`)

### 1. Listar Clientes
-   **Método**: `GET`
-   **Rota**: `/clientes`
-   **Parâmetros de Query**:
    -   `ativo` (String: `'true'` ou `'false'`, opcional): Filtro por status.

### 2. Obter Panorama Consolidado do Cliente
Retorna a ficha completa do cliente com dados de cadastro, frota vinculada, faturas emitidas e logs de históricos.
-   **Método**: `GET`
-   **Rota**: `/clientes/:id/panorama`
-   **Resposta de Sucesso (200 OK)**:
    ```json
    {
      "cliente": { ... },
      "veiculos": [ ... ],
      "faturas": [ ... ],
      "historico": [ ... ]
    }
    ```

### 3. Inativação Lógica de Cliente
Inativa o cliente, cancelando o contrato e exigindo preenchimento de justificativa de encerramento.
-   **Método**: `DELETE`
-   **Rota**: `/clientes/:id`
-   **Corpo da Requisição**:
    ```json
    {
      "motivoInativacao": "Inadimplência",
      "detalhesInativacao": "Cliente acumulou 3 faturas pendentes sem retorno.",
      "operadorCancelamento": "Administrador"
    }
    ```

---

## 🚗 Módulo de Veículos (`/veiculos`)

### 1. Inserção/Atualização em Massa (Bulk)
Permite salvar ou atualizar a frota inteira de um cliente de forma otimizada.
-   **Método**: `POST`
-   **Rota**: `/veiculos/bulk`
-   **Corpo da Requisição**:
    ```json
    {
      "clienteId": "64b0fca30e137b1275ff0d40",
      "veiculos": [
        { "placa": "ABC1D23", "marca": "Fiat", "modelo": "Fiorino", "ano": "2022" },
        { "placa": "XYZ9876", "marca": "Volvo", "modelo": "FH 460", "ano": "2020" }
      ],
      "forceCreate": false
    }
    ```

---

## 🛠️ Módulo de Técnicos e Equipamentos (`/tecnicos`, `/equipamentos`)

### 1. Transferir Equipamento para Técnico
Associa um equipamento físico do estoque sob a guarda de um técnico de campo para posterior instalação.
-   **Método**: `PUT`
-   **Rota**: `/equipamentos/:id/transferir`
-   **Corpo da Requisição**:
    ```json
    {
      "tecnicoId": "64b0fca30e137b1275ff0d90"
    }
    ```

### 2. Atualizar Status do Equipamento
-   **Método**: `PUT`
-   **Rota**: `/equipamentos/:id/status`
-   **Corpo da Requisição**:
    ```json
    {
      "status": "DEFEITUOSO"
    }
    ```

---

## 🔧 Módulo de Ordens de Serviço (`/ordens`)

### 1. Abrir Ordem de Serviço
-   **Método**: `POST`
-   **Rota**: `/ordens`
-   **Corpo da Requisição**:
    ```json
    {
      "tecnicoId": "64b0fca30e137b1275ff0d90",
      "clienteId": "64b0fca30e137b1275ff0d40",
      "placa": "MVK8I44",
      "rastreadorId": "64b0fca30e137b1275ff0d80",
      "observacoes": "Agendado instalação no painel de fusíveis."
    }
    ```

### 2. Concluir O.S. (Realizado pelo Técnico em Campo)
Envia os dados de instalação e URLs de fotos para aprovação da administração.
-   **Método**: `PUT`
-   **Rota**: `/ordens/:id/concluir`
-   **Corpo da Requisição**:
    ```json
    {
      "observacoes": "Instalação concluída. Alimentação pós-chave OK.",
      "fotosUrls": [
        "/uploads/foto-1689369910.jpg",
        "/uploads/foto-1689369945.jpg"
      ]
    }
    ```

### 3. Aprovação de O.S. (Administrador)
Efetiva a O.S., atualiza o status do hardware no banco para `'INSTALADO'` e dispara o histórico de instalação para início do faturamento contratual.
-   **Método**: `PUT`
-   **Rota**: `/ordens/:id/aprovar`

### 4. Rejeição de O.S. (Administrador)
-   **Método**: `PUT`
-   **Rota**: `/ordens/:id/rejeitar`
-   **Corpo da Requisição**:
    ```json
    {
      "motivoRejeicao": "Fotos ilegíveis do chicote elétrico."
    }
    ```

---

## 💳 Módulo Financeiro e Cobranças (`/financeiro`)

### 1. Executar Rotina de Faturamento Automático (Cron Job)
Dispara manualmente a varredura das assinaturas ativas para gerar as faturas pendentes do período corrente.
-   **Método**: `POST`
-   **Rota**: `/financeiro/faturamento-cron`
-   **Resposta de Sucesso (200 OK)**:
    ```json
    {
      "message": "Rotina de faturamento executada.",
      "faturasGeradas": 4
    }
    ```

### 2. Checkout de Fatura (Liquidação Total ou Parcial)
-   **Método**: `POST`
-   **Rota**: `/financeiro/:id/checkout`
-   **Corpo da Requisição (exemplo Pagamento Parcial)**:
    ```json
    {
      "valorPago": 100.00,
      "desconto": 10.00,
      "acrescimo": 5.00,
      "formaPagamento": "PIX",
      "novaDataVencimento": "2026-08-20T00:00:00.000Z"
    }
    ```
-   **Resposta de Sucesso Pagamento Parcial (200 OK)**:
    ```json
    {
      "message": "Pagamento parcial registrado. Nova fatura residual gerada com sucesso.",
      "mensalidadeOrigem": { ... },
      "mensalidadeNova": { ... }
    }
    ```

---

## 📊 Módulo de Controle de Caixa e Despesas (`/caixa`)

### 1. Listar Despesas
-   **Método**: `GET`
-   **Rota**: `/caixa/despesas`
-   **Parâmetros de Query**:
    -   `busca` (String, opcional): Filtragem textual de descrições.
    -   `categoriaId` (String, opcional): Filtragem por ID de categoria.
    -   `mes` (String, opcional, formato `YYYY-MM`): Filtro de competência.

---

## 🕰️ Módulo de Histórico Cruzado e Auditorias (`/historico`)

### 1. Histórico de Rastreamento por Placa Veicular
-   **Método**: `GET`
-   **Rota**: `/historico/veiculo/:placa`
-   **Retorno**: Lista contendo o histórico cronológico de todos os rastreadores que já foram instalados e removidos do veículo correspondente.

### 2. Histórico de Veículos por IMEI do Rastreador
-   **Método**: `GET`
-   **Rota**: `/historico/rastreador/:imei`

---

## 📷 Módulo de Upload de Mídia (`/upload`)

### 1. Fazer Upload de Imagem de O.S.
-   **Método**: `POST`
-   **Rota**: `/upload`
-   **Headers**: `Content-Type: multipart/form-data`
-   **Payload**: Arquivo binário enviado sob a chave `foto`.
-   **Resposta de Sucesso (200 OK)**:
    ```json
    {
      "url": "http://localhost:5000/uploads/foto-1689369910.jpg",
      "filename": "foto-1689369910.jpg"
    }
    ```
