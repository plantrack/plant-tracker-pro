# Google Sheets Integration Setup

## How to Set Up Google Sheets for Plant Tracker Pro

### Step 1: Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Click "+" to create a new spreadsheet
3. Name it "Plant Tracker Data" (or whatever you prefer)

### Step 2: Make the Sheet Public (Required for Easy Setup)
1. Click "Share" button (top right)
2. Click "Change to anyone with the link"
3. Set permission to "Editor"
4. Click "Copy link"

### Step 3: Get Your Spreadsheet ID
From your Google Sheets URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
```

The ID is the long string between `/d/` and `/edit`

Example:
- URL: `https://docs.google.com/spreadsheets/d/1ABC123def456GHI789jkl/edit`
- ID: `1ABC123def456GHI789jkl`

### Step 4: Add Spreadsheet ID to the App

#### Option A: During Registration
When creating a new account, you'll see a field for "Google Sheets ID" - paste your ID there.

#### Option B: In Settings (After Login)
1. Login to the app
2. Go to Settings tab
3. Paste your Spreadsheet ID
4. Tap "Save"

### Step 5: Test It
1. Take a photo of a plant
2. Fill in the details
3. Submit
4. Check your Google Sheet - the data should appear automatically!

## What Gets Saved to Google Sheets?

Each plant record saves:
- Timestamp
- User ID & Username
- Farm Name
- Field Name
- Location (ID, Latitude, Longitude)
- Plant Type
- Growth Stage
- Height (cm)
- Health Score
- Notes

## Troubleshooting

### Data not appearing in Google Sheets?
1. Make sure your sheet is set to "Anyone with link can edit"
2. Check that you entered the correct Spreadsheet ID
3. Try updating your Spreadsheet ID in settings

### Want Private Sheets?
For private sheets, you'll need to set up Google Service Account credentials. Contact your admin for help with this advanced setup.

## Privacy Note
- Your data stays in YOUR Google Sheet
- Only you have access to your spreadsheet
- The app only writes data, it doesn't read from your sheet
- You can revoke access anytime by changing sheet permissions

## Example Spreadsheet
Want to see how it looks? Check out this example:
[Example Plant Tracker Sheet](https://docs.google.com/spreadsheets/d/1EXAMPLE/edit)

The app will automatically create column headers when you save your first plant!