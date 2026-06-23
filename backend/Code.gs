/**
 * FARMER MANAGEMENT SYSTEM - Google Apps Script Backend
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Drive Folder for the photos.
 * 2. Copy the Folder ID into the DRIVE_FOLDER_ID below.
 * 3. Deploy this script as a "Web App" (Execute as: Me, Access: Anyone).
 * 4. Copy the Web App URL and paste it into `js/script.js` in your frontend.
 */

// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
  DRIVE_FOLDER_ID: 'YOUR_DRIVE_FOLDER_ID_HERE', // e.g. "1abcDEFghiJKLmnoPQRstuVWXyz..."
  SHEET_NAME: 'Farmers',                        // Default sheet tab name
  ADMIN_USER: 'admin',                          // Default admin username
  ADMIN_PASS: 'admin123'                        // Default admin password (change this!)
};

// Column headers mapping
const HEADERS = [
  'FarmerID', 'Password', 'Name', 'AadhaarNo', 'Gender', 'FarmerPhotoURL',
  'MobileNo', 'Village', 'Tahsil', 'District', 'Location', 'CropsGrown',
  'SoilType', 'ProductPhotoURL', 'DateOfFirstUse', 'MethodOfUse',
  'VegetativeGrowth', 'YieldResult', 'RegistrationDate', 'HasProductPhoto'
];

