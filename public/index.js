const $markdown = document.getElementById('markdown');
const $pluginName = document.getElementById('pluginName');
const $convertButton = document.getElementById('convertButton');

const onsubmit = function(ev) {
  ev.preventDefault();
  const pluginName = $pluginName.value;

  $markdown.value = 'Pending....';
  const type = document.querySelector('#format:checked').value;
  if (type.endsWith('.zip')) {
    fetch('./plugin/' + pluginName + type, {
      responseType: 'blob',
    })
        .then(function(response) {
          if (!response.ok) {
            throw Error(response.statusText);
          }
          return response;
        })
        .then((response) => response.blob())
        .then((blob) => {
          $markdown.value = 'Saving...';
          saveAs(blob, pluginName + type);
        });
  } else {
    fetch('./plugin/' + pluginName + type)
        .then(function(response) {
          if (!response.ok) {
            throw Error(response.statusText);
          }
          return response;
        })
        .then((resp) => resp.text())
        .then((body) => $markdown.value = body)
        .catch((err) => $markdown.value = 'Error: ' + err.toString());
  }
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
