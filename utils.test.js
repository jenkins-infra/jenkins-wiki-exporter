/* eslint-env node, jest */
const {
  findImages,
  checkUrl,
} = require('./utils.js');

describe('utils', function() {
  it('findImages', async () => {
    const images = findImages(require('./__testData/cron_column.json').wiki.content);
    expect(images).toEqual([
      'https://wiki.jenkins.io/download/attachments/43712750/Hudson%20Plugin%20-%20Cron%20Column.jpg?version=1&amp;modificationDate=1271470566000&amp;api=v2',
      'https://wiki.jenkins.io/download/attachments/43712750/Hudson%20Plugin%20-%20Cron%20Column.jpg?version=1&amp;modificationDate=1271470566000&amp;api=v2',
    ]);
  });
  it('checkUrl', () => {
    expect(checkUrl(['wiki.jenkins.io'], 'https://wiki.jenkins.io/something')).toBe(true);
  });
});

