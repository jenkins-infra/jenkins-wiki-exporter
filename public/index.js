/* eslint-env browser */
const $markdown = document.getElementById('markdown');
const $pluginName = document.getElementById('pluginName');
const $convertButton = document.getElementById('convertButton');

const onsubmit = function(ev) {
  ev.preventDefault();
  const type = document.querySelector('#format:checked').value;
  const pluginName = $pluginName.value;
  fetchContent(pluginName, type);
};

const onPageLoad = function() {
  const params = parseUrl();
  const pluginName = params.pluginName;
  if (pluginName) {
    $pluginName.value = pluginName;
    fetchContent(pluginName, params.type || '.md');
  }
};

const fetchContent = function(pluginName, type) {
  $markdown.value = 'Pending....';
  let url = './plugin/' + encodeURIComponent(pluginName) + type;
  if (pluginName.match(/^https?\:\/\//)) {
    url = '/confluence-url/' + encodeURIComponent(pluginName) + type;
  }

  fetch(url, {responseType: 'blob'})
      .then(function(response) {
        if (!response.ok) {
          return response.text().then((text) => {
            throw Error(text || response.statusText);
          });
        }
        return response;
      })
      .then((response) => {
        if (response.headers.get('content-type').includes('/zip')) {
          return response.blob()
              .then((blob) => {
                $markdown.value = 'Saving...';
                window.saveAs(blob, pluginName + type);
              });
        } else {
          return response.text().then((body) => $markdown.value = body);
        }
      })
      .catch((err) => $markdown.value = 'Error: ' + err.toString());
};

const parseUrl = function() {
  const query = location.search.replace(/^\?/, '').split('&');
  const params = {};
  query.forEach(function(tuple) {
    const keyAndVal = tuple.split('=');
    params[keyAndVal[0]] = keyAndVal[1];
  });
  return params;
};

window.addEventListener('load', onPageLoad);
$pluginName.addEventListener('keydown', function(e) {
  if (e.key == 'Enter') {
    e.preventDefault();
    onsubmit(e);
    return;
  }
});
$convertButton.addEventListener('click', onsubmit);
$markdown.value = '';
