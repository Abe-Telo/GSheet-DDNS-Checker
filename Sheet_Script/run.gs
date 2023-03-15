// Run this every 5 min, instead of running all of them sepretly. 
// This is your main triger file.
// You will need the following files to run this. 
// Convert_Note2cell.gs, LastOnline_TimeStamp.gs, Alert_when_offline_Online.gs, getColIndexByName.gs.

function RUNALL() {
  console.info('Starting: Convert_Note2cell -------------------------------------------')
  Convert_Note2cell();
  
  console.info('Starting: LastOnline_TimeStamp -------------------------------------------')
  LastOnline_TimeStamp();
  
  console.info('Starting: Alert_when_offline_Online -------------------------------------------')
  Alert_when_offline_Online();

  console.info('Script Completed')
}


// If you would like you can add all your settings in this file. For instance
// var Settingname = "Setting Value";
// It will be gloabal setting outside a funchion. 
