const axios = require('axios');
const pulls = require('./pulls.js');
const updatesUrl = 'http://updates.jenkins.io/plugin-documentation-urls.json';
const installsUrl = 'https://stats.jenkins.io/jenkins-stats/svg/201910-plugins.csv';
const httpCache = {};

/**
 * Get the content of the progress report
 * @return {array} of objects representing table rows
 */
async function pluginsReport() {
  const documentation = await getContent(updatesUrl, 'json');
  const installs = await getContent(installsUrl, 'blob');
  const lines = installs.split('\n');
  lines.forEach(function(line) {
    const nameAndValue = JSON.parse('[' + line + ']');
    const plugin = documentation[nameAndValue[0]] || {};
    plugin.installs = nameAndValue[1];
  });

  const report = [];
  Object.keys(documentation).forEach(function(key) {
    const plugin = documentation[key];
    const url = documentation[key].url || '';
    plugin.name = key;
    if (url.match('https?://github.com/jenkinsci/')) {
      plugin.status = 'OK';
      plugin.className = 'success';
    } else if (pulls[key]) {
      plugin.status = 'PR';
      plugin.className = 'info';
      plugin.action = 'https://github.com/jenkinsci/' + key + '-plugin/pull/' + pulls[key];
    } else {
      plugin.status = 'TODO';
      plugin.action = '/?pluginName=' + plugin.name;
    }
    report.push(plugin);
  });
  report.sort((a, b) => b.installs - a.installs);
  return report;
}

/**
 * Load content from URL, using cache.
 * @param {string} url
 * @param {string} type 'json' or 'blob'
 * @return {object} JSON object or string
 */
async function getContent(url, type) {
  const now = new Date().getTime();
  if (httpCache[url] && httpCache[url].timestamp > now - 60 * 60 * 1000) {
    return httpCache[url].data;
  }
  return axios.get(url, {'type': type}).then(function(response) {
    httpCache[url] = {'data': response.data, 'timestamp': new Date().getTime()};
    return response.data;
  });
}

module.exports = {
  pluginsReport,
};
