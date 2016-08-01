function initLanguages() {
  var range = app.getStaffNotices().getRange('Language!A2:B');
  app.languages = app.backend.sheetsInterface.keyValuesToObject(range);
}
