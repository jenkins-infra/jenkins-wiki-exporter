const $markdown = document.getElementById('markdown');
const $pluginName = document.getElementById('pluginName');
const $convertButton = document.getElementById('convertButton');

const onsubmit = function(ev) {
  ev.preventDefault();
  const pluginName = $pluginName.value;

  $markdown.value = 'Pending....';
  const type = document.querySelector('#format:checked').value;
  fetch('./plugin/' + pluginName + type, {
    responseType: 'blob',
  })
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
