/**
 * This Google Apps Script is designed to interact with Twilio's WhatsApp API and Google Sheets
 * to manage and monitor a list of DDNS (Dynamic Domain Name Service) entries.
 * 
 * Users can add or remove their phone numbers for DDNS monitoring by sending a WhatsApp message
 * to the Twilio phone number associated with this script.
 * 
 * The script supports the following commands:
 * 1. "start:your_ddns_name" - Adds the sender's phone number for monitoring the specified DDNS.
 * 2. "stop:your_ddns_name" - Removes the sender's phone number from monitoring the specified DDNS.
 * 3. "list" - Lists all DDNS entries associated with the sender's phone number.
 * 
 * The script should be triggered to run every minute, processing incoming WhatsApp messages and updating
 * the Google Sheet accordingly.
 */


const GOOGLE_SHEET_ID = "/*your_google_sheet_id_here*/"; // Replace with your Google Sheet ID
const SHEET_NAME = "DDNS"; // Replace with your desired sheet name within the Google Sheet
const accountSid = "/*your_account_sid_here*/"; // Replace with your Twilio account SID
const authToken = "/*your_auth_token_here*/"; // Replace with your Twilio auth token
const serviceSid = "/*your_service_sid_here*/"; // Replace with your Twilio Messaging Service SID
const mailStartCol = "mail 1"; // Replace with the column name for the start of the mail range in your Google Sheet
const mailEndCol = "mail 6"; // Replace with the column name for the end of the mail range in your Google Sheet
const ddnsColl = "DDNS"; // Replace with the column name for the DDNS column in your Google Sheet


/**
 * Main function that should be triggered every minute. This function runs
 * everything in the entire page.
 */
function fetchAndProcessWhatsAppMessages() {
  // Get Twilio phone number
  const twilioPhoneNumber = getTwilioPhoneNumber();

  // If unable to fetch Twilio phone number, log the error and exit
  if (!twilioPhoneNumber) {
    Logger.log("Unable to fetch Twilio phone number");
    return;
  }

  // Set up Twilio API URL
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  // Set up options for API request
  const options = {
    method: "GET",
    headers: {
      Authorization: `Basic ${Utilities.base64Encode(`${accountSid}:${authToken}`)}`,
    },
  };

  // Fetch the messages from Twilio API
  const response = UrlFetchApp.fetch(url, options);
  // Parse the response to a JSON object
  const json = JSON.parse(response.getContentText());

  // Get the last run time and current time
  const lastRunTime = getLastRunTime();
  const currentTime = new Date();

  // Check if there are messages and process them
  if (json.messages && json.messages.length > 0) {
    // Reverse the messages array to process them in chronological order
    json.messages.reverse().forEach((message) => {
      // Get the message date
      const messageDate = new Date(message.date_created);

      // Check if the message is sent to our Twilio phone number and is received after the last run time
      if (
        message.to === `whatsapp:${twilioPhoneNumber}` &&
        (!lastRunTime || messageDate > lastRunTime)
      ) {
        // Handle the incoming WhatsApp message
        handleWhatsAppMessage(message.from, message.body);
      }
    });
  }

  // Update the last run time
  setLastRunTime(currentTime);
}


