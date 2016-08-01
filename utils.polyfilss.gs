// Augment String with useful functions

if (typeof String.prototype.isBlank !== 'function') {
  String.prototype.isBlank = function () {
    return this.trim() === "";
  }
}

if (typeof Date.prototype.isBlank !== 'function') {
  Date.prototype.isBlank = function () {
    return false;
  }
}

if (typeof String.prototype.toTitleCaseString !== 'function') {
  String.prototype.toTitleCase = function () {
    return this.replace(/\w(\S|$)*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  }
}

if (typeof String.prototype.shortNameToLongName !== 'function') {
  String.prototype.shortNameToLongName = function () {
    return (this.split('-').join(' '));
  }
}

// Polyfill https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return searchString ? this.substr(position, searchString.length) === searchString : false;
  };
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}

if (!String.prototype.matchesColumn) {
  String.prototype.matchesColumn = function() {
    return this.match('^[A-Za-z]+$') && this.match('^[A-Za-z]+$').join("").split(this.charAt(0)).length == this.length+1;
  }
}