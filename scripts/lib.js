// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

Array.prototype.lowerBound = function(v, cmp) {
  cmp = cmp || function(l, r) { return l - r; };
  var lo = 0, hi = this.length;
  while (lo != hi) {
    var mid = Math.floor((lo + hi) / 2);
    var x = cmp(this[mid], v);
    if (x < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo == this.length ? -1 : lo;
}

function injectScript(document, func) {
  var script = document.createElement('script');
  script.textContent = '(' + func + ')(' + JSON.stringify(Array.prototype.slice.call(arguments, 2)) + ')';
  (document.head || document.documentElement).appendChild(script);
  script.parentNode.removeChild(script);
}
function injectScriptFile(document, file) {
  var script = document.createElement('script');
  script.src = file;
  (document.head || document.documentElement).appendChild(script);
  script.parentNode.removeChild(script);
}

var logDepth = 0;
function logWrapper(name, pre, post) {
  return function (func) {
    var args = [].slice.call(arguments, 1);
    pre(args);
    logDepth++;
    var ret = func.apply(this, args);
    logDepth--;
    post(ret);
    return ret;
  };
}

function decorate(name, func) {
  var base = window;
  var path = name.split('.');
  for (var i = 0; i < path.length - 1; i++)
    base = base[path[i]];
  path = path[path.length - 1];

  base[path] = (function(old) { return function () {
        return func.apply(this, [old].concat([].slice.apply(arguments)));
      };
    })(base[path]);
}

function decorateRecursive(name, func) {
  window[name] = (function(old) { return function () {
        var self = window[name];
        // TODO: make this safer
        window[name] = old;
        var ret = func.apply(this, [old].concat([].slice.apply(arguments)));
        window[name] = self;
        return ret;
      };
    })(window[name]);
}

function loggingDecorator(name) {
  decorate(name, logWrapper(name, 
        function(args) {
          console.log(Array(logDepth + 1).join('_'), name, args);
        },
        function(ret) {
          console.log(Array(logDepth + 1).join('_'), name, ret);
        }));
}

function timingDecorator(name) {
  var start;
  decorate(name, logWrapper(name, 
        function() {
          start = performance.now();
          var args = [].slice.call(arguments, 1);
          console.log(Array(logDepth + 1).join('_'), name, 'start: ' + start);
        },
        function(ret) {
          end = performance.now();
          console.log(Array(logDepth + 1).join('_'), name, 'end: ' + end, 'elapsed: ' + (end - start));
        }));
}

function sendCustomEvent(name, details, doc) {
  doc = doc || document;
  var ev = doc.createEvent('CustomEvent');
  ev.initCustomEvent(name, false, false, details);
  doc.dispatchEvent(ev);
}

if (chrome.extension) {
  injectScriptFile(document, chrome.extension.getURL('scripts/lib.js'));
}

// http://stackoverflow.com/a/4673436
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

if (!String.prototype.kwformat) {
  String.prototype.kwformat = function(kwargs) {
    return this.replace(/{([^}]*)}/g, function(match, kw) {
      return typeof kwargs[kw] != 'undefined'
        ? kwargs[kw]
        : match;
    });
  }
}

// Decorate the chrome.storage API to validate settings usage against the
// manifest, and add some functionality.
if (chrome.extension) {
  (function decorateChromeApis() {
    var keys = Object.keys(manifest.settings);
    function validateKeys(obj) {
      if (!$.isArray(obj) && !$.isPlainObject(obj)) {
        obj = [obj];
      }
      $.each(obj, function(k) {
        k = $.isNumeric(k) ? obj[k] : k;
        if (keys.indexOf(k) < 0) {
          var keysString = "Available keys: <";
          $.each(keys, function(k) { keysString += " " + keys[k]; });
          keysString += " >";
          throw new Error(k + " not a valid key. " + keysString);
        }
      });
      return obj;
    }

    (function(chromeEvent) {
      var fn = chromeEvent.addListener;
      chromeEvent.addListener = function(callback, filter) {
        if (filter) filter = validateKeys(filter);
        else filter = keys;
        return fn.call(chromeEvent, function(items) {
          var filtered_items = {};
          $.each(items, function(i) {
            if (keys.indexOf(i) > 0 && filter.indexOf(i) > 0)
              filtered_items[i] = keys[i];
          });
          if (filtered_items) {
            callback(filtered_items);
          }
        });
      };
    })(chrome.storage.onChanged);

    function decorateGet(storageArea) {
      var fn = storageArea.get;
      storageArea.get = function(keys, callback) {
        keys = validateKeys(keys);
        var keysWithDefaults = {};
        $.each(keys, function(k) {
          k = $.isNumeric(k) ? keys[k] : k;
          keysWithDefaults[k] = manifest.settings[k].default;
        });
        return fn.call(storageArea, keysWithDefaults, callback);
      };
    };
    decorateGet(chrome.storage.local);
    decorateGet(chrome.storage.sync);

    function decorateSet(storageArea) {
      var fn = storageArea.set;
      storageArea.set = function(items, cb) {
        // Ensure values are valid for the type.
        $.each(items, function(k) {
          var val = items[k];
          var setting = manifest.settings[k];
          var type = setting.type;
          switch (type) {
            case 'bool':
              if (typeof val != 'boolean') {
                throw new Error('<' + val + '> is not a bool');
              }
              break;
            case 'dropdown':
              if (typeof val != 'string') {
                throw new Error('<' + val + '> is not a string');
              }
              if (setting.values.indexOf(val) < 0) {
                throw new Error(val + ' is not a valid value for ' + k + '.');
              }
              break;
            case 'string':
              break;
            case 'dict':
              break;
            case 'number':
              break;
            case 'list':
              break;
            default:
              throw new Error('Unrecognized type: ' + type);
          }
        });
        return fn.call(storageArea, items, cb);
      }
    }
    decorateSet(chrome.storage.local);
    decorateSet(chrome.storage.sync);
  })();
}
