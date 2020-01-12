/* eslint-env node */
const expressBunyanLogger = require('express-bunyan-logger');
const archiver = require('archiver');
const {basename} = require('path');
const {parse: urlParse} = require('url');
const {
  checkUrl,
  convertBody,
  decodeEntities,
  findImages,
  getFormatType,
  getPluginData,
  getUrlAsStream,
  recordPandoc,
  replaceAsync,
} = require('./utils.js');
const {
  getConfluencePageFromId,
} = require('./confluence.js');
const {pluginsReport} = require('./reports.js');

const validWikiDomains = [
  'wiki.jenkins-ci.org', // primary
  'wiki.jenkins.io',
];

const supportedArchiveFormats = [
  'zip',
];


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

app.get('/progress', async function(req, res) {
  const report = await pluginsReport();
  res.render('progress', report);
});

app.get('/', function(req, res) {
  res.render('index');
});


/**
 * processing incoming parameter parts of urls
 * @param {request} req
 * @return {object} extension and isZip values
 */
function handleParams(req) {
  if (!req.params.format) {
    req.params.format = 'md';
  }
  const formats = req.params.format.split('.');
  const archiveFormat = formats[1] && supportedArchiveFormats.includes(formats[1]) ? formats[1] : '';
  return {
    extension: formats[0],
    archiveFormat,
  };
}

/**
 * Handles the /plugin/ action
 * @param {request} req
 * @param {response} res
 */
async function requestPluginHandler(req, res) {
  const {extension, archiveFormat} = handleParams(req);

  const pluginData = await getPluginData(req.params.plugin);
  checkUrl(validWikiDomains, pluginData.wiki.url);
  return processContent(req, res, pluginData.wiki.content, extension, archiveFormat);
}

/**
 *
 * @param {request} req
 * @param {response} res
 */
async function requestConfluenceUrlHandler(req, res) {
  const urlParts = req.originalUrl.replace(/^\/confluence-url\//, '').split('.');
  let archiveFormat = '';
  if (supportedArchiveFormats.includes(urlParts[urlParts.length - 1])) {
    archiveFormat = urlParts.pop();
  }
  const extension = urlParts.pop();
  getFormatType(extension);
  const url = decodeURIComponent(urlParts.join('.'));
  checkUrl(validWikiDomains, url);
  const content = await getConfluencePageFromId(url);

  return processContent(req, res, content, extension, archiveFormat);
}


/**
 * Handles the /plugin/ action
 * @param {request} req
 * @param {response} res
 * @param {string} wikiContent content to process
 * @param {string} extension which format/extension do we want
 * @param {string} archiveFormat do we want a zip
 */
async function processContent(req, res, wikiContent, extension, archiveFormat) {
  res.type('text/plain; charset=utf-8');
  const outputType = getFormatType(extension);
  const {stdout} = await convertBody( req.log, wikiContent, outputType);
  if (archiveFormat) {
    const archive = archiver(archiveFormat, {
      zlib: {level: 9}, // Sets the compression level.
    });
    const files = [];
    const images = findImages(wikiContent).map(decodeEntities);
    const urlRE = new RegExp('(' + images.map((i) => i.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|') + ')', 'gi');

    const content = await replaceAsync(stdout, urlRE, async function(val, grab) {
      if (!images.includes(val)) {
        return val;
      }

      try {
        const filename = `/docs/images/${decodeURIComponent(basename(urlParse(grab).pathname)).replace(/\s+/g, '_')}`;
        files.push({
          content: await getUrlAsStream(grab),
          filename: filename,
        });
        return val.replace(grab, filename);
      } catch (e) {
        // FIXME - sentry.captureException(e);
        req.log.error(e);
        return val;
      }
    });
    files.push({
      content: Buffer.from(content),
      filename: 'README.' + extension,
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
    res.attachment(`${req.params.plugin}.${archiveFormat}`).type(archiveFormat);
    archive.on('end', () => res.end()); // end response when archive stream ends
    archive.pipe(res);
    archive.finalize();
    return;
  } else {
    res.send(stdout);
  }
}
app.get('/plugin/:plugin([^\\.]+)\.?:format?', wrap(requestPluginHandler));
app.get('/confluence-url/:plugin([^\\.]+)\.?:format?', wrap(requestConfluenceUrlHandler));

app.use(function(err, req, res, next) {
  req.log.error(err.stack);
  res.status(err.code || 500).send(err.message);
});


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
