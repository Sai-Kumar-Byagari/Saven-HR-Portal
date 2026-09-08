# ══════════════════════════════════════════════════════════════
#  SAVEN HR PORTAL — DEPLOYMENT GUIDE
# ══════════════════════════════════════════════════════════════


# ██████████████████████████████████████████████████████████████
#  PART A: TESTING / DEMO MODE (on YOUR development laptop)
# ██████████████████████████████████████████████████████████████
#  Use this to quickly let other laptops test the app
#  without setting up anything on their machines.
#  Everything runs on YOUR laptop — they just open a browser.
# ──────────────────────────────────────────────────────────────

#  STEP 1: Find your IP address
#  Open cmd / terminal and run:
#    Windows: ipconfig     → look for "IPv4 Address"
#    Linux:   hostname -I
#  Example: 192.168.1.100

#  STEP 2: Start the backend (Terminal 1)
cd saven-hr-portal/backend
npm run dev
#  Backend runs on → http://localhost:5000

#  STEP 3: Start the frontend (Terminal 2)
cd saven-hr-portal/frontend
npm run dev
#  Frontend runs on → http://localhost:5173
#  Vite will also show:
#    ➜ Network: http://192.168.x.x:5173

#  STEP 4: Share with other laptops
#  Tell them to open their browser and go to:
#    http://<YOUR-IP>:5173
#  Example: http://192.168.1.100:5173
#
#  ✅ That's it! They can use the full app from their browser.
#  ❌ If it doesn't work → check Windows Firewall (allow port 5173 and 5000)
#
#  NOTE: Both your backend (5000) and frontend (5173) must be running.
#        If you close the terminal, the app stops.
#        For permanent hosting, follow Part B below.


# ██████████████████████████████████████████████████████████████
#  PART B: PRODUCTION DEPLOYMENT (on the office server/system)
# ██████████████████████████████████████████████████████████████
#  Use this when you want to deploy permanently on a system.
#  Only ONE server runs (port 5000) — serves both frontend & API.
#  Server stays running 24/7 even after closing the terminal.
#  Node.js and MySQL should already be installed.


# ──────────────────────────────────────────────────────────────
#  STEP 1: Extract the zip
# ──────────────────────────────────────────────────────────────
#  Extract saven-hr-portal.zip to any location, e.g.:
#    C:\saven-hr-portal\
#  or
#    /home/user/saven-hr-portal/


# ──────────────────────────────────────────────────────────────
#  STEP 2: Import the database
# ──────────────────────────────────────────────────────────────
#  Open terminal / command prompt and run:

mysql -u root -p
#  Inside MySQL prompt, run these 2 lines:
#    CREATE DATABASE hr_portal_saven;
#    EXIT;

#  Then import the SQL dump:
mysql -u root -p hr_portal_saven < hr_portal_saven_backup.sql


# ──────────────────────────────────────────────────────────────
#  STEP 3: Update the .env file
# ──────────────────────────────────────────────────────────────
#  Open this file in notepad:
#    saven-hr-portal/backend/.env
#
#  Change ONLY these 2 lines:
#
#    NODE_ENV=production
#    DB_PASSWORD=<this system's MySQL password>
#
#  Save and close the file.


# ──────────────────────────────────────────────────────────────
#  STEP 4: Install PM2 (one time only)
# ──────────────────────────────────────────────────────────────
#  Open terminal / command prompt and run:

npm install -g pm2


# ──────────────────────────────────────────────────────────────
#  STEP 5: Start the server
# ──────────────────────────────────────────────────────────────
#  Navigate to the backend folder and start:

cd saven-hr-portal/backend
pm2 start server.js --name saven-hr

#  You should see a green "online" status. ✅


# ──────────────────────────────────────────────────────────────
#  STEP 6: Save PM2 config (so it survives reboot)
# ──────────────────────────────────────────────────────────────

pm2 save

#  For auto-start on system reboot:
#    Linux:   pm2 startup
#    Windows: pm2-startup install  (run as Administrator)


