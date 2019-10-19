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
app.set('trust proxy', 1); // trust first proxy

app.use(expressWinston.logger({winstonInstance}));

app.get('/', function(req, res) {
  res.render('pages/index');
});

app.get('/healthcheck', function healthcheck(req, res) {
  res.send('OK');
});

app.get('/plugin/:plugin', wrap(async function(req, res, next) {
  const resp = await axios.get('https://plugins.jenkins.io/api/plugin/' + req.params.plugin);
  if (!resp.data.wiki.url.includes('wiki.jenkins-ci.org')) {
    res.send('Not a wiki page');
    return;
  }
  await new Promise(function(resolve, reject) {
    const command = 'pandoc';
    const args = [
      '-f',
      'html',
      '-t',
      'markdown_github+blank_before_header+link_attributes',
      '--atx-headers',
      '-o',
      '-',
      '-',
    ];
    winstonInstance.info(`${command} ${args.map((a) => `"${a}"`).join(' ')}`);
    const p = spawn(
        command, args, {
          env: {...process.env, LANG: 'en_US.UTF-8', LC_CTYPE: 'en_US.UTF-8'},
          stdio: ['pipe', 'pipe', 'pipe'],
        }
    );
    p.once('error', reject);
    p.once('exit', (code, signal) => resolve());

    let stderr = '';
    p.stderr.on('data', (data) => stderr += data);
    p.stderr.on('end', () => {
      if (stderr.trim()) {
        winstonInstance.error(stderr.trim());
      }
    });
    p.stdout.pipe(res);
    p.stdin.write(resp.data.wiki.content);
    p.stdin.end();
  });
}));

app.use(expressWinston.errorLogger({winstonInstance}));

app.listen(3000);
console.log('3000 is the magic port');
