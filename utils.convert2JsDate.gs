// Provides utility function that makes it more dependable

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
function convert2JsDate( value ) {
  var jsDate = new Date();  // default to now
  if (value) {
    // If we were given a date object, use it as-is
    if (typeof value === 'date' || typeof value === 'object') {
      jsDate = value;
    }
    else {
      if (typeof value === 'number') {
        // Assume this is spreadsheet "serial number" date
        var daysSince01Jan1900 = value;
        var daysSince01Jan1970 = daysSince01Jan1900 - 25569 // 25569 = days TO Unix Time Reference
        var msSince01Jan1970 = daysSince01Jan1970 * 24 * 60 * 60 * 1000; // Convert to numeric unix time
        var timezoneOffsetInMs = jsDate.getTimezoneOffset() * 60 * 1000;
        jsDate = new Date( msSince01Jan1970 + timezoneOffsetInMs );
      }
      else if (typeof value === 'string') {
        // Hope the string is formatted as a date string
        jsDate = new Date( value );
      }
    }
  }
  return jsDate;
}