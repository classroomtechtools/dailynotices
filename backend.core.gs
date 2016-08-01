// This builds the body of the email

function initBackend() {

  app.backend = {

    scriptPropertiesInterface: {
        get: function () {
          if (!this.get_) this.get_ = PropertiesService.getScriptProperties();
          return this.get_;
        },
        getProperty: function (prop) {
          return this.get().getProperty(prop);
        },
        hasProperty: function (prop) {
          return this.getProperty(prop) != null;
        },
        setProperty: function (key, value) {
          // supports chaining
          return this.get().setProperty(key, value);
        },
        deleteProperty: function (key) {
          this.get().deleteProperty(key);
        },
        sectionsOrder: function () {
          // TODO: Make this use the sheet
          return JSON.parse(this.getProperty(app.properties.sectionsOrder));
        },
        lastUpdated: function () {
          return this.getProperty(app.properties.lastUpdated);
        },
        getAllKeys: function () {
          return this.get().getKeys();
        },
        /* 
          Returns [{key:key,value:value}]
        */
        getAllPropertiesStartsWith: function(startsWith) {
          var ret = [];
          this.getAllKeys().forEach(function (prop) {
            if (prop.startsWith(startsWith)) {
              ret.push( {key:prop,value:this.get().getProperty(prop)} );
            }
          }.bind(this));
          return ret;
        }
    },

    templateInterface: {
      /* 
        Loads the template file called `name` with values in obj
        returns the result
        @param {name} Name of the template
        @param {obj} object with properties
      */
      load: function(name, obj) {
        var t = HtmlService.createTemplateFromFile(name);
        for (k in obj) {
          t[k] = obj[k];
        }
        return t.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);  
      }
    },

    sheetsInterface: {
    
       getThisSpreadsheet: function() {
         return SpreadsheetApp.getActiveSpreadsheet();
       },
       getSheetFromName: function(sheetName) {
         return this.getThisSpreadsheet().getSheetByName(sheetName);
       },
       getNoticesFromSheet: function(sheetName) {
          // TODO: Change 2 to app.settings.numHeaders
          var sheet = this.getSheetFromName(sheetName);
          return sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
       },
       getRangeFromA1Notation: function(sheetName, A1Notation) {
         return this.getSheetFromName(sheetName).getRange(A1Notation);
       },
       getNoticeById: function(id) {
         var found = null;
         for (sheet in app.config.sheets) {
            var sheetName = app.config.sheets[sheet];
            var notices = this.getNoticesFromSheet(sheetName);
            notices.every(function (row) {
              if (row[indexUniqueId] == id) {
                var obj = app.utils.getObjFromArray(row, true);
                app.utils.outfitObjectWithHtml(obj);
                found = obj;
                return false;
              }
              return true;
            });
         }
         return found;
       },
       /* 
         Filters out blank rows, returns the first one
         Only useful for columns of one dimension
       */
       rangeValuesToArray: function(range) {
         return range.getValues().filter(function (v, i, a) {
           return typeof v[0] == "string" ? v[0].trim().length > 0 : true;   // if it is not a string, then it has to have some value
         }).map(function (v, i, a) {
           return v[0];
         });
       },
       
       /*
         
       */
       keyValuesToObject: function(range) {
         // FIXME: Can only take two rows
         return range.getValues().filter(function (v,i,a) {
           return v[0].length > 0;
         }).reduce(function (o, v, i) {
           o[v[0]] = v[1];
           return o;
         }, {});
       },
       
       /*
         Returns an array of usernames that is found on the sheet
       */
       getPermissions: function() {
         return this.rangeValuesToArray(this.getThisSpreadsheet().getRange(app.config.permissionsSticky));
       }
    },
    
    usersInterface: {
      getUserFullNameFromEmail: function(email) {
        var user = AdminDirectory.Users.get(email); 
        if (!user) return "<no name available>";
        return user.name.fullName;
      }
    },

    sitesInterface: {
      site: function() {
        if (!this.site_) this.site_ = SitesApp.getSite(app.config.domain, app.config.site.slug);
        return this.site_;
      },
      getPageByName: function (name) {
        var templates = this.site().getTemplates();
        var names = app.libraries.underscore().invoke(templates, 'getName');
        return templates[names.indexOf(name)];
      },
    },

    lockInterface : {
      getScriptLock: function () {
        try {
          var lock = LockService.getScriptLock();
          var isLockt = lock.tryLock(10000);
        } catch (err) {
          Utilities.sleep(2000);//Wait 2 seconds
          lock = LockService.getScriptLock();//Try again
          isLockt = lock.tryLock(10000);
        };
        
        if (!isLockt) {
          //Email developer.  There was an error
          //Email user.  There was an error.
          //Keep running code?  Or quit?
          return false;
        };        
        return lock;
      },  
      lock : function() {
        var lock = this.getScriptLock();
        if (!lock) {
          MailApp.sendEmail(app.config.admin, "Warning", Utilities.formatString("No lock established: %s", e));
          return null;
        }
        return lock;
      },
      release : function(lock) {
        lock.releaseLock();
      }
    },

    formInterface: {
      getThisForm: function() {
        if (!this._form) this._form = FormApp.openById(app.config.forms['Staff Notices'])
        return this._form;
      },

      getReponseById: function(id) {
        var response = this.getThisForm().getResponse(id);        
        response.getItemResponses().forEach(function (item) {
          Logger.log(item.getItem().getType());
        });
      },

      /*
        There is no way to change responses programatically
        best you can do is build a prefill URL and have the user click on it
      */
      setStartDateToValue: function(id, value) {
        'not implemented';
      }
    },

    triggers: {
    
      autoUpdate: function(sheetName, updateString) {  
        var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        var thisSheet = spreadsheet.getSheetByName(sheetName);
        var thisRange = thisSheet.getDataRange();
        var targets = [];
        thisRange.getNotes().forEach(function (row, rowIndex) {
          row.forEach(function (col, colIndex) {
            if (col.startsWith(updateString)) {
                targets.push({row:rowIndex+1, col:colIndex+1});
            }
          });
        });
      
        targets.forEach(function (target) {
          var targetRange = thisSheet.getRange(target.row, target.col);
          var targetValue = targetRange.getFormula();
          targetRange.setFormula(targetValue);
        });
      },
    },
  }
}


