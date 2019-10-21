/* eslint-env node, jest */
const fs = require('fs').promises;

const sut = require('./index.js');

describe('/plugin/:pluginName', function() {
  beforeEach(() => {
    sut.getPluginData = jest.fn(
        (pluginName) => fs.readFile(`__testData/${pluginName}.json`)
    );
  });
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
  it('markdown should return markdown', async () => {
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

