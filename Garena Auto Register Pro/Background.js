// ============================================
// BACKGROUND - TỰ ĐỘNG F5 + XÓA EMAIL
// ============================================

import { GMAIL_CONFIG, ACCOUNT_LIST } from './email_list.js';
import { getOTPFromGmail, deleteGarenaEmail } from './gmail.js';

console.log('[Background] Started');

let isRunning = false;
let accountList = [];
let successCount = 0;
let failCount = 0;
let garenaTabId = null;
let hasClickedGetCode = false;

// ========== LOAD DANH SÁCH ==========
function loadAccountList() {
  if (ACCOUNT_LIST && ACCOUNT_LIST.length > 0) {
    accountList = [...ACCOUNT_LIST];
    console.log(`[Background] Đã load ${accountList.length} tài khoản`);
  } else {
    console.error('[Background] Không có tài khoản!');
    accountList = [];
  }
}
loadAccountList();

// ========== SLEEP ==========
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== GỬI TIN NHẮN ĐẾN CONTENT SCRIPT ==========
async function sendToContent(action, data = {}) {
  if (!garenaTabId) {
    console.error('[Background] ❌ Không có tab Garena!');
    return null;
  }
  
  try {
    const response = await chrome.tabs.sendMessage(garenaTabId, {
      action: action,
      ...data
    });
    return response;
  } catch (error) {
    console.log(`[Background] ⚠️ Gửi ${action} thất bại:`, error.message);
    return null;
  }
}

// ========== RELOAD TRANG GARENA ==========
async function reloadGarenaPage() {
  console.log('[Background] 🔄 Đang F5 tab Garena...');
  
  if (!garenaTabId) return false;
  
  try {
    await chrome.tabs.reload(garenaTabId);
    await sleep(3000);
    
    await chrome.scripting.executeScript({
      target: { tabId: garenaTabId },
      files: ['content.js']
    });
    
    await sleep(500);
    hasClickedGetCode = false;
    
    console.log('[Background] ✅ Đã F5 và inject lại content script');
    return true;
    
  } catch (error) {
    console.error('[Background] ❌ Lỗi reload:', error.message);
    return false;
  }
}

// ========== ĐĂNG KÝ 1 TÀI KHOẢN ==========
async function registerOneAccount(account) {
  console.log(`[Background] 🚀 Đăng ký: ${account.username}`);
  
  try {
    // 1. Điền form
    await sendToContent('fillForm', { account });
    await sleep(1000);
    
    // 2. Click NHẬN MÃ - CHỈ 1 LẦN DUY NHẤT
    if (!hasClickedGetCode) {
      const result = await sendToContent('clickGetCode');
      if (result && result.success) {
        hasClickedGetCode = true;
        console.log('[Background] ✅ Đã click NHẬN MÃ (1 lần)');
      } else {
        console.log('[Background] ⚠️ Click NHẬN MÃ thất bại, thử lại...');
        // Thử click lại 1 lần nữa nếu thất bại
        const retry = await sendToContent('clickGetCode');
        if (retry && retry.success) {
          hasClickedGetCode = true;
          console.log('[Background] ✅ Đã click NHẬN MÃ (lần thử 2)');
        } else {
          throw new Error('Không thể click nút NHẬN MÃ');
        }
      }
    } else {
      console.log('[Background] ⏭️ Bỏ qua click, đã click từ trước');
    }
    
    // 3. Đợi OTP (30 giây)
    console.log('[Background] ⏳ Đợi 30 giây cho OTP...');
    await sleep(30000);
    
    // 4. Lấy OTP từ Gmail
    let otp = null;
    for (let i = 0; i < 6; i++) {
      console.log(`[Background] 🔄 Lấy OTP lần ${i+1}/6`);
      otp = await getOTPFromGmail(GMAIL_CONFIG.email, GMAIL_CONFIG.password);
      if (otp) break;
      await sleep(5000);
    }
    
    if (!otp) {
      throw new Error('Không lấy được OTP từ Gmail');
    }
    
    console.log('[Background] ✅ Đã lấy OTP:', otp);
    
    // 5. Điền OTP và đăng ký
    await sendToContent('submitCode', { code: otp });
    
    // 6. Đợi kết quả
    await sleep(5000);
    
    // 7. XÓA EMAIL GARENA VỪA ĐỌC (để tránh đọc nhầm lần sau)
    console.log('[Background] 🗑️ Đang xóa email Garena...');
    const deleted = await deleteGarenaEmail(GMAIL_CONFIG.email, GMAIL_CONFIG.password);
    if (deleted) {
      console.log('[Background] ✅ Đã xóa email Garena thành công');
    } else {
      console.log('[Background] ⚠️ Không thể xóa email (tiếp tục)');
    }
    
    return true;
    
  } catch (error) {
    console.error(`[Background] ❌ Lỗi ${account.username}:`, error.message);
    return false;
  }
}

