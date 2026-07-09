// ============================================
// TELEGRAM - GỬI THÔNG BÁO QUA BOT
// ============================================

// CẤU HÌNH TELEGRAM (thay đổi theo bot của bạn)
let TELEGRAM_CONFIG = {
  botToken: '8893426208:AAGZb6FVaeF4X0ekIWSSw9uTDuyLAItqbEQ',      // Token của bot (lấy từ @BotFather)
  chatId: '7002992575'         // Chat ID (lấy từ @userinfobot)
};

// ========== CẤU HÌNH TELEGRAM ==========
export function setTelegramConfig(botToken, chatId) {
  TELEGRAM_CONFIG.botToken = botToken;
  TELEGRAM_CONFIG.chatId = chatId;
  
  // Lưu config
  chrome.storage.local.set({ telegramConfig: TELEGRAM_CONFIG });
  console.log('[Telegram] ✅ Đã cập nhật config');
}

// ========== LẤY CONFIG ==========
export async function getTelegramConfig() {
  const data = await chrome.storage.local.get('telegramConfig');
  if (data.telegramConfig) {
    TELEGRAM_CONFIG = data.telegramConfig;
  }
  return TELEGRAM_CONFIG;
}

// ========== GỬI TIN NHẮN ==========
export async function sendTelegramMessage(message, parseMode = 'HTML') {
  const config = await getTelegramConfig();
  
  if (!config.botToken || !config.chatId) {
    console.log('[Telegram] ⚠️ Chưa cấu hình bot token hoặc chat ID');
    return { success: false, error: 'Chưa cấu hình' };
  }
  
  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: parseMode,
        disable_web_page_preview: true
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log('[Telegram] ✅ Đã gửi thông báo');
      return { success: true, result: data };
    } else {
      console.error('[Telegram] ❌ Lỗi:', data.description);
      return { success: false, error: data.description };
    }
    
  } catch (error) {
    console.error('[Telegram] ❌ Lỗi kết nối:', error.message);
    return { success: false, error: error.message };
  }
}

// ========== TẠO NỘI DUNG THÔNG BÁO ==========
export function createAccountNotification(account, success, logContent = '') {
  const status = success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI';
  const statusColor = success ? '#00FF00' : '#FF0000';
  
  let message = `
<b>🚀 GARENA AUTO REGISTER</b>

<b>📝 Tài khoản:</b> <code>${account.username}</code>
<b>🔑 Mật khẩu:</b> <code>${account.password}</code>
<b>📧 Email:</b> <code>${account.email}</code>
<b>📊 Trạng thái:</b> <b style="color:${statusColor}">${status}</b>
<b>⏰ Thời gian:</b> ${new Date().toLocaleString('vi-VN')}
  `;
  
  // Thêm log nếu có
  if (logContent) {
    // Cắt log nếu quá dài (Telegram giới hạn 4096 ký tự)
    let logText = logContent;
    if (logText.length > 3000) {
      logText = logText.substring(0, 3000) + '\n... (cắt ngắn)';
    }
    message += `\n<b>📋 Log chi tiết:</b>\n<pre>${logText}</pre>`;
  }
  
  return message;
}

// ========== GỬI THÔNG BÁO KẾT QUẢ ==========
export async function sendAccountResult(account, success, logContent = '') {
  const message = createAccountNotification(account, success, logContent);
  return await sendTelegramMessage(message);
}

// ========== GỬI THÔNG BÁO BẮT ĐẦU BATCH ==========
export async function sendBatchStart(total) {
  const message = `
<b>🚀 BẮT ĐẦU BATCH ĐĂNG KÝ</b>

📦 Số tài khoản: <b>${total}</b>
⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}
  `;
  return await sendTelegramMessage(message);
}

// ========== GỬI THÔNG BÁO HOÀN THÀNH BATCH ==========
export async function sendBatchComplete(successCount, failCount) {
  const message = `
<b>🎉 HOÀN THÀNH BATCH ĐĂNG KÝ</b>

✅ Thành công: <b>${successCount}</b>
❌ Thất bại: <b>${failCount}</b>
📊 Tổng: <b>${successCount + failCount}</b>
⏰ Hoàn thành: ${new Date().toLocaleString('vi-VN')}
  `;
  return await sendTelegramMessage(message);
}

// ========== GỬI FILE LOG QUA TELEGRAM ==========
export async function sendLogFile(logContent, filename) {
  const config = await getTelegramConfig();
  
  if (!config.botToken || !config.chatId) {
    return { success: false, error: 'Chưa cấu hình' };
  }
  
  try {
    // Tạo Blob từ log content
    const blob = new Blob([logContent], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('chat_id', config.chatId);
    formData.append('document', blob, filename || 'log.txt');
    formData.append('caption', `📋 Log: ${filename || 'log.txt'}`);
    
    const url = `https://api.telegram.org/bot${config.botToken}/sendDocument`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log('[Telegram] ✅ Đã gửi file log');
      return { success: true };
    } else {
      console.error('[Telegram] ❌ Lỗi:', data.description);
      return { success: false, error: data.description };
    }
    
  } catch (error) {
    console.error('[Telegram] ❌ Lỗi gửi file:', error.message);
    return { success: false, error: error.message };
  }
}