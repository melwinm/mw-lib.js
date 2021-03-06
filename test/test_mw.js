module('MW.Util');

test('testGenerateRandomNumberString', function() {
  ok(MW.Util.generateRandomNumberString().match('^\\d{13}$'), 'Random number with default length generated.');
  ok(MW.Util.generateRandomNumberString(6).match('^\\d{6}$'), 'Random number with custom length generated.');
});

test('testGetKeyForElementFromObject', function() {
  equal(MW.Util.getKeyForElementFromObject({ aKey : 'anElement'}, 'anElement'), 'aKey');
  equal(MW.Util.getKeyForElementFromObject({ aKey : 'anElement'}, 'nonExistingElement'), false);
  equal(MW.Util.getKeyForElementFromObject({}, 'void'), false);
  equal(MW.Util.getKeyForElementFromObject({ aKey : 'anElement', anotherKey : 'anElement'}, 'anElement'), 'aKey');
});

test('testRemoveLineBreaks', function() {
  equal(MW.Util.removeLineBreaks('text\ntext'), 'texttext');
  equal(MW.Util.removeLineBreaks('text\r\ntext'), 'texttext');
  equal(MW.Util.removeLineBreaks('text\rtext'), 'texttext');
  equal(MW.Util.removeLineBreaks('text\n\ntext'), 'texttext');
});

module('MW.Template');

test('testIsValidPlaceholder', function() {
  // nth: use data provider
  ok(MW.Template.isValidPlaceholder('aPlaceholder'), 'String is valid.');
  ok(MW.Template.isValidPlaceholder(666), 'Integer is valid.');
  ok(MW.Template.isValidPlaceholder(''), 'Empty string is valid.');
  ok(MW.Template.isValidPlaceholder(0), 'Zero is valid.');
  ok(MW.Template.isValidPlaceholder(-10), 'Negative integer is valid.');
  ok(MW.Template.isValidPlaceholder(3.1415), 'Float is valid.');

  ok(!MW.Template.isValidPlaceholder({}), 'Object is invalid.');
  ok(!MW.Template.isValidPlaceholder([]), 'Array is invalid.');
  ok(!MW.Template.isValidPlaceholder(null), 'Null is invalid.');
  ok(!MW.Template.isValidPlaceholder(function(){}), 'Function is invalid.');
});

test('testCleanPlaceholder', function() {
  equal(MW.Template.cleanPlaceholder('aPlaceholder'), 'aPlaceholder', 'No cleaning needed for a string.');
  equal(MW.Template.cleanPlaceholder(666), '666', 'Integer was cleaned to a string.');
  equal(MW.Template.cleanPlaceholder(''), '', 'No cleaning needed for an empty string.');
  equal(MW.Template.cleanPlaceholder(0), '0', 'Zero was cleaned to a string.');
  equal(MW.Template.cleanPlaceholder(-10), '-10', 'Negative integer was cleaned to a string.');
  equal(MW.Template.cleanPlaceholder(3.1415), '3.1415', 'Float was cleaned to a string.');

  equal(MW.Template.cleanPlaceholder({}), '', 'Object was cleaned to an empty string.');
  equal(MW.Template.cleanPlaceholder([]), '', 'Array was cleaned to an empty string.');
  equal(MW.Template.cleanPlaceholder(null), '', 'NULL was cleaned to an empty string.');
  equal(MW.Template.cleanPlaceholder(function(){}), '', 'Function was cleaned to an empty string.');
});

test('testTemplate', function() {
  var templatePattern = 'my template #{start} #{middle} #{multiple} #{to}#{gether} #{multiple} #{str4ng3_n4m3}#{unset} template end';
  var template = new MW.Template(templatePattern);
  var placeholders = {
    'start' : 'started',
    'middle' : 'the middle bit',
    'to' : 'zu',
    'gether' : 'sammen',
    'multiple' : 'multi',
    'str4ng3_n4m3' : 666,
    'not_in_template' : 'void'
  };
  var expectedResult = "my template started the middle bit multi zusammen multi 666 template end";
  equal(template.render(placeholders), expectedResult, 'Template rendered as expected.');
});

