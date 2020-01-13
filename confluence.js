/* eslint-env node */
const {basename} = require('path');
const URL = require('url');
const bunyan = require('bunyan');
const axios = require('axios');
const Confluence = require('confluence-api');
const DomParser = require('dom-parser');
const cheerio = require('cheerio');
const {promisify} = require('util');
const {replaceImages} = require('./utils.js');

const logger = bunyan.createLogger({
  name: basename(process.argv[0]) + ':confluence',
});

const confluence = new Confluence({
  username: process.env.CONFLUENCE_USERNAME,
  password: process.env.CONFLUENCE_PASSWORD,
  baseUrl: 'https://wiki.jenkins.io',
  version: 4,
});
confluence.getContentByIdPromise = promisify(confluence.getContentById);

/**
 * Get the page id from a confluence page
 * @param {string} url to look up
 * @return {int} pageId
 */
async function getConfluencePageFromId(url) {
  logger.info('getConfluencePageFromId: looking up ' + url);

  const body = await axios.get(url).then((response) => response.data);
  const domParser = new DomParser();
  const dom = domParser.parseFromString(body);
  const meta = dom.getElementsByTagName('meta').find((elm)=>elm.getAttribute('name') === 'ajs-page-id');
  if (!meta) {
    throw new Error('No meta page id found');
  }
  const pageId = meta.getAttribute('content');
  if (!pageId) {
    throw new Error('No page id found');
  }
  return getContentFromConfluencePage(url, body);
}

/**
 * Get's content from a confluence page
 * Remove's some content that we don't want
 *
 * @param {*} url confluence url
 * @param {*} content page content
 * @return {string} processed html
 */
function getContentFromConfluencePage(url, content) {
  const $ = cheerio.load(cheerio.load(content)('.wiki-content').html());

  $('.conf-macro.output-inline th:contains("Plugin Information")').parents('table').remove();

  // Remove any table of contents
  $('.toc').remove();

  // Replace href/src with the wiki url
  $('[href]').each((idx, elm) => {
    $(elm).attr('href', URL.resolve(url, $(elm).attr('href')));
  });
  $('[src]').each((idx, elm) => {
    $(elm).attr('src', URL.resolve(url, $(elm).attr('src')));
  });
  return $.html();
}

module.exports = {
  getConfluencePageFromId,
};
