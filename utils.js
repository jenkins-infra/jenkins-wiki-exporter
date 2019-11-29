/* eslint-env node */
const bunyan = require('bunyan');
const axios = require('axios');
const {basename} = require('path');
const {spawn, execFile} = require('child_process');
const {parse: urlParse} = require('url');
const createError = require('http-errors');
const DomParser = require('dom-parser');

const logger = bunyan.createLogger({
  name: basename(process.argv[0]) + ':utils',
});


/**
 * decodeEntities - https://stackoverflow.com/a/39243641
 * @param {string} encodedString string to decode
 * @return {string} the decoded one
*/
function decodeEntities(encodedString) {
  const htmlEntities = {
    nbsp: ' ',
    cent: '¢',
    pound: '£',
    yen: '¥',
    euro: '€',
    copy: '©',
    reg: '®',
    lt: '<',
    gt: '>',
    quot: '"',
    amp: '&',
    apos: '\'',
  };

  return encodedString.replace(/\&([^;]+);/g, function(entity, entityCode) {
    let match;

    if (entityCode in htmlEntities) {
      return htmlEntities[entityCode];
      // eslint-disable-next-line no-cond-assign
    } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
      return String.fromCharCode(parseInt(match[1], 16));
      // eslint-disable-next-line no-cond-assign
    } else if (match = entityCode.match(/^#(\d+)$/)) {
      return String.fromCharCode(~~match[1]);
    } else {
      return entity;
    }
  });
}

/**
 * Find those images
 *
 * @param {string} body html content to find images in
 * @return {array} array of string urls
 */
function findImages(body) {
  const domParser = new DomParser();
  const dom = domParser.parseFromString(body);
  const images = dom.getElementsByTagName('img');
  const ret = images.map((image) => {
    return [
      (image.attributes.find((attr) => attr.name === 'data-image-src') || {}).value,
      (image.attributes.find((attr) => attr.name === 'src') || {}).value,
    ];
  })
      .flat()
      .map((url) => !url || url.startsWith('http') ? url : `https://wiki.jenkins.io${url}`)
      .filter(Boolean);
  return ret;
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

/**
 * Grabs the data from plugins.jenkins.io
 * @param {string} pluginName
 * @return {object}
 */
async function getPluginData(pluginName) {
  if (!pluginName) {
    throw new Error('plugin name is required');
  }

  const url = 'https://plugins.jenkins.io/api/plugin/' + pluginName;
  logger.info(`getting ${url}`);
  return axios.get(url)
      .then((resp) => resp.data);
}

/**
 * Grabs the data from plugins.jenkins.io
 * @param {string} url
 * @return {Stream}
 */
async function getUrlAsStream(url) {
  if (!url) {
    throw new Error('url');
  }

  return axios.get(url, {responseType: 'stream'})
      .then((resp) => resp.data);
}

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
      format+'-raw_html+blank_before_header+link_attributes',
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
  if (type === 'adoc') {
    return 'asciidoc';
  }
  throw new Error('Unknown format: ' + type);
}

/** outputPandocVersion
 * @return {promise}
 */
function recordPandoc() {
  return new Promise(function(resolve, reject) {
    execFile(
        'pandoc',
        ['--version'], {
          encoding: 'utf8',
          env: {...process.env, LANG: 'en_US.UTF-8', LC_CTYPE: 'en_US.UTF-8'},
        },
        (error, stdout, stderr) => {
          if (error) {
            logger.error(stderr);
            reject(error);
            return;
          }
          logger.info(stdout + stderr);
          resolve();
        }
    );
  });
}

/**
 * Checks the given url to see if its valid confluence domain
 * @param {string[]} validWikiDomains valid domains
 * @param {string} url to check
 * @return {boolean} true valid
 * @throws error if not valid
 */
function checkUrl(validWikiDomains, url) {
  if (!validWikiDomains.includes(urlParse(url).host)) {
    throw createError(400, url + ' is not a valid wiki url.');
  }
  return true;
}


module.exports = {
  checkUrl,
  convertBody,
  decodeEntities,
  findImages,
  getFormatType,
  getPluginData,
  getUrlAsStream,
  recordPandoc,
  replaceAsync
};
