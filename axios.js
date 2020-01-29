const axios = require('axios');
const package = require('./package.json');

module.exports = axios.create({
  headers: {'User-Agent': `jenkins-wiki-exporter/${package.version}`},
});

