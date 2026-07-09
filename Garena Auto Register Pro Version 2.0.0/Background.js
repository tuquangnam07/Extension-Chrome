// ============================================
// BACKGROUND - TÍCH HỢP LOGGER + TELEGRAM
// ============================================

import { GMAIL_CONFIG, ACCOUNT_LIST } from './email_list.js';
import { getOTPFromGmail, deleteGarenaEmail } from './gmail.js';
import { 
  addLog, 
  startAccountLog, 
  endAccountLog, 
  formatLogToText, 
  saveLogToStorage,
  getCurrentAccountLog
} from './logger.js';
import { 
  sendAccountResult, 
  sendBatchStart, 
  sendBatchComplete,
  sendLogFile,
  getTelegramConfig,
  setTelegramConfig
} from './telegram.js';

console.log('[Background] Started');

let isRunning = false;
let accountList = [];
let successCount = 0;
let failCount = 0;
let garenaTabId = null;
let hasClickedGetCode = false;
let currentAccountLogs = [];

// ========== LOAD CẤU HÌNH TELEGRAM ==========
async function loadTelegramConfig() {
  const config = await getTelegramConfig();
  if (config.botToken && config.chatId) {
    console.log('[Telegram] ✅ Đã load config');
  } else {
    console.log('[Telegram] ⚠️ Chưa cấu hình Telegram');
  }
}
loadTelegramConfig();

// ========== LOAD DANH SÁCH ==========
function loadAccountList() {
  if (ACCOUNT_LIST && ACCOUNT_LIST.length > 0) {
    accountList = [...ACCOUNT_LIST];
    addLog(`Đã load ${accountList.length} tài khoản`, 'INFO');
  } else {
    addLog('Không có tài khoản!', 'ERROR');
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
    addLog('Không có tab Garena!', 'ERROR');
    return null;
  }
  
  try {
    const response = await chrome.tabs.sendMessage(garenaTabId, {
      action: action,
      ...data
    });
    return response;
  } catch (error) {
    addLog(`Gửi ${action} thất bại: ${error.message}`, 'WARNING');
    return null;
  }
}

// ========== RELOAD TRANG GARENA ==========
async function reloadGarenaPage() {
  addLog('🔄 Đang F5 tab Garena...', 'INFO');
  
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
    
    addLog('✅ Đã F5 và inject lại content script', 'INFO');
    return true;
    
  } catch (error) {
    addLog(`Lỗi reload: ${error.message}`, 'ERROR');
    return false;
  }
}

// ========== ĐĂNG KÝ 1 TÀI KHOẢN ==========
async function registerOneAccount(account) {
  // Bắt đầu log cho tài khoản
  startAccountLog(account);
  addLog(`🚀 Đăng ký: ${account.username}`, 'INFO', account.username);
  
  try {
    // 1. Điền form
    await sendToContent('fillForm', { account });
    await sleep(1000);
    
    // 2. Click NHẬN MÃ - CHỈ 1 LẦN
    if (!hasClickedGetCode) {
      const result = await sendToContent('clickGetCode');
      if (result && result.success) {
        hasClickedGetCode = true;
        addLog('✅ Đã click NHẬN MÃ (1 lần)', 'INFO', account.username);
      } else {
        addLog('⚠️ Click NHẬN MÃ thất bại, thử lại...', 'WARNING', account.username);
        const retry = await sendToContent('clickGetCode');
        if (retry && retry.success) {
          hasClickedGetCode = true;
          addLog('✅ Đã click NHẬN MÃ (lần thử 2)', 'INFO', account.username);
        } else {
          throw new Error('Không thể click nút NHẬN MÃ');
        }
      }
    } else {
      addLog('⏭️ Bỏ qua click, đã click từ trước', 'INFO', account.username);
    }
    
    // 3. Đợi OTP
    addLog('⏳ Đợi 30 giây cho OTP...', 'INFO', account.username);
    await sleep(30000);
    
    // 4. Lấy OTP từ Gmail
    let otp = null;
    for (let i = 0; i < 6; i++) {
      addLog(`🔄 Lấy OTP lần ${i+1}/6`, 'INFO', account.username);
      otp = await getOTPFromGmail(GMAIL_CONFIG.email, GMAIL_CONFIG.password);
      if (otp) break;
      await sleep(5000);
    }
    
    if (!otp) {
      throw new Error('Không lấy được OTP từ Gmail');
    }
    
    addLog(`✅ Đã lấy OTP: ${otp}`, 'INFO', account.username);
    
    // 5. Điền OTP và đăng ký
    await sendToContent('submitCode', { code: otp });
    
    // 6. Đợi kết quả
    await sleep(5000);
    
    // 7. XÓA EMAIL GARENA
    addLog('🗑️ Đang xóa email Garena...', 'INFO', account.username);
    const deleted = await deleteGarenaEmail(GMAIL_CONFIG.email, GMAIL_CONFIG.password);
    if (deleted) {
      addLog('✅ Đã xóa email Garena thành công', 'INFO', account.username);
    } else {
      addLog('⚠️ Không thể xóa email (tiếp tục)', 'WARNING', account.username);
    }
    
    return true;
    
  } catch (error) {
    addLog(`❌ Lỗi: ${error.message}`, 'ERROR', account.username);
    return false;
  }
}

