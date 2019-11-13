import './ui.css'

document.getElementById('file').onchange = (e) => {
  const btn = document.getElementById('apply');
  btn.removeAttribute('disabled');
}

document.getElementById('apply').onclick = () => {
  const cleanName = (document.getElementById('clean-name') as HTMLInputElement).checked;
  const addStyles = (document.getElementById('add-styles') as HTMLInputElement).checked;
  const input = document.getElementById('file') as HTMLInputElement;
  const file = input.files[0];
  var reader = new FileReader();
  reader.onloadend = (e) => {
    const fileContent = e.target.result;
    parent.postMessage({ pluginMessage: { type: 'update-styles', fileContent, cleanName, addStyles } }, '*')
  }
  reader.readAsText(file);
}