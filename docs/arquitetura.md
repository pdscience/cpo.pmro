# Arquitetura Técnica - Controle CPO

O sistema segue uma arquitetura moderna de Single Page Application (SPA) no frontend, integrada a uma solução de backend como serviço (BaaS) utilizando ferramentas da Google.

## 🏗️ Stack Tecnológica

### Frontend
- **Framework:** [Vue 3](https://vuejs.org/) (utilizando a Composition API e Vapor Mode em partes experimentais).
- **Build Tool:** [Vite](https://vitejs.dev/) para um desenvolvimento rápido e otimizado.
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) para um design responsivo e moderno.
- **Gerenciamento de Estado:** [Pinia](https://pinia.vuejs.org/) para persistência de dados e estados globais (como tokens de API e configurações).
- **Roteamento:** [Vue Router](https://router.vuejs.org/) para navegação entre as diferentes visões do sistema.

### Backend & Persistência
- **Lógica de Servidor:** [Google Apps Script](https://developers.google.com/apps-script) funcionando como uma API RESTful (Web App).
- **Banco de Dados:** [Google Sheets](https://www.google.com/sheets/about/) (Planilhas Google) utilizado como armazenamento estruturado de dados.
- **Segurança:** A comunicação é feita via HTTPS, utilizando tokens de acesso configuráveis no sistema.

### Integrações de Terceiros
- **Mapas:** [Leaflet](https://leafletjs.com/) para renderização de mapas interativos e marcação de operações.

## 🔄 Fluxo de Dados

1. O **Usuário** interage com a interface Vue.
2. O **Frontend** realiza requisições HTTP (GET/POST) para a URL do Web App (Apps Script).
3. O **Google Apps Script** processa a requisição, valida os parâmetros e interage com as **Google Sheets** (Leitura/Escrita).
4. A resposta retorna em formato **JSON** para o frontend, que atualiza a interface de forma reativa.

## 📁 Estrutura do Projeto

- `src/views/`: Contém as páginas principais (Dashboard, Operações, Relatórios, etc.).
- `src/services/`: Camada de abstração para chamadas de API (comunicação com Google Sheets).
- `src/stores/`: Definições de estados globais (Pinia).
- `src/components/`: Componentes reutilizáveis (Botões, Cards, Modais).
- `GoogleAppsScript.gs`: Código-fonte que deve ser implantado no ambiente do Google Apps Script.
