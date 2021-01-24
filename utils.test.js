/* eslint-env node, jest */
const {
  findImages,
  checkUrl,
  replaceConfluenceContent,
  getAllPluginNamesForRepo,
} = require('./utils.js');

const fs = require('fs');
describe('utils', function() {
  it('findImages', async () => {
    const images = findImages(require('./__testData/cron_column.json').wiki.content);
    expect(images).toEqual([
      'https://wiki.jenkins.io/download/attachments/43712750/Hudson%20Plugin%20-%20Cron%20Column.jpg?version=1&amp;modificationDate=1271470566000&amp;api=v2',
      'https://wiki.jenkins.io/download/attachments/43712750/Hudson%20Plugin%20-%20Cron%20Column.jpg?version=1&amp;modificationDate=1271470566000&amp;api=v2',
    ]);
  });
  it('findImages with empty URL', async () => {
    const images = findImages(require('./__testData/github.json').wiki.content);
    expect(images).toEqual([
      'https://wiki.jenkins.io/download/attachments/37749162/changes.png?version=1&amp;modificationDate=1244761866000&amp;api=v2',
      'https://wiki.jenkins.io/download/thumbnails/37749162/changes.png?version=1&amp;modificationDate=1244761866000&amp;api=v2',
      'https://wiki.jenkins.io/download/attachments/37749162/changes-2.png?version=1&amp;modificationDate=1244761881000&amp;api=v2',
      'https://wiki.jenkins.io/download/thumbnails/37749162/changes-2.png?version=1&amp;modificationDate=1244761881000&amp;api=v2',
      'https://wiki.jenkins.io/s/en_GB/8100/5084f018d64a97dc638ca9a178856f851ea353ff/_/images/icons/emoticons/help_16.svg',
      'https://wiki.jenkins.io/download/attachments/37749162/ghserver-config.png?version=1&amp;modificationDate=1441295981000&amp;api=v2',
      'https://wiki.jenkins.io/download/thumbnails/37749162/ghserver-config.png?version=1&amp;modificationDate=1441295981000&amp;api=v2',
      'https://wiki.jenkins.io/download/attachments/37749162/manage-token.png?version=1&amp;modificationDate=1441297409000&amp;api=v2',
      'https://wiki.jenkins.io/download/thumbnails/37749162/manage-token.png?version=1&amp;modificationDate=1441297409000&amp;api=v2',
      'https://wiki.jenkins.io/download/attachments/37749162/secret-text.png?version=1&amp;modificationDate=1441295988000&amp;api=v2',
      'https://wiki.jenkins.io/download/thumbnails/37749162/secret-text.png?version=1&amp;modificationDate=1441295988000&amp;api=v2',
    ]);
  });
  it('checkUrl', () => {
    expect(checkUrl(['wiki.jenkins.io'], 'https://wiki.jenkins.io/something')).toBe(true);
  });
  it('replaceConfluenceContent', () => {
    const input = fs.readFileSync('test-data/with-classes.html', 'utf8');
    const expected = fs.readFileSync('test-data/with-classes-removed.html', 'utf8');
    expect(replaceConfluenceContent(input)).toBe(expected);
  });
  describe.each([
    ['https://github.com/jenkinsci/cloudbees-disk-usage-simple-plugin/pull/28', 'cloudbees-disk-usage-simple'],
    ['https://github.com/jenkinsci/groovy', 'groovy'],
    ['https://github.com/jenkinsci/backend-pull-request-greeter', 'backend-pull-request-greeter'],
  ])('pluginNameFromUrl(%s)', (url, expected) => {
    test(`returns ${expected}`, () => {
      expect(getAllPluginNamesForRepo(url, {})[0]).toBe(expected);
    });
  });
});

