function initStructures() {

  function AbstractRange(range, options) {
    this.options = typeof options !== 'undefined' ? options : {};
    this.range = range;
    this.initSheet();
    this.numHeaderRows = this.options.numHeaderRows || this.sheet.getFrozenRows() || this.defaultNumHeaderRows();
    this.initHeaders();
    this.initValues();
  
    // Store any extra headers in extraHeaders and make this.headers correct
    this.extraHeaders = null;
    if (this.headers.length > 1) this.extraHeaders = this.headers.slice(1)[0];
    this.headers = this.headers[0];
    this.initObjects();
    // For iteration:
    this._curRow = 0;
    this._curCol = 0;    
  }
  AbstractRange.prototype.defaultNumHeaderRows = function () {
    return 1;
  }
  AbstractRange.prototype.getDataRange = function () {
    return this.range.getSheet().getDataRange();
  }
  AbstractRange.prototype.getDataWithoutHeaders = function () {
    return this.range.getSheet().getDataRange();
    //var dataRange = this.getDataRange();
    //return this.getDataRange.getSheet().getRange(
  }
  AbstractRange.prototype.getColumnValuesFromDataRange = function (columnIndex) {
    var ret = [];
    this.getDataWithoutHeaders().getValues().forEach(function (row) {
      ret.push(row[columnIndex]);
    });
    return ret;
  }
  AbstractRange.prototype.isEmpty = function () {
    return this.range.getValues().every(function (row) { return row.every(function (elem) { return elem===""; }); });
  }
  AbstractRange.prototype.getBeyondRange = function () {
    var sheet = this.range.getSheet();
    return sheet.getRange(this.range.getRow(), this.range.getLastColumn()+1, 1, sheet.getLastColumn());
  }
  AbstractRange.prototype.beyondIsEmpty = function () {
    return this.getBeyondRange().getValues().every(function (row) { return row.every(function (elem) { return elem ===""; }) });
  }
  AbstractRange.prototype.next = function () {
    var curRow = this._curRow;
    var curCol = this._curCol;
    this._curCol += 1;
    if (this._curCol >= this.values[0].length) {
      this._curRow += 1;
      this._curCol = 0;
    }
    if (this.values[curRow] && this.values[curRow][curCol]) return this.values[curRow][curCol];
    return null;
  }
  AbstractRange.prototype.initSheet = function () {
    this.sheet = this.range.getSheet();
  }
  AbstractRange.prototype.initHeaders = function () {
    this.headers = this.sheet.getRange(1, this.range.getColumn(), this.numHeaderRows, this.range.getLastColumn()).getValues();
  }
  AbstractRange.prototype.initValues = function () {
    this.values = this.range.getValues();
  }
  AbstractRange.prototype.initObjects = function () {
    this.objects = [];
    this.values.forEach(function (row, rowIndex) {
      var rangeObject = {};
      this.headers.forEach(function (header, headerIndex) {
        rangeObject[header] = row[headerIndex];
      }.bind(this));
      this.objects.push(rangeObject);
    }.bind(this));
  }

  app.backend.structures = {AbstractRange: AbstractRange};

}

