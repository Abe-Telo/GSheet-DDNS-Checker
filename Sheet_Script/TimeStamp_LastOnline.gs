// https://community.glideapps.com/t/time-stamp-update/1382/84?u=abe.sherman
function TimeStamp_LastOnline() {

// Your settings
  var sheetName = "DDNS"; // This is your Sheet name for instance "sheet1"
  var portHttpDetails = "HTTP Details"; //Change this if you want the target offline to be on a diffrent row.
  var lastseanDDNS = "Last Updated"; // The name of the row that you want to update DDNS LAST SEAN TIMESTAMP
  

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues();
  var source_col_index = headers[0].indexOf(portHttpDetails);
  var target_col_index = headers[0].indexOf(lastseanDDNS);
  var LastUpdate = sheet.getRange('H2').getValues()  ;
  var data = sheet.getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn()).getValues();
  var now = new Date(LastUpdate);
  data.forEach(function (row) {
    var source_col_val = row[source_col_index];
    if (source_col_val.match(/✅/) ) {
      row[target_col_index] = now;
      //row[target_col_index] = LastUpdate;
    }
  });
  sheet.getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn()).setValues(data);
  SpreadsheetApp.getActiveSpreadsheet().toast("Updated TimeStamp", "Timestamp");
}
