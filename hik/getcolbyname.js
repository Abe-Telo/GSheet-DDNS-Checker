const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('./Jasonfile.json');

const doc = new GoogleSpreadsheet('SheetID');

async function getCredentials() {
  try {
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // Assumes the first sheet
    const rows = await sheet.getRows(); // Gets all rows
    rows.forEach(row => {
      const username = row.Username;
      const password = row.Password;
      const ddns = row.DDNS;
      const httpPort = row['HTTP Port'];
      console.log('Username:', username);
      console.log('Password:', password);
      console.log('DDNS:', ddns);
      console.log('HTTP Port:', httpPort);
    });
  } catch (err) {
    console.error('Error retrieving data from Google Sheets', err);
  }
}

getCredentials();

// Perpare to get SIAPI DATA 
