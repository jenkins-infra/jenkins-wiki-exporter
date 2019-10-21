const {spawn} = require('child_process');
const expressBunyanLogger = require('express-bunyan-logger');
const axios = require('axios');
const archiver = require('archiver');
const {basename} = require('path');
const {parse: urlParse} = require('url');

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

/**
 * Do the main conversion
 *
 * @param {Logger} log Logger
 * @param {str} body The body to be converted
 * @param {str} format What format to output as
 * @return {string} converted string
 */
async function convertBody(log, body, format) {
  return new Promise(function(resolve, reject) {
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
    log.debug(`${command} ${args.map((a) => `"${a}"`).join(' ')}`);
    const p = spawn(
        command, args, {
          encoding: 'utf8',
          env: {...process.env, LANG: 'en_US.UTF-8', LC_CTYPE: 'en_US.UTF-8'},
          stdio: ['pipe', 'pipe', 'pipe'],
        }
    );
    p.once('error', reject);
    p.once('exit', (code, signal) => {
      resolve({
        stderr,
        stdout,
      });
    });

    let stderr = '';
    p.stderr.on('data', (data) => stderr += data);
    p.stderr.on('end', () => {
      if (stderr.trim()) {
        log.error(stderr.trim());
      }
    });
    let stdout = '';
    p.stdout.on('data', (data) => stdout += data);
    p.stdin.write(body);
    p.stdin.end();
  });
}
/**
 * Which pandoc format do we want to output as
 * @param {string} type Which file extension do we want
 * @return {string}
 */
function getFormatType(type) {
  if (type === 'md') {
    return 'markdown_github';
  }
}


/**
 * Standard string replace function that allows async functions
 *
 * https://stackoverflow.com/a/48032528
 *
 * @param {string} str string to be searched
 * @param {string} regex regex to search
 * @param {function} asyncFn to do the replace
 * @return {string} the new string
 */
async function replaceAsync(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}

app.get('/plugin/:plugin([^\\.]+)\.?:format?', wrap(async (req, res, next) => {
  if (!req.params.format) {
    req.params.format = 'md';
  }
  const formats = req.params.format.split('.');
  const outputType = getFormatType(formats[0]);

  const resp = await axios.get('https://plugins.jenkins.io/api/plugin/' + req.params.plugin);
  if (!resp.data.wiki.url.includes('wiki.jenkins-ci.org')) {
    res.send('Not a wiki page');
    return;
  }
  res.type('text/plain; charset=utf-8');
  const {stdout} = await convertBody(
      req.log,
      resp.data.wiki.content,
      outputType
  );
  if (formats[1] === 'zip') {
    const archive = archiver('zip', {
      zlib: {level: 9}, // Sets the compression level.
    });
    const files = [];
    const imgRe = /\!\[\]\((.*)\)/g;
    const content = await replaceAsync(stdout, imgRe, async (val, grab) => {
      const filename = `docs/images/${basename(urlParse(grab).pathname)}`;
      files.push({
        content: await axios.get(
            grab,
            {
              responseType: 'stream',
            }
        ).then((response) => response.data),
        filename: filename,
      });
      return val.replace(grab, filename);
    });
    files.push({
      content: Buffer.from(content),
      filename: 'README.' + formats[0],
    });
    for (const file of files) {
      archive.append(file.content, {name: file.filename});
    }
    archive.on('error', function(err) {
      throw err;
    });
    archive.on('warning', function(err) {
      throw err;
    });
    res.attachment(`${req.params.plugin}.zip`).type('zip');
    archive.on('end', () => res.end()); // end response when archive stream ends
    archive.pipe(res);
    archive.finalize();
    return;
  } else {
    res.send(stdout);
  }
}));

app.use(expressBunyanLogger.errorLogger());

app.listen(3000);
console.log('3000 is the magic port');
