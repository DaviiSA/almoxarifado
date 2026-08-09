import { google, sheets_v4 } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

/** Definição de todas as abas que o sistema espera encontrar na planilha. */
export const REQUIRED_SHEETS: Record<string, string[]> = {
  Usuarios: ['id', 'nome', 'email', 'senhaHash', 'perfil', 'equipeVinculada', 'ativo'],
  Materiais: ['id', 'descricao', 'unidade', 'categoria', 'estoqueMinimo', 'observacoes'],
  Obras: ['id', 'nome', 'contratante', 'dataInicio', 'status', 'tipo', 'observacoes'],
  Entradas: [
    'id', 'data', 'tipoEstoque', 'obraId', 'materialId', 'quantidade',
    'fornecedor', 'notaFiscal', 'recebidoPor', 'observacoes',
  ],
  Saidas: [
    'id', 'data', 'tipoEstoque', 'obraId', 'materialId', 'quantidade',
    'origemComplemento', 'equipeResponsavel', 'retiradoPor', 'observacoes',
  ],
  Aplicacoes: [
    'id', 'data', 'obraId', 'materialId', 'quantidadeAplicada', 'quantidadeSobra',
    'equipe', 'localizacao', 'responsavel', 'observacoes',
  ],
};

let cachedClient: sheets_v4.Sheets | null = null;

export class SheetsNotConfiguredError extends Error {
  constructor() {
    super('A planilha do Google ainda não foi configurada nas variáveis de ambiente.');
    this.name = 'SheetsNotConfiguredError';
  }
}

export function getSheets(): sheets_v4.Sheets {
  if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !SPREADSHEET_ID) {
    throw new SheetsNotConfiguredError();
  }
  if (!cachedClient) {
    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    cachedClient = google.sheets({ version: 'v4', auth });
  }
  return cachedClient;
}

export function getSpreadsheetId(): string {
  if (!SPREADSHEET_ID) throw new SheetsNotConfiguredError();
  return SPREADSHEET_ID;
}

const colLetter = (index: number) => {
  let n = index + 1;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
};

/** Lê todas as linhas de uma aba (sem o cabeçalho) e devolve arrays de strings. */
export async function readSheetRows(tab: string): Promise<string[][]> {
  const sheets = getSheets();
  const lastCol = colLetter((REQUIRED_SHEETS[tab]?.length ?? 20) - 1);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${tab}!A2:${lastCol}`,
  });
  return (res.data.values ?? []) as string[][];
}

/** Lê e mapeia todas as linhas de uma aba para objetos, usando o esquema de colunas. */
export async function readSheet<T>(tab: string, mapper: (row: string[], rowNumber: number) => T): Promise<T[]> {
  const rows = await readSheetRows(tab);
  return rows
    .filter((row) => row.some((cell) => cell !== undefined && cell !== ''))
    .map((row, i) => mapper(row, i + 2));
}

export async function appendRow(tab: string, values: (string | number | undefined)[]): Promise<void> {
  const sheets = getSheets();
  const lastCol = colLetter(values.length - 1);
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${tab}!A2:${lastCol}`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values.map((v) => (v === undefined ? '' : v))] },
  });
}

/** Atualiza uma linha inteira localizada pelo id (coluna A) de uma aba. */
export async function updateRowById(
  tab: string,
  id: string,
  values: (string | number | undefined)[],
): Promise<boolean> {
  const sheets = getSheets();
  const rows = await readSheetRows(tab);
  const idx = rows.findIndex((r) => r[0] === id);
  if (idx === -1) return false;
  const rowNumber = idx + 2;
  const lastCol = colLetter(values.length - 1);
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${tab}!A${rowNumber}:${lastCol}${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values.map((v) => (v === undefined ? '' : v))] },
  });
  return true;
}

/** Verifica quais abas obrigatórias já existem na planilha. */
export async function checkSheetsStatus(): Promise<{ existentes: string[]; faltando: string[] }> {
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: getSpreadsheetId() });
  const titles = (meta.data.sheets ?? []).map((s) => s.properties?.title ?? '');
  const required = Object.keys(REQUIRED_SHEETS);
  return {
    existentes: required.filter((t) => titles.includes(t)),
    faltando: required.filter((t) => !titles.includes(t)),
  };
}

/** Cria as abas que estiverem faltando, já com a linha de cabeçalho preenchida. */
export async function provisionMissingSheets(): Promise<string[]> {
  const sheets = getSheets();
  const { faltando } = await checkSheetsStatus();
  if (faltando.length === 0) return [];

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      requests: faltando.map((title) => ({
        addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } },
      })),
    },
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: faltando.map((title) => ({
        range: `${title}!A1`,
        values: [REQUIRED_SHEETS[title]],
      })),
    },
  });

  return faltando;
}
