function initUtils() {
  app.utils = {

    /*
      This needs to be reimplemented with a template
    */
    outfitObjectWithHtml: function (obj) {
      obj.embededDoc = undefined;
      obj.embededText = "";
      obj.embededUrl && Logger.log("Obj: {} {}".format(obj.embededUrl, obj.opened));
      if (obj.embededUrl && obj.embedInfo.opened) {
        obj.embededText = ' <a href="#embedded{}">[Attachment]</a> '.format(obj.index);
      }
      obj.fullContent = obj.isNew ? '<span style="color:green;"><i><b>NEW:</b></i></span> ' : "";
      obj.fullContent += this.htmlify(obj.title + obj.content) + obj.embededText + obj.by;
  
      if (obj.sticky) {
        obj.htmlContent = '<div style="font-size:100%;padding:15px;background-color:#eae672;margin-bottom:30px;margin-top:30px;box-shadow: 0 5px 5px 2px rgba(0,0,0,0.3);">';
        obj.htmlContent += obj.fullContent + '</div>';
      } else {
        obj.htmlContent  = '<li style="padding-bottom:10px;"><a name="notice{}"></a>'.format(obj.uniqueId);
        obj.htmlContent += obj.fullContent + '</li>';
      }


    },

    /*
      Pack the row array into a regular javascript object
      Checking for things along the way
    */
    getObjFromArray: function(row, open) {
        open = open ? open : false;
        obj = new Object();
        obj.row = row;
        obj.timestamp = app.libraries.moment(row[0]);
        obj.username = row[indexUsername];
        try {
          obj.user = app.backend.usersInterface.getUserFullNameFromEmail(obj.username);
        } catch (e) {
          obj.user = obj.username;
        }
        if (obj.user) {
          obj.by = ' ' + ('<i>[' + obj.user + ']</i>').replace(' ', '&nbsp;');
        } else {
          // no username? maybe no permissions? use the email instead...
          obj.by = obj.username;
        }
        obj.startDate = app.libraries.moment(app.utils.convert2JsDate(row[indexStartDate]));
        if (!row[indexEndDate]) {
          obj.endDate = obj.startDate;
        } else {
          obj.endDate = app.libraries.moment(app.utils.convert2JsDate(row[indexEndDate]));
        }
        obj.title = row[indexTitle];
        obj.titlePlainText = obj.title;
        obj.itemdb = obj.title === 'db';
        // Do some checks
        if (!obj.title) {
          obj.title = "";
        }
        else if (obj.title.match(/:\s*$/)) {
           obj.title = '**' + obj.title.replace(/\s*:\s*$/, ':** ');
        } else {
            obj.title = '**' + obj.title.replace(/\s*$/, ':** ');
        }
        obj.uniqueId = row[indexUniqueId];
        obj.content = (row[indexContent]).replace('\n', ' ');
        obj.section = row[indexSection];
        obj.embededUrl = row[indexEmbedded];
        Logger.log("embededUrl: {}".format(obj.embededUrl));
        obj.embededText = '';
        if (obj.embededUrl) {
          obj.embedInfo = {};
          obj.embedInfo.docId = app.utils.getIdFromUrl(obj.embededUrl);  // backwards compatible
          obj.docId = obj.embedInfo.docId;
          obj.embedInfo.kind = 'none';
          
          ['document', 'spreadsheet'].forEach(function (kind, kindex, _) {
            if (obj.embededUrl.indexOf(kind) !== -1) {
              obj.embedInfo.kind = kind;
            }
          });
    
          if (open) {
            obj.itemdb && Logger.log("Kind: %s, docId: %s", obj.embedInfo.kind, obj.embedInfo.docId);
            obj.embedInfo.opened = true;
            
            switch (obj.embedInfo.kind) {
              case 'spreadsheet': 
                try {
                  obj.embedInfo.doc = SpreadsheetApp.openById(obj.embedInfo.docId);
                  obj.embedInfo.embedCode = '<div class="sites-embed-content sites-embed-type-spreadsheet"><iframe src="https://docs.google.com/spreadsheets/d/{id}/htmlembed?authuser=0" width="100%" height="600" title="{name}" frameborder="0" id="1320895680"></iframe></div>';
                } catch (e) {
                  obj.embedInfo.opened = false;
                  obj.embedInfo.embedCode = e.message;
                }
                break;
              case 'document': 
                obj.embedInfo.embedCode = ''; 
                try {
                  obj.embedInfo.doc = DocumentApp.openById(obj.embedInfo.docId); 
                  obj.embedInfo.embedCode = '<div><b><div><div class="sites-embed-align-left-wrapping-off"><div class="sites-embed-border-on sites-embed sites-embed-full-width" style="width:100%;"><h4 class="sites-embed-title">{name}</h4><div class="sites-embed-object-title" style="display:none;">{name}</div><div class="sites-embed-content sites-embed-type-writely"><iframe src="https://docs.google.com/document/preview?hgd=1&amp;id={id}" width="100%" height="400" title="{name}" frameborder="0"></iframe></div><div class="sites-embed-footer"><div class="sites-embed-footer-icon sites-writely-icon">&nbsp;</div><a href="https://docs.google.com/document/edit?hgd=1&amp;id={id}" target="_blank">Open <i>{name}</i></a></div></div></div></div><br></b></div>';
                } catch (e) {
                  obj.embedInfo.opened = false;
                  obj.embedInfo.embedCode = e.message;
                }
                break;
    //          case 'folder': 
    //            obj.embedInfo.embedCode = ''; 
    //            try {
    //              obj.embedInfo.doc = DriveApp.getFolderById(obj.embedInfo.docId);
    //              obj.embedInfo.embedCode = '<div class="sites-embed-border-on sites-embed sites-embed-full-width" style="width:100%;"><h4 class="sites-embed-title">{name}</h4><div class="sites-embed-object-title" style="display:none;">{name}</div><div class="sites-embed-content sites-embed-type-folder"><iframe src="https://drive.google.com/embeddedfolderview?authuser=0&amp;hl=en&amp;id={id}#list" width="100%" height="600" title="{name}" frameborder="0" class="folder_embed" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe></div><div class="sites-embed-footer"><div class="sites-embed-footer-icon sites-folder-icon">&nbsp;</div><a href="https://drive.google.com/folderview?authuser=0&amp;hl=en&amp;id={id}#list" target="_blank">Open <i>{name}</i></a></div></div>';
    //           } catch (e) {
    //              obj.embedInfo.opened = false;
    //              obj.embedInfo.embedCode = e.message;
    //            }
                break;
              default:
                Logger.log("Could not open? {}".format(obj.embededUrl));
                obj.embedInfo.doc = null;
                obj.embedInfo.opened = false;
                obj.embedInfo.embedCode = '';
            } 
    
            if (obj.embedInfo.opened) obj.embedInfo.embedCode = obj.embedInfo.embedCode.replace('{id}', obj.embedInfo.docId).replace('{name}', obj.embedInfo.doc.getName());
            else Logger.log("Could not do embed %s\n%s", obj.embedInfo.embedCode, obj.row);
            
            obj.itemdb && Logger.log("Embed code: %s", obj.embedInfo.embedCode);
          } else {
            Logger.log("Opened is false");
            obj.embedInfo.doc = null;
          }
        }
        obj.started = row[indexStarted];
        obj.expired = row[indexExpired];
        obj.days = row[indexDays];
        obj.editUrl = row[indexEditUrl];
        obj.linkToSite = row[indexLinkToSite];

        obj.sticky = obj.section.startsWith("Sticky");
        if (obj.sticky) {
          obj.section = "Sticky";
        }
        obj.index = 0;

        return obj;
    },

    getIdFromUrl: function(url) { 
      var match = url.match(/[-\w]{25,}/); 
      if (!match) {
        return "<url no Id>";
      }
      return match[0];
    },
    
    /*
      Returns an object with relevant document info
    */
    getEmbedInfo: function(url) {
      var ret = {};
      
      ret.url = url;
      ret.docId =  app.utils.getIdFromUrl(url);
      ret.kind = null;
 
      // At the moment we ony support document and spreadsheet
      ['document', 'spreadsheet'].every(function (kind) {
        if (ret.url.indexOf(kind) !== -1) {
          ret.kind = kind;
          return false; // short circuit
        } else {
          return true;
        }     
      });
      
      return ret;
    },
    
    /*
      Using an embedInfo object, returned from getEmbedInfo()
      Open it and augment the object with info
      Returns success object, describing what happened
    */
    attemptOpen: function(embedObj) {

      var ret = {
        invalidKind:false,
        kind: null,
        url: embedObj.url,
        err: null,
        success:false
      };

      var openByIdHelper = {
        'spreadsheet': {
          f:SpreadsheetApp.openById,
          t:SpreadsheetApp
         },
        'document': {
          f:DocumentApp.openById,
          t:DocumentApp
        }
      }[embedObj.kind];
    
      if (!openByIdHelper) {
        ret.invalidKind = true;
        ret.kind = embedObj.kind;
        return ret;
      }
    
      try {
        embedObj.doc = openByIdHelper.f.apply( openByIdHelper.t , [embedObj.docId] );
      } catch (err) {
        ret.err = err;
        return ret;
      }
      
      ret.success = true;
      return ret;
    },

    /**
    * Convert any spreadsheet value to a date.
    * Assumes that numbers are using Epoch (days since 1 Jan 1900, e.g. Excel, Sheets).
    * Originally found at http://stackoverflow.com/questions/33809229/how-to-get-a-date-format-string-from-a-sheet-cell/33813783#33813783
    * 
    * @param {object}  value  (optional) Cell value; a date, a number or a date-string 
    *                         will be converted to a JavaScript date. If missing or
    *                         an unknown type, will be treated as "today".
    *
    * @return {date}          JavaScript Date object representation of input value.
    */
    convert2JsDate: function(value) {
      var jsDate = new Date();  // default to now
      if (value) {
        // If we were given a date object, use it as-is
        if (typeof value === 'date' || typeof value === 'object') {
          jsDate = value;
        } else {
          if (typeof value === 'number') {
            // Assume this is spreadsheet "serial number" date
            var daysSince01Jan1900 = value;
            var daysSince01Jan1970 = daysSince01Jan1900 - 25569 // 25569 = days TO Unix Time Reference
            var msSince01Jan1970 = daysSince01Jan1970 * 24 * 60 * 60 * 1000; // Convert to numeric unix time
            var timezoneOffsetInMs = jsDate.getTimezoneOffset() * 60 * 1000;
            jsDate = new Date( msSince01Jan1970 + timezoneOffsetInMs );
          } else if (typeof value === 'string') {
            // Hope the string is formatted as a date string
            jsDate = new Date( value );
          }
        }
      }
      return jsDate;
    },
        
    htmlify: function(text) {
     return app.libraries.showdown().makeHtml(text).replace(/<p>|<\/p>/g, '')
    },
    
    deriveCutOffTime: function() {
      var lastUpdateDay = app.libraries.moment(app.libraries.moment(app.config.lastUpdated)).format('YYYY-MM-DD');
      var cutOffTime = app.libraries.moment(app.config.cutOffTime).format('HH:mm');
      var derivedTime = "{} {}".format(lastUpdateDay, cutOffTime);
      return app.libraries.moment(derivedTime);
    }

  }  
}