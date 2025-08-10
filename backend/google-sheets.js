const { google } = require('googleapis');

class GoogleSheetsService {
  constructor() {
    // You'll need to set these up - instructions below
    this.SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
    this.credentials = null;
    this.sheets = null;
  }

  async initialize() {
    try {
      // Initialize with service account credentials
      const auth = new google.auth.GoogleAuth({
        keyFile: './credentials.json', // You'll need to add this file
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const authClient = await auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });
      
      // Create headers if sheet is empty
      await this.createHeadersIfNeeded();
      
      console.log('Google Sheets service initialized successfully');
      return true;
    } catch (error) {
      console.error('Google Sheets initialization error:', error.message);
      console.log('Running without Google Sheets integration');
      return false;
    }
  }

  async createHeadersIfNeeded() {
    if (!this.sheets) return;
    
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.SPREADSHEET_ID,
        range: 'A1:M1',
      });

      if (!response.data.values || response.data.values.length === 0) {
        // Add headers
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.SPREADSHEET_ID,
          range: 'A1:M1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
              'Timestamp',
              'User ID',
              'Username',
              'Farm Name',
              'Field Name',
              'Location ID',
              'Latitude',
              'Longitude',
              'Plant Type',
              'Growth Stage',
              'Height (cm)',
              'Health Score',
              'Notes'
            ]]
          }
        });
        console.log('Headers created in Google Sheet');
      }
    } catch (error) {
      console.error('Error creating headers:', error.message);
    }
  }

  async addPlantRecord(data) {
    if (!this.sheets) {
      console.log('Google Sheets not configured - skipping');
      return;
    }

    try {
      const values = [[
        new Date().toISOString(),
        data.userId || '',
        data.username || '',
        data.farmName || '',
        data.fieldName || '',
        data.locationId || '',
        data.latitude || '',
        data.longitude || '',
        data.plantType || '',
        data.growthStage || '',
        data.heightCm || '',
        data.healthScore || '',
        data.notes || ''
      ]];

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.SPREADSHEET_ID,
        range: 'A:M',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: values
        }
      });

      console.log('Plant data saved to Google Sheets');
      return response.data;
    } catch (error) {
      console.error('Error saving to Google Sheets:', error.message);
      throw error;
    }
  }

  async getAllRecords() {
    if (!this.sheets) return [];

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.SPREADSHEET_ID,
        range: 'A2:M', // Skip header row
      });

      return response.data.values || [];
    } catch (error) {
      console.error('Error reading from Google Sheets:', error.message);
      return [];
    }
  }
}

module.exports = GoogleSheetsService;