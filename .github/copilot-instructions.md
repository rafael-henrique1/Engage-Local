# Instruções para Agentes AI do Engage-Local

## Visão Geral do Projeto
Engage-Local é uma plataforma web para engajamento comunitário, construída com uma clara separação entre componentes frontend e backend.

## Arquitetura

### Backend (`/Backend`)
- **Stack Tecnológica**: Node.js + Express + MySQL
- **Componentes Principais**:
  - `server.js`: Ponto de entrada do servidor Express, gerencia endpoints HTTP
  - `db.js`: Configuração de conexão com banco de dados MySQL
  - `components/*.html`: Componentes HTML reutilizáveis

### Frontend (`/Frontend`)
- **Stack Tecnológica**: HTML, CSS, JavaScript puro
- **Estrutura**:
  - `pages/*.html`: Páginas principais da aplicação (login, cadastro, home, perfil)
  - `css/style-*.css`: Folhas de estilo específicas para cada página
  - `assets/`: Arquivos estáticos (imagens, logos)

## Fluxo de Desenvolvimento

### Configuração do Banco de Dados
- Banco de dados MySQL chamado `engage_local` é necessário
- Detalhes de conexão em `Backend/db.js`
- Credenciais padrão: 
  ```
  usuário: root
  senha: EngageLocal@2025
  ```

### Executando a Aplicação
1. Backend: 
   ```
   cd Backend
   npm install
   node server.js
   ```
2. Frontend: Servir `Frontend/index.html` através de um servidor web

## Convenções do Projeto

### Padrões do Frontend
- Arquivos CSS específicos seguem o padrão: `style-{nomepagina}.css`
- Componentes reutilizáveis armazenados em `Backend/components/`
- Estrutura de navbar consistente em todas as páginas

### Padrões do Backend
- Endpoints da API RESTful em `server.js`
- Consultas ao banco de dados usam statements parametrizados para segurança
- Respostas de erro seguem o formato: `{status: number, message: string}`

## Pontos de Integração
- API Backend roda na porta 3000
- Comunicação Frontend-Backend via API REST
- Componentes HTML compartilhados em `Backend/components/`

## Arquivos de Referência Importantes
- `Frontend/index.html`: Exemplo de estrutura de página e padrões de estilo
- `Backend/server.js`: Estrutura de endpoints da API e tratamento de erros
- `Backend/db.js`: Configuração e gerenciamento de conexão com banco de dados
