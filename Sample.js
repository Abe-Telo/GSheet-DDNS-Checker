#!/usr/bin/env node

/*
  TODO: 
   -test case if scan timeout
    (no ports, iirc nothing to tell it timeouted)

  NOTES:
    -update is performed twice, first with IPs and clear format, 2nd with notes and background colors
*/

// Model NVR has other types of link
//http://<DDNS>:<port>/ISAPI/ContentMgmt/StreamingProxy/<channelID>/picture
// First download the XML. Read channel ID and add to a loop to google sheets
// Once in google sheet we will spilt the ID with cammas.
// Testing concept in app, each camma counting.
'use strict';
const dns = require('dns');
const nmap = require('libnmap');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { parseStringPromise } = require('xml2js'); // new dep

// dev dep
const fs = require('fs'); // devdep: save reports for analyse
const creds = require('./GOOGLE_API.json'); // 
//const { debug } = require('console');
const doc = new GoogleSpreadsheet('SHEET ID'); // Your Sheet ID
const ROW_OFFSET = 2;  //From Top
 

const headers = [
    'ddns',
    'ip',
    'http',
    'server', 
    'rtsp',
    'router',
    //'other',	
]; //Dummi Headers Counting from 0

const toheaders = [ // For col to submit to sheets
    'HTTP_up',
    'HTTPS_up',
    'RTSP_up',
    'Mobile_up',
    'Router_up',
    'server',
    'device',
    'router',
    'modem',
]; 
const ipv4 =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const ipv6 =
    /^[a-fA-F0-9]{1, 4}\:[a-fA-F0-9]{1, 4}\:[a-fA-F0-9]{1, 4}\:[a-fA-F0-9]{1, 4}\:[a-fA-F0-9]{1, 4}\:[a-fA-F0-9]{1, 4}\:[a-fA-F0-9]{1, 4}\:[a-fA-F0-9]{1, 4}$/;
const isIP = (ip) => (ip.match(ipv4) || ip.match(ipv6) ? true : false);

const isUp = (rdata) =>
    rdata.runstats[0].hosts[0].item.up == 1 ? true : false;
	
// modified port function to take multiple hosts and port
//const port = (rdata, port) => {
const port = (rdata, addr, port) => {
    if (!rdata.host[0].ports ||
        !rdata.host[0].ports[0].port
            .map((e) => e.item.portid)
            .some((p) => p == port)
    )
        return null; // timeout
    const find = rdata.host[0].ports[0].port.filter(
        (e) => e.item.portid == port
    )[0];

    //let ispData = (rdata?.host[0].hostnames[0].hostname[0].item.name);
    return {
        //ISP: ispData,
        protocol: find.item.protocol,
        portid: find.item.portid,
        state: find.state[0].item,
        service: find.service[0].item,
    };
};

// v4 wants an RGB(A) obj with values in a 0-1 range, totally discarding alpha here
const hex2RGBA = (hexCode) => {
    const hex = hexCode.replace('#', '');
    if (hex.length === 3) hex += hex;
    return {
        red: parseInt(hex.substring(0, 2), 16) / 255,
        green: parseInt(hex.substring(2, 4), 16) / 255,
        blue: parseInt(hex.substring(4, 6), 16) / 255,
    };
};

const colors = {
    up: hex2RGBA('#A9DFBF'), // green
    down: hex2RGBA('#E74C3C'), // red
    dns: hex2RGBA('#D3D3D3'), // grey
    timeout: hex2RGBA('#c85103'), // the timeout color \o/
    open: hex2RGBA('#A9DFBF'), // green
    closed: hex2RGBA('#E74C3C'), // red
    filtered: hex2RGBA('#F39C12'), // orange
    unfiltered: hex2RGBA('#F7DC6F'), // yellow
    'open|filtered': hex2RGBA('#C39BD3'), // purple
    'closed|filtered': hex2RGBA('#873600'), // brown
};

// dns lookup promise