// ==========================================
// SETUP / INIT
// ==========================================
/**
 * Run this function once manually in the Apps Script editor 
 * to set up the headers in your Google Sheet.
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
}

// ==========================================
// WEB APP ENDPOINTS
// ==========================================
function doPost(e) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    let result = { success: false, message: "Unknown action" };

    if (action === "register") result = handleRegister(payload);
    else if (action === "login") result = handleLogin(payload);
    else if (action === "getFarmer") result = handleGetFarmer(payload);
    else if (action === "updateFarmer") result = handleUpdateFarmer(payload);
    else if (action === "getAllFarmers") result = handleGetAllFarmers(payload);
    else if (action === "deleteFarmer") result = handleDeleteFarmer(payload);

    return ContentService.createTextOutput(JSON.stringify(result))
                         .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      message: "Server Error: " + error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Farmer Portal API is running.")
                       .setMimeType(ContentService.MimeType.TEXT);
}

// ==========================================
// HANDLERS
// ==========================================

function handleRegister(data) {
  const sheet = getSheet();
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.farmerId) {
      return { success: false, message: "Farmer ID already exists." };
    }
  }

  let farmerPhotoURL = data.farmerPhoto ? uploadBase64ToDrive(data.farmerPhoto, `Farmer_${data.farmerId}_Photo.jpg`) : "";
  let productPhotoURL = data.productPhoto ? uploadBase64ToDrive(data.productPhoto, `Farmer_${data.farmerId}_Product.jpg`) : "";

  const hashedPwd = hashPassword(data.password);
  const regDate = new Date().toISOString().split('T')[0];

  const row = [
    data.farmerId, hashedPwd, data.name, data.aadhaarNo, data.gender, farmerPhotoURL,
    data.mobileNo, data.village, data.tahsil, data.district, data.location, data.cropsGrown,
    data.soilType, productPhotoURL, data.dateOfFirstUse, data.methodOfUse,
    data.vegetativeGrowth, data.yieldResult, regDate, data.hasProductPhoto
  ];

  sheet.appendRow(row);
  return { success: true, message: "Farmer registered successfully." };
}

function handleLogin(data) {
  if (data.role === 'admin') {
    if (data.id === CONFIG.ADMIN_USER && data.password === CONFIG.ADMIN_PASS) {
      return { success: true, data: { id: "admin", name: "Administrator", role: "admin" } };
    }
    return { success: false, message: "Invalid admin credentials." };
  }

  if (data.role === 'farmer') {
    const sheet = getSheet();
    const allData = sheet.getDataRange().getValues();
    const hashedPwd = hashPassword(data.password);

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] == data.id && allData[i][1] == hashedPwd) {
        return { success: true, data: { id: allData[i][0], name: allData[i][2], role: "farmer" } };
      }
    }
    return { success: false, message: "Invalid Farmer ID or Password." };
  }
  return { success: false, message: "Invalid role specified." };
}

function handleGetFarmer(data) {
  const sheet = getSheet();
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] == data.farmerId) {
      return { success: true, data: rowToObject(allData[i]) };
    }
  }
  return { success: false, message: "Farmer not found." };
}

function handleGetAllFarmers(data) {
  const sheet = getSheet();
  const allData = sheet.getDataRange().getValues();
  const farmers = [];

  for (let i = 1; i < allData.length; i++) {
    const obj = rowToObject(allData[i]);
    delete obj.password;
    farmers.push(obj);
  }
  farmers.reverse();
  return { success: true, data: farmers };
}

function handleUpdateFarmer(data) {
  const sheet = getSheet();
  const allData = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] == data.farmerId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) return { success: false, message: "Farmer not found." };

  let farmerPhotoURL = allData[rowIndex - 1][5];
  if (data.farmerPhoto) {
    farmerPhotoURL = uploadBase64ToDrive(data.farmerPhoto, `Farmer_${data.farmerId}_Photo.jpg`);
  }

  sheet.getRange(rowIndex, 3, 1, 1).setValue(data.name);
  sheet.getRange(rowIndex, 4, 1, 1).setValue(data.aadhaarNo);
  sheet.getRange(rowIndex, 5, 1, 1).setValue(data.gender);
  sheet.getRange(rowIndex, 6, 1, 1).setValue(farmerPhotoURL);
  sheet.getRange(rowIndex, 7, 1, 1).setValue(data.mobileNo);
  sheet.getRange(rowIndex, 8, 1, 1).setValue(data.village);
  sheet.getRange(rowIndex, 9, 1, 1).setValue(data.tahsil);
  sheet.getRange(rowIndex, 10, 1, 1).setValue(data.district);
  sheet.getRange(rowIndex, 11, 1, 1).setValue(data.location);
  sheet.getRange(rowIndex, 12, 1, 1).setValue(data.cropsGrown);
  sheet.getRange(rowIndex, 13, 1, 1).setValue(data.soilType);
  sheet.getRange(rowIndex, 15, 1, 1).setValue(data.dateOfFirstUse);
  sheet.getRange(rowIndex, 16, 1, 1).setValue(data.methodOfUse);
  sheet.getRange(rowIndex, 17, 1, 1).setValue(data.vegetativeGrowth);
  sheet.getRange(rowIndex, 18, 1, 1).setValue(data.yieldResult);

  return { success: true, message: "Farmer updated successfully." };
}

function handleDeleteFarmer(data) {
  const sheet = getSheet();
  const allData = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] == data.farmerId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex !== -1) {
    sheet.deleteRow(rowIndex);
    return { success: true, message: "Farmer deleted successfully." };
  }
  return { success: false, message: "Farmer not found." };
}

// ==========================================
// UTILITIES
// ==========================================

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
}

function rowToObject(row) {
  const obj = {};
  for (let i = 0; i < HEADERS.length; i++) {
    let key = HEADERS[i];
    key = key.charAt(0).toLowerCase() + key.slice(1);
    obj[key] = row[i];
  }
  return obj;
}

function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  let txtHash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    if (hashVal.toString(16).length == 1) txtHash += '0';
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

function uploadBase64ToDrive(base64String, fileName) {
  try {
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const decodedBytes = Utilities.base64Decode(base64String);
    const blob = Utilities.newBlob(decodedBytes, MimeType.JPEG, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Return a direct image source URL using the file ID
    return 'https://drive.google.com/uc?export=view&id=' + file.getId();
  } catch (error) {
    Logger.log("Error uploading file: " + error.toString());
    return "";
  }
}
