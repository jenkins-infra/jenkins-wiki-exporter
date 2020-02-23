/* eslint-env node, jest */
const sut = require('./index.js');
const MockExpressRequest = require('mock-express-request');
const MockExpressResponse = require('mock-express-response');
const mockWikiPrefix = 'https://wiki.jenkins.io/display/JENKINS/';
jest.mock('./confluence.js', () => ({
  ...require.requireActual('./confluence.js'),
  getRawConfluenceContent: (url) => {
    const pluginName = url.replace(mockWikiPrefix, '');
    return require('fs').promises.readFile(`__testData/${pluginName}.json`)
        .then((buf) => JSON.parse(buf.toString()).wiki.content);
  },
}));

jest.mock('./reports.js', () => ({
  ...require.requireActual('./reports.js'),
  getPluginWikiUrl: (pluginName) => {
    return `${mockWikiPrefix}${pluginName}`;
  },
}));

describe('/plugin/:pluginName', function() {
  it('handle the basics', async () => {
    const req = {
      log: {
        debug: jest.fn(),
      },
      params: {
        plugin: 'html5-notifier-plugin',
      },
    };
    const res = {
      send: jest.fn(),
      type: jest.fn(),
    };

    await sut.requestPluginHandler(req, res);
    expect(res.send.mock.calls).toMatchSnapshot();
  });

  it('markdown should return markdown', async () => {
    const req = {
      log: {
        debug: jest.fn(),
      },
      params: {
        plugin: 'html5-notifier-plugin',
        format: 'md',
      },
    };
    const res = {
      send: jest.fn(),
      type: jest.fn(),
    };

    await sut.requestPluginHandler(req, res);
    expect(res.send.mock.calls).toMatchSnapshot();
  });
  it('markdown.zip should return markdown and images in zip', async () => {
    const req = new MockExpressRequest({
      log: {
        debug: jest.fn(),
      },
      params: {
        plugin: 'html5-notifier-plugin',
        format: 'md.zip',
      },
    });
    const res = new MockExpressResponse({ });

    await sut.requestPluginHandler(req, res);
    expect(res._getString()).toMatchSnapshot();
  });
  it('adoc should return asciidoc', async () => {
    const req = {
      log: {
        debug: jest.fn(),
      },
      params: {
        plugin: 'html5-notifier-plugin',
        format: 'adoc',
      },
    };
    const res = {
      send: jest.fn(),
      type: jest.fn(),
    };

    await sut.requestPluginHandler(req, res);
    expect(res.send.mock.calls).toMatchSnapshot();
  });
});

