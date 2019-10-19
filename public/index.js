const $markdown = document.getElementById('markdown');
const $pluginName = document.getElementById('pluginName');
const $convertButton = document.getElementById('convertButton');

const onsubmit = function(ev) {
  ev.preventDefault();
  const pluginName = $pluginName.value;

  $markdown.value = 'Pending....';
  fetch('./plugin/' + pluginName)
      .then((resp) => resp.text())
      .then((body) => $markdown.value = body)
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
