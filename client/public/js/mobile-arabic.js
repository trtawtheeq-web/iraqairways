/**
 * Mobile Arabic Auto-Translation
 * Automatically switches the site to Arabic on mobile devices
 */
(function() {
  'use strict';

  // Detect mobile (width < 768px or touch device)
  function isMobile() {
    return window.innerWidth < 768 || 
           ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0);
  }

  // Check if user manually chose English
  if (localStorage.getItem('amouage-lang') === 'en') {
    return; // Don't apply Arabic translation
  }

  // Translation dictionary
  const translations = {
    // Navigation
    'PERFUMES': 'العطور',
    'The Guidance Collection': 'مجموعة الإرشاد',
    'Best Sellers': 'الأكثر مبيعاً',
    'New Arrivals': 'وصل حديثاً',
    "Women's Perfumes": 'عطور نسائية',
    "Men's Perfumes": 'عطور رجالية',
    'Universal Perfumes': 'عطور للجنسين',
    'Eaux De Parfum': 'أو دو بارفان',
    'Extraits De Parfum': 'إكسترا دو بارفان',
    'Attars': 'العطور',
    'Shop All': 'تسوق الكل',
    'COLLECTIONS': 'المجموعات',
    'The Secret Garden Collection': 'مجموعة الحديقة السرية',
    'The Essences': 'الجواهر',
    'The Odyssey Collection': 'مجموعة الأوديسي',
    'The Main Collection': 'المجموعة الرئيسية',
    'The Library Collection': 'مجموعة المكتبة',
    'The Exceptional Extraits': 'الإكسترا الاستثنائية',
    'The Attars': 'العطور',
    'BODY': 'العناية بالجسم',
    'GIFTING': 'الهدايا',
    'Gifts for Her': 'هدايا لها',
    'Gifts for Him': 'هدايا له',
    'All Giftsets': 'جميع مجموعات الهدايا',
    'DISCOVERY': 'اكتشف',
    'Sampler Sets': 'مجموعات العينات',
    'Miniature Sets': 'مجموعات مصغرة',
    'Travel Sets': 'مجموعات السفر',
    'HOUSE OF AMOUAGE': 'دار أمواج',
    
    // Headings
    'INTRODUCING TWO NEW ATTARS': 'نقدم لكم عطرين جديدين',
    'Celebrate Him': 'احتفل به',
    'GUIDANCE COLLECTION': 'مجموعة الإرشاد',
    'Bridal Season': 'موسم الأعراس',
    'New - Love Hibiscus': 'جديد - لوف هيبيسكوس',
    'Harvested by hand': 'محصود يدوياً',
    'luxury body line': 'خط العناية الفاخر',
    'THE PERFECT GIFT': 'الهدية المثالية',
    'PRECIOUS, POTENT, PERSONAL': 'ثمين، قوي، شخصي',
    'FIND YOUR NEAREST AMOUAGE BOUTIQUE': 'اعثر على أقرب متجر أمواج',
    'THE HOUSE OF AMOUAGE': 'دار أمواج',
    'Insider Access': 'وصول حصري',
    'High Perfumery from the Sultanate of Oman, founded in 1983.': 'عطور فاخرة من سلطنة عمان، تأسست عام 1983.',
    'The House of Amouage': 'دار أمواج',
    'CUSTOMER SERVICE': 'خدمة العملاء',
    'LEGAL': 'قانوني',
    
    // Products
    'Reflection Man': 'ريفلكشن مان',
    'Guidance 46': 'جايدنس 46',
    'Outlands': 'آوتلاندز',
    'Purpose 50': 'بيربوز 50',
    
    // Buttons & Links
    'Continue shopping': 'متابعة التسوق',
    'Log in': 'تسجيل الدخول',
    'View Bag': 'عرض الحقيبة',
    'shop Now': 'تسوق الآن',
    'SHOP NOW': 'تسوق الآن',
    'Shop now': 'تسوق الآن',
    'shop now': 'تسوق الآن',
    'Discover': 'اكتشف',
    'STORE LOCATOR': 'محدد المتاجر',
    'DISCOVER OUR STORY': 'اكتشف قصتنا',
    'Subscribe': 'اشترك',
    'PROCEED TO CHECKOUT': 'المتابعة للدفع',
    'Update': 'تحديث',
    'OK': 'موافق',
    'Skip to content': 'تخطي إلى المحتوى',
    'Your cart is empty': 'سلة التسوق فارغة',
    'Bag': 'الحقيبة',
    'Bag Subtotal': 'المجموع الفرعي',
    'Country/region': 'البلد/المنطقة',
    'Update country/region': 'تحديث البلد/المنطقة',
    'Trending': 'الرائج',
    'Top Products': 'أفضل المنتجات',
    'Terms and Conditions': 'الشروط والأحكام',
    'Privacy Policy': 'سياسة الخصوصية',
    'Powered by Shopify': 'مدعوم من Shopify',
    // 'English': removed - don't translate the language switch button
    'Search': 'بحث',
    'Cart': 'السلة',
    'Account': 'الحساب',
    'Menu': 'القائمة',
    'Close menu': 'إغلاق القائمة',
    'Close': 'إغلاق',
    'shipping': 'الشحن',
    'Gifts for him': 'هدايا له',
    'Add to cart': 'أضف للسلة',
    'ADD TO BAG': 'أضف للحقيبة',
    'Add to Bag': 'أضف للحقيبة',
    'Sold out': 'نفذت الكمية',
    'Sale': 'تخفيض',
    'New': 'جديد',
    'Quick view': 'عرض سريع',
    'View all': 'عرض الكل',
    'View All': 'عرض الكل',
    'Free shipping': 'شحن مجاني',
    'FREE SHIPPING': 'شحن مجاني',
    'Complimentary': 'مجاني',
    'COMPLIMENTARY': 'مجاني',
  };

  function translatePage() {
    if (!isMobile()) return;

    // Set HTML attributes for RTL
    document.documentElement.setAttribute('lang', 'ar');
    document.documentElement.setAttribute('dir', 'rtl');

    // Add RTL CSS overrides
    const rtlStyle = document.createElement('style');
    rtlStyle.id = 'mobile-arabic-rtl';
    rtlStyle.textContent = `
      @media (max-width: 767px) {
        html[dir="rtl"] body {
          direction: rtl;
          text-align: right;
        }
        html[dir="rtl"] .header {
          direction: rtl;
        }
        html[dir="rtl"] .header__heading {
          order: 0;
        }
        html[dir="rtl"] .header__icons {
          direction: rtl;
        }
        html[dir="rtl"] .menu-drawer {
          direction: rtl;
          text-align: right;
        }
        html[dir="rtl"] .menu-drawer__menu-item {
          text-align: right;
        }
        html[dir="rtl"] .menu-drawer__submenu {
          text-align: right;
        }
        html[dir="rtl"] .disclosure__list {
          text-align: right;
        }
        html[dir="rtl"] .am-block-image-heading {
          direction: rtl;
        }
        html[dir="rtl"] .am-title {
          direction: rtl;
        }
        html[dir="rtl"] .footer {
          direction: rtl;
          text-align: right;
        }
        html[dir="rtl"] .footer-block__heading {
          text-align: right;
        }
        html[dir="rtl"] .newsletter-form__field-wrapper {
          direction: rtl;
        }
        html[dir="rtl"] input[type="email"] {
          text-align: right;
        }
        html[dir="rtl"] .grid__item {
          text-align: right;
        }
        html[dir="rtl"] .card__heading,
        html[dir="rtl"] .card__information {
          text-align: right;
        }
        html[dir="rtl"] .price {
          direction: ltr;
          text-align: right;
        }
        html[dir="rtl"] .cart-drawer {
          direction: rtl;
          text-align: right;
        }
        html[dir="rtl"] .language-selector-container span {
          font-family: 'Arial', sans-serif;
        }
        html[dir="rtl"] .language-selector-container {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(rtlStyle);

    // Swap logo to official Arabic version from amouage.com
    function swapLogoToArabic() {
      const logoImg = document.querySelector('.header__heading-logo');
      if (logoImg) {
        logoImg.setAttribute('src', '/images/amouage-logo-ar.png');
        logoImg.setAttribute('srcset', '/images/amouage-logo-ar.png 300w, /images/amouage-logo-ar.png 450w, /images/amouage-logo-ar.png 600w');
        logoImg.setAttribute('alt', 'أمواج');
      }
    }

    // Move language selector inside mobile menu drawer
    function moveLanguageToMenu() {
      var langSelector = document.querySelector('.language-selector-container');
      var menuUtility = document.querySelector('.menu-drawer__utility-links');
      
      if (!menuUtility) return;
      
      // Hide original language selector from header
      if (langSelector) {
        langSelector.style.display = 'none';
      }
      
      // Create a simple language switch link (same style as Sign in)
      var langLink = document.createElement('a');
      langLink.href = '#';
      langLink.className = 'menu-drawer__account link focus-inset h5 medium-hide large-up-hide';
      langLink.style.display = 'flex';
      langLink.style.alignItems = 'center';
      langLink.style.gap = '8px';
      langLink.style.textDecoration = 'none';
      langLink.style.color = '#000';
      langLink.style.fontSize = '14px';
      langLink.style.marginTop = '5px';
      langLink.setAttribute('data-no-translate', 'true');
      langLink.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> English';
      
      langLink.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.setItem('amouage-lang', 'en');
        window.location.reload();
      });
      
      // Insert after Sign in
      var signInLink = menuUtility.querySelector('.menu-drawer__account');
      if (signInLink && signInLink.nextSibling) {
        menuUtility.insertBefore(langLink, signInLink.nextSibling);
      } else {
        menuUtility.appendChild(langLink);
      }
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        moveLanguageToMenu();
        swapLogoToArabic();
      });
    } else {
      moveLanguageToMenu();
      swapLogoToArabic();
    }

    // Translate all text nodes
    function translateTextNodes(element) {
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        // Skip elements marked as no-translate
        if (node.parentElement && node.parentElement.closest('[data-no-translate]')) continue;
        const text = node.textContent.trim();
        if (text && translations[text]) {
          node.textContent = node.textContent.replace(text, translations[text]);
        }
      }
    }

    // Translate specific elements
    function translateElements() {
      // Translate all text content
      translateTextNodes(document.body);

      // Translate placeholder attributes
      document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
        const placeholder = el.getAttribute('placeholder');
        if (placeholder && translations[placeholder]) {
          el.setAttribute('placeholder', translations[placeholder]);
        }
      });

      // Translate aria-labels
      document.querySelectorAll('[aria-label]').forEach(el => {
        const label = el.getAttribute('aria-label');
        if (label && translations[label]) {
          el.setAttribute('aria-label', translations[label]);
        }
      });

      // Translate title attributes
      document.querySelectorAll('[title]').forEach(el => {
        const title = el.getAttribute('title');
        if (title && translations[title]) {
          el.setAttribute('title', translations[title]);
        }
      });
    }

    // Run translation after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', translateElements);
    } else {
      translateElements();
    }

    // Also translate dynamically loaded content
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            translateTextNodes(node);
          }
        });
      });
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // Execute
  translatePage();
})();
