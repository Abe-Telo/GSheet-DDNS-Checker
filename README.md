# GSheet-DDNS-Checker

In a Google sheet this script will read column A where the ddns are and read column c, d, e, f, g where the ports are. 
Once Nmap shows if up/down it will show the device that's under a port in a comments and change the colors of the cell. 


# instructions

Get api from https://console.developers.google.com/apis/

Share Email from api in sheet ![image](https://user-images.githubusercontent.com/29134216/109919567-d7a04980-7c86-11eb-81d4-709109d1b388.png)

Download API and put it in root folder

Change index.js API and Sheet ID




Install node.JS https://nodejs.org/en/

Linux: apt install nodejs npm nmap -y

# Open Terminal or CMD

npm install Or npm ci

node index.js

# Set timer: Here is the command amung the line.

systemctl enable /full_path/foo.timer

systemctl daemon-reload

systemctl enable foo.timer

systemctl start  foo.timer

systemctl enable foo.service

systemctl list-timers --all

# Oprating sytems 

Linux

Windows

# To do

Check prefix in Windows for nmap.

Video for the dummies.

Add 2 new columns of ports in the sheet. Provide at least an explanation.

Add a note of ISP in columns 1 and 2.

If ISP is not empty, then change the color (to avoid forcing online from NMap using -Pn).

Eventually, index.js will go into a cell instead of notes (at least index_cell.js, index_note.js).

ISP - should be stripped to ISP Name in a new cell (for my personal app).


![image](https://user-images.githubusercontent.com/29134216/222290036-659db498-b4c0-4c19-b0e5-4b0e26529b4e.png)


![image](https://user-images.githubusercontent.com/29134216/222292933-1c9323ff-a32c-4bfa-bc7a-e44d98e9a831.png)


