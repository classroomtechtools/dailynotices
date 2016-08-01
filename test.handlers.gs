function testThisHolidays() {
  Logger.log("Start");
  var startDate = app.libraries.moment("2016-06-20")
  var holidays = app.config.holidays.map(function (v) {
    return app.libraries.moment(v).format(app.config.dateFormats.short);
  });
  var found = false;
  // if startDate falls on a holiday, warn the user.
  if (holidays.indexOf(startDate.format(app.config.dateFormats.short)) != -1) {
    found = true;
  }

  Logger.log("Is {} a holiday?: {}".format(startDate.format(app.config.dateFormats.long), found));
}


function testTimes() {
  Logger.log(app.config.cutOffTime);
  var lastUpdateDay = app.libraries.moment(app.libraries.moment(app.config.lastUpdated)).format('YYYY-MM-DD');
  var cutOffTime = app.libraries.moment(app.config.cutOffTime).format('HH:mm');
  var derivedTime = "{} {}".format(lastUpdateDay, cutOffTime);
  Logger.log(derivedTime);
  var cutOff = app.libraries.moment(derivedTime);
  Logger.log(cutOff.format('YYYY-MM-DD HH:mm'));
  var now = app.libraries.moment('2016-05-27 05');
  Logger.log(now.format('YYYY-MM-DD HH:mm'));
  Logger.log(now.isAfter(cutOffTime, "hour"));
}

function testValidation () {
  var e = {};
  e.range = app.backend.sheetsInterface.getRangeFromA1Notation(app.config.sheets.studentNotices, 'A130:I130'); 
  app.backend.validate.validationsOnSubmit(e).forEach(function (item) {
    Logger.log(item);
  });  
}

function testBuild() {
  var day = app.libraries.interface.dates.today();
  var notices = app.backend.build.buildNoticesForDateByKind(day, 'Staff Notices');
}

function testHolidays() {
  var holidays = app.config.holidays.map(function (v) {
    return app.libraries.moment(v).format(app.config.dateFormats.short);
  });
  var targetDate = app.libraries.moment("2016-05-20");
  var nextDay = targetDate.clone();
  nextDay.add(1, "day");
  var result = holidays.indexOf(nextDay.format(app.config.dateFormats.short));
  var i = 0;
  while (result != -1) {
    nextDay.add(1, "day");
    result = holidays.indexOf(nextDay.format(app.config.dateFormats.short));
    i+=1;
    if (i>holidays.length) return -1;   // prevent infinite loop, but leaves you with a year earlier date
  }

  var previousDay = targetDate.clone();
  previousDay.subtract(1, "day");
  result = holidays.indexOf(previousDay.format(app.config.dateFormats.short));
  i = 0;
  while (result != -1) {
    previousDay.subtract(1, "day");
    result = holidays.indexOf(previousDay.format(app.config.dateFormats.short));
    i+=1;
    if (i>holidays.length) return -1;   // prevent infinite loop, but leaves you with a year later date
  }
  
  Logger.log(nextDay.format(app.config.dateFormats.long));
  Logger.log(previousDay.format(app.config.dateFormats.long));
  
  
}


function testMoment() {
  var now = app.libraries.moment();
  var key = now.format(app.config.dateFormats.key);
  app.backend.scriptPropertiesInterface.setProperty(key, now.toISOString());
  var retrieved = app.backend.scriptPropertiesInterface.getProperty(key);
  var newOne = app.libraries.moment( retrieved );
  Logger.log(newOne.isSame(now));
}

function testShowdown() {
  var result = app.utils.htmlify('*Test*');
  Logger.log(result);
}