function handleWhatsAppMessage(fromPhoneNumber, messageBody) {
  const twilioPhoneNumber = getTwilioPhoneNumber();
  if (!twilioPhoneNumber) {
    Logger.log("Unable to fetch Twilio phone number");
    return;
  }

  const parts = messageBody.trim().split(":");
  const command = parts[0].toLowerCase();

  Logger.log(`Command: ${command}`); // Debug log

  if (command === "start") {
    if (parts.length === 2) {
      const ddns = parts[1];
      const rowIndex = findRowIndexByDDNS(ddns);
      Logger.log(`Row index: ${rowIndex}`); // Debug log
 if (rowIndex !== -1) {
  const formattedPhoneNumber = fromPhoneNumber.replace("whatsapp:", "").replace("+1", "");

  Logger.log(`Formatted phone number: ${formattedPhoneNumber}`);

        if (isPhoneNumberInMails(rowIndex, formattedPhoneNumber)) { 
          const alreadyAddedMessage = `Your phone number has already been added to the DDNS monitoring list for ${ddns}.`;
          sendWhatsAppMessage(`whatsapp:${twilioPhoneNumber}`, fromPhoneNumber, alreadyAddedMessage);
        } else {
          const column = findEmptyMailColumn(rowIndex);
          if (column !== -1) {
            updatePhoneNumberInSheet(rowIndex, column, fromPhoneNumber);
            const successMessage = `Your phone number has been added to the DDNS monitoring list for ${ddns}.`;
            sendWhatsAppMessage(`whatsapp:${twilioPhoneNumber}`, fromPhoneNumber, successMessage);
          } else {
            const errorMessage = `All mail slots for ${ddns} are full. Cannot add your phone number.`;
            sendWhatsAppMessage(`whatsapp:${twilioPhoneNumber}`, fromPhoneNumber, errorMessage);
          }
        }
      } else {
        const errorMessage = `DDNS ${ddns} not found. Please check and try again.`;
        sendWhatsAppMessage(`whatsapp:${twilioPhoneNumber}`, fromPhoneNumber, errorMessage);
      }
    } else {
      const welcomeMessage = `Hello and welcome to MY Comany DDNS Monitoring on WhatsApp! To add your phone number for monitoring, please send a message in the format "start:your_ddns_name".`;
      sendWhatsAppMessage(`whatsapp:${twilioPhoneNumber}`, fromPhoneNumber, welcomeMessage);
    }
} else if (command === "stop") {
    if (parts.length === 2) {
      const ddns = parts[1];
      const rowIndex = findRowIndexByDDNS(ddns) +1;

      if (rowIndex !== -1) {
        const formattedPhoneNumber = fromPhoneNumber.replace("whatsapp:", "").replace("+1", "");
        const mailColumnIndex = findMailColumnByPhoneNumber(rowIndex, formattedPhoneNumber);

        if (mailColumnIndex !== -1) {
          updatePhoneNumberInSheet(rowIndex -1, mailColumnIndex +1, "" );
          const successMessage = `Your phone number has been removed from the DDNS monitoring list for ${ddns}.`;
          sendWhatsAppMessage(`whatsapp:${twilioPhoneNumber}`, fromPhoneNumber, successMessage);
        } else {
          const errorMessage = `Your phone number was not found in the DDNS monitoring list for ${ddns}.`;
          sendWhatsAppMessage(`whatsapp:${twilioPhoneNumber}`, fromPhoneNumber, errorMessage);
        }
      } else {
        const errorMessage = `DDNS ${ddns} not found. Please check and try again.`;
        sendWhatsAppMessage(`whatsapp:${twilioPhoneNumber}`, fromPhoneNumber, errorMessage);
      }
        } else {
      const stopFormatMessage = `To remove your phone number from monitoring, please send a message in the format "stop:your_ddns_name".`;
      sendWhatsAppMessage(`whatsapp:${twilioPhoneNumber}`, fromPhoneNumber, stopFormatMessage);
    }
  } else if (command === "list") {
    const formattedPhoneNumber = fromPhoneNumber.replace("whatsapp:", "").replace("+1", "");
    console.log("formattedPhoneNumber" + formattedPhoneNumber);
    console.log("fromPhoneNumber" + fromPhoneNumber);
     
    const ddnsList = findAllDDNSByPhoneNumber(formattedPhoneNumber);

    if (ddnsList.length > 0) {
      const ddnsListMessage = `Here is the list of all DDNS associated with your phone number:\n\n${ddnsList.join("\n")}`;
      sendWhatsAppMessage(`whatsapp:${twilioPhoneNumber}`, fromPhoneNumber, ddnsListMessage);
    } else {
      const noDDNSMessage = "There are no DDNS associated with your phone number.";
      sendWhatsAppMessage(`whatsapp:${twilioPhoneNumber}`, fromPhoneNumber, noDDNSMessage);
    }
    } else {
    const defaultMessage = `Welcome to MY Comany DDNS Monitoring on WhatsApp! Please use one of the following commands:\n\n1. To add your phone number for monitoring, send a message in the format "start:your_ddns_name".\n2. To remove your phone number from monitoring, send a message in the format "stop:your_ddns_name".\n3. To list all DDNS associated with your phone number, send the message "list".`;
    sendWhatsAppMessage(`whatsapp:${twilioPhoneNumber}`, fromPhoneNumber, defaultMessage);
  }
}
 
/**
 * Find all DDNS entries associated with a phone number in the spreadsheet.
 * @param {string} phoneNumber - The phone number to search for.
 * @return {Array} - A list of DDNS values associated with the phone number.
 */
