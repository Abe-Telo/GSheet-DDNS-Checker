function Alert_when_offline_Online() {
  // Column and sheet name settings. Ensure they match your sheet.
  const sheetName = "DDNS"; // This is your Sheet name for instance "sheet1"
  const portHttpStatus = "HTTP Details"; // The col that has the ✅ and 👎 Icon. You can pick if you would like.
  const alertTimestamp = "Alert_timestamp"; // The Timestamp of this script "Create it if you dont have it"
  const offlineStates = "Alert_state"; // Show stats of this sheet "Create it if needed"
  const ddnsTimestamp = "Last Updated"; // The GSheet Last Updated Timestamp
  const ddnsURL = "DDNS"; //The Col of all DDNS Ushally the header of col 1
  const portHttp = "HTTP Port"; // The col of the port you wanna show in email eg:ddns.somthing.com:1234
  const emailStartCol = "mail 1"; //The starting col of email
  const emailEndCol = "mail 6"; //The ending col of email. eg: mail 1, mail 2, mail 3, mail 4, mail 5, mail 6.
  // If your having issues. Please make sure you have "getColIndexByName.gs" you can find it under Sheer_Script.

  // Alert time settings
  const alertTimeOnline = 1000 * 60 * 50; // 50 minutes
  const alertTimeOffline = 1000 * 60 * 60 * 1; // 1 hour
  const timeZone = "America/New_York";
  const desiredFormat = "hh:mm a M/d/yyyy";

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  let store = JSON.parse(PropertiesService.getScriptProperties().getProperty('sent'));
  if (!store) store = [];
  console.log(`store: ${JSON.stringify(store)}`);
  SpreadsheetApp.getActiveSpreadsheet().toast(` ${store.join('\n')} \n`, "Currently Watching DDNS");

  const quota = MailApp.getRemainingDailyQuota();
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const index = Object.fromEntries(headers.filter(Boolean).map(e => [e, headers.indexOf(e)]));
  const now = new Date();
  const timestamp = Utilities.formatDate(new Date(now), timeZone, "yyyy-MM-dd'T'HH:mm:ss");
  
  data.forEach((row, i) => {
    const formattedDdnsTimestamp = Utilities.formatDate(new Date(row[index[ddnsTimestamp]]), timeZone, desiredFormat);
    const adjustedTimestamp = Utilities.formatDate(new Date(row[index[alertTimestamp]]), timeZone, "yyyy-MM-dd'T'HH:mm:ss");
    const diff = new Date(timestamp) - new Date(adjustedTimestamp);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    let timeDiff = row[index[alertTimestamp]] ? `${hours}h ${minutes}m ${days}d` : "Never Before";

    switch (row[index[portHttpStatus]]) {
      case (row[index[portHttpStatus]].match(/^✅/) || {}).input:
        if (row[index[offlineStates]].includes('👎')) {
          data[i][index[offlineStates]] = '✅';
          console.log(`[${row[index[ddnsURL]]}] up state ack`);
        }

        let addr = data[i].slice(index[emailStartCol], index[emailEndCol] + 1).filter(Boolean);

        // If in store and quota and time stamp is after TimeStamp 
        if (store.includes(row[index[ddnsURL]]) && quota > addr.length && Date.parse(row[index[alertTimestamp]]) < now - alertTimeOnline) {
          if (store.includes(row[index[ddnsURL]])) {
            store.splice(store.indexOf(row[index[ddnsURL]]), 1); // remove sent mail from store if any
          }

          console.log('✅ Store Passed - Clearing Store after email is sent.');
          if (quota > addr.length) {
            const emailAddress = `${addr.join(',')}`;
            const subject = 'DDNS Online, Was offline for ' + timeDiff;
            //const message = `\nLast seen: ${formattedDdnsTimestamp}\n\n${row[index[ddnsURL]]}:${row[index
            //const subject = 'DDNS Online, Was offline for', timeDiff; 
            const message = `\nLast seen: ${formattedDdnsTimestamp}\n\n${row[index[ddnsURL]]}:${row[index[portHttp]]}\n\nAll the following people received a down -> up alert. \n\n${addr.join('\n')}\n\nAny questions? please contact us\nVisic: 7185548581`;
//console.log(messagenow);
            MailApp.sendEmail(emailAddress, subject, message);   
            //MailApp.sendEmail("1231231234@tmomail.net", subject, message);
            SpreadsheetApp.getActiveSpreadsheet().toast(message, "DDNS Online Email Sent");   
            //sendWhatsAppMessage("whatsapp:+11231231234", message);
          } 
        } else { // If ddns is in store and qute is true, and timestamp is before the offline date
            //console.log('Removeing ddns',row[index[ddnsURL]],store.includes(row[index[ddnsURL]]))  
          if (store.includes(row[index[ddnsURL]])) {
          store.splice(store.indexOf(row[index[ddnsURL]]), 1); // remove sent mail from store if any
          } 
        }
 
        if(row[index[offlineStates]] === "") {  
          data[i][index[offlineStates]] = '✅';  // If empty cell UP
        }
        break; 

      case (row[index[portHttpStatus]].match(/^👎/) || {}).input: 
        if(row[index[offlineStates]].includes('✅')) {
          data[i][index[offlineStates]] = '👎'; // ack state changed
          data[i][index[alertTimestamp]] = timestamp; // state changed -> new timestamp
          console.log(`[${row[index[ddnsURL]]}] down state ack`);
        } else { // offlineStates (Alert_state) already '👎'
          let addr = data[i].slice(index[emailStartCol], index[emailEndCol]+1).filter(Boolean);
          
          // send mail if not already sent if quota ok if down more than 5h
          const Lasttime = new Date(row[index[alertTimestamp]]);   
 
        if(!store.includes(row[index[ddnsURL]]) && quota > addr.length && Date.parse(row[index[alertTimestamp]]) < now - alertTimeOffline) {
          store.push(row[index[ddnsURL]]); // mail +5h sent
          console.log(`[${row[index[ddnsURL]]}] send down for +5h mail to ${addr.join(',')}`);
        
        var emailAddress = `${addr.join(',')}`; //Email
        console.log("Console log Email:",emailAddress);
        //if(emailAddress !== null) { if email is not Null
 
         var subject = '👎 DDNS Offline for' + timeDiff;
         var message = `\nLast sean:  ${formattedDdnsTimestamp}\n\n${row[index[ddnsURL]]}:${row[index[portHttp]]}\n\nThe follwing receved a UP -> DOWN alert.\n\n${addr.join('\n')}\n\nAny questions? please contact us\nCopmany Name: 123 123 1234 `; 
         MailApp.sendEmail(emailAddress, subject, message);
         SpreadsheetApp.getActiveSpreadsheet().toast(message, "DDNS Offline Email Sent");           
         //sendWhatsAppMessage("whatsapp:+12221231234", message);
         //MailApp.sendEmail("1231231234@tmomail.net", subject, message);   
          }
        }
        if(row[index[offlineStates]] === "") {  data[i][index[offlineStates]] = '👎'; } // If empty cell Down
        //else {console.log(`unknown state ${row[index[portHttpStatus]]} for ${row[index[ddnsURL]]}`);}; 
         
        break;
      default:
  // console.log(`unknown state ${row[index[portHttpStatus]]} for ${row[index[ddnsURL]]}`);
      }
  });
  data.unshift(headers);
  console.log(`saving store: ${JSON.stringify(store)}`);
  PropertiesService.getScriptProperties().setProperty('sent', JSON.stringify(store));
  sheet.getRange(1,1,data.length,data[0].length).setValues(data);
}

 
function clr() {             //✅☑️✅✔️❎❌✖️❎
  PropertiesService.getScriptProperties().deleteAllProperties();
}
