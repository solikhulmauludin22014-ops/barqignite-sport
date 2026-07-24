import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });
  return auth;
}

async function getSheetsClient() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;

// ============================================
// READ — Get all rows from a sheet
// ============================================
export async function getSheetData(sheetName: string): Promise<string[][]> {
  try {
    if (!SPREADSHEET_ID) {
      console.warn(`[WARNING] SPREADSHEET_ID not defined. Returning empty data for ${sheetName}`);
      return [];
    }
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
    });
    return (response.data.values as string[][]) || [];
  } catch (error) {
    console.error(`Error getting data from sheet ${sheetName}:`, error);
    // Don't throw error to prevent app crash if API fails or credentials not set
    return [];
  }
}

// ============================================
// READ — Get rows as objects (first row = headers)
// ============================================
export async function getSheetDataAsObjects<T = Record<string, string>>(
  sheetName: string
): Promise<T[]> {
  const rows = await getSheetData(sheetName);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return dataRows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] ?? '';
    });
    return obj as T;
  });
}

// ============================================
// APPEND — Add a new row to a sheet
// ============================================
export async function appendRow(
  sheetName: string,
  values: string[]
): Promise<void> {
  try {
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
  } catch (error) {
    console.error(`Error appending row to sheet ${sheetName}:`, error);
    throw new Error(`Gagal menambahkan data ke sheet ${sheetName}`);
  }
}

// ============================================
// UPDATE — Update a specific row (1-indexed, including header)
// ============================================
export async function updateRow(
  sheetName: string,
  rowIndex: number, // 1-indexed (row 1 = header, row 2 = first data row)
  values: string[]
): Promise<void> {
  try {
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
  } catch (error) {
    console.error(`Error updating row ${rowIndex} in sheet ${sheetName}:`, error);
    throw new Error(`Gagal memperbarui data di sheet ${sheetName}`);
  }
}

// ============================================
// DELETE — Delete a specific row
// ============================================
export async function deleteRow(
  sheetName: string,
  sheetId: number,
  rowIndex: number // 0-indexed for batchUpdate
): Promise<void> {
  try {
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error(`Error deleting row ${rowIndex} from sheet ${sheetName}:`, error);
    throw new Error(`Gagal menghapus data dari sheet ${sheetName}`);
  }
}

// ============================================
// FIND ROW — Find row index by column value
// ============================================
export async function findRowIndex(
  sheetName: string,
  columnIndex: number, // 0-indexed
  value: string
): Promise<number> {
  const rows = await getSheetData(sheetName);
  // Start from index 1 to skip header, return 1-indexed row number
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][columnIndex] === value) {
      return i + 1; // +1 because sheets are 1-indexed
    }
  }
  return -1;
}

// ============================================
// GENERATE ID — Generate unique ID
// ============================================
export function generateId(prefix: string = 'ID'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

// ============================================
// FORMAT DATE — Format date for sheets
// ============================================
export function formatDateForSheet(date: Date = new Date()): string {
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
