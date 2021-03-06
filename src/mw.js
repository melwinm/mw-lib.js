/**
 * @class mw-lib name space.
 * @author Joerg Basedow <jbasedow@mindworks.de>
 */
var MW = {};

/**
 * @class Static class for utility methods.
 * @author Joerg Basedow <jbasedow@mindworks.de>
 */
MW.Util = {
  /**
   * Generate a random string of length "length" containing only numbers. If no
   * "length" given, default length of 13 is assumed.
   *
   * @param {Integer} length
   * @return {String}
   */
  generateRandomNumberString : function(length) {
    length = length || 13;
    return String(Math.random()).substring(2, 2 + length);
  },
  /**
   * Gets the first key for an element from an object if contained, false
   * otherwise.
   *
   * @param {Object.<String, mixed>} anObject
   * @param {mixed} anElement
   * @return {(String|false)}
   */
  getKeyForElementFromObject : function(anObject, anElement) {
    var foundKey = false;
    for (var aKey in anObject) {
      if (anObject[aKey] == anElement) {
        foundKey = aKey;
        break;
      }
    }
    return foundKey;
  },

  /**
   * Remove all Linebreaks (\n, \r\n, \r) from the given string.
   *
   * @param {String} string
   * @return {String}
   */
  removeLineBreaks : function(string) {
    return string.replace(/(\r|\n)/g, '');
  }
};

/**
 * @class Convenience class to merge placeholders into a template string.
 * @author Joerg Basedow <jbasedow@mindworks.de>
 * @constructor
 * @param {String} template
 */
MW.Template = function(template) {
  this._template = template || '';
};
MW.Template.prototype = {
  /**
   * Merge placeholders into the template string.
   *
   * @param {Object.<String, String>} placeholders
   * @return {String}
   */
  render : function(placeholders) {
    var placeholders = placeholders || {};
    return this._template.replace(
      /#\{([^{}]*)\}/gi,
      function(completeMatch, placeholderName) {
        return MW.Template.cleanPlaceholder(placeholders[placeholderName]);
      }
    );
  }
};
/**
 * Check if a placeholder is a string or a number.
 *
 * @param {mixed} placeholder
 * @return {Boolean}
 */
MW.Template.isValidPlaceholder = function(placeholder) {
  return typeof placeholder in {'string' : 1, 'number' : 1};
};

/**
 * Make a placeholder an empty string, if it is not a string or a number.
 *
 * @param {mixed} placeholder
 * @return {String}
 */
MW.Template.cleanPlaceholder = function(placeholder) {
  if (!MW.Template.isValidPlaceholder(placeholder)) {
    placeholder = '';
  }
  return String(placeholder);
};

/**
 * @class Service container to manage object dependencies.
 * @author Joerg Basedow <jbasedow@mindworks.de>
 * @constructor
 */
MW.ServiceContainer = function() {
  this._services = {};
  this._cache = {};
}
MW.ServiceContainer.prototype = {
    /**
     * Add a service factory to the container.
     *
     * @param {String} serviceName
     * @param {Function} factory
     */
    set : function(serviceName, factory) {
        this._services[serviceName] = factory;
    },
    /**
     * Add a service factory to the container.
     *
     * @param {String} serviceName
     * @return {Mixed} Service with all its dependencies
     */
    get : function(serviceName) { // TODO: allow non singleton
        if(!this._cache[serviceName]) {
            this._cache[serviceName] = this._services[serviceName](this);
        }
        return this._cache[serviceName];
    }
}

/**
 * @class Event dispatcher decoupling the event handlers from the objects where
 *   an event is triggered.
 * @author Joerg Basedow <jbasedow@mindworks.de>
 * @constructor
 */
MW.EventDispatcher = function() {
  this._eventHandlers = {};
};
MW.EventDispatcher.prototype = {

  /**
   * Register an event handler for an event name.
   *
   * @param {String} eventName
   * @param {Function} eventHandler
   * @param {String} executionTime Optional parameter to make given handler be
   *   executed first or last, when event is triggered.
   */
  on : function(eventName, eventHandler, executionTime) {
    if (executionTime !== MW.EventDispatcher.ExecutionTimes.FIRST && executionTime !== MW.EventDispatcher.ExecutionTimes.LAST) {
      executionTime = MW.EventDispatcher.ExecutionTimes.DEFAULT;
    }
    if (!typeof eventHandler == 'function') {
      throw {
        name : 'InvalidArgumentException',
        message : '"' + eventHandler + '" is not a valid event handler.'
      };
    }
    if (!this._eventHandlers[eventName]) {
      this._eventHandlers[eventName] = {};
    }
    if (!this._eventHandlers[eventName][executionTime]) {
      this._eventHandlers[eventName][executionTime] = [];
    }
    this._eventHandlers[eventName][executionTime].push(eventHandler);
  },

  /**
   * Remove the event handlers for an event name.
   *
   * @param {String} eventName
   */
  clear : function(eventName) {
    this._eventHandlers[eventName] = {};
  },

  /**
   * Trigger an event and notify the event handlers.
   *
   * @param {String} eventName
   * @param {mixed} context Object in whose context the event was thrown.
   * @param {mixed} info Additional event information
   */
  trigger : function(eventName, context, info) {
    if (this._eventHandlers[eventName]) {
      var flatList = this._eventHandlers[eventName][MW.EventDispatcher.ExecutionTimes.FIRST] || [];
      flatList = flatList.concat(this._eventHandlers[eventName][MW.EventDispatcher.ExecutionTimes.DEFAULT] || []);
      flatList = flatList.concat(this._eventHandlers[eventName][MW.EventDispatcher.ExecutionTimes.LAST] || []);
      for (var anIndex = 0; anIndex < flatList.length; anIndex++) {
        flatList[anIndex](context, info);
      }
    }
  }
};
/**
 * Execution time constants
 *
 * @type {Object.<String, String>}
 * @const
 */
