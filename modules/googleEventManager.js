const fs = require('node:fs');
const path = require('node:path');
const { google } = require('googleapis');
const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, '..', './credentials.json'), 'utf-8'))

//GOOGLE AUTH
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets({ version: 'v4', auth });


async function filterTable(spreadsheetId, filterKey = '', rowNum = 0){
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "'Form Responses 1'!A2:G"
    });

      const rows = response.data.values || [];
      return filterKey !== '' ? rows.filter(row => row[rowNum] === filterKey) : response;
}

async function completeOrder(spreadsheetId, range){
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'Form Responses 1'!F${range+1}`,
    valueInputOption: 'RAW',
    resource: {values: [['Complete']]},
  })
}

async function insertFormula(spreadsheetId){
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'Form Responses 1'!G2`,
    valueInputOption: 'USER_ENTERED',
    resource: {values: [['=IF(A2<>"", IFERROR(G1+1, 1), "") ']]},
  })
}

module.exports = { filterTable, completeOrder , insertFormula};