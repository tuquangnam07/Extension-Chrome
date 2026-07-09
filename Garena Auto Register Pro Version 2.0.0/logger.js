// ============================================
// LOGGER - TẠO VÀ LƯU LOG FILE
// ============================================

// Lưu log vào storage (vì Service Worker không có quyền ghi file trực tiếp)
// File log sẽ được lưu dưới dạng text và có thể export

let logEntries = [];
let currentAccountLog = [];
let sessionId = Date.now();

// ========== THÊM LOG ==========
export function addLog(message, type = 'INFO', account = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    message,
    account: account || 'SYSTEM'
  };
  
  logEntries.push(logEntry);
  currentAccountLog.push(logEntry);
  
  // Giới hạn log
  if (logEntries.length > 10000) {
    logEntries = logEntries.slice(-5000);
  }
  
  console.log(`[${type}] ${message}`);
  return logEntry;
}

// ========== BẮT ĐẦU LOG CHO 1 TÀI KHOẢN ==========
export function startAccountLog(account) {
  currentAccountLog = [];
  addLog(`========== BẮT ĐẦU ĐĂNG KÝ: ${account.username} ==========`, 'INFO', account.username);
  addLog(`📧 Email: ${account.email}`, 'INFO', account.username);
  return currentAccountLog;
}

// ========== KẾT THÚC LOG CHO 1 TÀI KHOẢN ==========
export function endAccountLog(account, success) {
  const status = success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI';
  addLog(`========== ${status}: ${account.username} ==========`, success ? 'SUCCESS' : 'ERROR', account.username);
  
  // Trả về log của tài khoản này
  return currentAccountLog;
}

// ========== LẤY TOÀN BỘ LOG ==========
export function getFullLog() {
  return logEntries;
}

// ========== LẤY LOG CỦA TÀI KHOẢN HIỆN TẠI ==========
export function getCurrentAccountLog() {
  return currentAccountLog;
}

// ========== TẠO NỘI DUNG LOG FILE ==========
export function formatLogToText(logEntries, account = null) {
  let text = '';
  let title = account ? `LOG ĐĂNG KÝ: ${account.username}` : 'LOG TỔNG HỢP';
  
  text += `========================================\n`;
  text += `${title}\n`;
  text += `Thời gian: ${new Date().toISOString()}\n`;
  text += `========================================\n\n`;
  
  for (let entry of logEntries) {
    const time = new Date(entry.timestamp).toLocaleString('vi-VN');
    text += `[${time}] [${entry.type}] ${entry.message}\n`;
  }
  
  return text;
}

// ========== LƯU LOG VÀO STORAGE (để export sau) ==========
export async function saveLogToStorage(logContent, filename) {
  try {
    const data = {
      filename: filename || `log_${sessionId}.txt`,
      content: logContent,
      timestamp: Date.now()
    };
    
    // Lưu log vào storage
    const existing = await chrome.storage.local.get('logFiles');
    let logFiles = existing.logFiles || [];
    
    logFiles.push(data);
    
    // Giữ tối đa 100 file log
    if (logFiles.length > 100) {
      logFiles = logFiles.slice(-100);
    }
    
    await chrome.storage.local.set({ logFiles });
    
    console.log(`[Logger] ✅ Đã lưu log: ${data.filename}`);
    return data.filename;
  } catch (error) {
    console.error('[Logger] ❌ Lỗi lưu log:', error.message);
    return null;
  }
}

// ========== EXPORT LOG RA FILE (dùng Blob) ==========
export function downloadLog(content, filename) {
  // Tạo blob và tạo link download
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `log_${Date.now()}.txt`;
  a.click();
  
  URL.revokeObjectURL(url);
}

// ========== LẤY DANH SÁCH LOG ĐÃ LƯU ==========
export async function getSavedLogs() {
  const data = await chrome.storage.local.get('logFiles');
  return data.logFiles || [];
}

// ========== XÓA LOG CŨ ==========
export async function clearOldLogs(days = 7) {
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  const data = await chrome.storage.local.get('logFiles');
  let logFiles = data.logFiles || [];
  
  logFiles = logFiles.filter(f => f.timestamp > cutoff);
  await chrome.storage.local.set({ logFiles });
  
  console.log(`[Logger] Đã xóa log cũ hơn ${days} ngày`);
}