# ──────────────────────────────────────────────────────────────
#  STEP 7: Open the app
# ──────────────────────────────────────────────────────────────
#
#  On this server system:
#    http://localhost:5000
#
#  ┌──────────────────────────────────────────────────────────┐
#  │  FOR OTHER LAPTOPS / PCs IN THE OFFICE:                  │
#  │                                                          │
#  │  They DON'T need to install anything.                    │
#  │  They DON'T need Node.js, MySQL, or any files.           │
#  │  They just open Chrome/Edge and go to:                   │
#  │                                                          │
#  │    http://<server-IP>:5000                                │
#  │    Example: http://192.168.1.50:5000                      │
#  │                                                          │
#  │  The full website + all features will load in browser.   │
#  │  They can login, use everything — it all works.          │
#  │                                                          │
#  │  To find server IP:                                      │
#  │    Windows → cmd → ipconfig → "IPv4 Address"             │
#  │    Linux   → hostname -I                                  │
#  └──────────────────────────────────────────────────────────┘
#
#  🎉 DONE! Server runs forever. Others just use the browser.


# ██████████████████████████████████████████████████████████████
#  PART C: FOR OTHER EMPLOYEES / TESTERS (other laptops)
# ██████████████████████████████████████████████████████████████
#
#  ╔══════════════════════════════════════════════════════════╗
#  ║  YOU DO NOT NEED TO INSTALL ANYTHING ON YOUR LAPTOP.    ║
#  ║  YOU DO NOT NEED NODE.JS, MYSQL, OR ANY FILES.          ║
#  ║  YOU DO NOT NEED TO DOWNLOAD OR EXTRACT ANY ZIP.        ║
#  ╚══════════════════════════════════════════════════════════╝
#
#  Just follow these 2 steps:
#
#  STEP 1: Connect to the same office WiFi / LAN network
#
#  STEP 2: Open your browser (Chrome / Edge) and type:
#
#          http://<server-IP>:5000
#
#          (Ask your admin for the server IP address)
#          Example: http://192.168.1.50:5000
#
#  STEP 3: Login with your credentials
#          → Use your work email and password
#          → If first time, you'll be asked to set a password
#
#  That's it! You can now:
#    ✅ View your dashboard
#    ✅ Mark attendance (clock in / clock out)
#    ✅ Apply for leave
#    ✅ View payslips
#    ✅ Check open positions & download JDs
#    ✅ Submit employee voice / feedback
#    ✅ View org chart & directory
#    ✅ Chat with AI assistant
#    ✅ And everything else based on your role
#
#  ❌ If the page doesn't load:
#    → Make sure you're on the same WiFi/LAN as the server
#    → Ask admin if the server is running (pm2 status)
#    → Try refreshing the page
#


# ══════════════════════════════════════════════════════════════
#  PM2 COMMANDS (use anytime)
# ══════════════════════════════════════════════════════════════
#
#  pm2 status             → Is the server running?
#  pm2 logs saven-hr      → See live logs
#  pm2 restart saven-hr   → Restart server
#  pm2 stop saven-hr      → Stop server
#  pm2 monit              → CPU/memory dashboard
#


# ══════════════════════════════════════════════════════════════
#  HOW TO UPDATE THE APP LATER
# ══════════════════════════════════════════════════════════════
#
#  1. Get the updated zip from developer
#  2. Replace the saven-hr-portal folder
#  3. Run:
#       cd saven-hr-portal/backend
#       pm2 restart saven-hr
#
#  Done — app is updated!


# ══════════════════════════════════════════════════════════════
#  TROUBLESHOOTING
# ══════════════════════════════════════════════════════════════
#
#  ❌ Other PCs can't connect:
#     → Windows Firewall is blocking port 5000
#     → Open: Settings → Firewall → Allow an app
#     → Add inbound rule for port 5000
#
#  ❌ "ECONNREFUSED" or DB error:
#     → MySQL is not running. Start MySQL service.
#     → Check DB_PASSWORD in .env matches MySQL password
#
#  ❌ "Port 5000 already in use":
#     → pm2 delete saven-hr
#     → pm2 start server.js --name saven-hr
#
#  ❌ App not loading after system restart:
#     → Run: pm2 resurrect
#     → Or: cd saven-hr-portal/backend && pm2 start server.js --name saven-hr
#
# ══════════════════════════════════════════════════════════════
