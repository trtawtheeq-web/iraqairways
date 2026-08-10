(function() {
  'use strict';
  
  function initAnnouncementSlider() {
    var slider = document.getElementById('js-announcement-bar-slider');
    if (!slider) return;
    
    var announcements = slider.querySelectorAll('.announcement-bar__announcement');
    if (announcements.length < 2) return;
    
    // Hide all except first
    var currentIndex = 0;
    for (var i = 0; i < announcements.length; i++) {
      announcements[i].style.transition = 'opacity 0.5s ease-in-out';
      if (i !== 0) {
        announcements[i].style.opacity = '0';
        announcements[i].style.position = 'absolute';
        announcements[i].style.top = '0';
        announcements[i].style.left = '0';
        announcements[i].style.right = '0';
      } else {
        announcements[i].style.opacity = '1';
        announcements[i].style.position = 'relative';
      }
    }
    
    // Make the slider container relative for absolute positioning
    slider.style.position = 'relative';
    slider.style.overflow = 'hidden';
    
    // Rotate every 4 seconds
    setInterval(function() {
      var prevIndex = currentIndex;
      currentIndex = (currentIndex + 1) % announcements.length;
      
      // Fade out current
      announcements[prevIndex].style.opacity = '0';
      
      // Fade in next
      announcements[currentIndex].style.opacity = '1';
      
      // After transition, swap positioning
      setTimeout(function() {
        announcements[prevIndex].style.position = 'absolute';
        announcements[prevIndex].style.top = '0';
        announcements[prevIndex].style.left = '0';
        announcements[prevIndex].style.right = '0';
        announcements[currentIndex].style.position = 'relative';
      }, 500);
    }, 4000);
  }
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnnouncementSlider);
  } else {
    initAnnouncementSlider();
  }
})();
