const xlsx = require('xlsx');
const fs = require('fs');

/**
 * Parse an uploaded Excel or CSV file into an array of objects
 */
function parseSpreadsheet(filePath) {
  const workbook = xlsx.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const records = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
  return records;
}

/**
 * Generate an Excel file buffer from JSON array
 */
function exportToExcelBuffer(data, sheetName = 'Sheet1') {
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

module.exports = {
  parseSpreadsheet,
  exportToExcelBuffer
};
