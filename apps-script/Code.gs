/**
 * Sadhana Card — Google Apps Script Backend
 * 
 * Deploy as Web App (Execute as: Me, Who has access: Anyone)
 * to receive POST requests from the Sadhana Card frontend.
 * 
 * Each POST creates/overwrites a sheet tab named "Week-YYYY-MM-DD"
 * with all activity scores, SEVA minutes, and computed grades.
 * 
 * Setup:
 * 1. Create a new Google Sheet
 * 2. Extensions → Apps Script → paste this code
 * 3. Deploy → New deployment → Web App
 * 4. Copy the URL → paste into the Sadhana Card Settings
 */

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);

    // Basic payload validation
    if (!payload.weekStart || !payload.activities) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Invalid payload: missing weekStart or activities',
      })).setMimeType(ContentService.MimeType.JSON);
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tabName = 'Week-' + payload.weekStart;
    
    // Delete existing tab if it exists, then create fresh
    var existingSheet = ss.getSheetByName(tabName);
    if (existingSheet) {
      ss.deleteSheet(existingSheet);
    }
    var sheet = ss.insertSheet(tabName);
    
    // ─── Header Section ─────────────────────────────────
    var row = 1;
    
    // Title row
    sheet.getRange(row, 1).setValue('Sadhana Card — ' + payload.devoteeName);
    sheet.getRange(row, 1).setFontSize(14).setFontWeight('bold');
    sheet.getRange(row, 1, 1, 9).merge();
    sheet.getRange(row, 1, 1, 9).setBackground('#F5A020').setFontColor('#fff');
    row++;
    
    sheet.getRange(row, 1).setValue('Week of ' + payload.weekStart);
    sheet.getRange(row, 1).setFontSize(10).setFontStyle('italic');
    row += 2;
    
    // ─── Scored Activities Table ─────────────────────────
    var days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    
    // Header row
    var headerRow = ['Activity (Section)'].concat(days).concat(['TOTAL']);
    sheet.getRange(row, 1, 1, headerRow.length).setValues([headerRow]);
    sheet.getRange(row, 1, 1, headerRow.length)
      .setFontWeight('bold')
      .setBackground('#B45C00')
      .setFontColor('#fff')
      .setHorizontalAlignment('center');
    row++;
    
    // Activity rows
    var currentSection = '';
    payload.activities.forEach(function(activity) {
      // Section separator
      if (activity.section !== currentSection) {
        currentSection = activity.section;
        sheet.getRange(row, 1, 1, headerRow.length)
          .setBackground('#FFF3E0')
          .setFontWeight('bold');
        sheet.getRange(row, 1).setValue('── ' + getSectionLabel(currentSection) + ' ──');
        row++;
      }
      
      var rowData = [activity.label + ' (max ' + activity.maxPoints + ')'];
      var weekTotal = 0;
      
      activity.daily.forEach(function(d) {
        var val = d.value !== null && d.value !== undefined ? d.value : '';
        rowData.push(val);
        if (typeof val === 'number') weekTotal += val;
      });
      
      rowData.push(weekTotal);
      sheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
      
      // Color-code score cells
      for (var c = 2; c <= 8; c++) {
        var cellVal = rowData[c - 1];
        if (cellVal === '') {
          sheet.getRange(row, c).setBackground('#F5F5F5');
        } else if (cellVal === activity.maxPoints) {
          sheet.getRange(row, c).setBackground('#C8E6C9');
        } else if (cellVal === 0) {
          sheet.getRange(row, c).setBackground('#FFCDD2');
        } else {
          sheet.getRange(row, c).setBackground('#FFF9C4');
        }
        sheet.getRange(row, c).setHorizontalAlignment('center');
      }
      
      row++;
    });
    
    row++;
    
    // ─── SEVA Table ──────────────────────────────────────
    sheet.getRange(row, 1, 1, headerRow.length)
      .setBackground('#E0F2F1')
      .setFontWeight('bold');
    sheet.getRange(row, 1).setValue('── SEVA (minutes) ──');
    row++;
    
    payload.seva.forEach(function(seva) {
      var rowData = [seva.label];
      var weekTotal = 0;
      
      seva.daily.forEach(function(d) {
        rowData.push(d.minutes || 0);
        weekTotal += (d.minutes || 0);
      });
      
      rowData.push(weekTotal);
      sheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
      
      for (var c = 2; c <= 9; c++) {
        sheet.getRange(row, c).setHorizontalAlignment('center');
      }
      sheet.getRange(row, 1, 1, rowData.length).setBackground('#F1F8E9');
      
      row++;
    });
    
    row += 2;
    
    // ─── Summary Section ────────────────────────────────
    sheet.getRange(row, 1, 1, 4).setValues([['Metric', 'Points', 'Max', 'Percentage']]);
    sheet.getRange(row, 1, 1, 4).setFontWeight('bold').setBackground('#E8760A').setFontColor('#fff');
    row++;
    
    sheet.getRange(row, 1, 1, 4).setValues([['Body Score (NIDRA)', payload.scores.bodyTotal, 525, payload.scores.bodyPct + '%']]);
    row++;
    sheet.getRange(row, 1, 1, 4).setValues([['Soul Score (Japa+Pathan+College)', payload.scores.soulTotal, 525, payload.scores.soulPct + '%']]);
    row++;
    sheet.getRange(row, 1, 1, 4).setValues([['Combined Total', payload.scores.bodyTotal + payload.scores.soulTotal, 1050, payload.scores.totalPct + '%']]);
    sheet.getRange(row, 1, 1, 4).setFontWeight('bold');
    row++;
    
    // Grade row
    sheet.getRange(row, 1, 1, 2).setValues([['GRADE', payload.scores.grade]]);
    sheet.getRange(row, 1, 1, 2).setFontSize(12).setFontWeight('bold');
    var gradeColor = getGradeColor(payload.scores.grade);
    sheet.getRange(row, 2).setBackground(gradeColor).setFontColor('#fff');
    
    // ─── Formatting ─────────────────────────────────────
    sheet.setColumnWidth(1, 250);
    for (var i = 2; i <= 9; i++) {
      sheet.setColumnWidth(i, 80);
    }
    sheet.getRange(1, 1, row, 9).setBorder(true, true, true, true, true, true, '#E8D5B8', SpreadsheetApp.BorderStyle.SOLID);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      tab: tabName,
      grade: payload.scores.grade,
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString(),
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Sadhana Card Apps Script is deployed and running.',
  })).setMimeType(ContentService.MimeType.JSON);
}

// ─── Helpers ────────────────────────────────────────────

function getSectionLabel(key) {
  var labels = {
    'NIDRA': 'NIDRA (Body)',
    'JAPA': 'JAPA (Soul)',
    'PATHAN': 'PATHAN & SRAVANA (Soul)',
    'COLLEGE': 'College Studies & Cleanliness (Soul)',
  };
  return labels[key] || key;
}

function getGradeColor(grade) {
  var colors = {
    'High Honors': '#1B5E20',
    'Honors': '#2E7D32',
    'Distinction': '#1565C0',
    'First Class': '#E65100',
    'Pass': '#F57F17',
    'Below Pass': '#C62828',
  };
  return colors[grade] || '#757575';
}
