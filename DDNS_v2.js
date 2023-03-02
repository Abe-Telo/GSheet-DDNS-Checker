function checkDDNS(hosts) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('API key not found!');
    return;
  }

  const sheetId = getSheetId();
  if (!sheetId) {
    console.error('Sheet ID not found!');
    return;
  }

  // Get existing IP addresses from the sheet
  const ips = getIPs(sheetId);
  if (!ips) {
    console.error('Error getting IP addresses from sheet!');
    return;
  }

  const updatedIPs = [];

  // Scan hosts in parallel
  scanHosts(hosts)
    .then((results) => {
      results.forEach((result) => {
        const { host, ip, ports } = result;

        // Check if the IP address has changed
        const existingIP = ips[host];
        if (!existingIP || existingIP !== ip) {
          updatedIPs.push({ host, ip, ports });

          // Update the IP address in the sheet
          setIP(sheetId, host, ip);
        }
      });

      // Notify via email if IP addresses have changed
      if (updatedIPs.length > 0) {
        const email = getEmail();
        if (email) {
          sendEmail(email, apiKey, updatedIPs);
        }
      }
    })
    .catch((error) => {
      console.error('Error scanning hosts:', error);
      return null;
    });
}
