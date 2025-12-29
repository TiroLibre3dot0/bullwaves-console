const fs = require('fs');
const path = require('path');

// Path to the CSV file
const csvPath = path.join(__dirname, '..', 'public', 'Registrations Report.csv');
const backupPath = path.join(__dirname, '..', 'public', 'Registrations Report.csv.backup');

// Function to parse CSV line (handle quotes)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Read and process the CSV
fs.readFile(csvPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  const lines = data.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    console.log('File has less than 2 lines, no processing needed.');
    return;
  }

  const headers = parseCSVLine(lines[0]);
  const userIdIndex = headers.findIndex(h => h.replace(/"/g, '').trim() === 'User ID');
  const regDateIndex = headers.findIndex(h => h.replace(/"/g, '').trim() === 'Registration Date');

  if (userIdIndex === -1) {
    console.error('User ID column not found');
    return;
  }

  console.log(`Found ${lines.length - 1} data rows`);

  // Group by User ID
  const groups = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const userId = cols[userIdIndex]?.replace(/"/g, '').trim();
    if (userId) {
      if (!groups[userId]) {
        groups[userId] = [];
      }
      groups[userId].push({ line: lines[i], index: i, regDate: cols[regDateIndex]?.replace(/"/g, '').trim() });
    }
  }

  // Find duplicates
  const duplicates = Object.keys(groups).filter(userId => groups[userId].length > 1);
  console.log(`Found ${duplicates.length} User IDs with duplicates`);

  if (duplicates.length === 0) {
    console.log('No duplicates found.');
    return;
  }

  // Create backup
  fs.writeFileSync(backupPath, data);
  console.log('Backup created at Registrations Report.csv.backup');

  // For each duplicate group, keep the one with latest Registration Date
  const linesToKeep = new Set();
  for (const userId of duplicates) {
    const group = groups[userId];
    let latest = group[0];
    for (const item of group) {
      const latestDate = new Date(latest.regDate);
      const currentDate = new Date(item.regDate);
      if (!isNaN(currentDate) && (isNaN(latestDate) || currentDate > latestDate)) {
        latest = item;
      }
    }
    linesToKeep.add(latest.index);
    console.log(`For User ID ${userId}, keeping row ${latest.index} with date ${latest.regDate}`);
  }

  // Keep all non-duplicate rows and the selected duplicate rows
  const newLines = [lines[0]]; // header
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const userId = cols[userIdIndex]?.replace(/"/g, '').trim();
    const group = groups[userId];
    if (group.length === 1 || linesToKeep.has(i)) {
      newLines.push(lines[i]);
    }
  }

  console.log(`Original rows: ${lines.length - 1}, New rows: ${newLines.length - 1}`);

  // Write back
  const newData = newLines.join('\n');
  fs.writeFile(csvPath, newData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('Duplicates removed successfully!');
  });
});