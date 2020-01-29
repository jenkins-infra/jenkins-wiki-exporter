const axios = require('axios');
const pkg = require('./package.json');

module.exports = axios.create({
  headers: {'User-Agent': `jenkins-wiki-exporter/${pkg.version}`},
});

