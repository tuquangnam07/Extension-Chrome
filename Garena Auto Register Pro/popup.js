document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statusText = document.getElementById('statusText');
  const currentAccount = document.getElementById('currentAccount');
  const successCount = document.getElementById('successCount');
  const failCount = document.getElementById('failCount');
  const remainCount = document.getElementById('remainCount');
  const gmailDisplay = document.getElementById('gmailDisplay');
  const logBox = document.getElementById('logBox');
  
  let isRunning = false;
  
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
          currentAccount.textContent = `${response.currentAccount.username} (${response.currentAccount.email})`;
        }
      }
    });
  }
  
  // Lấy thông tin Gmail
  chrome.storage.local.get(['gmailEmail'], function(data) {
    if (data.gmailEmail) {
      gmailDisplay.textContent = data.gmailEmail;
    } else {
      gmailDisplay.textContent = 'Chưa cấu hình';
    }
  });
  
  // Bắt đầu
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
  
  // Dừng
  stopBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'stopBatch' }, function() {
      addLog('⏹ Đã dừng batch', 'warning');
      updateStats();
    });
  });
  
  // Reset
  resetBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'resetAccounts' }, function() {
      addLog('🔄 Đã reset danh sách', 'warning');
      updateStats();
    });
  });
  
  // Lắng nghe từ background
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
      currentAccount.textContent = `${msg.account.username} (${msg.account.email})`;
      statusText.textContent = `🔄 Đang xử lý... (còn ${msg.remaining})`;
      statusText.style.color = '#d29922';
    }
  });
  
  // Cập nhật định kỳ
  setInterval(updateStats, 2000);
  updateStats();
});