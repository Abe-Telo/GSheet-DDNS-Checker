// Run this every 5 min, instead of running all of them sepretly. 
// This is your main triger file.

function RUNALL() {
  console.info('Starting: Convert_Note2cell -------------------------------------------')
  Convert_Note2cell();
  
  console.info('Starting: LastOnline_TimeStamp -------------------------------------------')
  LastOnline_TimeStamp();
  
  console.info('Starting: Alert_when_offline_Online -------------------------------------------')
  Alert_when_offline_Online();

  console.info('Script Completed')
}
