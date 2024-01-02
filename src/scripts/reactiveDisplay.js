const dropzone = document.getElementById('dropzone');

dropzone.addEventListener('dragenter', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.remove('dragover');
  let file = e.dataTransfer.files[0];
  ipcRenderer.send('fileDropped', file.path);
});
