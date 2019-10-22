/* eslint-env node */
const {basename} = require('path');
const bunyan = require('bunyan');
const axios = require('axios');
const Confluence = require('confluence-api');
const DomParser = require('dom-parser');
const {promisify} = require('util');

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
async function getConfluencePageId(url) {
  logger.info('getConfluencePageId: looking up ' + url);

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
  return pageId;
}

/**
 * Get the page id from a confluence page
 * @param {string} pageId to look up
 * @return {int} pageId
 */
async function getConfluenceContent(pageId) {
  logger.info('getConfluenceContent: looking up ' + pageId);

  const body = await confluence.getContentByIdPromise(pageId);
  return body.body;
}

module.exports = {
  getConfluenceContent,
  getConfluencePageId,
};
