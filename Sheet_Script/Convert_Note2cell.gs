 // All Comments from col A-G are being inported into cell for easy read.
 // ISP Is also being imported and converted to show the ISP type
 // Currently this script is messy needs a cleanup
 
 function Convert_Note2cell() {

   var sheetName = "DDNS"; // This is your Sheet name for instance "sheet1"
   
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName); //Sheet Name
  SpreadsheetApp.getActiveSpreadsheet().toast("Converting Notes to cell", "Starting internal script");
  const data = sheet.getDataRange().getValues(); //Evrything but the headers. 
  const headers = data.shift(); //All headers
  const index = Object.fromEntries(headers.filter(Boolean).map(e => [e, headers.indexOf(e)])); //All heders by number
  
  /*Settings */ 
  const ROW_OFFSET = 3;  //From Top
  //const targetStatic = headers.indexOf('Device/ISP Static?') +1;  // Get Target ISP Where it goes
  const getISPcol = headers.indexOf('ISPURL') +1; //Get Internet Service Provider URL
  const targetISP = headers.indexOf('ISP') +1;  // Get Target ISP Where it goes
  const startPortcol = headers.indexOf('External IP Address') +1; // Where the staring col of port is. 
  const targetstartPortcol = headers.indexOf('ISPURL') +1; // Where the staring Target col of the status.   
  const Ports_Col = 5;  //From Start - How many Col of ports are we counting? 
  /* End Settings */ 

  const getlastRow = (sheet.getLastRow()-ROW_OFFSET+1).toString();


  GetISPcol = sheet.getRange(ROW_OFFSET,getISPcol,getlastRow).getValues(); //Get Internet Service Provider URL
  TargetISP = sheet.getRange(ROW_OFFSET,targetISP,getlastRow);      // Get Target ISP Where it goes
  TargetISPvalue = sheet.getRange(ROW_OFFSET,targetISP,getlastRow).getValues();      // Get Target ISP Where it goes

  //GetifStatic = sheet.getRange(ROW_OFFSET,getISPcol,getlastRow).getValues(); //Just to avoid dublicat Value
  //TargetStatic = sheet.getRange(ROW_OFFSET,targetStatic,getlastRow); //Get Internet Service Provider URL

  StartPortcol = sheet.getRange(ROW_OFFSET,startPortcol,getlastRow,Ports_Col).getNotes(); // Where the staring col of port is. 
  TargetstartPortcol = sheet.getRange(ROW_OFFSET,targetstartPortcol,getlastRow,Ports_Col); //  Where the staring Target col of the status.   
 
  const repl = {
 //   "✅ Host is up:": "✅",
    "syn-ack": "✅",
    "conn-refused": "🤔 refused",
    "nmap timeout":"",
    " (unknown/undefined ":"✅❓ (unknown)",
    "(cslistener/undefined (undefined)":"✅❓ ( cslistener/undefined", 
    "(rtsp/undefined (Apple AirTunes rtspd)": "✅ (rtsp/undefined (rtspd)",

  //  "✅ ❌":"❌",
    "down/filtered": "🛑 Somthing is wrong",
    "no-response": "👎 no-response", 
    " (http/undefined (lighttpd)": "✅ Verizon Fios (http/undefined (lighttpd)", 
    " (http/webcam (Hikvision ": "✅⏺️ Hikvision (http/webcam)",
    "(ipcam/undefined ": "✅🎥", 
  }; // Icons you can use ❓🤔🧐🤔🤯


 
// GetNotes.foreach((Row,Count_+1 => Row.forEach((col,Count_+1))
  StartPortcol.forEach((r,i) => r.forEach((c, j) => {
    for (const [key, value] of Object.entries(repl)) {
      if(c.includes(key))
          //GetNotes[i][j] = value;
          //GetNotes Counted Row And Counted COL = (to See number ROW,Cell is)
          //GetNotes[i][j] = "GetNotes["+i+"]["+j+"]";    
          StartPortcol[i][j] = `${value} ${StartPortcol[i][j].slice(key.length+1)}`;
     }
     
 }));
TargetstartPortcol.setValues(StartPortcol);

  const replISPNAME = {
        "❌":"",
        "optonline.net":"Optumum",
        "nyc.res.rr.com":"Spectrum",
        "nyc.rr.com":"Spectrum",
        "mycingular.net":"mycingular",
        "verizon.net":"Verizon"
     }; 

      //function (funcGetISPcol){
      GetISPcol.forEach((r,i) => r.forEach((c, j) => {
        for (const [key, value] of Object.entries(replISPNAME)) {
          if(c.includes(key))  // If Cell included  Key then import value of host.
              GetISPcol[i][j] = `${value}`;
               
          if(c.includes(value))  // If [key,value of replISPNAME]  is empty then leave current ISP Cell ( "❌":"",)
          GetISPcol[i][j] = `${TargetISPvalue[i]}`;

          if(!c)  // if host cell empty then dont replace target isp cell. 
          GetISPcol[i][j] = `${TargetISPvalue[i]}`;

          //console.log("I",TargetISPvalue[i], "j",GetISPcol[j], "I and J",GetISPcol[i][j]) 
 }; 

          TargetISP.setValues(GetISPcol); 
          //console.log("TargetISPvalue[i]",TargetISPvalue[i][j], "GetISPcol[i]", GetISPcol[i][j])   
          
      }));    
};
