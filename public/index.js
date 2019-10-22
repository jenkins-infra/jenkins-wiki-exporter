/* eslint-env browser */
const $markdown = document.getElementById('markdown');
const $pluginName = document.getElementById('pluginName');
const $convertButton = document.getElementById('convertButton');

const onsubmit = function(ev) {
  ev.preventDefault();
  $markdown.value = 'Pending....';
  const type = document.querySelector('#format:checked').value;
  const pluginName = $pluginName.value;

  let url = './plugin/' + encodeURIComponent(pluginName) + type;
  if (pluginName.match(/^[0-9]+$/i)) {
    url = '/confluence-page-id/' + encodeURIComponent(pluginName) + type;
  } else if (pluginName.match(/^https?\:\/\//)) {
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
                document.saveAs(blob, pluginName + type);
              });
        } else {
          return response.text().then((body) => $markdown.value = body);
        }
      })
      .catch((err) => $markdown.value = 'Error: ' + err.toString());
};

$pluginName.addEventListener('keydown', function(e) {
  if (e.key == 'Enter') {
    e.preventDefault();
    onsubmit(e);
    return;
  }
});
$convertButton.addEventListener('click', onsubmit);
$markdown.value = '';
