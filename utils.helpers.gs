
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .getContent();
}

/* 
  Loads the template file called `name` with values in obj
  returns the result
  @param {name} Name of the template
  @param {obj} object with properties
*/
function loadTemplate(name, obj) {
  var t = HtmlService.createTemplateFromFile(name);
  for (k in obj) {
    t[k] = obj[k];
  }
  return t.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);  
}

// These are all used by frontend to implement (broken) Easy Editor feature
// Leave them for now, until such time that I can refactor appropriately

function getCurrentRange() {
  var row = SpreadsheetApp.getActiveRange().getRow();
  return sheet.getRange(row, indexContent+1);
}

function getCurrentEntry() {
  var range = getCurrentRange();
  return range.getValue();
}

function getCurrentEntryMD() {
  var value = getCurrentEntry();
  return htmlify_(value);
}

function setCurrentEntry(rawText) {
  var range = getCurrentRange();
  range.setValue(rawText);
  return htmlify_(rawText);
}

function selectRowForUser() {
  var range = getCurrentRange();
  var newRange = sheet.getRange(range.getRow(), 1, 1, indexContent+1);
  sheet.setActiveSelection(newRange);
}


