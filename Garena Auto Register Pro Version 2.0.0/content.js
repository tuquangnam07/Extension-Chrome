// ============================================
// CONTENT SCRIPT - XỬ LÝ DOM GARENA
// ============================================

console.log('[Content] Loaded!');

if (typeof window.__garena_content_loaded === 'undefined') {
  window.__garena_content_loaded = false;
}

if (window.__garena_content_loaded) {
  console.log('[Content] Already loaded, skip');
} else {
  window.__garena_content_loaded = true;
  window._codeSent = false;
  window._isProcessing = false;
  window._clickAttempted = false; // Thêm flag để đảm bảo chỉ click 1 lần
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function findInput(selectors) {
  for (let selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el) return el;
    } catch(e) {}
  }
  return null;
}

function fillForm(username, password, email) {
  console.log('[Content] Điền form...');
  
  const usernameInput = findInput([
    'input[placeholder="Tên truy cập"]',
    'input[name="username"]'
  ]);
  if (usernameInput) {
    usernameInput.value = username;
    usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
    usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[Content] ✅ Username:', username);
  }
  
  const passwordInput = findInput([
    'input[placeholder="Mật khẩu"]',
    'input[name="password"]'
  ]);
  if (passwordInput) {
    passwordInput.value = password;
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[Content] ✅ Password');
  }
  
  const confirmInput = findInput([
    'input[placeholder="Nhập lại mật khẩu"]',
    'input[name="confirm_password"]'
  ]);
  if (confirmInput) {
    confirmInput.value = password;
    confirmInput.dispatchEvent(new Event('input', { bubbles: true }));
    confirmInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[Content] ✅ Confirm');
  }
  
  const emailInput = findInput([
    'input[placeholder="Email"]',
    'input[name="email"]'
  ]);
  if (emailInput) {
    emailInput.value = email;
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[Content] ✅ Email:', email);
  }
  
  return true;
}

// ========== CLICK NHẬN MÃ - CHỈ 1 LẦN DUY NHẤT ==========
function clickGetCode() {
  // Kiểm tra đã click chưa
  if (window._clickAttempted) {
    console.log('[Content] ⏭️ Đã click NHẬN MÃ rồi, bỏ qua');
    return { success: true, alreadyClicked: true };
  }
  
  if (window._codeSent) {
    console.log('[Content] ⏭️ Mã đã gửi, bỏ qua');
    return { success: true, alreadyClicked: true };
  }
  
  console.log('[Content] 🔍 Tìm nút NHẬN MÃ...');
  
  const allButtons = document.querySelectorAll('button');
  let btn = null;
  
  for (let b of allButtons) {
    if (b.textContent.includes('NHẬN MÃ')) {
      btn = b;
      break;
    }
  }
  
  if (!btn) {
    const secondaryBtns = document.querySelectorAll('button.secondary');
    if (secondaryBtns.length > 0) btn = secondaryBtns[0];
  }
  
  if (btn) {
    // CLICK DUY NHẤT 1 LẦN
    btn.click();
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
    
    // Đánh dấu đã click
    window._clickAttempted = true;
    window._codeSent = true;
    
    console.log('[Content] ✅ Đã click NHẬN MÃ (1 lần duy nhất)');
    return { success: true };
  }
  
  console.log('[Content] ❌ Không tìm thấy nút NHẬN MÃ!');
  return { success: false };
}

// ========== ĐIỀN MÃ VÀ ĐĂNG KÝ ==========
function submitCode(code) {
  console.log('[Content] Điền mã và đăng ký...');
  
  const codeInput = findInput([
    'input[placeholder="Mã xác minh"]',
    'input[type="tel"]',
    'input[name="otp"]'
  ]);
  
  if (codeInput) {
    codeInput.value = code;
    codeInput.dispatchEvent(new Event('input', { bubbles: true }));
    codeInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[Content] ✅ Đã điền mã:', code);
  } else {
    console.error('[Content] ❌ Không tìm thấy input mã!');
    return { success: false };
  }
  
  setTimeout(() => {
    const allButtons = document.querySelectorAll('button');
    let submitBtn = null;
    for (let btn of allButtons) {
      const text = btn.textContent || '';
      if (text.includes('Đăng Ký Ngay') || text.includes('Đăng ký')) {
        submitBtn = btn;
        break;
      }
    }
    
    if (submitBtn) {
      submitBtn.click();
      console.log('[Content] ✅ Đã nhấn Đăng Ký Ngay');
      
      setTimeout(() => {
        checkResult();
      }, 3000);
    } else {
      console.error('[Content] ❌ Không tìm thấy nút đăng ký!');
    }
  }, 1000);
  
  return { success: true };
}

function checkResult() {
  if (window._isProcessing) return;
  window._isProcessing = true;
  
  const allElements = document.querySelectorAll('*');
  let success = false;
  
  for (let el of allElements) {
    const text = el.textContent || '';
    if (text.includes('Cám ơn vì đã tạo tài khoản Garena') ||
        text.includes('đăng kí thành công') ||
        text.includes('đăng ký thành công')) {
      success = true;
      break;
    }
  }
  
  if (window.location.href.includes('account.garena.com')) {
    success = true;
  }
  
  if (success) {
    console.log('[Content] 🎉 THÀNH CÔNG!');
    chrome.runtime.sendMessage({
      action: 'registerResult',
      success: true
    });
  } else {
    console.log('[Content] ⏳ Chưa thấy kết quả');
  }
  
  window._isProcessing = false;
}

// ========== RESET STATE SAU F5 ==========
function resetState() {
  console.log('[Content] 🔄 Reset state');
  window._codeSent = false;
  window._isProcessing = false;
  window._clickAttempted = false; // Reset flag click
}

// ========== NHẬN LỆNH ==========
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Content] Lệnh:', request.action);
  
  if (request.action === 'fillForm') {
    fillForm(request.account.username, request.account.password, request.account.email);
    sendResponse({ success: true });
  }
  
  if (request.action === 'clickGetCode') {
    const result = clickGetCode();
    sendResponse(result);
  }
  
  if (request.action === 'submitCode') {
    const result = submitCode(request.code);
    sendResponse(result);
  }
  
  if (request.action === 'ping') {
    sendResponse({ status: 'alive' });
  }
  
  if (request.action === 'reset') {
    resetState();
    sendResponse({ success: true });
  }
  
  return true;
});

console.log('[Content] ✅ Ready!');