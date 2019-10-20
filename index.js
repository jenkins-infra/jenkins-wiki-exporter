const {spawn} = require('child_process');
const expressBunyanLogger = require('express-bunyan-logger');
const axios = require('axios');

// server.js
// load the things we need
const express = require('express');
const app = express();

const wrap = (fn) => (...args) => fn(...args).catch(args[2]);
// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('trust proxy', 1); // trust first proxy

app.use(expressBunyanLogger());

app.use(express.static('public'));

app.get('/healthcheck', function healthcheck(req, res) {
  res.send('OK');
});

app.get('/plugin/:plugin', wrap(async function(req, res, next) {
  const resp = await axios.get('https://plugins.jenkins.io/api/plugin/' + req.params.plugin);
  if (!resp.data.wiki.url.includes('wiki.jenkins-ci.org')) {
    res.send('Not a wiki page');
    return;
  }
  res.type('text/plain; charset=utf-8');
  await new Promise(function(resolve, reject) {
    const command = 'pandoc';
    const args = [
      '-f',
      'html',
      '-t',
      'markdown_github-raw_html+blank_before_header+link_attributes',
      '--atx-headers',
      '-o',
      '-',
      '-',
    ];
    req.log.debug(`${command} ${args.map((a) => `"${a}"`).join(' ')}`);
    const p = spawn(
        command, args, {
          encoding: 'utf8',
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
        req.log.error(stderr.trim());
      }
    });
    p.stdout.pipe(res);
    p.stdin.write(resp.data.wiki.content);
    p.stdin.end();
  });
}));

app.use(expressBunyanLogger.errorLogger());

app.listen(3000);
console.log('3000 is the magic port');
