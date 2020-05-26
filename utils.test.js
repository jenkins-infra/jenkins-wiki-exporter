/* eslint-env node, jest */
const {
  findImages,
  checkUrl,
  replaceConfluenceContent,
  getArtifactIDFromPom,
  pluginNameFromUrl,
} = require('./utils.js');

const fs = require('fs');

describe('utils', function() {
  it('getArtifactIDFromPom', async () => {
    const content = '<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">\n' +
              '    <modelVersion>4.0.0</modelVersion>\n' +
              '\n' +
              '    <parent>\n' +
              '        <groupId>org.jenkins-ci.plugins</groupId>\n' +
              '        <artifactId>plugin</artifactId>\n' +
              '        <version>3.5</version>\n' +
              '        <relativePath />\n' +
              '    </parent>\n' +
              '    <artifactId>matrix-combinations-parameter</artifactId>\n' +
              '    <packaging>hpi</packaging>\n' +
              '\t\n' +
              '    <name>Matrix Configuration Parameter Plugin</name>\n' +
              '    <version>1.3.1-SNAPSHOT</version>\n' +
              '    <url>https://wiki.jenkins-ci.org/display/JENKINS/matrix+combinations+plugin</url>\n' +
              '\n' +
              '\t<scm>\n' +
              '\t\t<connection>scm:git:https://github.com/jenkinsci/matrix-combinations-plugin.git</connection>\n' +
              '\t\t<developerConnection>scm:git:https://github.com/jenkinsci/matrix-combinations-plugin.git</developerConnection>\n' +
              '\t\t<url>https://github.com/jenkinsci/matrix-combinations-plugin.git</url>\n' +
              '\t  <tag>HEAD</tag>\n' +
              '  </scm>\n' +
              '\n' +
              '    <properties>\n' +
              '        <jenkins.version>1.651.3</jenkins.version>\n' +
              '        <java.level>7</java.level>\n' +
              '    </properties>\n' +
              '\n' +
              '\t<repositories>\n' +
              '        <repository>\n' +
              '            <id>repo.jenkins-ci.org</id>\n' +
              '            <url>https://repo.jenkins-ci.org/public/</url>\n' +
              '        </repository>\n' +
              '    </repositories>\n' +
              '\n' +
              '    <pluginRepositories>\n' +
              '        <pluginRepository>\n' +
              '            <id>repo.jenkins-ci.org</id>\n' +
              '            <url>https://repo.jenkins-ci.org/public/</url>\n' +
              '        </pluginRepository>\n' +
              '    </pluginRepositories>\n' +
              '\n' +
              '    <dependencies>\n' +
              '      <dependency>\n' +
              '        <groupId>org.jenkins-ci.plugins</groupId>\n' +
              '        <artifactId>matrix-project</artifactId>\n' +
              '        <!-- The version with fix for SECUTIRY-170 to test with newer cores. -->\n' +
              '        <version>1.7</version>\n' +
              '      </dependency>\n' +
              '      <dependency>\n' +
              '        <groupId>com.sonyericsson.hudson.plugins.rebuild</groupId>\n' +
              '        <artifactId>rebuild</artifactId>\n' +
              '        <version>1.21</version> <!-- RebuildParameterProvider is available since 1.21 -->\n' +
              '        <optional>true</optional>\n' +
              '      </dependency>\n' +
              '      <dependency>\n' +
              '        <groupId>org.jenkins-ci.plugins</groupId>\n' +
              '        <artifactId>antisamy-markup-formatter</artifactId>\n' +
              '        <version>1.5</version>\n' +
              '        <scope>test</scope>\n' +
              '      </dependency>\n' +
              '    </dependencies>\n' +
              '\n' +
              '</project>\n';
    expect(await getArtifactIDFromPom(content)).toEqual('matrix-combinations-parameter');
  });
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
      expect(pluginNameFromUrl(url)).toBe(expected);
    });
  });
});