module('MW.ServiceContainer');

test('testSetThenGet', function() {
    var serviceName = 'aServiceName';
    var aService = 'aService';
    var container = new MW.ServiceContainer();
    container.set(serviceName, function(container){
      return aService;
    });
    equal(container.get(serviceName), aService, 'Container delivered previously configured service.');
});

test('testGetSingletonFunctionality', function() {
    var serviceName = 'aServiceName';

    var AService = function(){ /* a constructor */ };

    var container = new MW.ServiceContainer();
    container.set(serviceName, function(container){
      return new AService();
    });
    var service1 = container.get(serviceName);
    strictEqual(service1, container.get(serviceName), 'Container delivered same service on second get() call.');
});

test('testGetImplicidDependencyCreation', function() {
    var serviceName = 'aServiceName';
    var dependencyName = 'aDependencyName';

    var AService = function(dependency){
      this.dependency = dependency;
    };
    var aDependency = 'aDependency';

    var container = new MW.ServiceContainer();
    container.set(dependencyName, function(container){
        return aDependency;
    });
    container.set(serviceName, function(container){
        return new AService(container.get(dependencyName));
    });
    var service = container.get(serviceName);
    equal(service.dependency, aDependency, 'Dependency implicidly created..');
});

module('MW.EventDispatcher');

test('testEventDispatcherRegisteringAndDispatching', function() {
  var dispatcher = new MW.EventDispatcher();

  var infos = [];
  var aContext = {
    doSth : function(info) {
      infos.push(info);
    }
  };
  dispatcher.on('anEventName', function(context, info){
    context.doSth(info + '1');
  });
  dispatcher.on('anEventName', function(context, info){
    context.doSth(info + '2');
  });
  deepEqual(infos, []);

  dispatcher.trigger('anEventName', aContext, 'someInfo');
  deepEqual(infos, ['someInfo1', 'someInfo2']);

  dispatcher.on('anotherEventName', function(context, info){
    context.doSth(info + '3');
  });
  dispatcher.trigger('anotherEventName', aContext, 'someMoreInfo');
  deepEqual(infos, ['someInfo1', 'someInfo2', 'someMoreInfo3']);

  dispatcher.clear('anotherEventName');
  dispatcher.trigger('anotherEventName', aContext, 'someMoreInfo');
  deepEqual(infos, ['someInfo1', 'someInfo2', 'someMoreInfo3']);

  dispatcher.clear('anEventName');
});

test('testEventDispatcherRegisteringHandlerExecutionTime', function() {
  var dispatcher = new MW.EventDispatcher();

  var log = [];
  var handler1 = function() {log.push('handler1');};
  var handler2 = function() {log.push('handler2');};
  var handler3 = function() {log.push('handler3');};
  var handler4 = function() {log.push('handler4');};

  dispatcher.on('anEventName', handler3, MW.EventDispatcher.ExecutionTimes.LAST);
  dispatcher.on('anEventName', handler1);
  dispatcher.on('anEventName', handler2, MW.EventDispatcher.ExecutionTimes.FIRST);
  dispatcher.on('anEventName', handler4, MW.EventDispatcher.ExecutionTimes.DEFAULT);

  dispatcher.trigger('anEventName');

  deepEqual(log, ['handler2', 'handler1', 'handler4', 'handler3']);

  dispatcher.clear('anEventName');
});

module('MW.Logging');

test('testLogEntryDefaultLevel', function() {
  var entry = new MW.LogEntry('aMessage');
  equal(entry.toString(), 'INFO: aMessage');
});

test('testLogEntryCustomLevel', function() {
  var entry = new MW.LogEntry('anErrorMessage', MW.Logger.Levels.ERROR);
  equal(entry.toString(), 'ERROR: anErrorMessage');
});

test('testLogEntryInvalidLevel', function() {
  var entry = new MW.LogEntry('anErrorMessage', 'AN_INVALID_LEVEL');
  equal(entry.toString(), 'INFO: anErrorMessage');
});

