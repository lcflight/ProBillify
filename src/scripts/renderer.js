const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', (event) => {
  const dropzone = document.getElementById('dropzone');
  const csvContentDiv = document.getElementById('csv-content');
  const exportButton = document.getElementById('export-button');
  const unitPriceForm = document.getElementById('unit-price-form');

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();

    let file = e.dataTransfer.files[0];
    ipcRenderer.send('fileDropped', file.path);
  });

  ipcRenderer.on('fileParsed', (event, data) => {
    csvContentDiv.innerText = JSON.stringify(data, null, 2);
  });

  let projectNames = [];

  ipcRenderer.on('unitPrices', (event, unitPrices) => {
    projectNames.forEach((projectName) => {
      const input = document.getElementById(projectName);
      if (input && unitPrices[projectName]) {
        // Set the value of the input field to the unit price
        input.value = unitPrices[projectName];
      }
    });
  });

  ipcRenderer.on('projectNames', (event, names) => {
    projectNames = names; // Update projectNames when a 'projectNames' event is received

    projectNames.forEach((projectName) => {
      const div = document.createElement('div'); // Create a new div

      const label = document.createElement('label');
      label.textContent = `Enter the unit price for ${projectName}: `;
      div.appendChild(label); // Add the label to the div

      const input = document.createElement('input');
      input.type = 'number';
      input.id = projectName;
      div.appendChild(input); // Add the input to the div

      unitPriceForm.appendChild(div); // Add the div to the form
    });

    const button = document.createElement('button');
    button.textContent = 'Submit';
    button.addEventListener('click', () => {
      const unitPrices = projectNames.reduce((prices, projectName) => {
        prices[projectName] = Number(
          document.getElementById(projectName).value,
        );
        return prices;
      }, {});
      ipcRenderer.send('unitPrices', unitPrices);
    });
    unitPriceForm.appendChild(button);

    // Emit the 'getUnitPrices' event after the input fields are created
    ipcRenderer.send('getUnitPrices');
  });

  exportButton.addEventListener('click', () => {
    try {
      const csvData = JSON.parse(csvContentDiv.innerText);
      ipcRenderer.send('exportPdf', csvData);
      console.log('exportButton clicked');
    } catch (error) {
      console.error('Failed to parse CSV data:', error);
    }
  });
});
