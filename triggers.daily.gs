
function testDailyTrigger() {
  var e = {};
  e.test = true;
  e.day = app.libraries.interface.dates.today();
  //e.day.subtract(1, "days");
  e.agents = ['adam.morris@igbis.edu.my'];
  e.updateSite = true;
  triggerDailyTrigger(e);
}

function testAbsencesTrigger() {
  var e = {};
  e.test = true;
  e.agents = [];
  e.day = app.libraries.interface.dates.today();
  triggerAbsencesTrigger(e);
}

function report(data) {
  var template = app.backend.templateInterface.load('frontend.report', {data:data}).getContent();

  app.config.reportAdmins.forEach(function (agent) {
    MailApp.sendEmail(agent, "Daily Notices Report", '', {
      htmlBody:template
    });
  });
}

function triggerAbsencesTrigger(e) {
  e.agents = [];
  triggerDailyTrigger(e);  // will build with no agents, i.e. no emails 
}

function triggerDailyTrigger(e) {
  var startTime = new Date().getTime();
  var reportData = [];

  // First check to see if I should be running at all.
  // e parameter can be undefined if run from code console
  // or is defined, but e.day is not in that case
  // or I define it manually in order to test.
  // Reads in holidays column from sheet and converts them into usable dates.
  // TODO: Look at the archive to decide what to run with
  // if this is equal today, then go ahead, otherwise, just return
  e = e ? e : {
    test: false,
  }
  if (typeof e.day === 'undefined') e.day = app.libraries.interface.dates.today();  // TODO: Is there a way to make this a setting on the spreadsheet? Dropdown?
  if (typeof e.test === 'undefined') e.test = false;
  if (typeof e.agents == 'undefined') e.agents = null;
  if (typeof e.updateSite == 'undefined') e.updateSite = true;
  app.options.debug = e.test; // This also determines who the agents are

  var day = e.day.clone();

  if (!e.test) {
    // Running from a real daily trigger, so determine if we should stop running
    // We can tell if we are supposed to run or not, by lookin at the Archive sheet.
    var checkDate = app.config.lastUpdated;
    checkDate = app.libraries.moment(checkDate);

    if (!day.isSame(checkDate, "day")) {
      reportData.push({
        message: "Daily Notices did not run today, because it appears that there is no school. TODO: Turn me off.",
      });
      report(reportData);
      return;
    }
  }

  var beforeBuildTime = new Date().getTime();
  var notices = app.backend.build.buildNoticesForDateByKind(day, 'Staff Notices');
  reportData.push({
    message: "Building notices took {} seconds".format(
      app.libraries.iMoment.reportSeconds(beforeBuildTime)
    )
  });

  if (typeof notices === 'undefined') {
    reportData.push({
      message: "No notices to send today!"
    });
    return;
  }

  var agents = e.agents || app.backend.build.buildAgents(e);
  
  var beforeEmailTime = new Date().getTime();
  notices.title = "Digest for {}".format(day.format(app.config.dateFormats.long));
  app.backend.build.emailAgents(agents, notices, {view:'titlesHtml'});
  reportData.push({
    message: "Emailing the agents took {} seconds".format(
      app.libraries.iMoment.reportSeconds(beforeEmailTime)
    )
  });

  if (e.updateSite) {

    var beforeUpdateSite = new Date().getTime();

    // update individual site and today's notices
    app.backend.build.updateSite(day, notices, {todaysNotices:true});
    // build placeholder site for next day
    var nothingToSeeHere = {html: "There are no notices here (yet)", kind:notices.kind};
    app.backend.build.updateSite(notices.nextDay, nothingToSeeHere, {todaysNotices:false});
    
    reportData.push({
      message: "Updating the site took {} seconds".format(
        app.libraries.iMoment.reportSeconds(beforeUpdateSite)
      )
    });

  }

  report(reportData);
}

function absencesTrigger(e) {
  var day = today;

  // build just the absences for the email
  var absentNotices = buildNoticesForDateByKind(day, 'Staff', {
      filterBySection:"Absences",
      title: "Absences Update for " + day.format(longDateFormat)
    });
  var agents = buildAgents(e);
  emailAgents(agents, day, absentNotices, {view: 'html'});  

  var allNotices = buildNoticesForDateByKind(day, 'Staff');  
  updateSite(day, allNotices)
}


