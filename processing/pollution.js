const fs = require('fs');
const csv = require('csv-parser');

// [ OBTENER PARÁMETROS ]
const args = process.argv.slice(2);
if (args.length === 1 && (args[0] === '-c' || args[0] === '-C')) {
  console.log(`input:3,output:1,config:1`);
  console.log(`./results/waterInfrastructure/319.csv   3  3    ./results/waterInfrastructure/6612_3.csv    ./exec/sensorsConfig.json`);
  process.exit(0);
}
if (args.length < 4) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

const inputFile = args[0];       // Archivo de entrada
const numLinesToContaminate = parseInt(args[1]);  // Número de filas a contaminar
const contaminationFactor = parseFloat(args[2]);  // Factor de contaminación
const outputFile = args[3];      // Archivo de salida

// Columnas a excluir de la contaminación
const excludedColumns = ['num', 'month', 'day', 'hour', 'min'];

// [ LEER CSV ORIGINAL ]
const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

// [ GUARDAR CSV ]
function saveCSV(data, headers, fileName) {
  const csvContent = [
    headers.join(','), // Cabeceras
    ...data.map(row => headers.map(header => row[header] !== undefined ? row[header] : '').join(',')) // Rellenar archivo
  ].join('\n'); // Unir los elementos con comas
  fs.writeFileSync(fileName, csvContent);
  console.log(`[ SAVED: ${fileName} ]`);
}

// [ APLICAR CONTAMINACIÓN A FILAS ]
function contaminateRows(results) {
  const selectedIndices = [];
  
  while (selectedIndices.length < numLinesToContaminate) {
    const randomIndex = Math.floor(Math.random() * results.length);
    if (!selectedIndices.includes(randomIndex)) {
      selectedIndices.push(randomIndex);
    }
  }

  // Inicializar la columna `truth` para todas las filas como `0`
  results.forEach(row => {
    row['truth'] = 0; // Asignar por defecto no contaminada
  });

  selectedIndices.forEach(index => {
    const row = results[index];
    for (const key in row) {
      if (!excludedColumns.includes(key) && !isNaN(row[key])) {
        row[key] = parseFloat(row[key]) * parseFloat(contaminationFactor); // Aplicar contaminación
      }
    }
    row['truth'] = 1; // Marcar como contaminada
  });

  return results;
}

// [ MAIN ]
async function main(inputFile, outputFile) {
  try {
    const results = await readCSV(inputFile);
    const updatedResults = contaminateRows(results);
    const headers = Object.keys(results[0]);
    saveCSV(updatedResults, headers, outputFile);
  } 
  catch (error) {
    console.error('ERROR MAIN: ', error); // Error de procesamiento
  }
}

main(inputFile, outputFile);
