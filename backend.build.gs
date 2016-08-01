//
// Routines that have to do with generation of raw data to be used in frontend applications
// 
//

function initBuild() {
  app.backend.build =  {
  
    buildAgents: function(e) {
      var agents = [];
      if (app.options.debug) return [app.config.admin];  // note, if you want to debug this routine, you'll need to move this.
      
      if (app.config.agents) return app.config.agents;

      // This seems like a pretty expensive way of doing it, maybe just email the group email?
//      app.backend.sheetsInterface.getThisSpreadsheet().getViewers().
//        forEach(function (user, index, obj) {
//        // Add this user's email only if not already there
//        if (agents.indexOf(user.getEmail()) <= -1) {
//          agents.push(user.getEmail());
//        }
//      });
//      app.backend.sheetsInterface.getThisSpreadsheet().getEditors().
//        forEach(function (user, index, obj) {
//        // Add this user's email only if not already there
//        if (agents.indexOf(user.getEmail()) <= -1) {
//          agents.push(user.getEmail());
//        }
//      });
 
      app.options.debug && Logger.log("Agents to send to: %s", agents);

      return agents;
    },
        
    buildNoticesForDateByKind: function(targetDate, kind, options)  {
      options = options ? options : {};
      var notices = {};
      
      var values = app.backend.sheetsInterface.getNoticesFromSheet('Active');
      var obj, row, docId, before, after;
      
      var holidays = app.config.holidays.map(function (v) {
        return app.libraries.moment(v).format(app.config.dateFormats.short);
      });
      notices.nextDay = targetDate.clone();
      notices.nextDay.add(1, "day");
      var result = holidays.indexOf(notices.nextDay.format(app.config.dateFormats.short));
      var i = 0;
      while (result != -1) {
        notices.nextDay.add(1, "day");
        result = holidays.indexOf(notices.nextDay.format(app.config.dateFormats.short));
        i+=1;
        if (i>holidays.length) return -1;   // prevent infinite loop, but leaves you with a year earlier date
      }
    
      notices.previousDay = targetDate.clone();
      notices.previousDay.subtract(1, "day");
      result = holidays.indexOf(notices.previousDay.format(app.config.dateFormats.short));
      i = 0;
      while (result != -1) {
        notices.previousDay.subtract(1, "day");
        result = holidays.indexOf(notices.previousDay.format(app.config.dateFormats.short));
        i+=1;
        if (i>holidays.length) return -1;   // prevent infinite loop, but leaves you with a year later date
      }
            
      // Make the "body" a string that contains the message we want to send

      var body = "";
      var incidents = 0;   // tally of how many incidents

      app.options.debug && Logger.log("Date we are using is for %s", targetDate.format(app.config.dateFormats.long));

      // forEach function loops through after filtering out bad stuff

      notices.title = options.title || targetDate.format(app.config.dateFormats.long);
      notices.shortTitle = options.shortTitle || targetDate.format(app.config.dateFormats.short);
      if (kind === app.config.sheets.staffNotices) notices.kind = 'staffnotices';
      if (kind === app.config.sheets.studentNotices) notices.kind = 'studentnotices';
      notices.url = "{}/{}/{}/{}/{}".format(
        app.config.site.urlPrefix, 
        app.config.domain, 
        app.config.site.slug, 
        notices.kind, 
        targetDate.format(app.config.dateFormats.short)
      );
      notices.count = 0;
      notices.countNew = 0;
      app.options.debug && Logger.log("URL: " + notices.url);


      // First put in any repeating notices
      // This will "make" the section in the notices, which is repeat code from below
      // REFACTOR: Lots of repetition here
      if (app.config.repeatingNotices) {
        for (var whichDay in app.config.repeatingNotices) {
          if (whichDay === targetDate.format('dddd')) {   // "Monday", "Tuesday"...
            var objs = app.config.repeatingNotices[whichDay];
            if (typeof objs !== 'function') continue;
            objs().forEach(function (obj) {
              if (!(obj.section in notices)) {
                notices[obj.section] = {};
                notices[obj.section].title = obj.section;
                notices[obj.section].order = app.config.sections[obj.section] || 10000;
                notices[obj.section].items = [];
                notices[obj.section].html = ""; 
              }
              notices[obj.section].items.push(obj);
              notices.count += 1;
              if (obj.isNew) notices.countNew += 1;

              if (obj.embededUrl && obj.embedInfo.doc !== undefined) {
                if (!('Attachments' in notices)) {
                  notices['Attachments'] = [];
                }
                notices['Attachments'].push(obj);
                obj.itemdb && Logger.log("Put into attachments");
              }

            });
          }
        }
      }

      var stickyPermissions = app.config.permissionsSticky;
      var priorityUsernames = app.config.priorityUsernames;
      
      // index will definitely be the row index
      values.forEach(function (row, index, arr) {
        if (row[0] === "") {
          app.options.debug && Logger.log("No value in first: {}".format(row));
          return;
        }
        if (row[indexExpired]) {
          app.options.debug && Logger.log("Expired: %s", row);
          return;
        }
        if (row[indexKind] !== kind) {
          app.options.debug && Logger.log("notice kind: {}, looking for {}".format(row[indexKind], kind));
          return;
        }
        
        if (options.filterBySection && row[indexSection] !== options.filterBySection) {
          // we have been instructed to exclude it
          Logger.log("Filtered!");
          return;
        }

        obj = app.utils.getObjFromArray(row, true);
        // TODO: Improve this by looking at the archive field
        // isAfter(archive) || obj.startDate.isSame(targetDate, "day")
        obj.isNew = obj.startDate.isSame(targetDate, "day");
        obj.itemdb && Logger.log(row);
        
        if (obj.sticky && stickyPermissions.indexOf(obj.username) === -1) {
          // No permissions to publish this!
          obj.itemdb && Logger.log("No permissions");
          return;
        }
        
        // Calculate the priority by determining how many days it has been published
        // Increase the priority if it is a priority username, that way they appear higher up
        // REFACTOR, we need target date to do this calculation...
        if (obj.sticky) {
          obj.priority = -10000;
          if (priorityUsernames.indexOf(obj.username)) {
            obj.priority -= 1;
          }
          obj.itemdb && Logger.log("Processing priority as sticky: %s", obj.priority);
        } else {
          obj.priority = targetDate.diff(obj.startDate, 'days') * 10;
          if (priorityUsernames.indexOf(obj.username)) {
            obj.priority += 1;
          }
          obj.itemdb && Logger.log("Processing priority: %s", obj.priority);
        }
        
        // Derive an internal index of each notice so we can sort by it and can figure out what order they appear on the page
        // We'll use that when outputting the attachments, below
        obj.index = parseInt(app.config.sections[obj.section].toString() + obj.priority.toString() + index.toString());
        obj.itemdb && Logger.log("Got index: %s", obj.index);
                
        app.utils.outfitObjectWithHtml(obj);
        obj.itemdb && Logger.log(obj.htmlContent);
        
        // Ensure that today is a weekday
        //if (timestamp.weekday() == 0 || timestamp.weekday() > 5) {
        //   return
        //}
        
        // Another filter to check for verifications?
        
        before = obj.startDate.isBefore(targetDate, 'day') || obj.startDate.isSame(targetDate, 'day')
        after =  obj.endDate.isAfter(targetDate, 'day') || obj.endDate.isSame(targetDate, 'day');
        obj.itemdb && Logger.log("Before %s and after %s", before, after);
        obj.itemdb && Logger.log(obj.endDate.format(app.config.dateFormats.long));
        
        if ( before && after ) {
          // Process it
          if (!(obj.section in notices))  {
            notices[obj.section] = new Object();
            notices[obj.section].title = obj.section;
            notices[obj.section].order = app.config.sections[obj.section];
            notices[obj.section].items = [];
            notices[obj.section].html = "";
          }
          
          notices[obj.section].items.push(obj);
          notices.count += 1;
          if (obj.isNew) notices.countNew += 1;
          
          obj.itemdb && Logger.log("Put into section %s", obj.section);
          
          if (obj.embededUrl && obj.embedInfo.doc !== undefined) {
            if (!('Attachments' in notices)) {
              notices['Attachments'] = [];
            }
            notices['Attachments'].push(obj);
            obj.itemdb && Logger.log("Put into attachments");
          }
        } else {
          Logger.log("Before and after wrong for this object: \n%s", obj.row);
        }
      });
      
      if (notices.count === 0) {
        // No notices at all, return something like 'blank'
        Logger.log("No notices found");
        return
      }
      
      // In case of 
      //var absences = 'Absences';
      //if (absences in notices) {
      //  notices[absences].items.push({by: '', isNew: false, titlePlainText: "TBD", htmlContent:'<li style="padding-bottom:10px">Academic: TBD</li><li style="padding-bottom:10px">Administration: TBD</li>'});
      //} else {
      //  notices[absences] = new Object();
      //  notices[absences].title = absences;
      //  notices[absences].order = -1;
      //  notices[absences].items = [{by: '', isNew: false, titlePlainText: "TBD", htmlContent:'<li style="padding-bottom:10px">Academic: TBD</li><li style="padding-bottom:10px">Administration: TBD</li>'}];
      //  notices[absences].html = "";
      //}

      notices.previousDayUrl = "{}/{}/{}/{}/{}".format(
        app.config.site.urlPrefix, 
        app.config.domain, 
        app.config.site.slug, 
        notices.kind,
        notices.previousDay.format(app.config.dateFormats.short)
      );
      notices.nextDayUrl = "{}/{}/{}/{}/{}".format(
        app.config.site.urlPrefix,
        app.config.domain, 
        app.config.site.slug, 
        notices.kind, 
        notices.nextDay.format(app.config.dateFormats.short)
      );
      notices.thisDayUrl = "{}/{}/{}/{}/{}#notice".format(
        app.config.site.urlPrefix,
        app.config.domain,
        app.config.site.slug,
        notices.kind,
        targetDate.format(app.config.dateFormats.short)
      );
      
      notices.summaryHtml = '<div style="margin-bottom:15px;"><span style="font-size:180%;"><strong>{title}</strong></span><br />Only the first notice in each section is displayed, <a href="{url}">click here</a> to view today\'s entire notices.</div>'.format(notices);
      notices.html = '<div style="font-family:sans-serif;"><div style="font-size:180%;margin-bottom:15px;"><strong>{title}</strong><div style="font-size:50%;"><a href="{previousDayUrl}">Previous Day</a> | <a href="{nextDayUrl}">Next Day</a></div></div>'.format(notices);
      //notices.titlesHtml = '<div style="margin-bottom:15px;"><span style="font-size:180%;"><strong>' + notices.title + '</strong></span><br /><div style="font-size:100%;padding:15px;background-color:#eee;box-shadow: 0 5px 5px 2px rgba(0,0,0,0.3);margin-top:15px;"><a href="' + notices.url + '">Today there are ' + notices.count + ' total notices, with ' + notices.countNew + ' new one(s). Click here to go to the website with the full contents.</a></div></div>';
      notices.titlesHtml = '<div style="margin-bottom:15px;"><span style="font-size:180%;"><strong>' + notices.title + '</strong></span><br /><div style="font-size:100%;padding:15px;background-color:#eee;box-shadow: 0 5px 5px 2px rgba(0,0,0,0.3);margin-top:15px;"><a href="{url}">Today there are {count} total notices, with {countNew} new one(s). Click here to go to the website with the full contents. Additional absences on the website are updated there, too.</a></div></div>'.format(notices);
      app.libraries.underscore().sortBy(notices, 'order').forEach(function (notice, index, arr) {
        if (notice.title === "Attachments") {
          // Don't do embedded docs the normal way, because we'll handle it differently
          return;
        }
        
        if (notice.items === undefined) { 
          return;
        }
        
        if (notice.title === "Sticky") {
          notices.titlesHtml += '<div style="font-size:150%;font-variant:small-caps;"><strong>' + notice.title + '</strong></div><ul class="unilist">';
          notice.items.forEach(function (item, index, obj) {
            notices.html += item.htmlContent;
            notices.summaryHtml += item.htmlContent;
            notice.titlesHtml += '<li>';
            notices.titlesHtml += item.isNew ? '<span style="color:green;"><i><b>NEW:</b></i></span> ' + item.titlePlainText : item.titlePlainText;
            notices.titlesHtml += item.by + '</li>';
          });
          notices.titlesHtml += '</ul>';
          return
        }
        notice.html = '<div style="font-size:150%;font-variant:small-caps;"><strong>' + notice.title + '</strong></div>';
        notice.summaryHtml = '<div style="font-size:150%;font-variant:small-caps;"><strong>' + notice.title + '</strong></div>';
        notice.titlesHtml = '<div style="font-size:150%;font-variant:small-caps;"><strong>' + notice.title + '</strong></div>';
        
        app.libraries.underscore().filter(notice.items, function (i) { return i.sticky; }).forEach(function (item, index, obj) {
          notice.html += item.htmlContent;
          notice.titlesHtml += '<li style="margin-bottom:10px;">';
          notice.titlesHtml += item.isNew ? '<span style="color:green;"><i><b>NEW:</b></i></span> ' + item.titlePlainText : item.titlePlainText;
          notice.titlesHtml += item.by + '</a></li>';
          if (index === 0) notice.summaryHtml += item.htmlContent;
        });
        notice.html += '<ul class="unilist">';
        notice.summaryHtml += '<ul class="unilist">';
        notice.titlesHtml += '<ul class="unilist">';
        var summaryCounter = 0;
        app.libraries.underscore().sortBy(notice.items, 'priority').forEach(function (item, index, obj) {
          if (!item.sticky) {
            notice.html += item.htmlContent;
            notice.titlesHtml += '<li><a style="text-decoration:none;color:inherit;" href="{}">'.format( notices.thisDayUrl + item.uniqueId.toString() );
            notice.titlesHtml += item.isNew ? '<span style="color:green;"><i><b>NEW:</b></i></span> ' + item.titlePlainText  : item.titlePlainText;
            notice.titlesHtml += item.by + '</a></li>';
            if (index === 0) notice.summaryHtml += item.htmlContent;
            else summaryCounter += 1;
          }
        });
        notice.html += '</ul>';
        
        if (summaryCounter == 0) notice.summaryHtml += '<li><i><a href="' + notices.url + '">No more in this section…</a></li></li></ul>';
        else notice.summaryHtml += '<li><i><a href="' + notices.url + '">And ' + summaryCounter +  ' more notice(s)…</a></i></li></ul>';
        notice.titlesHtml += '</ul>';
        
        notices.html += notice.html;
        notices.summaryHtml += notice.summaryHtml;
        notices.titlesHtml += notice.titlesHtml;
      });
      
      // Now handle the attachments:
      if (notices["Attachments"]) {
        notices.html += '<div style="font-size:130%;font-variant:small-caps;margin-top:40px;"><hr style="margin-bottom:40px;"><strong>Attachments</strong></div><br />';
        
        // Sort by index, so that attachments appear in the same order as given on the page
        app.libraries.underscore().sortBy(notices['Attachments'], 'index').forEach(function (item, index, obj) {
          notices.html += '<a name="embedded' + item.index.toString() + '"></a>' + item.fullContent + ' [<a href="#">Back to top</a>]';
          if (item.embedInfo.opened) {
            notices.html += item.embedInfo.embedCode;
          } else {
            notices.html += '<p>Sorry, could not open the attachment for display (maybe permissions are wrong?)</p>';
          }
          notices.html += '<p style="margin-bottom:20px;"></p>';
        });
        notices.html += '';
      }
      
      app.options.debug && Logger.log("Content of the notices:\n%s", notices.html);
      notices.html += '</div><br /><br /><br /><br />';
      return notices;
    },
    
    emailAgents: function(agents, notices, options) {
      options = options ? options : {view: 'html'};
      // Determine who should get the email, and actually send it
      // No duplicate sends
    
      agents.forEach(function (value, _, obj) {
          // TODO: send notices.html, but as html 
          MailApp.sendEmail(value, notices.title, '', {
            htmlBody:notices[options.view],
            name: app.config.replyToName,
            replyTo: app.config.replytoEmail,
          });
      });
    },
    
    updateSite: function(dateObj, notices, options) {
      options ? options : {todaysNotices:false}
      var shortTitle = dateObj.format(app.config.dateFormats.short);
      var longTitle = dateObj.format(app.config.dateFormats.long);
    
      app.options.debug && Logger.log(notices.kind);
      var parentPage = app.backend.sitesInterface.site().getChildByName(notices.kind);
      
      // Update the content of the individual page, and the "Today's Notices" page, per options
      var list = [shortTitle];
      if (options.todaysNotices) list.push(app.config.site.todaysNotices);
      list.forEach(function (name, nameIndex) {
          var targetNoticesPage = parentPage.getChildByName(name);
          if (targetNoticesPage === null) {
              // create the page on the site that will hold the data.
              var template = null;
              app.options.debug && Logger.log("Creating site shortTitle: %s longTitle %s", shortTitle, longTitle);
              app.backend.sitesInterface.site().getTemplates().forEach(function (t, i) {
                app.options.debug && Logger.log("<{}> <{}>".format(t.getName(), app.config.site.template));
                if (t.getName() == app.config.site.template) template = t;
              });
            
              if (!template) {
                app.options.debug && Logger.log("No Template found!");
                return;
              }
              var newPage = parentPage.createPageFromTemplate(longTitle, shortTitle, template);
              newPage.setHtmlContent(notices.html);
          } else {
            targetNoticesPage.setHtmlContent(notices.html);
          }
      });
      
    }
  }
}

