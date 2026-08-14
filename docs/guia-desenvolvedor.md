# Guia do Desenvolvedor - Controle CPO

Se você é um desenvolvedor responsável por manter ou expandir o sistema, siga estas instruções.

## 💻 Configuração do Ambiente Local

### Pré-requisitos
- Node.js (v20.19.0 ou v22.12.0+)
- npm ou yarn

### Instalação
1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```

### Desenvolvimento
Inicie o servidor de desenvolvimento com hot-reload:
```bash
npm run dev
```

## ☁️ Implantação do Backend (Google Apps Script)

O backend reside no arquivo `GoogleAppsScript.gs`. Para atualizar:

1. Abra a planilha do Google Sheets que servirá de banco de dados.
2. Vá em **Extensões** > **Apps Script**.
3. Copie o conteúdo de `GoogleAppsScript.gs` para o editor do Apps Script.
4. Clique em **Implantar** > **Nova Implantação**.
5. Selecione o tipo **App da Web**.
6. Configure para executar como "Eu" e acesso para "Qualquer pessoa" (ou conforme a política da OPM).
7. Copie a **URL do App da Web** gerada.
8. No frontend do sistema (em produção ou local), insira essa URL na tela de **Configuração API**.

### ⚠️ Importante: IDs de Apps Script
Lembre-se de atualizar a constante `SPREADSHEET_ID` no topo do arquivo `.gs` com o ID da planilha atual:
```javascript
const SPREADSHEET_ID = 'SEU_ID_DA_PLANILHA_AQUI';
```

## 🧪 Testes e Qualidade

- **Testes Unitários:** O projeto utiliza Vitest. Execute com `npm run test:unit`.
- **Linting/Formatação:** Utilizamos o `oxfmt` para garantir a padronização do código. Execute `npm run format`.
- **Type Checking:** Execute `npm run type-check` para validar os tipos TypeScript.

## 🚀 Build para Produção

Para gerar os arquivos estáticos para hospedagem:
```bash
npm run build
```
Os arquivos serão gerados na pasta `dist/`.