function findAllDDNSByPhoneNumber(phoneNumber) {
  // Get the sheet by name
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  // Get the values in the data range of the sheet
  const data = sheet.getDataRange().getValues();
  // Initialize an empty list to store DDNS values
  const ddnsList = [];

  // Get the column indexes by name
  const mail1ColIndex = getColumnIndexByName(sheet, mailStartCol);
  const mail6ColIndex = getColumnIndexByName(sheet, mailEndCol);
  const ddnsColumnIndex = getColumnIndexByName(sheet, ddnsColl);

  // Log the phone number
  Logger.log(`Phone number: ${phoneNumber}`);

  // Convert phone number to string
  phoneNumber = String(phoneNumber);

  // Loop through columns (mail1 to mail6)
  for (let columnIndex = mail1ColIndex; columnIndex <= mail6ColIndex; columnIndex++) {
    // Loop through rows (excluding header row)
    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
      // Get the cell value as a string
      const cellValue = String(data[rowIndex][columnIndex]);
      Logger.log(`Checking row ${rowIndex + 1}, column ${columnIndex + 1}: ${cellValue}`); // Log the cell value being checked

      // If the cell value matches the phone number
      if (cellValue === phoneNumber) {
        // Log when a match is found
        Logger.log(`Match found at row ${rowIndex + 1}, column ${columnIndex + 1}`); // Log when a match is found

        // Retrieve the DDNS value from the data array
        const ddnsValue = data[rowIndex][ddnsColumnIndex];
        // Log the DDNS value
        Logger.log(`DDNS value at row ${rowIndex + 1}: ${ddnsValue}`); // Log the DDNS value
        // Add the DDNS value to the ddnsList
        ddnsList.push(ddnsValue);
      }
    }
  }
  Logger.log(ddnsList);
  return ddnsList;
}
 
// This function is used in other scripts to get the index of a header
function getColumnIndexByName(sheet, columnName) {
  // Retrieve the header row from the sheet
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Iterate through the header row
  for (let columnIndex = 0; columnIndex < headers.length; columnIndex++) {
    // If the header matches the columnName, return the index
    if (headers[columnIndex] === columnName) {
      return columnIndex;
    }
  }

  // If no match is found, return -1
  return -1;
}


/**
 * This function finds the row index of a given DDNS value in the sheet.
 * It is useful for locating the row containing a specific DDNS value.
 * @param {string} ddns - The DDNS value to search for in the sheet.
 * @returns {number} The row index where the DDNS value is found, or -1 if not found.
 */
