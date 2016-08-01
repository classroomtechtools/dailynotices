function test_triggerOnSubmit() {
  var e = {};
  app.options.debug = false;
  var mimickFirstTime = false;
  
  [163,164,165,166,167,168,169,170,171,172].forEach(function (row) {
    var range = 'A{row}:I{row}'.format({row:row});
    e.range = app.backend.sheetsInterface.getRangeFromA1Notation(app.config.sheets.staffNotices, range);
    if (mimickFirstTime) {
      // Clear them...
      var newRange = e.range.offset(0, 0, 1, indexUniqueId+1);
      var uniqueId = Math.round(newRange.getValues()[0][indexUniqueId], 0);
      var properties = app.backend.scriptPropertiesInterface.getAllPropertiesStartsWith(uniqueId.toString());
      properties.forEach(function (property) {
        app.backend.scriptPropertiesInterface.deleteProperty(property.key);
      });
    }
    triggerOnSubmit(e);
  });
}

function triggerOnSubmit(e) {

  var lock = app.backend.lockInterface.lock();
  if (!lock) return;
  var user = null;

  var sheetName = e.range.getSheet().getName();
  var formId = app.config.forms[sheetName];
  
  app.backend.filldowns.fillDownOnSubmit(e);
  app.backend.filldowns.assignEditUrl(e.range, formId, 0, indexEditUrl+1);
  app.backend.filldowns.uniqueIdOnSubmit(e);

  var results = app.backend.
                  validate.
                  validationsOnSubmit(e);

  // release the lock because we just have to report back to the user now
  app.backend.lockInterface.release(lock);
  var problems = [];

  results.forEach(function (item) {
    var raw = app.languages[item.command];
    if (raw) {
      problems.push({message:raw.format(item)});
    } else {
      problems.push({message:"Unknown problem, please ask admin. {}".format(item.command)});
    }
  });
  
  if (problems.length > 0) {
    var obj = app.utils.getObjFromArray(results[0].row);
    app.utils.outfitObjectWithHtml(obj);  // is this needed?

    var html = loadTemplate("frontend.problem", {
      'problems':problems,
      'obj':obj,
      'kind': 'Daily Notice',
      'startDate': app.libraries.moment(obj.startDate).format(app.config.dateFormats.long),
      'endDate': app.libraries.moment(obj.endDate).format(app.config.dateFormats.long),
    }).getContent();
    if (app.options.debug) {
      user = app.config.admin;
    } else {
      user = obj.username;
    }
    MailApp.sendEmail(user, '[Attention!] Problem found with your notice "' + obj.titlePlainText + '"', 'Your notice needs attention, thank you.', {
                      htmlBody: html,
                      name: app.config.replyToNotifier,
                      replyTo: app.config.replytToEmail
                      });
  } else {
    var obj = app.utils.getObjFromArray(e.range.getSheet().getRange(e.range.getRow(), 1, 1, e.range.getSheet().getLastColumn()).getValues()[0]);
    app.utils.outfitObjectWithHtml(obj);
    var html = app.backend.templateInterface.load("frontend.success", {
      'obj': obj,
      'kind': 'Daily Notice',
      'startDate': app.libraries.moment(obj.startDate).format(app.config.dateFormats.long),
      'endDate': app.libraries.moment(obj.endDate).format(app.config.dateFormats.long),
    }).getContent();

    if (app.options.debug) {
      user = app.config.admin;
    } else {
      user = obj.username;
    }
    Logger.log("admin: {}".format(app.config.admin))
    Logger.log("username: {}".format(obj.username));

    MailApp.sendEmail(user, '[Success] Your notice "' + obj.titlePlainText + '"', 'Your notice was successful, thank you.', {
                      htmlBody:html,
                      name: app.config.replyToNotifier,
                      replyTo: app.config.replyToEmail,
                      });
  }
}

function test_validatationsOnSubmit() {

  var range = app.getStaffNotices().getRange('A38:I38');
  var e = {range:range,filldowns:false};
  app.options.debug = false;
  triggerOnSubmit(e);
}

