(function() {
  'use strict';

  // Only show popup once per visitor
  if (localStorage.getItem('amouage_popup_shown') === '1') return;

  // Detect mobile
  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

  // Generate or retrieve random countdown end time (random for each visitor, less than 13 hours)
  function getCountdownEnd() {
    var stored = localStorage.getItem('amouage_popup_countdown_end');
    if (stored) {
      var endTime = parseInt(stored, 10);
      if (endTime > Date.now()) {
        return endTime;
      }
    }
    // Random between 2 and 13 hours
    var minMs = 2 * 60 * 60 * 1000;
    var maxMs = 13 * 60 * 60 * 1000;
    var randomMs = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    var endTime = Date.now() + randomMs;
    localStorage.setItem('amouage_popup_countdown_end', String(endTime));
    return endTime;
  }

  function createPopup() {
    var countdownEnd = getCountdownEnd();

    // Overlay
    var overlay = document.createElement('div');
    overlay.id = 'discount-popup-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s ease;';

    // Popup
    var popup = document.createElement('div');
    popup.style.cssText = 'background:#fff;border-radius:12px;padding:40px 50px;text-align:center;max-width:480px;width:90%;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.3);transform:scale(0.8);transition:transform 0.3s ease;';

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'position:absolute;top:12px;right:18px;background:none;border:none;font-size:28px;cursor:pointer;color:#333;line-height:1;';
    closeBtn.onclick = closePopup;

    // Logo
    var logo = document.createElement('div');
    logo.style.cssText = 'font-family:"Times New Roman",serif;font-size:28px;letter-spacing:0.3em;font-weight:300;color:#000;margin-bottom:20px;';
    logo.textContent = 'AMOUAGE';

    // Subtitle
    var subtitle = document.createElement('p');
    subtitle.style.cssText = 'font-size:15px;color:#555;margin-bottom:12px;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;';
    if (isMobile) {
      subtitle.textContent = '\u062E\u0635\u0645 \u0644\u0641\u062A\u0631\u0629 \u0645\u062D\u062F\u0648\u062F\u0629 \u0639\u0644\u0649 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A';
      subtitle.style.direction = 'rtl';
      subtitle.style.fontFamily = 'Arial, sans-serif';
    } else {
      subtitle.textContent = 'Limited Time Discount on All Products';
    }

    // Discount percentage
    var discountNum = document.createElement('div');
    discountNum.style.cssText = 'font-size:72px;font-weight:700;color:#cc0000;margin:15px 0;line-height:1;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;';
    discountNum.textContent = '25%';

    // Countdown container (always LTR: hours : minutes : seconds)
    var countdownContainer = document.createElement('div');
    countdownContainer.style.cssText = 'display:flex;justify-content:center;gap:12px;margin-top:25px;direction:ltr;';

    function createTimeBox(value, label) {
      var box = document.createElement('div');
      box.style.cssText = 'background:#1a1a1a;color:#fff;border-radius:8px;padding:12px 16px;min-width:65px;';
      var num = document.createElement('div');
      num.style.cssText = 'font-size:28px;font-weight:700;font-family:"Helvetica Neue",monospace;';
      num.textContent = value;
      var lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;color:#ccc;';
      lbl.textContent = label;
      box.appendChild(num);
      box.appendChild(lbl);
      return { box: box, num: num };
    }

    var hoursLabel = isMobile ? '\u0633\u0627\u0639\u0627\u062A' : 'HOURS';
    var minsLabel = isMobile ? '\u062F\u0642\u0627\u0626\u0642' : 'MINUTES';
    var secsLabel = isMobile ? '\u062B\u0648\u0627\u0646\u064A' : 'SECONDS';

    var hoursBox = createTimeBox('00', hoursLabel);
    var minsBox = createTimeBox('00', minsLabel);
    var secsBox = createTimeBox('00', secsLabel);

    var sep1 = document.createElement('div');
    sep1.style.cssText = 'font-size:28px;font-weight:700;color:#333;display:flex;align-items:center;';
    sep1.textContent = ':';
    var sep2 = document.createElement('div');
    sep2.style.cssText = 'font-size:28px;font-weight:700;color:#333;display:flex;align-items:center;';
    sep2.textContent = ':';

    countdownContainer.appendChild(hoursBox.box);
    countdownContainer.appendChild(sep1);
    countdownContainer.appendChild(minsBox.box);
    countdownContainer.appendChild(sep2);
    countdownContainer.appendChild(secsBox.box);

    // Assemble
    popup.appendChild(closeBtn);
    popup.appendChild(logo);
    popup.appendChild(subtitle);
    popup.appendChild(discountNum);
    popup.appendChild(countdownContainer);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    // Mark as shown so it won't appear again
    localStorage.setItem('amouage_popup_shown', '1');

    // Animate in
    setTimeout(function() {
      overlay.style.opacity = '1';
      popup.style.transform = 'scale(1)';
    }, 50);

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closePopup();
    });

    // Update countdown every second
    function updateCountdown() {
      var remaining = countdownEnd - Date.now();
      if (remaining <= 0) {
        hoursBox.num.textContent = '00';
        minsBox.num.textContent = '00';
        secsBox.num.textContent = '00';
        return;
      }
      var h = Math.floor(remaining / 3600000);
      var m = Math.floor((remaining % 3600000) / 60000);
      var s = Math.floor((remaining % 60000) / 1000);
      hoursBox.num.textContent = h < 10 ? '0' + h : String(h);
      minsBox.num.textContent = m < 10 ? '0' + m : String(m);
      secsBox.num.textContent = s < 10 ? '0' + s : String(s);
    }

    updateCountdown();
    var timer = setInterval(updateCountdown, 1000);

    function closePopup() {
      overlay.style.opacity = '0';
      popup.style.transform = 'scale(0.8)';
      setTimeout(function() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        clearInterval(timer);
      }, 300);
    }
  }

  // Show popup after 2 seconds
  function init() {
    setTimeout(createPopup, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
