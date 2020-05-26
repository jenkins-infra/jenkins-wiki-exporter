/* eslint-env node */
const axios = require('./axios');
const {getPullRequests, getAllTopics} = require('./graphql.js');
const {getArtifactIDFromPom, getCached, pluginNameFromUrl} = require('./utils.js');

const updatesUrl = 'http://updates.jenkins.io/plugin-documentation-urls.json';

/**
 * Get the content of the progress report
 * @return {array} of objects representing table rows
 */
async function pluginsReport() {
  const installsUrl = 'https://stats.jenkins.io/jenkins-stats/svg/' + lastReportDate() + '-plugins.csv';

  const pulls = await getCached('get-pulls', () => getPulls());
  const isTombstoned = await getCached('get-tombstoned-repos', () => getTombstonedRepos());
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
    } else if (isTombstoned[key]) {
      plugin.status = 'deprecated';
      plugin.className = 'success';
    } else if (pulls[key]) {
      plugin.status = 'PR';
      plugin.className = 'info';
      plugin.action = pulls[key];
    } else {
      plugin.status = 'TODO';
      plugin.action = '/?pluginName=' + plugin.name;
    }
    report.push(plugin);
  });
  report.sort((a, b) => b.installs - a.installs);

  const statuses = report.reduce((statuses, report) => {
    statuses[report.status.toLowerCase()] = (statuses[report.status.toLowerCase()] || 0) + 1;
    return statuses;
  }, {});
  statuses.total = report.length;
  return {
    plugins: report,
    statuses,
  };
}

/**
 * Gets documentation URL for a plugin from Update Center
 * @param {string} pluginId plugin ID
 * @return {string} documentation URL
 */
async function getPluginWikiUrl(pluginId) {
  const documentation = await getContent(updatesUrl, 'json');
  if (documentation[pluginId]) {
    return documentation[pluginId].url.replace('//wiki.jenkins-ci.org', '//wiki.jenkins.io');
  }
  return '';
}

/**
 * Gets list of all unreleased pull requests from GitHub project
 * @return {object} map (plugin name) => url
 */
async function getPulls( ) {
  const data = await getPullRequests();
  const columns = data.organization.project.columns.edges;
  const inProgress = columns[1].node.cards;
  const merged = columns[2].node.cards;
  const cardEdges = inProgress.edges.concat(merged.edges);
  const projectToPull = {};
  for (const edge of cardEdges) {
    const {url, baseRepository} = edge.node.content;
    if (baseRepository && baseRepository.object && baseRepository.object.text) {
      const pluginName = await getArtifactIDFromPom(baseRepository.object.text);
      if (pluginName) {
        projectToPull[pluginName] = url;
      }
    }
    if (url) {
      const pluginName = pluginNameFromUrl(url);
      projectToPull[pluginName] = url;
    }
  }
  return projectToPull;
}

/**
 * Get all labels for all repos
 * @return {object} repo => [labels]
 */
async function getTombstonedRepos() {
  const repos = {};
  let after = null;
  do {
    const {organization: {repositories: {pageInfo, edges}}} = await getAllTopics(after);
    after = pageInfo.endCursor;
    edges.forEach(({node}) => {
      if (node.isArchived) {
        repos[pluginNameFromUrl(node.url)] = true;
        return;
      }
      if (node.repositoryTopics.edges.find(({node: topicNode}) => topicNode.topic.name === 'deprecated')) {
        repos[pluginNameFromUrl(node.url)] = true;
        return;
      }
    });

    if (!pageInfo.hasNextPage) {
      break;
    }
  } while (1);
  return repos;
}

/**
 * Load content from URL, using cache.
 * @param {string} url
 * @param {string} type 'json' or 'blob'
 * @return {object} JSON object or string
 */
async function getContent(url, type) {
  return getCached(
      url,
      () => axios.get(url, {'type': type}).then((response) => response.data),
  );
}

/**
 * @return {string} last month date as yyyymm
 */
function lastReportDate() {
  const reportDate = new Date();
  // needs a bit more than a month https://github.com/jenkins-infra/infra-statistics/blob/master/Jenkinsfile#L18
  reportDate.setDate(reportDate.getDate() - 35);
  const month = reportDate.getMonth() + 1; // January: 0 -> 1
  const monthStr = month.toString().padStart(2, '0');
  return reportDate.getFullYear() + monthStr;
}

module.exports = {
  pluginsReport,
  getPluginWikiUrl,
};