// ========== CHẠY HÀNG LOẠT ==========
async function runBatch() {
  if (isRunning) return;
  
  if (accountList.length === 0) {
    console.log('[Background] Không còn tài khoản!');
    chrome.runtime.sendMessage({
      action: 'batchComplete',
      successCount,
      failCount,
      total: successCount + failCount
    });
    return;
  }
  
  isRunning = true;
  hasClickedGetCode = false;
  
  console.log(`[Background] Bắt đầu batch: ${accountList.length} tài khoản`);
  
  chrome.runtime.sendMessage({
    action: 'batchStart',
    total: accountList.length
  });
  
  let accountIndex = 0;
  
  while (accountList.length > 0 && isRunning) {
    const account = accountList[0];
    accountIndex++;
    
    console.log(`[Background] 📝 [${accountIndex}] Đang xử lý ${account.username}`);
    
    chrome.runtime.sendMessage({
      action: 'currentAccount',
      account: account,
      remaining: accountList.length - 1,
      index: accountIndex
    });
    
    const success = await registerOneAccount(account);
    
    if (success) {
      successCount++;
      console.log(`[Background] ✅ Thành công: ${account.username}`);
      chrome.runtime.sendMessage({
        action: 'accountSuccess',
        account: account,
        successCount,
        remaining: accountList.length - 1
      });
    } else {
      failCount++;
      console.log(`[Background] ❌ Thất bại: ${account.username}`);
      chrome.runtime.sendMessage({
        action: 'accountFail',
        account: account,
        failCount,
        remaining: accountList.length - 1
      });
    }
    
    // Xóa tài khoản đã xử lý
    accountList.splice(0, 1);
    
    // Lưu state
    chrome.storage.local.set({ accountList, successCount, failCount });
    
    // Reset flag click cho tài khoản tiếp theo
    hasClickedGetCode = false;
    
    // F5 sau mỗi tài khoản
    if (accountList.length > 0 && isRunning) {
      console.log('[Background] ⏳ Đợi 3 giây trước khi F5...');
      await sleep(3000);
      
      await reloadGarenaPage();
      await sleep(2000);
    }
  }
  
  isRunning = false;
  
  console.log(`[Background] 🎉 HOÀN THÀNH! ✅${successCount} ❌${failCount}`);
  
  chrome.runtime.sendMessage({
    action: 'batchComplete',
    successCount,
    failCount,
    total: successCount + failCount
  });
}

// ========== NHẬN LỆNH ==========
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] Lệnh:', request.action);
  
  if (request.action === 'startBatch') {
    garenaTabId = request.tabId;
    
    chrome.scripting.executeScript({
      target: { tabId: garenaTabId },
      files: ['content.js']
    }).then(() => {
      setTimeout(() => {
        runBatch();
      }, 500);
      sendResponse({ success: true });
    }).catch((err) => {
      console.error('[Background] Inject error:', err);
      sendResponse({ success: false, error: err.message });
    });
    
    return true;
  }
  
  if (request.action === 'stopBatch') {
    isRunning = false;
    sendResponse({ success: true });
  }
  
  if (request.action === 'getStatus') {
    sendResponse({
      isRunning,
      remaining: accountList.length,
      success: successCount,
      fail: failCount,
      currentAccount: accountList.length > 0 ? accountList[0] : null
    });
  }
  
  if (request.action === 'resetAccounts') {
    loadAccountList();
    successCount = 0;
    failCount = 0;
    chrome.storage.local.set({ accountList, successCount, failCount });
    sendResponse({ success: true });
  }
  
  if (request.action === 'registerResult') {
    console.log('[Background] 📥 Nhận kết quả từ content:', request.success);
    sendResponse({ success: true });
  }
  
  return true;
});

// Khôi phục state
chrome.storage.local.get(['accountList', 'successCount', 'failCount'], (data) => {
  if (data.accountList && data.accountList.length > 0) {
    accountList = data.accountList;
    successCount = data.successCount || 0;
    failCount = data.failCount || 0;
    console.log(`[Background] Khôi phục state: ${accountList.length} tài khoản`);
  }
});

console.log('[Background] ✅ Ready!');