
function initFilldowns() {

  // FillDown classes that make it easy to write such things :)

  function FillDownOnSubmit(range, options) {
    FillDownOnSubmit._super.constructor.call(this, range, options);
  }
  FillDownOnSubmit.prototype.initObjects = function () {
    this.objects = [];
  
    // initial values for looping through headers
    var lastColumnInRange = this.range.getLastColumn();
    var lastColumnInSheet = this.sheet.getLastColumn();
    this.beyondHeaders = this.sheet.getRange(1, lastColumnInRange+1, this.numHeaderRows, lastColumnInSheet).getValues();
    this.beyondHeaders.forEach(function (headerRow, headerRowIndex) {
      headerRow.forEach(function (header, headerIndex) {
        if (this.passes(header, headerRowIndex, headerIndex)) {
          var column = lastColumnInRange + headerIndex + 1;
          obj = {
            column: column,
            source: this.sheet.getRange(this.numHeaderRows+1, column),
          }
          this.objects.push(obj);
        }
      }.bind(this));
    }.bind(this));
  }
  FillDownOnSubmit.prototype.passes = function (header, headerRowIndex, headerIndex) {
    if (this.options.hasOwnProperty('secondRow')) {
      return headerRowIndex == 1 && header === this.options.secondRow;
    }
    return header !== '';
  }
  FillDownOnSubmit.prototype.fillDown = function () {
    this.values.forEach (function (row, rowIndex) {
      this.objects.forEach(function (obj) {
        var row = this.range.getRow()+rowIndex;
        if (row > this.numHeaderRows+1) {
          var dest = this.sheet.getRange(row, obj.column);
          obj.source.copyTo(dest);
        }
      }.bind(this));
    }.bind(this));
  }
  subclasses(FillDownOnSubmit, app.backend.structures.AbstractRange);
  
  function UniqueIdOnSubmit(range, options) {
    UniqueIdOnSubmit._super.constructor.call(this, range, options);  
  }
  UniqueIdOnSubmit.prototype.fillDown = function () {
    // FIXME: Cannot test for this.beyondIsEmpty() because 
    this.values.forEach (function (row, rowIndex) {
      this.objects.forEach(function (obj) {
        
        // Find the highest number in the columns
        // but do it, assuming that there is bad data
        var values = this.getColumnValuesFromDataRange(obj.column-1).
        filter(function (v, i, a) {  // filter out NaNs, but isNaN("") returns false, so filter out ""s too
          return v!=="" && !isNaN(v);
        });
        var newId = Math.max.apply(Math, values)+1;
        
        var here = this.sheet.getRange(this.range.getRow()+rowIndex, obj.column);
        if (here.getValue() === "") here.setValue(newId).setNumberFormat('00000');
        
      }.bind(this));
    }.bind(this));
  }
  subclasses(UniqueIdOnSubmit, FillDownOnSubmit);
  
  app.backend.filldowns = {
    fillDownOnSubmit: function(e) {
      (new FillDownOnSubmit(e.range, {secondRow: "FillDown"})).fillDown();
    },
    uniqueIdOnSubmit: function(e) {
      (new UniqueIdOnSubmit(e.range, {secondRow: "UniqueID"})).fillDown();
    },
    
    /* 
      Gets all the form responses, makes a map of them with the timestamp as the key
      Then returns the edit response URLs for that one
      @param {responsesRange} The responses to process as a range (can be used in "on submit" trigger)
      @param {timestampCol} integer (probably 0) which holds the timestamp info
      @param {colToWrite} integer of the column number to write to (the row used is calculated)
    */
    assignEditUrl: function(responsesRange, formId, timestampCol, colToWrite) {  
      var form = FormApp.openById(formId);
      var data = responsesRange.getValues();

      var responses = form.getResponses();
      var resultUrls = [];

      // Make a object map of the data, that way we don't have to assume it is sorted
      var timestampUrlMap = responses.reduce(function (obj, response, index, arr) { 
        obj[response.getTimestamp().setMilliseconds(0)] = response.getEditResponseUrl();
        return obj;
      }, {});
      
      app.options.debug && Logger.log(data);

      data.forEach(function (row, index, arr) {
        resultUrls.push([row[timestampCol] ? timestampUrlMap[row[timestampCol].setMilliseconds(0)] : '']);
      });

      // writes the data
      responsesRange.getSheet().getRange(responsesRange.getRow(), colToWrite, resultUrls.length).setValues(resultUrls);  
    }
  }
}




