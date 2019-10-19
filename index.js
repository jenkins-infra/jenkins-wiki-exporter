const {spawn} = require('child_process');
const winston = require('winston');
const expressWinston = require('express-winston');
const axios = require('axios');

// server.js
// load the things we need
const express = require('express');
const app = express();

const dev = process.env.NODE_ENV !== 'production';

const prettyJson = winston.format.printf((info) => {
  if (info.message.constructor === Object) {
    info.message = JSON.stringify(info.message, null, 4);
  }

  return `${info.timestamp} ${info.level}: ${info.message}`;
});

const screamLevel = winston.format((info, opts) => {
  if (opts.yell) {
    info.level = info.level.toUpperCase();
  } else {
    info.level = info.level.toLowerCase();
  }

  return info;
});

const alignedWithColorsAndTime = winston.format.combine(
    screamLevel({yell: true}),
    winston.format.colorize(),
    winston.format.timestamp(),
    prettyJson
);

const winstonInstance = winston.createLogger({
  exitOnError: false,
  transports: [
    new winston.transports.Console({
      format: (dev ? alignedWithColorsAndTime : winston.format.json()),
    }),
  ],
});

const wrap = (fn) => (...args) => fn(...args).catch(args[2]);
// set the view engine to ejs
app.set('view engine', 'ejs');

app.use(expressWinston.logger({winstonInstance}));

// index page
app.get('/', function(req, res) {
  res.render('pages/index');
});

// about page
app.get('/plugin/:plugin', wrap(async function(req, res, next) {
  const resp = await axios.get('https://plugins.jenkins.io/api/plugin/' + req.params.plugin);
  if (!resp.data.wiki.url.includes('wiki.jenkins-ci.org')) {
    res.send('Not a wiki page');
    return;
  }
  await new Promise(function(resolve, reject) {
    const p = spawn(
        'pandoc',
        [
          '-f',
          'html',
          '-t',
          'markdown_github+blank_before_header+link_attributes',
          '--atx-headers',
          '-o',
          '-',
          '-',
        ],
        {stdio: ['pipe', 'pipe', process.stderr]}
    );
    p.once('error', reject);
    p.once('exit', (code, signal) => {
      winstonInstance.info('p1 done', {code, signal});
      resolve();
    });
    p.stdout.pipe(res);
    p.stdin.write(resp.data.wiki.content);
    p.stdin.end();
  });
}));

app.listen(3000);
console.log('3000 is the magic port');
