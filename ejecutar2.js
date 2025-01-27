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

async function automateIsolationForest() {
  try {
    const configFile = './exec/waterConfig.json';
    const auxiliaryFile = './results/iot/auxiliaryWeight.csv';

    // Iterar sobre los valores incrementales de 10 a 200 (de 10 en 10)
    for (let i = 10; i <= 200; i += 10) {
      // Construir las rutas de los archivos dinámicamente
      const deleteTruthFile = `./results/umbral/deleteTruth_45_${i}.csv`;
      const pollutionFile = `./results/umbral/pollution_45_${i}.csv`;
      const outputDir = `./results/umbral/45_${i}/`;
      const isolationFile = `${outputDir}isolation.csv`;
      const scoresFile = `${outputDir}scores.csv`;
      const metricsFile = `${outputDir}metrics.csv`;
      const imageDir = `${outputDir}image`;

      // Comando para ejecutar isolationForest (primer comando)
      console.log(`Running: node ./models/isolationForest/index.js ${deleteTruthFile} ${pollutionFile} ${auxiliaryFile} 1 20 ${outputDir} isolation.csv scores.csv metrics.csv image ${configFile}`);
      await executeCommand(`node ./models/isolationForest/index.js ${deleteTruthFile} ${pollutionFile} ${auxiliaryFile} 1 20 ${outputDir} isolation.csv scores.csv metrics.csv image ${configFile}`);
      console.log(`[ SAVED: ${isolationFile} ]`);

    }

  } catch (error) {
    console.error('Error during automation:', error);
  }
}

// Llamar a la función para automatizar el proceso
automateIsolationForest();
