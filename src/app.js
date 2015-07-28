/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var Vibe = require('ui/vibe');
var Settings = require('settings');

var time = {
  seconds: 0,
  running: false,
  interval: null,
  mode: "up",
  toString: function () {
    var hours = Math.floor(this.seconds / 3600);
    var minutes = Math.floor(this.seconds / 60 % 60);
    var seconds = Math.floor(this.seconds % 60);

    var mins = minutes < 10 ? "0"+minutes : minutes;
    var hrs = hours < 10 ? "0"+hours : hours;
    var scs = seconds < 10 ? "0"+seconds : seconds;

    return "" + hrs + "h " + mins + "m " + scs + "s";
  },
  start: function () {
    if (time.interval)
      window.clearInterval(time.interval);  
    time.interval = window.setTimeout(time.firstTick, 400);
    main.subtitle(time.toString());
    if (time.mode === "up") {
      main.title("Stopwatch");
      main.body(bodies[main.title()]);
    } else {
      main.title("Countdown");
      main.body(bodies[main.title()]);
    }

    time.running = true;
  },
  firstTick: function () {
    time.tick();
    if (time.running)
      time.interval = window.setInterval(time.tick, 1000);
  },
  tick: function () {
    main.subtitle(time.toString());

    if (time.mode === "up") {
      time.seconds++;
    } else {
      if (time.seconds < 1) {
        time.reset();
        Vibe.vibrate('long');
      } else {
        time.seconds--;
      }
    }
  },
  pause: function (force) {
    if (!time.running && !force)
      return;
    time.running = false;
    if (time.interval)
      window.clearInterval(time.interval);
    time.interval = null;
    main.subtitle(time.toString());
    main.title("Paused");
    main.body(bodies[main.title()]);
  },
  reset: function () {
    time.seconds = 0;
    time.running = false;
    if (time.interval)
      window.clearInterval(time.interval);
    time.interval = null;
    time.mode = "up";
    main.subtitle(time.toString());
    main.title("Stopped");
    main.body(bodies[main.title()]);
  }
};

var bodies = {
  'Stopped':   "  \\ Start\n   | Reset\n  / +30s",
  'Countdown': "  \\ Pause\n   | Reset\n  / +30s",
  'Stopwatch': "  \\ Pause\n   | Reset",
  'Paused':    "  \\ Resume\n   | Reset"
};

var main = new UI.Card({
  title: 'Stopped',
  icon: 'images/ic_watch_black_24dp.png',
  subtitle: time.toString(),
  body: bodies['Stopped'],
  style: 'large'
});

main.on('click', 'up', function(e) {
  if (time.running) {
    time.pause(true);
  }
  else {
    time.start();
  }
});

main.on('click', 'select', function(e) {
  time.reset();
});

main.on('click', 'down', function(e) {
  if (time.running && time.mode === "up") {
    return;
  }

  time.mode = "down";
  time.seconds += 30;
  main.subtitle(time.toString());
});

main.on('show', function () {
    var oldTime = Settings.data('time');
    var state = Settings.data('state');
    console.log(oldTime, typeof oldTime);
    if (oldTime && state) {
      // load state
      var cTime = Math.floor(Date.now() / 1000);
      var diff = Math.max(cTime - oldTime, 0);
      time.running = state.running;
      time.mode = state.mode;
      switch (state.status) {
        case 'Stopped': 
          time.reset(); 
          break;
        case 'Countdown':
        case 'Stopwatch':
          if (time.mode === "up") 
            time.seconds = state.seconds + diff;
          else
            time.seconds = Math.max(0, state.seconds - diff);
          time.start();
          break;
        case 'Paused':
          time.seconds = state.seconds;
          time.pause();
          break;
      }
      main.subtitle(time.toString());
    }
});

main.on('hide', function () {
  console.log('hidden');
  clearInterval(time.interval);
  time.interval = null;

  Settings.data('state', {
    running: time.running,
    seconds: time.seconds,
    mode: time.mode,
    status: main.title()
  });
  Settings.data('time', Math.floor(Date.now() / 1000));
});

main.show();
