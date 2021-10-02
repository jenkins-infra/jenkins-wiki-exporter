/* eslint-env node, jest */
process.env.CONFLUENCE_USERNAME = process.env.CONFLUENCE_PASSWORD = 'fake';

const sut = require('./index.js');
const MockExpressRequest = require('mock-express-request');
const MockExpressResponse = require('mock-express-response');
const mockWikiPrefix = 'https://wiki.jenkins.io/display/JENKINS/';
jest.mock('./confluence.js', () => ({
  ...jest.requireActual('./confluence.js'),
  getRawConfluenceContent: (url) => {
    const pluginName = url.replace(mockWikiPrefix, '');
    return require('fs').promises.readFile(`__testData/${pluginName}.json`)
        .then((buf) => JSON.parse(buf.toString()).wiki.content);
  },
}));

jest.mock('./reports.js', () => ({
  ...jest.requireActual('./reports.js'),
  getPluginWikiUrl: (pluginName) => {
    return `${mockWikiPrefix}${pluginName}`;
  },
}));

const makeLogger = () => {
  return {
    debug: jest.fn(),
    error: jest.fn(),
  };
};

describe('/plugin/:pluginName', function() {
  it('handle the basics', async () => {
    const logger = makeLogger();
    const req = new MockExpressRequest({
      log: logger,
      params: {
        plugin: 'html5-notifier-plugin',
      },
    });
    const res = {
      send: jest.fn(),
      type: jest.fn(),
    };

    await sut.requestPluginHandler(req, res);
    expect(res.send.mock.calls).toMatchSnapshot();
    expect(logger.error.mock.calls).toEqual([]);
  });

  it('markdown should return markdown', async () => {
    const logger = makeLogger();
    const req = new MockExpressRequest({
      log: logger,
      params: {
        plugin: 'html5-notifier-plugin',
        format: 'md',
      },
    });
    const res = {
      send: jest.fn(),
      type: jest.fn(),
    };

    await sut.requestPluginHandler(req, res);
    expect(res.send.mock.calls).toMatchSnapshot();
    expect(logger.error.mock.calls).toEqual([]);
  });
  // / this one is actually talking to the wiki for some reason, so ignore it
  it.skip('markdown.zip should return markdown and images in zip', async () => {
    const logger = makeLogger();
    const req = new MockExpressRequest({
      log: logger,
      params: {
        plugin: 'html5-notifier-plugin',
        format: 'md.zip',
      },
    });
    const res = new MockExpressResponse({ });

    await sut.requestPluginHandler(req, res);
    expect(res._getString()).toMatchSnapshot();
    expect(logger.error.mock.calls).toEqual([]);
  });
  it('adoc should return asciidoc', async () => {
    const logger = makeLogger();
    const req = new MockExpressRequest({
      log: logger,
      params: {
        plugin: 'html5-notifier-plugin',
        format: 'adoc',
      },
    });
    const res = {
      send: jest.fn(),
      type: jest.fn(),
    };

    await sut.requestPluginHandler(req, res);
    expect(res.send.mock.calls).toMatchSnapshot();
    expect(logger.error.mock.calls).toEqual([]);
  });
});

