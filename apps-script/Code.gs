// Dán toàn bộ mã này vào tệp Code.gs trong dự án Apps Script hiện tại.
// Để trống nội dung tệp LoiChuc.gs cũ để chỉ có một doGet và một doPost.
const RSVP_TABS = {
  groom: 'Xác nhận tham dự',
  bride: 'Xác nhận tham dự-Nhà gái'
};

// Chạy thủ công một lần, từ Apps Script mở bằng Tiện ích mở rộng của bảng.
function setupNhaGai() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    if (!book) throw new Error('Hãy mở Apps Script từ bảng Data khách mời cưới');
    const source = book.getSheetByName(RSVP_TABS.groom);
    if (!source) throw new Error('Thiếu tab Xác nhận tham dự');
    let target = book.getSheetByName(RSVP_TABS.bride);
    if (!target) {
      target = book.insertSheet(RSVP_TABS.bride);
      const rows = source.getMaxRows();
      if (target.getMaxRows() < rows) {
        target.insertRowsAfter(target.getMaxRows(), rows - target.getMaxRows());
      }
      source.getRange(1, 1, rows, 5).copyTo(
        target.getRange(1, 1, rows, 5), {formatOnly: true}
      );
      target.getRange(1, 1, 1, 5).setValues(source.getRange(1, 1, 1, 5).getValues());
      for (let column = 1; column <= 5; column++) {
        target.setColumnWidth(column, source.getColumnWidth(column));
      }
      target.setFrozenRows(source.getFrozenRows());
      target.setConditionalFormatRules(source.getConditionalFormatRules().map(rule =>
        rule.copy().setRanges(rule.getRanges().map(range =>
          target.getRange(range.getA1Notation())
        )).build()
      ));
    }
    PropertiesService.getScriptProperties().setProperty('RSVP_SPREADSHEET_ID', book.getId());
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}

function getRsvpSheet(event) {
  const side = String(event && event.parameter && event.parameter.side || '');
  if (side && side !== 'nha-trai' && side !== 'nha-gai') {
    throw new Error('Bên nhận xác nhận không hợp lệ');
  }
  const id = PropertiesService.getScriptProperties().getProperty('RSVP_SPREADSHEET_ID');
  if (!id) throw new Error('Hãy chạy setupNhaGai trước khi triển khai');
  const name = side === 'nha-gai' ? RSVP_TABS.bride : RSVP_TABS.groom;
  const sheet = SpreadsheetApp.openById(id).getSheetByName(name);
  if (!sheet) throw new Error('Thiếu tab ' + name);
  return sheet;
}

function doPost(event) {
  const data = event && event.parameter;
  if (!data || !String(data.name || '').trim()) throw new Error('Thiếu tên khách');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const text = value => {
      const result = String(value || '').trim().slice(0, 2000);
      return /^[=+\-@]/.test(result) ? "'" + result : result;
    };
    getRsvpSheet(event).appendRow([
      Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss'),
      text(data.name),
      text(data.attend),
      data.attend === 'Không thể đến' ? '0' : text(data.count),
      text(data.msg)
    ]);
    SpreadsheetApp.flush();
    return ContentService.createTextOutput('OK');
  } finally {
    lock.releaseLock();
  }
}

function doGet(event) {
  const wishes = [];
  if (event && event.parameter && event.parameter.action === 'wishes') {
    const sheet = getRsvpSheet(event);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    const nameColumn = headers.indexOf('Họ và tên') + 1;
    const messageColumn = headers.indexOf('Lời chúc') + 1;
    if (!nameColumn || !messageColumn) throw new Error('Thiếu cột Họ và tên hoặc Lời chúc');
    const count = sheet.getLastRow() - 1;
    if (count > 0) {
      const names = sheet.getRange(2, nameColumn, count, 1).getDisplayValues();
      const messages = sheet.getRange(2, messageColumn, count, 1).getDisplayValues();
      const seen = new Set();
      const testNames = new Set(['KIỂM TRA KẾT NỐI', 'KIỂM TRA TỪ THIỆP']);
      for (let i = count - 1; i >= 0; i--) {
        const name = names[i][0].trim();
        const msg = messages[i][0].trim();
        const key = JSON.stringify([name, msg]);
        if (!name || !msg || testNames.has(name.toUpperCase()) || seen.has(key)) continue;
        seen.add(key);
        wishes.push({name, msg});
      }
    }
  }
  return ContentService.createTextOutput(JSON.stringify({wishes}))
    .setMimeType(ContentService.MimeType.JSON);
}