async function lookup(domain) {
    return new Promise((resolve, reject) => {
        dns.lookup(domain, (err, address, family) => {
            if (err) reject(err);
            resolve(address);
            //console.log('Looking up DDNS: ',domain, ' -> ',address);
        });
    });
}

// nmap promise
async function scan(opts) {
    return new Promise((resolve, reject) => {
        nmap.scan(opts, function (err, report) {
            if (err) reject(err);
            resolve(report);
            //console.log('Live Report: ',report);
        });
    });
    //console.log('NMAP',opts);
}

function getISP(reports,data,domain) {
    //const ISP = "Host is down: ";
    //var ISP = reports[data[domain].addr].host[0].hostnames[0].hostname[0].item.name;

    const reportsData = reports[data[domain].addr];
    if (!reportsData) return 'Host is down';

    const reportsHost = reportsData.host[0];
    if (!reportsHost) return 'Host is down';

    const reportHostNames = reportsHost.hostnames[0];
    if (reportHostNames == '\n') return 'Host is down';
    if (!reportHostNames) return 'Host is down';
    //console.log("reportHostNames",domain,reportHostNames) 

    const reportHostName = reportHostNames.hostname[0];
    if (!reportHostName) return 'Host is down';
    //console.log("reportHostName",domain,reportHostName)

    const name = reportHostName.item.name;
    if (!name) return 'Host is down';

    //if all the above else's are false, that means we have the data we want, so we return it
 //   return `Host is up: ${name}`;
    return `${name}`;    
}
(async () => {
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    console.log(`Loading spreadsheet: ${doc.title} (${doc.spreadsheetId})`);
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadCells();

    const data = {};
    for (let i = ROW_OFFSET, len = sheet.rowCount; i < len; i++) {
        //let HTTP_up = sheet.getCell(i, 0);
        let ddns = sheet.getCell(i, 0);
        if (ddns.value != null) {
            data[ddns.value] = {};
            let ip;
            try {
                ip = await lookup(ddns.value);
            } catch (e) {
                ip = e.code || null;
            }
            ///
            //  UPDownStats.forEach((h, j) => data[HTTP_up.value][UPDownStats[j]] = sheet.getCell(i, j));
            //  data[HTTP_up.value].HTTPS_up.value = ip; // MOD VALUE
            //  data[HTTP_up.value]['HTT'] = HTTP_up; // just to save on calls
            ///
            headers.forEach(
                (h, j) => (data[ddns.value][headers[j]] = sheet.getCell(i, j))
            );
            data[ddns.value].ip.value = ip; // MOD VALUE
            data[ddns.value]['addr'] = ip; // just to save on calls
            //(pdata == null)
        }
    }
    //console.table(ports);
    console.table(data, ['addr']); // log ips
    let ports = [];
    Object.keys(data).forEach((k1) =>
        headers.slice(2).forEach((k2) => ports.push(data[k1][k2].value))
    );
    ports = Array.from(new Set(ports));
    let ips = Object.values(data)
        .map((e) => e.addr)
        .filter((ip) => isIP(ip));

    let opts = {
        timeout: 190, 
		
		//T4 // Aggressive
        // A List of commands can be found in Nmap.txt
        //flags: ['-sv', '-p'], // This seams to work via command not in script (probbely the way the script works)
        //nmap -sV -p 9000,8000,554,443, Berkowitz137.araknisdns.com
        //flags: ['-sV', '-sT', '-Pn w/Idlescan'], // This may be another option (need to test and make sure nothing goes down)
        flags: ['-sV', '-sS', '-Pn w/Idlescan'], // This may be another option (need to test and make sure nothing goes down)
        //flags: ['-sv', '-sT', ' --version-intensity 9 '],
        //flags: ['-sV', '-sT', '-Pn'], //Working But seems DDNS port goes down after.
        //flags: ['-sV', '-sT'], //XSE
        ports: ports.filter(Boolean).join(','),
        range: Array.from(new Set(ips)),
    };
    console.log(
        'Timeout: ',
        [opts.timeout],
        '\n',
        'Flage: ',
        opts.flags,
        '\n',
        'Scanning Ports: ',
        [opts.ports]
    );
    let reports;
    try {
        console.log('Scan Starting: ' + new Date());
        console.log('Nmap is scanning...');
        reports = await scan(opts);
        //fs.writeFileSync('./reports.json', JSON.stringify(reports, null, 2)); // dev
    } catch (e) {
        reports = null;
        console.log('NMAP ERROR');
        console.log(e);
        process.exit(1);
    }

    Object.keys(data).forEach((domain) => {
        headers.forEach((col) => data[domain][col].clearAllFormatting());
        //console.log("clearing All Formatting Notes and colors");
    });
    await sheet.saveUpdatedCells(); // MOD VALUE RESET!

    Object.keys(data).forEach((domain) => {
        if (!isIP(data[domain].addr)) {
            /* dns down */
            return headers.forEach((col) => {
                data[domain][col].backgroundColor = colors.dns;
                data[domain][col].note = '❌ DNS FAILED: DNS lookup did not resolve';
                console.warn('DNS lookup did not resolve: ', [domain]);
            });
        }
        /* if it reaches here then dns ok */
        if (!isUp(reports[data[domain].addr])) {
            /* host down */
            return headers.forEach((col) => {
                data[domain][col].backgroundColor = colors.down;
                console.log('host down: ', domain);
            });
        }
        /* if it reaches here then host up */
        headers.slice(0, 2).forEach((col) => {
            let isp = getISP(reports,data,domain);
            if (isp != 'Host is down') {
                data[domain][col].backgroundColor = colors.up;
                data[domain][col].note = `✅ `+isp;
            } else {
                //if you want to do something specific when the host is down
                data[domain][col].backgroundColor = colors.down;
                data[domain][col].note = `❌ Host is down`;
            }
        });

        headers.slice(2).forEach((p) => {
            let pdata = port(reports[data[domain].addr], data[domain][p].value);
            pdata == null
                ? ((data[domain][p].backgroundColor = colors.timeout),  // Just means cell is empty so timout
                 /* (data[domain][p].note = 'nmap timeout')*/  (data[domain][p].note = ''))
                : ((data[domain][p].backgroundColor =
                      colors[pdata.state.state]),
                  (data[domain][
                      p
                  ].note = `${pdata.state.reason} (${pdata.service.name}/${pdata.service.devicetype} (${pdata.service.product})`));

            if (pdata !== null) {
                //If ISP is UP
                //    // debug("DEBUGGING",`${pdata.ISP}`)
                //console.log(`host seems up: ${pdata.ISP}`)
                
                /* else  if(pdata == null){ //IF ISP is Down
                headers.slice(0, 2).forEach(col => {/*DDNS ROW*/ //console.log(ISP);
                /* data[domain][col].backgroundColor = colors.dns;  
                  data[domain][col].note = `host seems down: No internet!`;
                  console.log("DDON",domain," seems down")
                  });    
                  }*/
                //console.log("pdate: ", pdata)  //console.log("pdate: ", )
                //console.info("Found: ",pdata);/* host up COL */
                //console.log([{Stats: pdata.state.state, Domain: domain, Port: pdata.portid, Name: pdata.service.name, DeviceType: pdata.service.devicetype, Product: pdata.service.product}]);
                //console.info([pdata.state.state],domain,pdata.portid,pdata.service.name,[pdata.service.devicetype],pdata.service.product );
                console.info(pdata);
            }
        });

        //console.log("host seems up: ",domain)
    });
	console.log('Scan Completed: ' + new Date());
	
	// TimeStamp
    //  sheet.getCell(1, 1).value = new Date().toLocaleString().replace('', '').substr(0, 19); // set the 'updated' cell
    sheet.getCell(1, 7).value = new Date()
        .toLocaleString()
        .replace('', '')
        .substr(0, 23); // set the 'updated' cell
    await sheet.saveUpdatedCells();
})();
