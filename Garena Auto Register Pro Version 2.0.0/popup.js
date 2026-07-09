// ============================================
// POPUP - QUẢN LÝ GIAO DIỆN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statusText = document.getElementById('statusText');
  const currentAccount = document.getElementById('currentAccount');
  const successCount = document.getElementById('successCount');
  const failCount = document.getElementById('failCount');
  const remainCount = document.getElementById('remainCount');
  const logBox = document.getElementById('logBox');
  
  // Telegram
  const botToken = document.getElementById('botToken');
  const chatId = document.getElementById('chatId');
  const saveTelegram = document.getElementById('saveTelegram');
  const testTelegram = document.getElementById('testTelegram');
  const telegramStatus = document.getElementById('telegramStatus');
  
  function addLog(message, type = 'info') {
    const time = new Date().toLocaleTimeString('vi-VN');
    const colors = {
      info: 'log-info',
      success: 'log-success',
      error: 'log-error',
      warning: 'log-warning'
    };
    const div = document.createElement('div');
    div.className = colors[type] || colors.info;
    div.textContent = `[${time}] ${message}`;
    logBox.appendChild(div);
    logBox.scrollTop = logBox.scrollHeight;
    
    while (logBox.children.length > 100) {
      logBox.removeChild(logBox.firstChild);
    }
  }
  
  function updateStats() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, function(response) {
      if (response) {
        successCount.textContent = response.success || 0;
        failCount.textContent = response.fail || 0;
        remainCount.textContent = response.remaining || 0;
        
        if (response.isRunning) {
          statusText.textContent = '🔄 Đang chạy...';
          statusText.style.color = '#d29922';
          startBtn.disabled = true;
          startBtn.textContent = '⏳ ĐANG CHẠY';
        } else {
          statusText.textContent = '⏸ Dừng';
          statusText.style.color = '#8b949e';
          startBtn.disabled = false;
          startBtn.textContent = '▶ BẮT ĐẦU';
        }
        
        if (response.currentAccount) {
          currentAccount.textContent = `${response.currentAccount.username}`;
        }
      }
    });
  }
  
  // ========== LOAD TELEGRAM CONFIG ==========
  chrome.runtime.sendMessage({ action: 'getTelegramConfig' }, function(response) {
    if (response && response.config) {
      botToken.value = response.config.botToken || '';
      chatId.value = response.config.chatId || '';
      if (response.config.botToken && response.config.chatId) {
        telegramStatus.textContent = '✅ Đã cấu hình';
        telegramStatus.style.color = '#3fb950';
      }
    }
  });
  
  // ========== LƯU TELEGRAM CONFIG ==========
  saveTelegram.addEventListener('click', function() {
    const token = botToken.value.trim();
    const chat = chatId.value.trim();
    
    if (!token || !chat) {
      addLog('⚠️ Vui lòng nhập Bot Token và Chat ID', 'warning');
      return;
    }
    
    chrome.runtime.sendMessage({
      action: 'setTelegramConfig',
      botToken: token,
      chatId: chat
    }, function(response) {
      if (response && response.success) {
        telegramStatus.textContent = '✅ Đã lưu';
        telegramStatus.style.color = '#3fb950';
        addLog('✅ Đã lưu cấu hình Telegram', 'success');
      }
    });
  });
  
  // ========== TEST TELEGRAM ==========
  testTelegram.addEventListener('click', function() {
    const token = botToken.value.trim();
    const chat = chatId.value.trim();
    
    if (!token || !chat) {
      addLog('⚠️ Vui lòng nhập Bot Token và Chat ID', 'warning');
      return;
    }
    
    // Lưu trước khi test
    chrome.runtime.sendMessage({
      action: 'setTelegramConfig',
      botToken: token,
      chatId: chat
    }, function() {
      // Gửi test message
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat,
          text: '✅ Kết nối Telegram thành công!',
          parse_mode: 'HTML'
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          addLog('✅ Test Telegram thành công!', 'success');
          telegramStatus.textContent = '✅ Kết nối OK';
          telegramStatus.style.color = '#3fb950';
        } else {
          addLog(`❌ Lỗi: ${data.description}`, 'error');
          telegramStatus.textContent = '❌ Lỗi kết nối';
          telegramStatus.style.color = '#f85149';
        }
      })
      .catch(err => {
        addLog(`❌ Lỗi: ${err.message}`, 'error');
      });
    });
  });
  
  // ========== BẮT ĐẦU ==========
  startBtn.addEventListener('click', function() {
    addLog('🚀 Bắt đầu batch đăng ký...', 'info');
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const url = tabs[0].url || '';
      if (!url.includes('sso.garena.com')) {
        addLog('⚠️ Vui lòng mở trang đăng ký Garena!', 'warning');
        return;
      }
      
      chrome.runtime.sendMessage({
        action: 'startBatch',
        tabId: tabs[0].id
      }, function(response) {
        if (response && response.success) {
          addLog('✅ Đã gửi lệnh bắt đầu', 'success');
        } else {
          addLog('❌ Lỗi: ' + (response?.error || 'Không xác định'), 'error');
        }
      });
    });
  });
  
  // ========== DỪNG ==========
  stopBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'stopBatch' }, function() {
      addLog('⏹ Đã dừng batch', 'warning');
      updateStats();
    });
  });
  
  // ========== RESET ==========
  resetBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'resetAccounts' }, function() {
      addLog('🔄 Đã reset danh sách', 'warning');
      updateStats();
    });
  });
  
  // ========== LẮNG NGHE TỪ BACKGROUND ==========
  chrome.runtime.onMessage.addListener(function(msg) {
    if (msg.action === 'batchStart') {
      addLog(`📦 Bắt đầu với ${msg.total} tài khoản`, 'info');
      updateStats();
    }
    
    if (msg.action === 'accountSuccess') {
      addLog(`✅ ${msg.account.username} (còn ${msg.remaining})`, 'success');
      updateStats();
    }
    
    if (msg.action === 'accountFail') {
      addLog(`❌ ${msg.account.username} (còn ${msg.remaining})`, 'error');
      updateStats();
    }
    
    if (msg.action === 'batchComplete') {
      addLog(`🎉 HOÀN THÀNH! ✅${msg.successCount} ❌${msg.failCount}`, 'success');
      updateStats();
    }
    
    if (msg.action === 'currentAccount') {
      currentAccount.textContent = `${msg.account.username}`;
      statusText.textContent = `🔄 Đang xử lý... (còn ${msg.remaining})`;
      statusText.style.color = '#d29922';
    }
  });
  
  // Cập nhật định kỳ
  setInterval(updateStats, 2000);
  updateStats();
});