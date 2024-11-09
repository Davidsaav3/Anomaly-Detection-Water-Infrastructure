const fs = require('fs');
const csv = require('csv-parser');

// [ OBTENER PARÁMETROS ]
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

const inputFile = args[0]; // ENTRADA
const outputFile = args[1]; // SALIDA
const percentage = parseFloat(args[2]); // PORCENTAJE

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
    headers.join(','), // CABECERAS
    ...data.map(row => headers.map(header => row[header] !== undefined ? row[header] : '').join(',')) // RELLENAR ARCHIVO DE CADA GRUPO
  ].join('\n'); // UNIR LOS ELEMENTOS CON COMAS
  fs.writeFileSync(fileName, csvContent);
  console.log(`[ DATA DISPERSION: ${fileName} ]`);
}

// [ FILTRAR PORCENTAJE ALEATORIO ]
function filterByPercentage(data, percentage) {
  const totalRows = data.length;
  const rowsToKeep = Math.floor((percentage / 100) * totalRows);

  // Crear una lista de índices aleatorios seleccionados sin alterar el orden
  const selectedIndices = new Set();
  while (selectedIndices.size < rowsToKeep) {
    const randomIndex = Math.floor(Math.random() * totalRows);
    selectedIndices.add(randomIndex);
  }

  // Filtrar las filas usando los índices seleccionados y mantener el orden
  return data.filter((_, index) => selectedIndices.has(index));
}

// [ MAIN ]
async function main(inputFile, outputFile, percentage) {
  try {
    const results = await readCSV(inputFile);
    const filteredResults = filterByPercentage(results, percentage); // FILTRAR PORCENTAJE
    const headers = Object.keys(filteredResults[0]); // CABECERAS ORIGINALES
    saveCSV(filteredResults, headers, outputFile);
  } catch (error) {
    console.error('ERROR MAIN: ', error); // ERROR DE PROCESAMIENTO
  }
}

main(inputFile, outputFile, percentage);