MW.EventDispatcher.ExecutionTimes = {
  FIRST : 'first',
  DEFAULT : 'default',
  LAST : 'last'
};

/**
 * @class Service for logging messages with log levels. Only entries are logged
 *        that have a log level higher or equal than the log level configured in
 *        the logger.
 * @author Joerg Basedow <jbasedow@mindworks.de>
 * @constructor
 * @param {Integer} logLevel
 */
MW.Logger = function(logLevel) {
  this._logEntries = [];
  this._logLevel = MW.Logger.Levels.WARNING;

  this.setLogLevel(logLevel);
};
MW.Logger.prototype = {

  /**
   * Creates log entry.
   *
   * @param {String} message
   * @param {Integer} level
   */
  log : function(message, level) {
    if (this._logLevel != MW.Logger.Levels.NOLOG && MW.Logger.isValidLevel(level) && level >= this._logLevel) {
      this._logEntries.push(new MW.LogEntry(message, level));
    }
  },

  /**
   * Set current log level.
   *
   * @param {Integer} level One of MW.Logger.Levels
   */
  setLogLevel : function(level) {
    if (MW.Logger.isValidLevel(level)) {
      this._logLevel = level;
    }
  },

  /**
   * Get current log level.
   *
   * @return {Integer} One of MW.Logger.Levels
   */
  getLogLevel : function() {
    return this._logLevel;
  },

  /**
   * Get current log level name.
   *
   * @return {String} Name of the current log level.
   */
  getLogLevelAsString : function() {
    return MW.Logger.getStringForLogLevel(this.getLogLevel());
  },

  /**
   * Get log as String.
   *
   * @return {String}
   */
  toString : function() {
    return this._stringify(this.getLogEntries());
  },

  /**
   * Get log entries which log level is at least as high as the configured log
   * level as Array.
   *
   * @return {Array.<String>} Array of log strings (Level: message).
   */
  getLogEntries : function() {
    var log = [];
    for (var anIndex = 0; anIndex < this._logEntries.length; anIndex++) {
      var anEntry = this._logEntries[anIndex];
      log.push(anEntry.toString());
    }
    return log;
  },

  /**
   * Convert array of log entries to single new line separated string.
   *
   * @private
   * @param {Array.<MW.LogEntry>} entries
   * @return {String}
   */
  _stringify : function(entries) {
    var logString = '';
    for (var i = 0; i < entries.length; i++) {
      logString += entries[i].toString() + "\n";
    }
    return logString;
  }
};

/**
 * Log levels
 *
 * @type {Object.<String, Integer>}
 * @const
 */
MW.Logger.Levels = {
  NOLOG     :  0,
  DEBUG     : 10,
  INFO      : 20,
  NOTICE    : 30,
  WARNING   : 40,
  ERROR     : 50,
  CRITICAL  : 60,
  ALERT     : 70,
  EMERGENCY : 80
};

/**
 * Checks if the given level is allowed.
 *
 * @param {Integer} level
 * @return {Boolean}
 */
MW.Logger.isValidLevel = function(level) {
  return MW.Util.getKeyForElementFromObject(MW.Logger.Levels, level);
};

/**
 * Get log level for given string.
 *
 * @param {String} levelAsString
 * @return {Integer} the log level (one of MW.Logger.Levels), default: NOLOG
 *
 */
MW.Logger.getLogLevelForString = function(levelAsString) {
  var levels = MW.Logger.Levels;
  var lvl = levels.NOLOG;
  for (var aLevelName in levels) {
    if (levelAsString.toUpperCase() == aLevelName) {
      lvl = levels[aLevelName];
    }
  }
  return lvl;
};

/**
 * Get log level for given string.
 *
 * @param {Integer} level
 * @return {String} Name of the log level
 *
 */
MW.Logger.getStringForLogLevel = function(level) {
  var levels = MW.Logger.Levels;
  var levelAsString = '';
  for (var aLevelName in levels) {
    if (level == levels[aLevelName]) {
      levelAsString = aLevelName;
    }
  }
  return levelAsString;
};

/**
 * @class Container for log entry data (log message and log level).
 * @author Joerg Basedow <jbasedow@mindworks.de>
 * @constructor
 * @param {String} message
 * @param {Integer} level
 */
