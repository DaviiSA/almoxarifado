/**
 * Db.gs — acesso genérico à planilha.
 * Como o script fica vinculado à própria planilha, SpreadsheetApp.getActiveSpreadsheet()
 * já aponta para ela automaticamente — não é preciso guardar nenhum ID.
 */

const REQUIRED_SHEETS = {
  Usuarios: ['id', 'nome', 'email', 'senhaHash', 'perfil', 'equipeVinculada', 'ativo'],
  Materiais: ['id', 'descricao', 'unidade', 'categoria', 'estoqueMinimo', 'observacoes'],
  Obras: ['id', 'nome', 'contratante', 'dataInicio', 'status', 'tipo', 'observacoes'],
  Entradas: ['id', 'data', 'tipoEstoque', 'obraId', 'materialId', 'quantidade', 'fornecedor', 'notaFiscal', 'recebidoPor', 'observacoes'],
  Saidas: ['id', 'data', 'tipoEstoque', 'obraId', 'materialId', 'quantidade', 'origemComplemento', 'equipeResponsavel', 'retiradoPor', 'observacoes'],
  Aplicacoes: ['id', 'data', 'obraId', 'materialId', 'quantidadeAplicada', 'quantidadeSobra', 'equipe', 'localizacao', 'responsavel', 'observacoes'],
};

// Colunas (0-indexed) que guardam datas e devem ser escritas/lidas sempre como texto "yyyy-MM-dd".
const DATE_COLUMNS = {
  Obras: [3],
  Entradas: [1],
  Saidas: [1],
  Aplicacoes: [1],
};

function getSS_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function toDateStr_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone() || 'America/Sao_Paulo', 'yyyy-MM-dd');
  return v === null || v === undefined ? '' : String(v);
}

/** Verifica quais das abas obrigatórias existem na planilha. */
function getSheetStatus_() {
  const ss = getSS_();
  const existing = ss.getSheets().map((s) => s.getName());
  const required = Object.keys(REQUIRED_SHEETS);
  return {
    existentes: required.filter((t) => existing.includes(t)),
    faltando: required.filter((t) => !existing.includes(t)),
  };
}

/** Cria as abas que estiverem faltando, com cabeçalho, formatação e coluna de data em texto. */
function provisionSheets_() {
  const ss = getSS_();
  const status = getSheetStatus_();
  status.faltando.forEach((name) => {
    const sheet = ss.insertSheet(name);
    const headers = REQUIRED_SHEETS[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#191d21').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, headers.length, 150);
    (DATE_COLUMNS[name] || []).forEach((colIdx) => {
      sheet.getRange(2, colIdx + 1, 2000, 1).setNumberFormat('@');
    });
  });
  return status.faltando;
}

/** Lê todas as linhas de dados (sem cabeçalho) de uma aba. */
function readRows_(tab) {
  const ss = getSS_();
  const sheet = ss.getSheetByName(tab);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const lastCol = REQUIRED_SHEETS[tab].length;
  return sheet
    .getRange(2, 1, lastRow - 1, lastCol)
    .getValues()
    .filter((r) => r.some((c) => c !== '' && c !== null && c !== undefined));
}

function appendRow_(tab, values) {
  const ss = getSS_();
  const sheet = ss.getSheetByName(tab);
  if (!sheet) {
    throw new Error(`A aba "${tab}" não existe na planilha. Peça a um administrador para configurar a planilha em Usuários.`);
  }
  sheet.appendRow(values);
}

/** Atualiza a linha inteira localizada pelo id (coluna A). Retorna false se não encontrar. */
function updateRowById_(tab, id, values) {
  const ss = getSS_();
  const sheet = ss.getSheetByName(tab);
  if (!sheet) return false;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      sheet.getRange(i + 2, 1, 1, values.length).setValues([values]);
      return true;
    }
  }
  return false;
}
