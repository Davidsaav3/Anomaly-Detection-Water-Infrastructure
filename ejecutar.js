const { exec } = require('child_process');
const path = require('path');

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing command: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`Error in stderr: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
}

async function automateProcess() {
  try {
    const file1 = './results/umbral/scores4539.csv';
    const configFile = './exec/waterConfig.json';
    let i= 0;
    
    // Iterar sobre los valores incrementales de 1.1 a 3.0 (de 0.1 en 0.1)
    for (let value = 1; value <= 3; value += 0.1) {
        i= i+10;

        const file2 = `./results/umbral/pollution_45_${i}.csv`;
        const outputFile2 = `./results/umbral/deleteTruth_45_${i}.csv`;

        // Ejecutar el primer comando (pollution.js) con el valor incremental
        console.log(`Running: node ./processing/pollution.js ${file1} ${file2} 45 ${value.toFixed(1)} ${configFile}`);
        await executeCommand(`node ./processing/pollution.js ${file1} ${file2} 45 ${value.toFixed(1)} ${configFile}`);
        console.log(`[ SAVED: ${file2} ]`);

        // Ejecutar el segundo comando (deleteColumn.js)
        console.log(`Running: node ./processing/deleteColumn.js ${file2} ${outputFile2} ${configFile}`);
        await executeCommand(`node ./processing/deleteColumn.js ${file2} ${outputFile2} ${configFile}`);
        console.log(`[ DELETE COLUMN: ${outputFile2} ]`);
      
    }

  } catch (error) {
    console.error('Error during automation:', error);
  }
}

// Llamar a la función para automatizar el proceso
automateProcess();
