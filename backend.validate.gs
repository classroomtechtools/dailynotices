function initValidations() {
  
  function ValidateOnSubmit(range, options) {
    ValidateOnSubmit._super.constructor.call(this, range, options);
  }
  ValidateOnSubmit.prototype.initObjects = function () {
    this.objects = [];
    var obj = {};
    this.values.forEach(function (row, rowIndex) {
      this.extraHeaders.forEach(function (extraHeader, index) {
        if (extraHeader.indexOf(this.options.secondRow) != -1) {
          obj = {
            currentValue: row[index],
            header: this.headers[index],
            column: index+1,
            validationString: extraHeader,
            klass: typeof this,
            range: this.range.getSheet().getRange(this.range.getRow(), index+1),
            cancelRange: this.range.getSheet().getRange(this.range.getRow(), indexCancel+1),
          };
          this.objects.push(obj)
        }
      }.bind(this));
    }.bind(this));
  }
  ValidateOnSubmit.prototype.passes = function (header, headerRowIndex, headerIndex) {
    if (this.options.hasOwnProperty('secondRow')) {
      //Logger.log("%s %s: %s", header, this.options.secondRow, (header.indexOf(this.options.secondRow)).toString());
      return headerRowIndex == 1 && header.indexOf(this.options.secondRow) != -1;
    }
    return header !== '';
  }
  ValidateOnSubmit.prototype.validate = function () {
    var ret = [];
    var myName = arguments.callee.name;
    this.values.forEach(function (row, rowOffset) {
      this.objects.forEach(function (obj) {
        var rowIndex = this.range.getRow() + rowOffset;
        var extendedRow = this.range.getSheet().getRange(rowIndex, 1, 1, this.range.getSheet().getLastColumn());
        if (rowIndex > this.numHeaderRows+1) {

          // Begin validation algorthm here
          obj.validationString.split(" ").every(function (command, vIndex) {
            if (command.startsWith(this.options.secondRow + '(') && command.endsWith(')')) {
              var name = command.slice(0, this.options.secondRow.length);
              var arg = command.slice(this.options.secondRow.length+1, command.length-1);
              var operator = arg.replace(/[^=<>]+$/, "");
              var operand = arg.slice(operator.length);

              var validationObject = {
                operator: operator,
                operand: operand,
                operandResolvedValue: null,
                command: command,
                argument: arg,
                value: obj.currentValue,
                header: obj.header,
                obj: obj,
                rowIndex: rowIndex,
                row: extendedRow.getValues()[0],
                name: name,
                result: {
                  result: null,
                }
              };

              app.options.debug && Logger.log(validationObject);
              var result =  this._validate(validationObject);
              if (result && !validationObject.result.result) ret.push(validationObject);
              return result;  // might want us to short circuit
            } else {
              // falls here when it is mismatched, and by design some of them will, for those with multiple commands
              app.options.debug && Logger.log("Not found: {} when looking inside {}: {} and {}, finally {}".format(command, obj.validationString, command.startsWith(this.options.secondRow + '('), command.endsWith(')'), this.options.secondRow));
            }
            return true;  // keep going
          }.bind(this));
        }
      }.bind(this));
    }.bind(this));
    
    return ret;
  }
  subclasses(ValidateOnSubmit, app.backend.structures.AbstractRange);


  // ValidateCharLength
  
  function ValidateCharLengthOnSubmit(range, options) {
    ValidateCharLengthOnSubmit._super.constructor.call(this, range, options);
    this.className = 'ValidateCharLengthOnSubmit';
  }
  ValidateCharLengthOnSubmit.prototype._validate = function (validationObject) {

    validationObject.operand = parseInt(validationObject.operand);
    if (isNaN(validationObject.operand)) return false; // silently fails
    validationObject.numChars = validationObject.value.length;

    switch (validationObject.operator) {
      case '>':
        validationObject.result.result = validationObject.value.length > validationObject.operand;
        break;
        
      case '<':
        validationObject.result.result = validationObject.value.length < validationObject.operand;
        break;
        
      case '>=':
        validationObject.result.result = validationObject.value.length >= validationObject.operand;
        break;
        
      case '<=':
        validationObject.result.result = validationObject.value.length <= validationObject.operand;
        break;
        
      case '=':
        validationObject.result.result = validationObject.value.length == validationObject.operand;
        break;
        
      case '':
        // gets here with 'ignoreEmpty' or other non logical statement
        validationObject.result.result = false;
        break;
        
      default:
        // Can get here with nonlogical operations
        validationObject.result.result = false;
        break;
    }
      
    return true;
  }
  subclasses(ValidateCharLengthOnSubmit, ValidateOnSubmit);

  // ValidateNotUpper

  function ValidateNotUpper(range, options) {
    ValidateNotUpper._super.constructor.call(this, range, options);
    this.className = 'ValidateNotUpper';
  }
  ValidateNotUpper.prototype._validate = function (validationObject) {
    validationObject.result.result = validationObject.value === "" ? true : (validationObject.value != validationObject.value.toUpperCase());
    return true;
  }
  subclasses(ValidateNotUpper, ValidateOnSubmit);

  
  // ValidateCancel
  
  function ValidateCancel(range, options) {
    ValidateCancel._super.constructor.call(this, range, options);
    this.className = 'ValidateCancel';
  }
  ValidateCancel.prototype._validate = function (validationObject) {
    validationObject.result.result = (validationObject.value == "" || validationObject.value.startsWith("Undo"));

    return true;
  }
  subclasses(ValidateCancel, ValidateOnSubmit);


  // ValidateOpen
  
  function ValidateOpen(range, options) {
    ValidateOpen._super.constructor.call(this, range, options);
  }
  ValidateOpen.prototype._validate = function (validationObject) {

    // TODO: ignoreEmtpy is not implemented yet
    if (validationObject.value && validationObject.value.trim() != "") {      
      var embedObj = app.utils.getEmbedInfo(validationObject.value);
      var result = app.utils.attemptOpen(embedObj);
      validationObject.result.result = result.success;
      return true;
    } else {
      return false;
    }    
  }
  subclasses(ValidateOpen, ValidateOnSubmit);
  

  // ValidateDate 

  function ValidateDateOnSubmit(range, options) {
    ValidateDateOnSubmit._super.constructor.call(this, range, options);
    this.className = 'ValidateDateOnSubmit';
  }
  ValidateDateOnSubmit.prototype._validate = function (valObj) {

    app.options.debug && Logger.log("argument: %s, value: %s", valObj.argument, valObj.value);
    if (valObj.argument.toLowerCase()==='ignoreempty' && valObj.value.isBlank()) {
      // If it's the first validation string and it is ignoreEmpty and there is nothing there...
      // ... we want it to return empty list instead 
      valObj.result.result = true;
      return false; // short circuit...
    } else if (valObj.argument.toLowerCase()==='ignoreempty') {
      valObj.result.result = true;
      return true;
    } else {
      var compareValue = null;
      
      // if it's a column name,
      if (valObj.operand.matchesColumn()) {
        // Get the value of the column
        compareValue = app.libraries.moment(app.utils.convert2JsDate(valObj.row[5]));  // "F" = 5 TODO: calculate
      } else {
        // assume it's a script property
        compareValue = PropertiesService.getScriptProperties().getProperty(valObj.operand);
        if (compareValue) {
          compareValue = app.libraries.moment(compareValue);
        } else {
          compareValue = "<invalid date>";   // TODO: Figure out what to do here.
        }
      }

      var thisValue = app.libraries.moment(valObj.row[valObj.obj.column-1]);   // validate
      valObj.column = valObj.obj.column;
      valObj.compareValue = compareValue;
    }
    
    valObj.value = thisValue.format(app.config.dateFormats.long);
    valObj.compareValue = compareValue;

    switch (valObj.operator) {
      case '>':
        valObj.result.result = thisValue.isAfter(compareValue, "day");
        break;
        
      case '<':
        valObj.result.result = thisValue.isBefore(compareValue, "day");
        break;
        
      case '>=':
        valObj.result.result = thisValue.isAfter(compareValue, "day") || thisValue.isSame(compareValue, "day");
        break;
        
      case '<=':
        valObj.result.result = thisValue.isBefore(compareValue, "day") || thisValue.isSame(compareValue, "day");
        break;
        
      case '=':
        valObj.result.result = thisValue.isSame(compareValue, "day");
        break;
        
      case '':
        // gets here with 'ignoreEmpty' or other non logical statement
        valObj.result.result = false;
        break;

      default:
        // Can get here with nonlogical operations
        valObj.result.result = false;
        break;
    }
      
    return true;
  }
  subclasses(ValidateDateOnSubmit, ValidateOnSubmit);
  
  // ValidateIFTE 
  function ValidateIFTE(range, options) {
    ValidateIFTE._super.constructor.call(this, range, options);
    this.className = 'ValidateIFTE';
  }
  /* 
    ValidateIFTE(!G,   // detects first time through
      ValidateDate(>Archive!A3),
      ValidateIFTE(K=true,  // started
        ValidateNoChange(),
        ValidateDate(>Archive!A3)
      )
    )
  */
  ValidateIFTE.prototype._validate = function (valObj) {
    // key with milliseconds is pretty reliable... he said
    // TODO: Check that it is
    var timestamp = valObj.row[indexTimestamp];
    var uniqueId = valObj.row[indexUniqueId];
    var startDate = app.libraries.moment(valObj.row[indexStartDate]);
    var value = valObj.value instanceof Date ? app.libraries.moment(valObj.value) : valObj.value;
    var lastUpdated = app.libraries.moment(app.config.lastUpdated);

    if (valObj.argument === "ignoreAbsences") {
      if (valObj.row[indexSection] == "Absences") {
        valObj.result.result = startDate.isSame(lastUpdated, "day") || startDate.isAfter(lastUpdated, "day");
        return !(valObj.result.result);
      }
      else {
        valObj.result.result = true;
        return true;
      }
    } else if (valObj.argument === "noChangeAfterPublished") {
      var suffix = "_" + valObj.header;
      var stored = this.retrieve(uniqueId, {suffix:suffix});

      if (stored != null && (startDate.isBefore(lastUpdated, "day") || startDate.isSame(lastUpdated, "day"))) {
        var equ;
        if (app.libraries.m().isMoment(value)) equ = stored.isSame(value, "day");
        else equ = stored === value;
        
        if (equ) {
          valObj.result.result = true;
          return true;
        }
        valObj.result.result = false;
        var oldValue;
        if (app.libraries.m().isMoment(stored)) oldValue = stored.toDate();
        else oldValue = stored;
        
        valObj.obj.range.setValue(oldValue);
        valObj.stored = app.libraries.m().isMoment(stored) ? stored.format(app.config.dateFormats.long) : stored;
        return true; // how to short circuit this?
      } else {
        // Nothing to validate, so pass cleanly, store it if needed
        valObj.result.result = true;
        if (!stored) this.store(uniqueId, valObj.value, {suffix:suffix});
        return true;
      }

    } else if (valObj.argument === "firstAfterLastUpdated") {
      var suffix = "_" + valObj.header + 'X';
      var stored = this.retrieve(uniqueId, {suffix:suffix});

      if (stored != null) {
        // not the first time.
        valObj.result.result = true;
        return true;
      }

      // This is the startDate column, so am using startDate
      // TODO: Decouple that!

      // We have to see if the notice went out the same day, but before the cut off time
      var cutOffTime = app.utils.deriveCutOffTime();
      if (startDate.isAfter(cutOffTime, "hour")) {
        valObj.result.result = true;
        return true;
      }

      valObj.result.result = startDate.isAfter(lastUpdated, "day");
      valObj.operator = 'after';
      valObj.operand = lastUpdated.format(app.config.dateFormats.long);
      valObj.value = startDate.format(app.config.dateFormats.long);
      valObj.result.startDateIsAfterUpdate = startDate.isAfter(lastUpdated, "day");
      if (!valObj.result.result) valObj.obj.cancelRange.setValue(
        "System cancelled on {}: Changed {} after publication date".format(app.libraries.moment(new Date()).format(app.config.dateFormats.short), valObj.header)
      );
      if (!stored) this.store(uniqueId, valObj.value, {suffix:suffix});

    } else if (valObj.argument === 'notHoliday') {
      var holidays = app.config.holidays.map(function (v) {
        return app.libraries.moment(v).format(app.config.dateFormats.short);
      });

      // if startDate falls on a holiday, warn the user.
      if (holidays.indexOf(startDate.format(app.config.dateFormats.short)) != -1) {
        valObj.result.result = false;
      } else {
        valObj.result.result = true;
      }
      
      if (!valObj.result.result) valObj.obj.cancelRange.setValue(
        "System cancelled on {}: Start date is a holiday or weekend".format(app.libraries.moment(new Date()).format(app.config.dateFormats.short))
      );
      
      return true;
    }
      
    return true; // unknown argument, keep going
  }
  /*
    Returns the value
  */
  ValidateIFTE.prototype.retrieve = function(uniqueId, options) {
    options = options ? options : {suffix:'', prefix:''};
    if (!options.prefix) options.prefix = "";
    if (!options.suffix) options.suffix = "";
    var key = options.prefix + uniqueId + '_' + options.suffix;
    var value = app.backend.scriptPropertiesInterface.hasProperty(key) ? app.backend.scriptPropertiesInterface.getProperty(key) : null;
    if (value === null) return null;
    var ret = JSON.parse(value);
    if (!isNaN(Date.parse(ret))) ret = app.libraries.moment(new Date(ret));
    return ret;
  }
  ValidateIFTE.prototype.store = function(uniqueId, value, options) {
    options = options ? options : {suffix:'', prefix:''};
    if (!options.prefix) options.prefix = "";
    if (!options.suffix) options.suffix = "";
    var key = options.prefix + uniqueId + '_' + options.suffix;
    var newValue;
    if (value.hasOwnProperty('toISOString')) newValue = value.toISOString();
    else newValue = JSON.stringify(value);
    app.backend.scriptPropertiesInterface.setProperty(key, newValue);
  }
  subclasses(ValidateIFTE, ValidateOnSubmit);


  // ValidatePermissions 

  function ValidatePermissions(range, options) {
    ValidatePermissions._super.constructor.call(this, range, options);
    this.className = 'ValidatePermissions';
  }
  ValidatePermissions.prototype._validate = function (valObj) {
    // this assumes there is definitely a comma...
    // gets the list of people who have permissions
    var split = valObj.argument.split(",");
    var section = split[0].trim();
    if (valObj.value.startsWith(section)) {
      var permissionsRange = split[1];
      permissionsRange = app.backend.sheetsInterface.getThisSpreadsheet().getRange(permissionsRange);
      permissionsRange = app.backend.sheetsInterface.getThisSpreadsheet().getRange(permissionsRange.getValue());
      var permittedPeople = app.backend.sheetsInterface.rangeValuesToArray(permissionsRange);
      var user = valObj.row[indexUsername];
      valObj.result.result = permittedPeople.indexOf(user) !== -1; //TODO: case insensitive
      if (!valObj.result.result) valObj.obj.cancelRange.setValue(
        "System cancelled on {}: No permission for {}".format(app.libraries.moment(new Date()).format(app.config.dateFormats.short), valObj.header)
       );
    } else {
      valObj.result.result = true;
    }
    return true;
  }
  subclasses(ValidatePermissions, ValidateOnSubmit);

  app.backend.validate = {
  
    validationsOnSubmit: function(e) {
      var validateCancel = (new ValidateCancel(e.range, {secondRow: "ValidateCancel"})).validate();
      var validatePermissions = (new ValidatePermissions(e.range, {secondRow: "ValidatePermissions"})).validate();
      var validateIFTE = (new ValidateIFTE(e.range, {secondRow: "ValidateIFTE"})).validate();
      var validateDates = (new ValidateDateOnSubmit(e.range, {secondRow: "ValidateDate"})).validate();
      var validateCharLengths = (new ValidateCharLengthOnSubmit(e.range, {secondRow: "ValidateCharLength"})).validate();
      var validateNotUpper = (new ValidateNotUpper(e.range, {secondRow: "ValidateNotUpper"})).validate();
      var validateOpen = (new ValidateOpen(e.range, {secondRow: "ValidateOpen"})).validate();

      // merge the arrays into one
      return [].concat.apply([], [validateCancel,validatePermissions, validateIFTE,validateDates,validateCharLengths,validateNotUpper,validateOpen]);
    },

    test_validateDateOnSubmit: function(e) {
      var abRange = new app.backend.structures.AbstractRange(e.range);
      abRange.extraHeaders.forEach(function (item) {
        if (!item.isBlank()) {
          var command = item.slice(0, item.indexOf('('));
          Logger.log("item: {}, command: {}".format(item, command));
        }
      });
      
    }

  }
}