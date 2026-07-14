# Documentação Geral do Sistema — AP RASTRO

Bem-vindo à documentação oficial do **AP RASTRO**, um ecossistema completo de rastreamento de veículos, gerenciamento de frotas, ordens de serviço (instalações e desinstalações) e controle financeiro de assinaturas recorrentes.

Este repositório está estruturado como um monorepo simplificado contendo o frontend da aplicação cliente e o servidor de backend da API.

---

## 🎯 Objetivo do Sistema

O AP RASTRO foi concebido para automatizar as operações de empresas de rastreamento veicular. Ele resolve gargalos críticos de negócios em três frentes principais:
1. **Controle de Estoque e Logística**: Rastreabilidade total de rastreadores e chips, desde a chegada no estoque até a posse com os técnicos de campo e instalação final nos veículos.
2. **Automação Financeira (Faturamento)**: Cobrança automatizada baseada em planos flexíveis (valores por veículo, fixos globais ou faixas escalonadas), com prorrateamento inteligente para instalações ocorridas no meio do mês de cobrança.
3. **Gestão de Ordens de Serviço (O.S.)**: Ciclo completo de agendamento, coleta de evidências fotográficas em campo pelo técnico (aplicativo frontend móvel) e validação técnica centralizada pelo time operacional/administrador.

---

## 📂 Estrutura de Navegação da Documentação

Para facilitar a análise técnica por parte da sua equipe de engenharia, a documentação está dividida de forma modular. Recomendamos a leitura na seguinte sequência lógica:

*   **⚡ [1. Arquitetura e Stack Tecnológica](file:///c:/Users/Lameira/Desktop/AP%20RASTRO/docs/arquitetura.md)**
    *   *Pilha de tecnologias, fluxo de autenticação via token JWT, políticas de CORS e padrões de projeto.*
*   **💾 [2. Modelagem do Banco de Dados](file:///c:/Users/Lameira/Desktop/AP%20RASTRO/docs/banco-de-dados.md)**
    *   *Modelagem baseada em MongoDB com schemas do Mongoose, tipos de dados, relacionamentos e chaves de indexação.*
*   **🔌 [3. Referência Completa da API](file:///c:/Users/Lameira/Desktop/AP%20RASTRO/docs/api-reference.md)**
    *   *Catálogo de endpoints REST contendo métodos, payloads aceitos e estrutura das respostas.*
*   **⚙️ [4. Regras e Fluxos de Negócio Detalhados](file:///c:/Users/Lameira/Desktop/AP%20RASTRO/docs/fluxos-negocio.md)**
    *   *Detalhamento do motor de faturamento automático (cron job), fluxo transicional de status das Ordens de Serviço (O.S.) e logística de estoque de equipamentos.*
*   **🚀 [5. Guia de Instalação, Variáveis de Ambiente e Deploy](file:///c:/Users/Lameira/Desktop/AP%20RASTRO/docs/instalacao-deploy.md)**
    *   *Configuração do ambiente de desenvolvimento local, guia de variáveis `.env` e orientações de deploy nas nuvens (Render e Vercel).*

---

## 🖼️ Demonstrações Visuais da Interface (Dashboard)

A pasta de documentação possui capturas de tela reais do sistema para que a equipe de engenharia entenda a identidade visual da aplicação:

1.  **Dashboard Financeiro e Operacional**:
    ![Dashboard Financeiro e Operacional](file:///c:/Users/Lameira/Desktop/AP%20RASTRO/docs/apresentacao/dashboard.png)
2.  **Ficha de Frota de Veículos**:
    ![Ficha de Frota](file:///c:/Users/Lameira/Desktop/AP%20RASTRO/docs/apresentacao/ficha_frota.png)
3.  **Ficha de Auditoria e Histórico**:
    ![Ficha de Auditoria](file:///c:/Users/Lameira/Desktop/AP%20RASTRO/docs/apresentacao/ficha_auditoria.png)

---

## 🛠️ Contato e Suporte Operacional

Caso ocorram dúvidas técnicas profundas sobre a lógica de integração, favor contatar o administrador responsável do sistema pelo canal padrão configurado:
- **E-mail de Suporte**: `ANDREWLAMEIRA30@GMAIL.COM`
