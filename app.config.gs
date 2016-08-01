function initConfig() {
  // Reads in all the data once, and provides interface for allowing app to access
  
  var rangeString = 'Admin!A1:B';
  var range = app.backend.sheetsInterface.getThisSpreadsheet().getRange(rangeString);
  var config = app.backend.sheetsInterface.keyValuesToObject(range);
  
  // look at the values and read in the range
  
  for (key in config) {
    if (typeof config[key] === 'string' && config[key].indexOf('!') != -1) {
      // FIXME: ha, some parser for detecting range
      var range  = app.backend.sheetsInterface.getThisSpreadsheet().getRange(config[key]);
      var numCols = range.getNumColumns();
      var newValue = null;
      if (numCols == 2) {
        newValue = app.backend.sheetsInterface.keyValuesToObject(range);
      } else if (numCols == 1) {
        if (range.getNumRows() == 1) newValue = range.getValue();
        else newValue = app.backend.sheetsInterface.rangeValuesToArray(range);
      } else {
        Logger.log("Unsupported number of columns in Admin sheet settings: " + numCols.toString() + "range: " + range.getA1Notation());
      }
      config[key] = newValue;
    }
  }
  
  // now go through and read in the 
  for (var key in config) {
    if (key.indexOf('.') != -1) {
      var split = key.split('.');
      var parentKey = split[0];
      var childKey = split[1];
      if (!(parentKey in config)) config[parentKey] = {};
      config[parentKey][childKey] = config[key];
      delete config[key];
    }
  }
  
  
  for (var key in config) {
    var value = config[key];
    if (typeof value == "object" && !(value instanceof Array)) {
      for (var subKey in config[key]) {
        var value = config[key][subKey];
        // First resolve the range, if present
        if (typeof value == "string" && value.startsWith('[') && value.endsWith(']')) {
          var val = value.slice(1, value.length-1);
          config[key][subKey] = function () {
            var ret = [];
            val.split(',').forEach(function(v) {
              var r = app.backend.sheetsInterface.getNoticeById(parseInt(v));
              if (r!=null) ret.push(r);
            });
            return ret;
          }
        }
      }
    }
  }
  
  
  app.config = config;
}

