// Taken from davidchamber's string-format
// https://github.com/davidchambers/string-format
// Slight modifications for use in google apps script environment

// To use, simply:
// "Hello, {}".format('world');
// or
// "Hello, {key}".format({key:'world'});

(function(global) {

  //  ValueError :: String -> Error
  var ValueError = function(message) {
    var err = new Error(message);
    err.name = 'ValueError';
    return err;
  };

  //  defaultTo :: a,a? -> a
  var defaultTo = function(x, y) {
    return y == null ? x : y;
  };

  //  create :: Object -> String,*... -> String
  var create = function(transformers) {
    return function(template) {
      var args = Array.prototype.slice.call(arguments, 1);
      var idx = 0;
      var state = 'UNDEFINED';

      return template.replace(
        /([{}])\1|[{](.*?)(?:!(.+?))?[}]/g,
        function(match, literal, key, xf) {
          if (literal != null) {
            return literal;
          }
          if (key.length > 0) {
            if (state === 'IMPLICIT') {
              throw ValueError('cannot switch from ' +
                               'implicit to explicit numbering');
            }
            state = 'EXPLICIT';
          } else {
            if (state === 'EXPLICIT') {
              throw ValueError('cannot switch from ' +
                               'explicit to implicit numbering');
            }
            state = 'IMPLICIT';
            key = String(idx);
            idx += 1;
          }
          var value = defaultTo('', lookup(args, key.split('.')));

          if (xf == null) {
            return value;
          } else if (Object.prototype.hasOwnProperty.call(transformers, xf)) {
            return transformers[xf](value);
          } else {
            throw ValueError('no transformer named "' + xf + '"');
          }
        }
      );
    };
  };

  var lookup = function(obj, path) {
    if (!/^\d+$/.test(path[0])) {
      path = ['0'].concat(path);
    }
    for (var idx = 0; idx < path.length; idx += 1) {
      var key = path[idx];
      obj = typeof obj[key] === 'function' ? obj[key]() : obj[key];
    }
    return obj;
  };

  //  format :: String,*... -> String
  var format = create({});

  //  format.create :: Object -> String,*... -> String
  format.create = create;

  //  format.extend :: Object,Object -> ()
  format.extend = function(prototype, transformers) {
    var $format = create(transformers);
    prototype.format = function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(this);
      return $format.apply(global, args);
    };
  };

  // Do not pollute the global namespace, seems like a bad idea
  //global.format = format;
  
  // ...instead we will polyfill the String.protype, but you may want to modify this
  // for the use of transformers
  format.extend(String.prototype);

}.call(this, this));


