const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', (event) => {
  // Create header elements
  const leftHeader = document.createElement('h2');
  leftHeader.id = 'left-header';
  leftHeader.style.display = 'none'; // Initially hidden

  const rightHeader = document.createElement('h2');
  rightHeader.id = 'right-header';
  rightHeader.style.display = 'none'; // Initially hidden

  // Get the flex-left and flex-right elements
  const flexLeft = document.getElementById('flex-left');
  const flexRight = document.getElementById('flex-right');

  // Insert headers at the top of flex-left and flex-right
  flexLeft.insertBefore(leftHeader, flexLeft.firstChild);
  flexRight.insertBefore(rightHeader, flexRight.firstChild);

  const dropzone = document.getElementById('dropzone');
  const csvContentDiv = document.getElementById('csv-content');
  const exportButton = document.getElementById('export-button');
  exportButton.style.display = 'none'; // Initially hide the button
  const unitPriceForm = document.getElementById('unit-price-form');

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  // Get the "add-reimbursement" button
  const addReimbursement = document.getElementById('add-reimbursement');

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();

    let file = e.dataTransfer.files[0];
    ipcRenderer.send('fileDropped', file.path);

    // Update header text and make them visible
    leftHeader.textContent = 'Sourse Array';
    leftHeader.style.display = 'block';
    rightHeader.textContent = 'Input Unit Prices';
    rightHeader.style.display = 'block';

    exportButton.style.display = 'block'; // Show the button
    addReimbursement.style.display = 'block'; // Show the button
  });

  ipcRenderer.on('fileParsed', (event, data) => {
    csvContentDiv.innerText = JSON.stringify(data, null, 2);
  });

  let projectNames = [];

  ipcRenderer.on('unitPrices', (event, unitPrices) => {
    projectNames.forEach((projectName) => {
      const input = document.getElementById(projectName);
      if (input && unitPrices[projectName]) {
        input.value = unitPrices[projectName];
      }
    });
  });

  ipcRenderer.on('projectNames', (event, names) => {
    projectNames = names;

    while (unitPriceForm.firstChild) {
      unitPriceForm.removeChild(unitPriceForm.firstChild);
    }

    projectNames.forEach((projectName) => {
      const div = document.createElement('div');

      const input = document.createElement('input');
      input.type = 'number';
      input.id = projectName;
      div.appendChild(input);

      const colon = document.createElement('span');
      colon.textContent = ': ';
      div.appendChild(colon);

      const label = document.createElement('label');
      label.textContent = `${projectName} unit price`;
      div.appendChild(label);

      unitPriceForm.appendChild(div);
    });

    ipcRenderer.send('getUnitPrices');
  });

  exportButton.addEventListener('click', () => {
    try {
      const csvData = JSON.parse(csvContentDiv.innerText);

      // Get unit prices from input fields
      const unitPrices = projectNames.reduce((prices, projectName) => {
        prices[projectName] = Number(
          document.getElementById(projectName).value,
        );
        return prices;
      }, {});

      // Get all input-pair divs
      const inputPairs = Array.from(form.querySelectorAll('.input-pair'));

      // Gather all the data from the input-pairs
      let reimbursements = inputPairs.map((pair) => {
        const titleInput = pair.querySelector('input[name="title"]');
        const valueInput = pair.querySelector('input[name="value"]');

        return {
          title: titleInput.value,
          cost: valueInput.value,
        };
      });

      // Filter out any pairs where either the title or cost is empty
      reimbursements = reimbursements.filter(
        (item) => item.title !== '' && item.cost !== '',
      );

      // Send unit prices to main process
      ipcRenderer.send('unitPrices', unitPrices);

      // Send reimbursements to main process
      ipcRenderer.send('reimbursements', reimbursements);

      // Send data to be exported as PDF
      ipcRenderer.send('exportPdf', csvData, unitPrices, reimbursements);
      console.log('exportButton clicked');
    } catch (error) {
      console.error('Failed to parse CSV data:', error);
    }
  });

  ipcRenderer.on('changeDropzoneId', () => {
    console.log('changeDropzoneId received');
    const dropzone =
      document.getElementById('dropzone') ||
      document.getElementById('dropzone-hidden');
    if (dropzone) {
      if (dropzone.id === 'dropzone') {
        dropzone.id = 'dropzone-hidden';
      } else if (dropzone.id === 'dropzone-hidden') {
        dropzone.id = 'dropzone';
      }
    }
  });

  // Get the form where you want to add the input fields
  const form = document.getElementById('reimbursement-form'); // Replace 'form-id' with the id of your form

  // Add event listener to the button
  addReimbursement.addEventListener('click', () => {
    // Get all input-pair divs
    const inputPairs = Array.from(form.querySelectorAll('.input-pair'));

    // Check if the last pair is filled out
    if (inputPairs.length > 0) {
      const lastPair = inputPairs[inputPairs.length - 1];
      const lastTitleInput = lastPair.querySelector('input[name="title"]');
      const lastValueInput = lastPair.querySelector('input[name="value"]');

      if (lastTitleInput.value === '' || lastValueInput.value === '') {
        // If the last pair is not filled out, return and do not create new inputs
        return;
      }
    }

    // Create a div
    const div = document.createElement('div');
    div.className = 'input-pair'; // Add a class to the div

    // Create title input
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.name = 'title';
    titleInput.placeholder = 'Title';

    // Create value input
    const valueInput = document.createElement('input');
    valueInput.type = 'number';
    valueInput.name = 'value';
    valueInput.placeholder = 'Value';

    // Append inputs to the div
    div.appendChild(titleInput);
    div.appendChild(valueInput);

    // Append div to the form
    form.appendChild(div);
  });
});