test('testLoggerDefaultLogLevel', function() {
  var logger = new MW.Logger();
  equal(logger.getLogLevel(), MW.Logger.Levels.WARNING);
});

test('testLoggerCustomLogLevel', function() {
  var logger = new MW.Logger(MW.Logger.Levels.DEBUG);
  equal(logger.getLogLevel(), MW.Logger.Levels.DEBUG);
});

test('testLoggerInvalidLogLevel', function() {
  var logger = new MW.Logger('InvalidLogLevel');
  equal(logger.getLogLevel(), MW.Logger.Levels.WARNING);
});

test('testLoggerLogWithHigherLogLevel', function() {
  var logger = new MW.Logger(MW.Logger.Levels.INFO);
  logger.log('aMessage', MW.Logger.Levels.WARNING);
  equal(logger.toString(), "WARNING: aMessage\n");
});

test('testLoggerLogWithEqualLogLevel', function() {
  var logger = new MW.Logger(MW.Logger.Levels.INFO);
  logger.log('aMessage', MW.Logger.Levels.INFO);
  equal(logger.toString(), "INFO: aMessage\n");
});

test('testLoggerLogWithLowerLogLevel', function() {
  var logger = new MW.Logger(MW.Logger.Levels.INFO);
  logger.log('aMessage', MW.Logger.Levels.DEBUG);
  equal(logger.toString(), '');
});

test('testLoggerLogWithInvalidLogLevel', function() {
  var logger = new MW.Logger();
  logger.log('aMessage', 180);
  equal(logger.toString(), '');
});

test('testLoggerLogMessageWithLineBreaks', function() {
  var entry = new MW.LogEntry('aMessage \n next line');
  equal(entry.toString(), 'INFO: aMessage  next line');
});

test('testLoggerGetLog', function() {
  var logger = new MW.Logger(MW.Logger.Levels.INFO);
  logger.log('anInfo', MW.Logger.Levels.INFO);
  logger.log('aDebugMessage', MW.Logger.Levels.DEBUG);
  logger.log('aWarning', MW.Logger.Levels.WARNING);
  logger.log('anError', MW.Logger.Levels.ERROR);
  var expectedEntries = [
    'INFO: anInfo',
    'WARNING: aWarning',
    'ERROR: anError'
  ];
  deepEqual(logger.getLogEntries(), expectedEntries);
});

test('testLoggerSetLogLevel', function() {
  var logger = new MW.Logger();
  equal(logger.getLogLevel(), MW.Logger.Levels.WARNING);

  logger.setLogLevel(MW.Logger.Levels.INFO);
  equal(logger.getLogLevel(), MW.Logger.Levels.INFO);

  logger.setLogLevel(180); // invalid log level
  equal(logger.getLogLevel(), MW.Logger.Levels.INFO);
});

test('testGetLogLevelForString', function() {
  equal(MW.Logger.getLogLevelForString('NOLOG'), MW.Logger.Levels.NOLOG);
  equal(MW.Logger.getLogLevelForString('DEBUG'), MW.Logger.Levels.DEBUG);
  equal(MW.Logger.getLogLevelForString('info'), MW.Logger.Levels.INFO);
  equal(MW.Logger.getLogLevelForString('noticE'), MW.Logger.Levels.NOTICE);
  equal(MW.Logger.getLogLevelForString('WARNing'), MW.Logger.Levels.WARNING);
  equal(MW.Logger.getLogLevelForString('eRROR'), MW.Logger.Levels.ERROR);
  equal(MW.Logger.getLogLevelForString('critical'), MW.Logger.Levels.CRITICAL);
  equal(MW.Logger.getLogLevelForString('Alert'), MW.Logger.Levels.ALERT);
  equal(MW.Logger.getLogLevelForString('EMERGENCY'), MW.Logger.Levels.EMERGENCY);
  equal(MW.Logger.getLogLevelForString('INVALID_LEVEL'), MW.Logger.Levels.NOLOG);
});

module('MW.Window');

