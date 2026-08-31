const SPREADSHEET_ID = '10EKgMKuGEM11NUs35QZBJJSAFlNk18cUvvxixHtC5c4';

const ABAS_CRP = ['CRP I', 'CRP II', 'CRP III', 'CRP IV'];

const MAPA_COLUNAS = {
  'data de inicio': 'DATA DE INÍCIO',
  'total de dias': 'TOTAL DE DIAS',
  'organizacao policial militar': 'ORGANIZAÇÃO POLICIAL MILITAR',
  'municipio distrito': 'MUNICÍPIO',
  'emprego de policiamento': 'EMPREGO DE POLICIAMENTO',
  'nome da operacao apoio': 'NOME DA OPERAÇÃO/APOIO',
  'area': 'ÁREA',
  'demandante solicitante': 'ÓRGÃO DEMANDANTE',
  'n sei': 'Nº SEI',
  'qtde total de efetivo': 'QTDE EFETIVO',
  'qtde total de viaturas': 'QTDE VIATURAS',
  'recursos financeiros empregados': 'TIPO FINANCEIRO EMPREGADO',
  'valor total gasto': 'VALOR GASTO',
  'cod operacao siseg': 'CÓD. OPERAÇÃO SISEG',
};

function doGet(e) {
  try {
    return handleRequest(e);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    return handleRequest(e);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleRequest(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const action = params.action || '';
  let result;

  try {
    switch (action) {
      case 'list':
        result = listarOperacoes();
        break;
      case 'listCalendario':
        result = listarCalendario();
        break;
      case 'get':
        result = buscarOperacao(params.id);
        break;
      case 'create':
        result = criarOperacao(params.data ? JSON.parse(params.data) : {});
        break;
      case 'update':
        result = atualizarOperacao(params.id, params.data ? JSON.parse(params.data) : {});
        break;
      case 'delete':
        result = excluirOperacao(params.id);
        break;
      case 'sync':
        result = sincronizarOperacoes(params.data ? JSON.parse(params.data) : []);
        break;
      default:
        result = { status: 'error', message: 'Ação não reconhecida' };
    }
  } catch (error) {
    result = { status: 'error', message: error.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizar(texto) {
  if (!texto) return '';
  return texto.toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-/]/g, ' ')
    .replace(/[º"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseMonetario(valor) {
  if (typeof valor === 'number') return valor;
  if (!valor) return 0;
  const str = String(valor)
    .replace(/R\$\s*/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function mapearLinha(linha, cabecalhos, nomeAba) {
  const op = {};

  for (let j = 0; j < cabecalhos.length; j++) {
    const headerRaw = cabecalhos[j];
    if (!headerRaw) continue;
    const headerNorm = normalizar(headerRaw);
    const targetField = MAPA_COLUNAS[headerNorm];
    if (!targetField) continue;

    let valor = linha[j];
    if (valor instanceof Date) {
      valor = Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }

    if (targetField === 'VALOR GASTO') {
      op[targetField] = parseMonetario(valor);
      op['RECURSO EMPREGADO'] = op[targetField];
    } else if (targetField === 'QTDE EFETIVO' || targetField === 'QTDE VIATURAS') {
      op[targetField] = typeof valor === 'number' ? Math.round(valor) : (parseInt(String(valor).replace(/\D/g, ''), 10) || 0);
    } else if (targetField === 'TOTAL DE DIAS') {
      op[targetField] = typeof valor === 'number' ? valor : (parseFloat(String(valor).replace(',', '.')) || 1);
    } else {
      op[targetField] = String(valor || '').trim();
    }
  }

  op.ID = Utilities.getUuid();
  op['COMANDO REGIONAL'] = nomeAba;
  op.CRP = nomeAba;
  op.STATUS = 'rascunho';
  if (!op['TIPO FINANCEIRO EMPREGADO']) op['TIPO FINANCEIRO EMPREGADO'] = '';
  if (!op['RECURSO EMPREGADO']) op['RECURSO EMPREGADO'] = 0;
  if (!op['VALOR GASTO']) op['VALOR GASTO'] = 0;
  op['CRIADO EM'] = new Date().toISOString();
  op['ATUALIZADO EM'] = new Date().toISOString();
  op['CRIADO POR'] = 'importado';
  op['ATUALIZADO POR'] = 'importado';

  return op;
}

function listarOperacoes() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const todas = [];

  for (let s = 0; s < ABAS_CRP.length; s++) {
    const nomeAba = ABAS_CRP[s];
    const sheet = spreadsheet.getSheetByName(nomeAba);
    if (!sheet) continue;

    const dados = sheet.getDataRange().getValues();
    if (dados.length <= 1) continue;

    const cabecalhos = dados[0];
    for (let i = 1; i < dados.length; i++) {
      const linha = dados[i];
      const temDados = linha.some(function(cel) { return cel !== '' && cel !== null && cel !== undefined; });
      if (!temDados) continue;
      if (!linha[0] && !linha[5]) continue;
      const op = mapearLinha(linha, cabecalhos, nomeAba);
      todas.push(op);
    }
  }

  return { status: 'success', data: todas };
}

function listarCalendario() {
  return { status: 'success', data: [] };
}

function buscarOperacao(id) {
  return { status: 'error', message: 'Operação não encontrada' };
}

function criarOperacao(dados) {
  return { status: 'error', message: 'Operação somente leitura' };
}

function atualizarOperacao(id, dados) {
  return { status: 'error', message: 'Operação somente leitura' };
}

function excluirOperacao(id) {
  return { status: 'error', message: 'Operação somente leitura' };
}

function sincronizarOperacoes(operacoes) {
  return { status: 'error', message: 'Operação somente leitura' };
}
