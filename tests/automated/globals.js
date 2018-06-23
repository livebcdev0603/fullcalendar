
// Jasmine Enhancements
// ---------------------------------------------------------------------------------------------------------------------

// like `it`, but with the ability to return a promise
window.pit = function(description, runFunc) {
  it(description, function(done) {
    runFunc().then(done)
  })
}


// Setup / Teardown
// ---------------------------------------------------------------------------------------------------------------------

window.optionsStack = null
window.currentCalendar = null


beforeEach(function() {
  window.optionsStack = []
})

afterEach(function() {
  window.optionsStack = null
  if (window.currentCalendar) {
    window.currentCalendar.destroy()
    window.currentCalendar = null
  }
  $('#calendar').remove()
})


// Calendar Options and Initialization
// ---------------------------------------------------------------------------------------------------------------------

window.pushOptions = function(options) {
  beforeEach(function() {
    return window.optionsStack.push(options)
  })
}

// called within an `it`
window.spyOnCalendarCallback = function(name, func) {
  var options = {}

  options[name] = func
  spyOn(options, name).and.callThrough()

  window.optionsStack.push(options)

  return options[name]
}

window.initCalendar = function(options, el) {
  var $el

  if (options) {
    window.optionsStack.push(options)
  }

  if (el) {
    $el = $(el)
  } else {
    $el = $('<div id="calendar">').appendTo('body')
  }

  window.currentCalendar = new FullCalendar.Calendar($el[0], getCurrentOptions()) // set the global

  return window.currentCalendar.render()
}

window.getCurrentOptions = function() {
  return $.extend.apply($, [ {} ].concat(window.optionsStack))
}


// Categorizing Tests
// ---------------------------------------------------------------------------------------------------------------------

/*
describeOptions(optionName, descriptionAndValueHash, callback)
describeOptions(descriptionAndOptionsHash, callback)
 */
window.describeOptions = function(optName, hash, callback) {
  if ($.type(optName) === 'object') {
    callback = hash
    hash = optName
    optName = null
  }

  $.each(hash, function(desc, val) {
    var opts

    if (optName) {
      opts = {}
      opts[optName] = val
    } else {
      opts = val
    }
    opts = $.extend(true, {}, opts)

    describe(desc, function() {
      pushOptions(opts)
      callback(val)
    })
  })
}

window.describeValues = function(hash, callback) {
  $.each(hash, function(desc, val) {
    describe(desc, function() {
      callback(val)
    })
  })
}


// Timezone Tests (needed?)
// ---------------------------------------------------------------------------------------------------------------------
// NOTE:
// new Date('YYYY-MM-DD') --- parsed as UTC
// new Date('YYYY-MM-DDT00:00:00') --- parsed as local

const timezoneScenarios = {
  local: {
    description: 'when local timezone',
    value: 'local',
    createDate: function(str) {
      if (str.length <= 10) { // doesn't have a time part?
        str += 'T00:00:00' // will force it to parse as local
      }
      return new Date(str)
    }
  },
  UTC: {
    description: 'when UTC timezone',
    value: 'UTC',
    createDate: function(str) {
      if (str.length > 10) { // has a time part?
        str += 'Z' // will force it to parse as UTC
      }
      return new Date(str)
    }
  }
}

window.describeTimezones = function(callback) {
  $.each(timezoneScenarios, function(name, scenario) {
    describe(scenario.description, function() {
      pushOptions({
        timezone: name
      })
      callback(scenario)
    })
  })
}

window.describeTimezone = function(name, callback) {
  var scenario = timezoneScenarios[name]

  describe(scenario.description, function() {
    pushOptions({
      timezone: name
    })
    callback(scenario)
  })
}


// Misc
// ---------------------------------------------------------------------------------------------------------------------

window.oneCall = function(func) {
  var called
  called = false
  return function() {
    if (!called) {
      called = true
      return func.apply(this, arguments)
    }
  }
}

window.spyOnMethod = function(Class, methodName, dontCallThrough) {
  var origMethod = Class.prototype.hasOwnProperty(methodName)
    ? Class.prototype[methodName]
    : null

  var spy = spyOn(Class.prototype, methodName)

  if (!dontCallThrough) {
    spy = spy.and.callThrough()
  }

  spy.restore = function() {
    if (origMethod) {
      Class.prototype[methodName] = origMethod
    } else {
      delete Class.prototype[methodName]
    }
  }

  return spy
}

// wraps an existing function in a spy, calling through to the function
window.spyCall = function(func) {
  func = func || function() {}
  const obj = { func }
  spyOn(obj, 'func').and.callThrough()
  return obj.func
}


// Defaults that apply to all tests
// ---------------------------------------------------------------------------------------------------------------------

window.pushOptions({
  timezone: 'UTC'
})


// Convoluted triggers that are really useful
// ---------------------------------------------------------------------------------------------------------------------

window.afterViewEventsRendered = function(calendar, callback) {

  function monitor() {
    var sourceHash = calendar.state.eventSources
    var pendingSourceCnt = 0

    for (var sourceId in sourceHash) {
      if (sourceHash[sourceId].isFetching) {
        pendingSourceCnt++
      }
    }

    if (!pendingSourceCnt) {
      callback()
    } else {
      calendar.one('RECEIVE_EVENT_SOURCE', function() {
        pendingSourceCnt--
        if (!pendingSourceCnt) {
          calendar.one('_rendered', callback)
        }
      })
    }
  }

  calendar.one('_rendered', monitor) // wait for calendar.render() to be called

  calendar.on('SET_DATE_PROFILE', function() {
    calendar.one('_rendered', monitor) // wait for the render after a view/date switch
  })
}
