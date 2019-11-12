const axios = require('axios');
const pulls = require('./pulls.js');
const updatesUrl = 'http://updates.jenkins.io/plugin-documentation-urls.json';
const installsUrl = 'https://stats.jenkins.io/jenkins-stats/svg/' + lastReportDate() + '-plugins.csv';
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
    const url = plugin.url || '';
    plugin.name = key;
    plugin.installs = plugin.installs || 0;
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

/**
 * @return {string} last month date as yyyymm
 */
function lastReportDate() {
  const reportDate = new Date();
  // needs a bit more than a month https://github.com/jenkins-infra/infra-statistics/blob/master/Jenkinsfile#L18
  reportDate.setDate(reportDate.getDate() - 35);
  const month = reportDate.getMonth() + 1; // January: 0 -> 1
  const prefix = month < 10 ? '0' : '';
  return reportDate.getFullYear() + prefix + month;
}

module.exports = {
  pluginsReport,
};