test('testPath', function() {
  var windowWrapper = new MW.Window({
    location : {
      pathname : '/aPath'
    }
  });
  equal(windowWrapper.getPath(), '/aPath');

  windowWrapper = new MW.Window({});
  equal(windowWrapper.getPath(), '');
  windowWrapper.setLocation({'search' : '?aQuery'});
  equal(windowWrapper.getPath(), '');
  windowWrapper.setLocation('invalidLocation');
  equal(windowWrapper.getPath(), '');
});

test('testQueryString', function() {
  var windowWrapper = new MW.Window({
    location : {
      search : '?test=1&param2=peter'
    }
  });
  equal(windowWrapper.getQueryParameter('param2'), 'peter');
  equal(windowWrapper.getQueryParameter('test'), '1');

  windowWrapper.setLocation({'search': '?test=2&param2='});
  equal(windowWrapper.getQueryParameter('param2'), '');
  equal(windowWrapper.getQueryParameter('test'), '2');

  windowWrapper.setLocation({'search': '?'});
  equal(windowWrapper.getQueryParameter('unsetParameter'), undefined);

  // invalid query string
  windowWrapper.setLocation({'search': '?=2&param2='});
  equal(windowWrapper.getQueryParameter('param2'), undefined);

  windowWrapper = new MW.Window({});
  equal(windowWrapper.getQueryParameter('unsetParameter'), undefined);
  windowWrapper.setLocation({'pathname' : '/aPath'});
  equal(windowWrapper.getQueryParameter('unsetParameter'), undefined);
  windowWrapper.setLocation('invalidLocation');
  equal(windowWrapper.getQueryParameter('unsetParameter'), undefined);
});

test('testCloning', function() {
  var windowLocation = {pathname: '/aPath'};
  var windowWrapper = new MW.Window({
    location : windowLocation
  });
  windowLocation.pathname = '/anotherPath';
  equal(windowWrapper.getPath(), '/aPath');
});

test('testIsValidQuerySting', function() {
  ok(MW.Window.isValidQuerySting('?a=b&c=&z=w'));
  ok(!MW.Window.isValidQuerySting('?a=b&=&z=w'));
  ok(!MW.Window.isValidQuerySting('?a=b&c=z=w'));
  ok(!MW.Window.isValidQuerySting('?a=b&&c=&z=w'));
  ok(!MW.Window.isValidQuerySting('a=b&c=&z=w'));
});

test('testCookie', function() {
  var mockWindow = {
    document : {}
  };
  var windowWrapper = new MW.Window(mockWindow);
  var aCookieName = 'testCookie';
  var aCookieValue = 'testValue';

  equal(windowWrapper.getCookie(aCookieName), '', 'Internal cookie is initially empty.');

  windowWrapper.setCookie(aCookieName, aCookieValue);
  ok(mockWindow.document.cookie.indexOf(aCookieName + '=' + aCookieValue) != -1, 'Browser cookie was propely set.');

  equal(windowWrapper.getCookie(aCookieName), aCookieValue, 'Internal cookie was propely set.');

  windowWrapper.deleteCookie(aCookieName);
  equal(mockWindow.document.cookie, aCookieName + '=; expires= Thu, 01-Jan-1970 00:00:01 GMT;', 'Browser cookie was deleted.');
});

test('test$', function() {
  var mockWindow = {
    document : {
      getElementById : function(id) {
        return id;
      },
      getElementsByClassName  : function(className) {
        return [className];
      },
      getElementsByTagName : function(tagName) {
        return [tagName];
      }
    }
  };
  var windowWrapper = new MW.Window(mockWindow);
  deepEqual(windowWrapper.$('#anId'), ['anId'], 'Id selector propery translated.');
  deepEqual(windowWrapper.$('.aClass'), ['aClass'], 'Class selector propery translated.');
  deepEqual(windowWrapper.$('aTag'), ['aTag'], 'Tag selector propery translated.');
  deepEqual(windowWrapper.$(666), [], 'Non string selector results in an empty array.');
});