MW.LogEntry = function(message, level) {
  this._message = MW.Util.removeLineBreaks(message);
  if (!MW.Logger.isValidLevel(level)) {
    level = MW.Logger.Levels.INFO;
  }
  this._level = level;
};
MW.LogEntry.prototype = {

  /**
   * Get string representation of Log Entry
   *
   * @param {Integer} level
   * @return {String}
   */
  toString : function() {
    var levelAsString = MW.Util.getKeyForElementFromObject(MW.Logger.Levels, this._level);
    return levelAsString + ': ' + this._message;
  },

  /**
   * Get log level of entry.
   *
   * @return {Integer}
   */
  getLevel : function() {
    return this._level;
  }
};

/**
 * @class Wrapper for window object (window.location, window.document.cookie etc.).
 * @author Joerg Basedow <jbasedow@mindworks.de>
 * @constructor
 * @param {Object.<String, Object>} window
 */
MW.Window = function(window) {
  window = window || {};
  this.setLocation(window.location);
  this.setDocument(window.document);
};
MW.Window.prototype = {

  /**
   * Set location implementation (i.e. window.location). Copys of the sub
   * properties are stored to clone the original so we do not accidental tamper
   * with the original.
   *
   * @param {Object.<String, String>} location
   */
  setLocation : function(location) {
    location = location || {};
    this._location = {};
    this._location.path        = this._cleanString(location.pathname);
    this._location.queryString = this._cleanString(location.search);
    this._location.host        = this._cleanString(location.hostname);

    this._cachedSearchHash = null;
  },

  /**
   * Set document implementation (i.e. document).
   *
   * @param {Object} document
   */
  setDocument : function(document) {
    this._document = document || {};
  },

  /**
   * Get the path of the page url.
   *
   * @return {String}
   */
  getPath : function() {
    return this._location.path;
  },

  /**
   * get the host of the page url.
   *
   * @return {String}
   */
  getHost : function() {
    return this._location.host;
  },

  /**
   * Split the query string to a hash containing name => value pairs.
   *
   * @private
   */
  _splitQueryString : function() {
    if (this._cachedSearchHash === null) {
      this._cachedSearchHash = {};
      if (MW.Window.isValidQuerySting(this._location.queryString)) {
        var queryString = this._location.queryString.substring(1);
        var parameters = queryString.split('&');
        for (var anIndex = 0; anIndex < parameters.length; anIndex++) {
          var pair = parameters[anIndex].split('=');
          this._cachedSearchHash[pair[0]] = pair[1];
        }
      }
    }
  },

  /**
   * Convert value to empty string, if no string given.
   *
   * @private
   * @param {mixed} value
   * @return {String}
   */
  _cleanString : function(value) {
    return typeof value === 'string' ? value : '';
  },

  /**
   * Get cookie with given name.
   *
   * @param {String} cookieName
   * @return {String} the cookie value
   */
  getCookie : function(cookieName) {
    var cookieValue = "";
    if (cookieName !== "")
    {
      var cookie = "" + this._document.cookie;
      var indexBegin = cookie.indexOf(cookieName);
      if (indexBegin != -1)
      {
        var indexEnd = cookie.indexOf(';', indexBegin);
        if (indexEnd == -1)
        {
          indexEnd = cookie.length;
        }
        cookieValue = unescape(
          cookie.substring(indexBegin + cookieName.length + 1, indexEnd));
      }
    }
    return cookieValue;
  },

  /**
   * Set given value for cookie with given name.
   *
   * @param {String} cookieName
   * @param {String} cookieValue
   */
  setCookie : function(cookieName, cookieValue) {
    this._document.cookie = cookieName + '=' + cookieValue;
  },

  /**
   * Delete cookie with given name.
   *
   * @param {String} cookieName
   */
  deleteCookie : function(cookieName) {
    this._document.cookie = cookieName + "=; expires= Thu, 01-Jan-1970 00:00:01 GMT;";
  },

  /**
   * Get the value corresponding the given "name" or undefined if parameter is
   * not set.
   *
   * @param {String} parameterName
   * @return {String} Query parameter.
   */
  getQueryParameter : function(parameterName) {
    this._splitQueryString();
    return this._cachedSearchHash[parameterName];
  },

  /**
   * Simple dom element selector faking rudimentary jQuery like functionality
   * normalizing the result to alwys be an array/iterable.
   *
   * @param {String} selector
   * @return {Array.<DomElement>}
   */
  $ : function(selector) {
    if (typeof selector != 'string') {
      return [];
    }
    if (selector[0] == '#') {
      return [this._document.getElementById(selector.slice(1))];
    }
    if (selector[0] == '.') {
      return this._document.getElementsByClassName(selector.slice(1));
    }
    return this._document.getElementsByTagName(selector);
  }
};

/**
 * Check if given query string has proper format (i.e. ?x=y&z=1).
 *
 * @param {String} A query string
 * @return {Boolean} true if query string matches pattern, false else
 */
MW.Window.isValidQuerySting = function(string) {
  return string.match(/^\?(\w+=[^&=]*)(&(\w+=[^&=]*))*$/);
};
