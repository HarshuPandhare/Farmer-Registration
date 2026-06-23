# Farmer Management System

A complete management system for farmers to register their details, track crop growth, and monitor yields, with an admin dashboard for analytics and management.

## Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend API**: Google Apps Script
- **Database**: Google Sheets
- **File Storage**: Google Drive
- **Hosting**: Vercel

## Setup Instructions

### Step 1: Prepare Google Drive & Sheets
1. Go to your [Google Drive](https://drive.google.com).
2. Create a new Folder named `Farmer_Portal_Photos`.
   - Right-click the folder > Share > "Anyone with the link" can view.
   - Copy the Folder ID from the URL (the part after `folders/`).
3. Create a new Google Sheet named `Farmer_Portal_DB`.
   - Rename the first sheet tab to `Farmers` if it's not already.
   - Copy the Sheet ID from the URL (the part between `/d/` and `/edit`).

### Step 2: Deploy Google Apps Script
1. Go to [Google Apps Script](https://script.google.com/) and create a "New Project".
2. Name the project "Farmer Management Backend".
3. Copy the entire contents of `backend/Code.gs` from this project into the Apps Script editor.
4. Update the `CONFIG` section at the top of the file:
   - Paste your `SHEET_ID`.
   - Paste your `DRIVE_FOLDER_ID`.
   - Change the `ADMIN_PASS` to something secure.
5. In the Apps Script editor toolbar, select the `setupSheet` function and click **Run**.
   - Review and accept the permissions prompt. This will create the column headers in your Google Sheet.
6. Click **Deploy** > **New deployment**.
   - Select type: **Web app**.
   - Description: "Initial Release".
   - Execute as: **Me**.
   - Who has access: **Anyone**.
   - Click **Deploy**.
7. Copy the **Web app URL**.

### Step 3: Configure Frontend
1. Open `js/script.js` in your code editor.
2. Replace the `API_BASE` constant with the Web app URL you copied in the previous step.
   ```javascript
   const API_BASE = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
   ```

### Step 4: Deploy to Vercel
1. Ensure your code is pushed to a GitHub repository.
2. Log in to [Vercel](https://vercel.com) and click **Add New** > **Project**.
3. Import your GitHub repository.
4. The default settings (No framework, no build command) are correct because this is a static site.
5. Click **Deploy**.

## Features

### Farmer Role
- Multi-step registration capturing personal details, location (via GPS), and crop data.
- Upload photos of the farmer and their products.
- Secure login using Farmer ID and Password.
- View and edit their profile.

### Admin Role
- Dashboard with key metrics and animated counters.
- View a table of all registered farmers.
- Search and filter by village, district, soil type, and crops.
- View full farmer details and photos in a modal.
- Edit farmer records or delete them entirely.

## Project Structure
```
farmer PORTAL/
├── index.html              # Login page
├── register.html           # Multi-step registration form
├── farmer-dashboard.html   # Farmer's profile view
├── admin-dashboard.html    # Admin analytics & management
├── css/
│   └── style.css           # Modern design system (Glassmorphism, Dark mode)
├── js/
│   └── script.js           # API connections, form validation, UI state
├── backend/
│   └── Code.gs             # Google Apps Script web app code
└── vercel.json             # Routing rules for Vercel deployment
```
