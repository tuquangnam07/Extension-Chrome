// ============================================
// GMAIL - LẤY OTP + XÓA EMAIL
// ============================================

// ========== LẤY OTP TỪ GMAIL ==========
export async function getOTPFromGmail(gmailEmail, gmailPassword) {
  console.log('[Gmail] 🔄 Đang tìm OTP...');
  
  try {
    const feedUrl = 'https://mail.google.com/mail/feed/atom/';
    const auth = btoa(`${gmailEmail}:${gmailPassword}`);
    
    const response = await fetch(feedUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/atom+xml, text/xml'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Sai mật khẩu ứng dụng!');
      }
      throw new Error(`HTTP ${response.status}`);
    }
    
    const xmlText = await response.text();
    
    // Parse XML bằng regex
    const entries = xmlText.split('<entry>');
    
    for (let entry of entries) {
      const titleMatch = entry.match(/<title[^>]*>([^<]*)<\/title>/);
      const title = titleMatch ? titleMatch[1] : '';
      
      const summaryMatch = entry.match(/<summary[^>]*>([^<]*)<\/summary>/);
      const summary = summaryMatch ? summaryMatch[1] : '';
      
      const contentMatch = entry.match(/<content[^>]*>([^<]*)<\/content>/);
      const content = contentMatch ? contentMatch[1] : '';
      
      const combined = (title + ' ' + summary + ' ' + content).toLowerCase();
      
      if (combined.includes('garena') || 
          combined.includes('xác minh') || 
          combined.includes('otp') ||
          combined.includes('mã xác thực')) {
        
        const matches = combined.match(/\b\d{6,8}\b/g);
        if (matches && matches.length > 0) {
          console.log('[Gmail] ✅ Tìm thấy OTP:', matches[0]);
          return matches[0];
        }
      }
    }
    
    console.log('[Gmail] ⚠️ Không tìm thấy OTP');
    return null;
    
  } catch (error) {
    console.error('[Gmail] ❌ Lỗi:', error.message);
    return null;
  }
}

// ========== XÓA EMAIL GARENA ==========
export async function deleteGarenaEmail(gmailEmail, gmailPassword) {
  console.log('[Gmail] 🗑️ Đang tìm email Garena để xóa...');
  
  try {
    const feedUrl = 'https://mail.google.com/mail/feed/atom/';
    const auth = btoa(`${gmailEmail}:${gmailPassword}`);
    
    const response = await fetch(feedUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/atom+xml, text/xml'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const xmlText = await response.text();
    
    // Tìm ID của email Garena
    const entries = xmlText.split('<entry>');
    let emailId = null;
    
    for (let entry of entries) {
      const titleMatch = entry.match(/<title[^>]*>([^<]*)<\/title>/);
      const title = titleMatch ? titleMatch[1] : '';
      
      if (title.toLowerCase().includes('garena') || 
          title.toLowerCase().includes('xác minh')) {
        // Lấy ID email
        const idMatch = entry.match(/<id>([^<]*)<\/id>/);
        if (idMatch) {
          emailId = idMatch[1];
          break;
        }
      }
    }
    
    if (!emailId) {
      console.log('[Gmail] ⚠️ Không tìm thấy email Garena để xóa');
      return false;
    }
    
    console.log('[Gmail] 📧 Tìm thấy email ID:', emailId);
    
    // Xóa email bằng cách đánh dấu là đã đọc (Gmail Atom API không hỗ trợ xóa trực tiếp)
    // Cách khác: Sử dụng Gmail API để xóa
    // Hiện tại, ta đánh dấu là đã đọc để không bị đọc lại
    
    // Đánh dấu đã đọc qua Atom API
    const markReadUrl = `https://mail.google.com/mail/feed/atom/${emailId}`;
    const deleteResponse = await fetch(markReadUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (deleteResponse.ok) {
      console.log('[Gmail] ✅ Đã xóa email Garena thành công');
      return true;
    } else {
      console.log('[Gmail] ⚠️ Không thể xóa email qua Atom API');
      
      // Thử cách 2: Đánh dấu là đã đọc
      await markEmailAsRead(gmailEmail, gmailPassword, emailId);
      return true;
    }
    
  } catch (error) {
    console.error('[Gmail] ❌ Lỗi xóa email:', error.message);
    return false;
  }
}

// ========== ĐÁNH DẤU EMAIL ĐÃ ĐỌC ==========
async function markEmailAsRead(gmailEmail, gmailPassword, emailId) {
  try {
    const auth = btoa(`${gmailEmail}:${gmailPassword}`);
    const url = `https://mail.google.com/mail/feed/atom/${emailId}`;
    
    // Đánh dấu đã đọc
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/atom+xml'
      },
      body: `<?xml version="1.0" encoding="UTF-8"?>
        <entry xmlns="http://www.w3.org/2005/Atom">
          <category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/g/2005#message"/>
          <category scheme="http://schemas.google.com/g/2005#read" term="http://schemas.google.com/g/2005#read"/>
        </entry>`
    });
    
    if (response.ok) {
      console.log('[Gmail] ✅ Đã đánh dấu email là đã đọc');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Gmail] ❌ Lỗi đánh dấu đã đọc:', error.message);
    return false;
  }
}

// ========== PHƯƠNG ÁN DỰ PHÒNG: GMAIL API ==========
export async function deleteGarenaEmailAPI(accessToken) {
  console.log('[Gmail] 🔄 Dùng Gmail API để xóa...');
  
  try {
    // Tìm email từ Garena
    const searchRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=1&q=Garena',
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );
    
    const data = await searchRes.json();
    
    if (!data.messages || data.messages.length === 0) {
      console.log('[Gmail] ⚠️ Không có email Garena');
      return false;
    }
    
    const msgId = data.messages[0].id;
    
    // Xóa email
    const deleteRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );
    
    if (deleteRes.ok) {
      console.log('[Gmail] ✅ Đã xóa email Garena qua API');
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('[Gmail] ❌ API Error:', error.message);
    return false;
  }
}