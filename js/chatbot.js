/* ================================================
   CHATBOT UI — نمایندگی ۱۷۳۷ زراعتکار
   Frontend-only chat interface with multi-page support
   Responsive | RTL | Accessibility
   ================================================ */
(function () {
  'use strict';

  /* ────────────────────────────────────────── DOM REFS ────────────────────────────────────────── */
  var floatingBtn   = document.getElementById('chatbotFloatingBtn');
  var chatWindow    = document.getElementById('chatbotWindow');
  var closeBtn      = document.getElementById('chatbotClose');
  var messagesArea  = document.getElementById('chatbotMessages');
  var inputField    = document.getElementById('chatbotInput');
  var sendBtn       = document.getElementById('chatbotSendBtn');
  var quickBtns     = Array.from(document.querySelectorAll('.chatbot-quick-btn'));
  var quickOptions  = document.querySelector('.chatbot-quick-options');

  /* ────────────────────────────────────────── STATE ────────────────────────────────────────── */
  var isOpen = false;
  var currentPage = 'main'; // main, buy, service, warranty, support
  var pageHistory = [];

  /* ────────────────────────────────────────── PAGES CONTENT ────────────────────────────────────────── */
  var pages = {
    main: {
      greeting: 'سلام، چطور می‌توانیم راهنمایی‌تان کنیم؟',
      options: [
        { key: 'buy', label: 'مشاوره خرید خودرو', icon: '🚗' },
        { key: 'service', label: 'خدمات پس از فروش', icon: '🔧' },
        { key: 'warranty', label: 'گارانتی و تعمیرات', icon: '🛡️' },
        { key: 'support', label: 'ارتباط با کارشناس', icon: '👨‍💼' }
      ]
    },
    buy: {
      greeting: 'مشاوره خرید خودرو',
      messages: [
        'سلام! خوش آمدید به بخش مشاوره خرید.',
        'ما تمام مدل‌های موجود نمایندگی را معرفی می‌کنیم و می‌توانیم شرایط خرید بهتری ارائه دهیم.',
        'برای کسب اطلاعات تفصیلی‌تر، لطفاً با واحد فروش تماس بگیرید: ۰۷۱-۳۸۳۲۳۴۱۰'
      ],
      options: [
        { key: 'contact_buy', label: 'تماس مستقیم با فروش', icon: '📞', action: 'contact' },
        { key: 'back', label: 'بازگشت به منو اصلی', icon: '←', action: 'back' }
      ]
    },
    service: {
      greeting: 'خدمات پس از فروش',
      messages: [
        'خوش آمدید به بخش خدمات پس از فروش!',
        'ما سرویس‌های دوره‌ای، تعمیرات و نگهداری را ارائه می‌دهیم.',
        'برای رزرو نوبت سرویس، شماره تماس: ۰۹۳۷۳۱۹۴۳۱۵'
      ],
      options: [
        { key: 'book_service', label: 'رزرو نوبت سرویس', icon: '📅', action: 'contact' },
        { key: 'back', label: 'بازگشت به منو اصلی', icon: '←', action: 'back' }
      ]
    },
    warranty: {
      greeting: 'گارانتی و تعمیرات',
      messages: [
        'درخوش آمدید به بخش گارانتی!',
        'تمام خودروهای ما دارای ضمانت اصالت و گارانتی کامل هستند.',
        'برای سوالات درباره گارانتی و تعمیرات: ۰۹۳۷۳۱۹۴۳۱۵'
      ],
      options: [
        { key: 'warranty_info', label: 'مشاوره درباره گارانتی', icon: '🛡️', action: 'contact' },
        { key: 'back', label: 'بازگشت به منو اصلی', icon: '←', action: 'back' }
      ]
    },
    support: {
      greeting: 'ارتباط با کارشناس',
      messages: [
        'برای ارتباط مستقیم با کارشناس‌های ما، لطفاً فرم تماس را پر کنید.',
        'یک نماینده از تیم ما در اسرع وقت با شما تماس خواهد گرفت.'
      ],
      options: [
        { key: 'open_form', label: 'بازکردن فرم تماس', icon: '📝', action: 'contact' },
        { key: 'back', label: 'بازگشت به منو اصلی', icon: '←', action: 'back' }
      ]
    }
  };

  /* ────────────────────────────────────────── UTILITIES ────────────────────────────────────────── */
  function createElement(tag, className, attrs) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        el.setAttribute(key, attrs[key]);
      });
    }
    return el;
  }

  function scrollMessagesToBottom() {
    setTimeout(function () {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }, 50);
  }

  /* ────────────────────────────────────────── MESSAGE RENDERING ────────────────────────────────────────── */
  function addMessage(text, isUser) {
    var messageEl = createElement('div', 'chatbot-message ' + (isUser ? 'user' : 'bot'));
    var contentEl = createElement('div', 'chatbot-message-content');
    contentEl.textContent = text;
    messageEl.appendChild(contentEl);
    messagesArea.appendChild(messageEl);
    scrollMessagesToBottom();
  }

  function addBotTyping() {
    var messageEl = createElement('div', 'chatbot-message bot');
    var typingEl = createElement('div', 'chatbot-typing');
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    messageEl.appendChild(typingEl);
    messagesArea.appendChild(messageEl);
    scrollMessagesToBottom();
    return messageEl;
  }

  /* ────────────────────────────────────────── PAGE RENDERING ────────────────────────────────────────── */
  function renderPage(pageKey) {
    currentPage = pageKey;
    var pageData = pages[pageKey];
    
    if (!pageData) return;

    // Clear messages
    messagesArea.innerHTML = '';

    // Add greeting
    addMessage(pageData.greeting, false);

    // Add additional messages if they exist
    if (pageData.messages && pageData.messages.length > 0) {
      setTimeout(function () {
        var i = 0;
        function addNextMessage() {
          if (i < pageData.messages.length) {
            setTimeout(function () {
              addMessage(pageData.messages[i], false);
              i++;
              addNextMessage();
            }, 300);
          }
        }
        addNextMessage();
      }, 600);
    }

    // Render options
    setTimeout(function () {
      renderOptions(pageData.options);
    }, 300 + (pageData.messages ? pageData.messages.length * 300 : 0));
  }

  function renderOptions(options) {
    // Remove old quick options (find all and remove)
    var existingOptions = document.querySelectorAll('.chatbot-quick-options');
    existingOptions.forEach(function (opt) {
      if (opt.parentNode) {
        opt.parentNode.removeChild(opt);
      }
    });

    // Create new options container
    var newQuickOptions = createElement('div', 'chatbot-quick-options');
    
    options.forEach(function (option) {
      var btn = createElement('button', 'chatbot-quick-btn', {
        'type': 'button',
        'data-option': option.key,
        'data-action': option.action || 'navigate'
      });
      
      var icon = createElement('span', 'chatbot-quick-icon');
      icon.textContent = option.icon;
      
      var label = createElement('span');
      label.textContent = option.label;
      
      btn.appendChild(icon);
      btn.appendChild(label);
      
      btn.addEventListener('click', function () {
        var action = option.action || 'navigate';
        if (action === 'back') {
          goBack();
        } else if (action === 'contact') {
          handleContactAction(option.key);
        } else {
          navigateToPage(option.key);
        }
      });
      
      newQuickOptions.appendChild(btn);
    });

    // Insert before input area
    var inputArea = document.querySelector('.chatbot-input-area');
    inputArea.parentNode.insertBefore(newQuickOptions, inputArea);
  }

  function navigateToPage(pageKey) {
    // Add user message
    var pageData = pages[pageKey];
    if (pageData) {
      addMessage(pageData.greeting, true);
      pageHistory.push(currentPage);
      
      // Remove quick options with fade
      var quickOptionsEl = document.querySelector('.chatbot-quick-options');
      if (quickOptionsEl) {
        quickOptionsEl.style.opacity = '0';
        quickOptionsEl.style.pointerEvents = 'none';
        setTimeout(function () {
          renderPage(pageKey);
        }, 200);
      }
    }
  }

  function goBack() {
    if (pageHistory.length > 0) {
      var previousPage = pageHistory.pop();
      
      // Add message
      addMessage('بازگشت به صفحه قبلی', true);
      
      // Remove quick options with fade
      var quickOptionsEl = document.querySelector('.chatbot-quick-options');
      if (quickOptionsEl) {
        quickOptionsEl.style.opacity = '0';
        quickOptionsEl.style.pointerEvents = 'none';
        setTimeout(function () {
          renderPage(previousPage);
        }, 200);
      }
    }
  }

  function handleContactAction(actionKey) {
    addMessage('درخواست شما ثبت شد', true);

    // Remove quick options
    var quickOptionsEl = document.querySelector('.chatbot-quick-options');
    if (quickOptionsEl) {
      quickOptionsEl.style.opacity = '0';
      quickOptionsEl.style.pointerEvents = 'none';
      setTimeout(function () {
        if (quickOptionsEl.parentNode) {
          quickOptionsEl.parentNode.removeChild(quickOptionsEl);
        }
      }, 200);
    }

    // Show bot response
    setTimeout(function () {
      var typingEl = addBotTyping();
      setTimeout(function () {
        if (typingEl.parentNode) {
          typingEl.parentNode.removeChild(typingEl);
        }
        addMessage('برای ارتباط مستقیم، فرم تماس را بر کنید یا شماره‌های زیر را تماس بگیرید:\n📞 ۰۷۱-۳۸۳۲۳۴۱۰\n📱 ۰۹۳۷۳۱۹۴۳۱۵', false);
      }, 600);
    }, 400);
  }

  /* ────────────────────────────────────────── INPUT & SEND ────────────────────────────────────────── */
  function handleSendMessage() {
    var text = inputField.value.trim();
    if (!text) return;

    addMessage(text, true);
    inputField.value = '';
    inputField.focus();

    // Simulate bot typing
    setTimeout(function () {
      var typingEl = addBotTyping();
      setTimeout(function () {
        if (typingEl.parentNode) {
          typingEl.parentNode.removeChild(typingEl);
        }
        addMessage('سپاس از پیام شما. برای کسب اطلاعات بیشتر لطفاً از گزینه‌های بالا استفاده کنید یا با شماره‌های زیر تماس بگیرید:\n📞 ۰۷۱-۳۸۳۲۳۴۱۰', false);
      }, 600);
    }, 300);
  }

  /* ────────────────────────────────────────── WINDOW MANAGEMENT ────────────────────────────────────────── */
  function openChatbot() {
    isOpen = true;
    chatWindow.classList.add('is-open');
    floatingBtn.setAttribute('aria-expanded', 'true');

    // Reset to main page and re-render
    currentPage = 'main';
    pageHistory = [];
    renderPage('main');

    setTimeout(function () {
      inputField.focus();
    }, 100);
  }

  function closeChatbot() {
    isOpen = false;
    chatWindow.classList.remove('is-open');
    floatingBtn.setAttribute('aria-expanded', 'false');
    floatingBtn.focus();
    
    // Reset to main page when closing
    currentPage = 'main';
    pageHistory = [];
  }

  function toggleChatbot() {
    if (isOpen) {
      closeChatbot();
    } else {
      openChatbot();
    }
  }

  /* ────────────────────────────────────────── EVENT LISTENERS ────────────────────────────────────────── */
  if (floatingBtn) {
    floatingBtn.addEventListener('click', toggleChatbot);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeChatbot);
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', handleSendMessage);
  }

  if (inputField) {
    inputField.addEventListener('keypress', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });
  }

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) {
      closeChatbot();
    }
  });

  // Close chatbot when Contact Modal opens
  var contactModal = document.getElementById('contactModal');
  if (contactModal) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.target === contactModal) {
          if (contactModal.classList.contains('is-open') && isOpen) {
            closeChatbot();
          }
        }
      });
    });
    observer.observe(contactModal, { attributes: true });
  }

  // Initialize with main page
  setTimeout(function () {
    renderPage('main');
  }, 100);

})();
