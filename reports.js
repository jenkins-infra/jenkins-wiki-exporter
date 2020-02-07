/* eslint-env node */
const axios = require('./axios');
const axiosGH = require('axios');
const updatesUrl = 'http://updates.jenkins.io/plugin-documentation-urls.json';
const installsUrl = 'https://stats.jenkins.io/jenkins-stats/svg/' + lastReportDate() + '-plugins.csv';
const httpCache = {};
const gitHubToken = process.env.GITHUB_TOKEN;
const graphql = `query {
  organization(login:"jenkinsci") {
    project(number:3 ) {
      columns (first:100) {
        edges {
          node {
            id
            cards {
              edges {
                node {
                  content {
                    ... on PullRequest {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

/**
 * Get the content of the progress report
 * @return {array} of objects representing table rows
 */
async function pluginsReport() {
  const pulls = await getPulls();
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
 * Gets list of all unreleased pull requests from GitHub project
 * @return {object} map (plugin name) => url
 */
async function getPulls( ) {
  const data = await getCached('github-project', function() {
    const github = axiosGH.create({headers: {'Authorization': `bearer ${gitHubToken}`}});
    return github.post('https://api.github.com/graphql', {query: graphql});
  });

  const columns = data.data.organization.project.columns.edges;
  const inProgress = columns[1].node.cards;
  const merged = columns[2].node.cards;
  const cardEdges = inProgress.edges.concat(merged.edges);
  const projectToPull = {};
  cardEdges.forEach(function(edge) {
    const url = edge.node.content.url;
    if (url) {
      const pluginName = url.replace(/^.*\/(.*)-plugin\/.*$/, '$1');
      projectToPull[pluginName] = url;
    }
  });
  return projectToPull;
}

/**
 * Load content from URL, using cache.
 * @param {string} url
 * @param {string} type 'json' or 'blob'
 * @return {object} JSON object or string
 */
async function getContent(url, type) {
  return getCached(url, () => axios.get(url, {'type': type}));
}

/**
 * Returns response from cache, updates cache if required.
 * @param {string} url
 * @param {function} callback update callback
 * @return {object} JSON object or string
 */
async function getCached(url, callback) {
  const now = new Date().getTime();
  if (httpCache[url] && httpCache[url].timestamp > now - 60 * 60 * 1000) {
    return httpCache[url].data;
  }
  return callback().then(function(response) {
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
  const monthStr = month.toString().padStart(2, '0');
  return reportDate.getFullYear() + monthStr;
}

module.exports = {
  pluginsReport,
};
