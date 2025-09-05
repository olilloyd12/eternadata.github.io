// ===== PERFORMANCE MONITORING =====
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
    this.init();
  }

  init() {
    // Monitor Core Web Vitals
    this.observeCLS();
    this.observeFID();
    this.observeLCP();
    
    // Monitor page load performance
    window.addEventListener('load', () => this.measureLoadTime());
    
    // Monitor user interactions
    this.observeUserInteractions();
  }

  // Cumulative Layout Shift
  observeCLS() {
    if ('LayoutShift' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    }
  }

  // First Input Delay
  observeFID() {
    if ('PerformanceEventTiming' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-input') {
            this.metrics.fid = entry.processingStart - entry.startTime;
            observer.disconnect();
            break;
          }
        }
      });
      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    }
  }

  // Largest Contentful Paint
  observeLCP() {
    if ('LargestContentfulPaint' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);
    }
  }

  measureLoadTime() {
    const navigation = performance.getEntriesByType('navigation')[0];
    this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
    this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
  }

  observeUserInteractions() {
    ['click', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.metrics.timeToFirstInteraction = performance.now();
      }, { once: true, passive: true });
    });
  }

  getMetrics() {
    return this.metrics;
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
  }
}

// ===== MAIN APPLICATION =====
class EternaDataApp {
  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.isLoading = false;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initScrollAnimations();
    this.initSmoothScrolling();
    this.preloadCriticalResources();
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
    } else {
      this.onDOMReady();
    }
  }

  onDOMReady() {
    this.hideLoading();
    this.animateHeroElements();
    this.initIntersectionObserver();
  }

  setupEventListeners() {
    // Navigation toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => this.toggleNavigation(navMenu));
    }

    // Close nav on link click (mobile)
    document.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        if (navMenu && navMenu.classList.contains('active')) {
          this.toggleNavigation(navMenu);
        }
      });
    });

    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Header scroll effect
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });

    // Button click tracking
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.trackButtonClick(e));
    });

    // Error handling
    window.addEventListener('error', (e) => this.handleError(e));
    window.addEventListener('unhandledrejection', (e) => this.handleError(e));
  }

  toggleNavigation(navMenu) {
    navMenu.classList.toggle('active');
    
    // Update ARIA attributes
    const navToggle = document.getElementById('nav-toggle');
    const isOpen = navMenu.classList.contains('active');
    navToggle.setAttribute('aria-expanded', isOpen);
    navMenu.setAttribute('aria-hidden', !isOpen);
  }

  handleScroll() {
    const header = document.getElementById('header');
    const scrollY = window.scrollY;
    
    if (scrollY > 50) {
      header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
      header.style.boxShadow = 'none';
    }
  }

  initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          const headerHeight = document.getElementById('header').offsetHeight;
          const targetPosition = target.offsetTop - headerHeight - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  initScrollAnimations() {
    // Animate elements on scroll using Intersection Observer
    this.observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
  }

  initIntersectionObserver() {
    const animateElements = document.querySelectorAll(
      '.service-card, .step, .price-card, .hero__stats'
    );

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, this.observerOptions);

    animateElements.forEach(el => observer.observe(el));
  }

  animateHeroElements() {
    const heroElements = document.querySelectorAll(
      '.hero__title, .hero__description, .hero__cta, .hero__stats'
    );
    
    heroElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('animate-in');
      }, index * 200);
    });
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    
    if (this.isLoading) return;
    
    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Validate form
    if (!this.validateForm(form)) {
      this.showNotification('Please fill in all required fields correctly.', 'error');
      return;
    }

    // Show loading state
    this.isLoading = true;
    this.showLoading();
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    try {
      // Simulate form submission (replace with actual endpoint)
      await this.submitForm(formData);
      
      this.showNotification('Thank you! Your message has been sent successfully.', 'success');
      form.reset();
      
      // Track conversion
      this.trackConversion('form_submit');
      
    } catch (error) {
      console.error('Form submission error:', error);
      this.showNotification('Sorry, there was an error sending your message. Please try again.', 'error');
    } finally {
      this.isLoading = false;
      this.hideLoading();
      submitButton.disabled = false;
      submitButton.textContent = 'Send Message';
    }
  }

  validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
      const value = field.value.trim();
      const fieldType = field.type;
      
      // Remove previous error styling
      field.classList.remove('error');
      
      if (!value) {
        isValid = false;
        field.classList.add('error');
        return;
      }

      // Email validation
      if (fieldType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
          field.classList.add('error');
        }
      }
    });

    return isValid;
  }

  async submitForm(formData) {
    // Replace with your actual form submission endpoint
    const response = await fetch('/api/contact', {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return response.json();
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
      <div class="notification__content">
        <span class="notification__message">${message}</span>
        <button class="notification__close" aria-label="Close notification">×</button>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto hide after 5 seconds
    setTimeout(() => this.hideNotification(notification), 5000);

    // Close button functionality
    notification.querySelector('.notification__close').addEventListener('click', () => {
      this.hideNotification(notification);
    });
  }

  hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('show');
    }
  }

  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.remove('show');
    }
  }

  trackButtonClick(e) {
    const button = e.target.closest('.btn');
    if (button) {
      const action = button.textContent.trim().toLowerCase().replace(/\s+/g, '_');
      this.trackEvent('button_click', { action });
    }
  }

  trackConversion(type, data = {}) {
    // Track conversions (integrate with analytics)
    console.log(`Conversion tracked: ${type}`, data);
    
    // Google Analytics 4 example (uncomment and configure)
    // if (typeof gtag !== 'undefined') {
    //   gtag('event', 'conversion', {
    //     event_category: 'engagement',
    //     event_label: type,
    //     ...data
    //   });
    // }
  }

  trackEvent(eventName, data = {}) {
    console.log(`Event tracked: ${eventName}`, data);
    
    // Google Analytics 4 example (uncomment and configure)
    // if (typeof gtag !== 'undefined') {
    //   gtag('event', eventName, data);
    // }
  }

  preloadCriticalResources() {
    // Preload critical images
    const criticalImages = [
      'assets/logo.svg',
      'assets/favicon.svg'
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  handleError(error) {
    console.error('Application error:', error);
    
    // Show user-friendly error message for critical errors
    if (error.error && error.error.stack) {
      this.showNotification('Something went wrong. Please refresh the page and try again.', 'error');
    }

    // Log error for monitoring (integrate with error tracking service)
    this.logError(error);
  }

  logError(error) {
    // Integrate with error tracking service like Sentry, LogRocket, etc.
    const errorData = {
      message: error.message || 'Unknown error',
      stack: error.stack || error.error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      metrics: this.performanceMonitor.getMetrics()
    };

    console.log('Error logged:', errorData);
    
    // Send to error tracking service
    // Example: Sentry.captureException(error);
  }

  // Cleanup method
  destroy() {
    this.performanceMonitor.disconnect();
  }
}

// ===== UTILITY FUNCTIONS =====
const Utils = {
  // Debounce function for performance optimization
  debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  // Throttle function for scroll events
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Check if element is in viewport
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Format currency
  formatCurrency(amount, currency = 'GBP') {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  // Sanitize HTML to prevent XSS
  sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
};

// ===== CSS FOR NOTIFICATIONS =====
const notificationStyles = `
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 400px;
    padding: 16px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    transform: translateX(100%);
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    z-index: 10000;
    border-left: 4px solid #0066ff;
  }

  .notification.show {
    transform: translateX(0);
  }

  .notification--success {
    border-left-color: #00c851;
    background: linear-gradient(135deg, #f0fff4, #ffffff);
  }

  .notification--error {
    border-left-color: #ff4444;
    background: linear-gradient(135deg, #fff5f5, #ffffff);
  }

  .notification__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .notification__message {
    flex: 1;
    color: #334155;
    font-weight: 500;
  }

  .notification__close {
    background: none;
    border: none;
    font-size: 20px;
    color: #64748b;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.15s ease;
  }

  .notification__close:hover {
    background: #f1f5f9;
    color: #334155;
  }

  .form-input.error,
  .form-textarea.error {
    border-color: #ff4444;
    background-color: #fff5f5;
  }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registration successful:', registration);
    } catch (error) {
      console.log('ServiceWorker registration failed:', error);
    }
  });
}

// ===== INITIALIZE APPLICATION =====
let app;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app = new EternaDataApp();
  });
} else {
  app = new EternaDataApp();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (app) {
    app.destroy();
  }
});

// Export for testing or external access
window.EternaDataApp = EternaDataApp;
window.Utils = Utils;