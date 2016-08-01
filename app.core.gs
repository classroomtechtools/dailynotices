var app = {};

function initApp(options) {
  app.options = options ? options : {
    debug:false,
  };
  app.toggleDebug = function() {
    this.options.debug = !this.options.debug;
  }
  
  app.getStaffNotices = function() {
    return app.backend.sheetsInterface.getSheetFromName(app.config.sheets.staffNotices);
  };
  
  app.getStudentNotices = function() {
    return app.backend.sheetsInterface.getSheetFromName(app.config.sheets.studentNotices);
  };

  // init our layers, in the order of dependencies
  initLibraries();
  initUtils();
  initBackend();
  initConfig();
  initStructures();
  initFilldowns();
  initValidations();
  initBuild();
  initLanguages();
  
}

initApp();