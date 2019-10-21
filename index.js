const expressBunyanLogger = require('express-bunyan-logger');
const archiver = require('archiver');
const {basename} = require('path');
const {parse: urlParse} = require('url');
const {
  convertBody,
  findImages,
  decodeEntities,
  getFormatType,
  getPluginData,
  getUrlAsStream,
  recordPandoc,
  replaceAsync,
} = require('./utils.js');

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

// from https://gist.github.com/dperini/729294
/**
 * Handles the /plugin/ action
 * @param {request} req
 * @param {response} res
 */
async function requestPluginHandler(req, res) {
  if (!req.params.format) {
    req.params.format = 'md';
  }
  const formats = req.params.format.split('.');
  const outputType = getFormatType(formats[0]);

  const pluginData = await getPluginData(req.params.plugin);
  if (!pluginData.wiki.url.includes('wiki.jenkins-ci.org')) {
    res.send('Not a wiki page');
    return;
  }
  res.type('text/plain; charset=utf-8');
  const {stdout} = await convertBody(
      req.log,
      pluginData.wiki.content,
      outputType
  );
  if (formats[1] === 'zip') {
    const archive = archiver('zip', {
      zlib: {level: 9}, // Sets the compression level.
    });
    const files = [];
    const images = findImages(pluginData.wiki.content).map(decodeEntities);
    const urlRE = new RegExp('(' + images.map((i) => i.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|') + ')', 'gi');
    const content = await replaceAsync(stdout, urlRE, async function(val, grab) {
      if (!images.includes(val)) {
        return val;
      }

      const filename = `docs/images/${decodeURIComponent(basename(urlParse(grab).pathname)).replace(/\s+/g, '_')}`;
      files.push({
        content: await getUrlAsStream(grab),
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
}
app.get('/plugin/:plugin([^\\.]+)\.?:format?', wrap(requestPluginHandler));

app.use(expressBunyanLogger.errorLogger());

if (typeof require !== 'undefined' && require.main === module) {
  recordPandoc().then(() => {
    app.listen(3000);
    console.log('3000 is the magic port');
  }).catch(console.error);
} else {
  module.exports = {
    requestPluginHandler,
  };
}