// ========== CHẠY HÀNG LOẠT ==========
async function runBatch() {
  if (isRunning) return;
  
  if (accountList.length === 0) {
    addLog('Không còn tài khoản!', 'INFO');
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
  
  addLog(`📦 Bắt đầu batch: ${accountList.length} tài khoản`, 'INFO');
  
  // Gửi thông báo Telegram bắt đầu
  await sendBatchStart(accountList.length);
  
  chrome.runtime.sendMessage({
    action: 'batchStart',
    total: accountList.length
  });
  
  let accountIndex = 0;
  
  while (accountList.length > 0 && isRunning) {
    const account = accountList[0];
    accountIndex++;
    
    addLog(`📝 [${accountIndex}/${accountList.length + accountIndex - 1}] ${account.username}`, 'INFO');
    
    chrome.runtime.sendMessage({
      action: 'currentAccount',
      account: account,
      remaining: accountList.length - 1,
      index: accountIndex
    });
    
    // Đăng ký
    const success = await registerOneAccount(account);
    
    // Lấy log của tài khoản này
    const accountLog = getCurrentAccountLog();
    const logText = accountLog.map(e => `[${e.timestamp}] [${e.type}] ${e.message}`).join('\n');
    
    // Lưu log file
    const filename = `log_${account.username}_${Date.now()}.txt`;
    await saveLogToStorage(logText, filename);
    
    // Gửi thông báo Telegram
    const telegramResult = await sendAccountResult(account, success, logText);
    if (telegramResult.success) {
      addLog(`📨 Đã gửi thông báo Telegram cho ${account.username}`, 'INFO');
    } else {
      addLog(`⚠️ Không gửi được Telegram: ${telegramResult.error}`, 'WARNING');
    }
    
    if (success) {
      successCount++;
      addLog(`✅ Thành công: ${account.username}`, 'SUCCESS');
      chrome.runtime.sendMessage({
        action: 'accountSuccess',
        account: account,
        successCount,
        remaining: accountList.length - 1
      });
    } else {
      failCount++;
      addLog(`❌ Thất bại: ${account.username}`, 'ERROR');
      chrome.runtime.sendMessage({
        action: 'accountFail',
        account: account,
        failCount,
        remaining: accountList.length - 1
      });
    }
    
    // Xóa tài khoản
    accountList.splice(0, 1);
    chrome.storage.local.set({ accountList, successCount, failCount });
    
    // Reset flag
    hasClickedGetCode = false;
    
    // F5 sau mỗi tài khoản
    if (accountList.length > 0 && isRunning) {
      addLog('⏳ Đợi 3 giây trước khi F5...', 'INFO');
      await sleep(3000);
      await reloadGarenaPage();
      await sleep(2000);
    }
  }
  
  isRunning = false;
  
  addLog(`🎉 HOÀN THÀNH BATCH! ✅${successCount} ❌${failCount}`, 'SUCCESS');
  
  // Gửi thông báo hoàn thành
  await sendBatchComplete(successCount, failCount);
  
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
    addLog('⏹ Đã dừng batch', 'WARNING');
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
    addLog('🔄 Đã reset danh sách tài khoản', 'INFO');
    sendResponse({ success: true });
  }
  
  // Cấu hình Telegram
  if (request.action === 'setTelegramConfig') {
    setTelegramConfig(request.botToken, request.chatId);
    addLog('📨 Đã cập nhật cấu hình Telegram', 'INFO');
    sendResponse({ success: true });
  }
  
  if (request.action === 'getTelegramConfig') {
    getTelegramConfig().then(config => {
      sendResponse({ config });
    });
    return true;
  }
  
  if (request.action === 'registerResult') {
    sendResponse({ success: true });
  }
  
  return true;
});

// ========== TEST TELEGRAM ==========
export async function testTelegram() {
  const result = await sendTelegramMessage('✅ Test kết nối thành công!');
  return result;
}

// Khôi phục state
chrome.storage.local.get(['accountList', 'successCount', 'failCount'], (data) => {
  if (data.accountList && data.accountList.length > 0) {
    accountList = data.accountList;
    successCount = data.successCount || 0;
    failCount = data.failCount || 0;
    addLog(`Khôi phục state: ${accountList.length} tài khoản`, 'INFO');
  }
});

addLog('✅ Background ready!', 'INFO');