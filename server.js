var Fiber = require('fibers');
var express = require('express');
var app = express();
var gc = (require('gc-stats'))();

gc.on('stats', function (stats) {
  console.log('GC:', stats);
});

function logit(res, failed) {
  let time
  if (res.startTime) {
    time = process.hrtime(res.startTime);
    // time is [s, ns] tuple, convert to ms
    time = Math.round((time[0] * 1e3) + (time[1] / 1e6));
  }

  console.log(res.req.url, res.statusCode, failed, time);
}

app.use(function (req, res, next) {
  return Fiber(next).run();
});

app.use(function (req, res, next) {
  res.startTime = process.hrtime();
  res.once('finish', logit.bind(null, res, false));
  res.once('closed', logit.bind(null, res, true));
  return next();
});

app.use(function(req, res, next) {
  return setTimeout(function () {
    return next();
  }, 0);
});

app.use(function (req, res, next) {
  return Fiber(next).run();
});

app.get('/', function (req, res) {
  var sleepTime = Math.round(Math.random() * 1000);
  var fiber = Fiber.current;
  setTimeout(function() {
    fiber.run();
  }, sleepTime);
  Fiber.yield();
  res.send('hello world')
})

app.listen(6666);