function findRowIndexByDDNS(ddns) { 
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  // Get the column index for the "DDNS" header
  const ddnsColIndex = getColumnIndexByName(sheet, "DDNS"); 

  // Iterate through the rows in the data
  for (let i = 0; i < data.length; i++) {
    // If the current row's DDNS value matches the given DDNS, return the row index
    if (data[i][ddnsColIndex] === ddns) {
      return i;
    }
  }

  // If no match is found, return -1
  return -1;
}

 
function getSheet() {
  const ss = SpreadsheetApp.openById(GOOGLE_SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  return sheet;
}
 
/**
 * Updates the phone number in the Google Sheet by removing the 'whatsapp:' and '+1' prefixes.
 * @param {number} rowIndex - The row index of the cell to update (0-based).
 * @param {number} columnIndex - The column index of the cell to update (1-based).
 * @param {string} phoneNumber - The phone number to be updated.
 */
function updatePhoneNumberInSheet(rowIndex, columnIndex, phoneNumber) {
  const sheet = getSheet();
  const formattedPhoneNumber = phoneNumber.replace("whatsapp:", "").replace("+1", "");
  sheet.getRange(rowIndex + 1, columnIndex).setValue(formattedPhoneNumber);
}


function getTwilioPhoneNumber() {
  const url = `https://messaging.twilio.com/v1/Services/${serviceSid}/PhoneNumbers`;

  const options = {
    method: "GET",
    headers: {
      Authorization: `Basic ${Utilities.base64Encode(`${accountSid}:${authToken}`)}`,
    },
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());

  if (json.phone_numbers && json.phone_numbers.length > 0) {
    return json.phone_numbers[0].phone_number;
  }

  return null;
}

/**
 * Sends a WhatsApp message using the Twilio API.
 * @param {string} from - The sender's phone number in E.164 format with "whatsapp:" prefix.
 * @param {string} to - The recipient's phone number in E.164 format with "whatsapp:" prefix.
 * @param {string} message - The message text to send.
 * @param {object} properties - Optional custom properties to include in the message.
 */
function sendWhatsAppMessage(from, to, message, properties = {}) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const payload = {
    To: to,
    From: from,
    Body: message,
  };

  // Add custom properties to the payload
  for (const key in properties) {
    payload[`X-Twilio-App-${key}`] = properties[key];
  }

  const options = {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Utilities.base64Encode(`${accountSid}:${authToken}`)}`,
    },
    payload: payload,
  };

  const response = UrlFetchApp.fetch(url, options);

  Logger.log(response.getContentText());
}
 

/**
 * Get the last run time of the script.
 * We use this function to avoid sending messages that have already been sent.
 * 
 * @returns {Date|null} - The last run time as a Date object or null if not set.
 */
function getLastRunTime() {
  // Access the script properties to store and retrieve the last run time
  const scriptProperties = PropertiesService.getScriptProperties();
  // Get the stored last run time as a string
  const lastRunTimeString = scriptProperties.getProperty("lastRunTime");

  // If there is a stored last run time, convert it to a Date object and return it
  if (lastRunTimeString) {
    return new Date(lastRunTimeString);
  }

  // If there is no stored last run time, return null
  return null;
}

/**
 * Set the last run time of the script.
 * 
 * @param {Date} time - The time to set as the last run time.
 */
function setLastRunTime(time) {
  // Access the script properties to store and retrieve the last run time
  const scriptProperties = PropertiesService.getScriptProperties();
  // Set the last run time as an ISO string in the script properties
  scriptProperties.setProperty("lastRunTime", time.toISOString());
}


/**
 * Finds the first empty "mail" column in the specified row.
 * @param {number} rowIndex - The row index (0-based) to search for the empty mail column.
 * @return {number} - Returns the column index (1-based) of the first empty mail column, or -1 if not found.
 */
function findEmptyMailColumn(rowIndex) {
  const sheet = getSheet();
  const mailStartColIndex = getColumnIndexByName(sheet, mailStartCol);
  const mailEndColIndex = getColumnIndexByName(sheet, mailEndCol);

  Logger.log(`Mail 1 column index: ${mailStartColIndex}\n Mail 6 column index: ${mailEndColIndex}`);

  if (mailStartColIndex < 0 || mailEndColIndex < 0) {
    Logger.log("Invalid mail column index");
    return -1;
  }

  const row = sheet.getRange(rowIndex + 1, mailStartColIndex + 1, 1, (mailEndColIndex - mailStartColIndex) + 1).getValues()[0];
  for (let i = 0; i < row.length; i++) {
    if (!row[i] || row[i] === "") {
      return mailStartColIndex + i + 1;
    }
  }

  return -1;
}

/**
 * Finds the "mail" column containing the specified phone number in the given row.
 * @param {number} rowIndex - The row index (0-based) to search for the phone number.
 * @param {string} phoneNumber - The phone number to search for in the row.
 * @return {number} - Returns the column index (1-based) of the mail column containing the phone number, or -1 if not found.
 */
function findMailColumnByPhoneNumber(rowIndex, phoneNumber) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const row = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];

  for (let columnIndex = 2; columnIndex < row.length; columnIndex++) {
    const cellPhoneNumber = row[columnIndex].toString().replace("whatsapp:", "").replace("+1", "");
    if (cellPhoneNumber === phoneNumber) {
      return columnIndex;
    }
  }

  return -1;
}

/**
 * Check if the given phone number is present in any of the "mail 1" to "mail 6" columns of a specific row.
 * @param {number} rowIndex - The row index (0-based) to search for the phone number.
 * @param {string} fromPhoneNumber - The phone number to check, in the format "whatsapp:+1xxxxxxxxxx".
 * @return {boolean} - Returns true if the phone number is found, false otherwise.
 */
function isPhoneNumberInMails(rowIndex, fromPhoneNumber) {
  const sheet = getSheet();
  const formattedPhoneNumber = fromPhoneNumber.replace("whatsapp:", "").replace("+1", "");

  const mailStartColIndex = getColumnIndexByName(sheet, mailStartCol);
  const mailEndColIndex = getColumnIndexByName(sheet, mailEndCol);

  if (mailStartColIndex < 1 || mailEndColIndex < 1) {  
    Logger.log("Invalid mail column index");     
    return -1;   
  }

  const row = sheet.getRange(rowIndex + 1, mailStartColIndex, 1, mailEndColIndex - mailStartColIndex + 1).getValues()[0];
  const hasPhoneNumber = row.some(cellValue => cellValue.toString().trim() === formattedPhoneNumber);
  
  if (hasPhoneNumber) {
    console.log("Phone number removed: " + formattedPhoneNumber);
    return true;  
  } else {
    console.log("Error or unable to find number"); 
    return false;
  }
} 
