const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// CARGAR CONFIGURACIÓN DESDE EL ARCHIVO JSON (O USAR VALORES POR DEFECTO)
const loadConfig = (configPath) => {
  let config = {};
  try {
    const configFile = fs.readFileSync(configPath);
    config = JSON.parse(configFile);
  } 
  catch (error) {
    console.error(`! ERROR: NO SE PUDO LEER ${configPath}, USANDO CONFIGURACIÓN POR DEFECTO !`, error);
    process.exit(1);
  }
  return config;
};

// LEER CSV Y DEVOLVER CABECERAS Y RESULTADOS
const readCSV = (filePath) => new Promise((resolve, reject) => {
  const results = [];
  let headers = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('headers', (headerList) => { headers = headerList; }) 
    .on('data', (data) => results.push(data)) 
    .on('end', () => resolve({ headers, results })) 
    .on('error', reject); 
});

// GUARDAR CSV
const saveToCSV = (data, headers, fileName) => {
  const csvContent = [
    headers.join(','), 
    ...data.map(row => headers.map(header => row[header] ?? '').join(','))
  ].join('\n');
  fs.writeFileSync(fileName, csvContent); // ESCRIBIR CSV
  console.log(`[ GUARDADO: ${fileName} ]`); // CONFIRMAR GUARDADO
};

// PREPARAR DATOS Y MANEJAR NULOS
async function normalizes(inputFile, normalizeFile) {
  try {
    const { headers, results } = await readCSV(inputFile); // LEER CSV
    const { results: results1 } = await readCSV(normalizeFile); // LEER ARCHIVO DE NORMALIZACIÓN
    if (results1.length === 0) throw new Error('ARCHIVO DE NORMALIZACIÓN VACÍO.');
    const values1 = results1[0];
    return results.map(row => {
      // NORMALIZAR DATOS
      return headers.reduce((newRow, header) => {
        newRow[header] = row[header] === null || row[header] === 'null' || row[header] === '' || row[header] === '0'
          ? (values1[header] === '0' ? '0' : null)
          : row[header];
        return newRow;
      }, {});
    });
  } 
  catch (error) {
    console.error('! ERROR ! ', error);
  }
}

// FUNCIÓN PARA NORMALIZAR UN VALOR
function normalizeValue(value, min, max, newMin, newMax) {
  if (min === max) { // SI TODOS LOS VALORES SON IGUALES
    return 1; // ASIGNAR 1 A TODA LA COLUMNA
  }
  const normalized = (value - min) / (max - min); // NORMALIZAR ENTRE 0 Y 1
  return normalized * (newMax - newMin) + newMin;  // ESCALA AL NUEVO RANGO
}

// OBTENER MIN Y MAX DE UNA COLUMNA
function getColumnMinAndMax(data, column) {
  let min = Infinity;
  let max = -Infinity;
  data.forEach(row => {
    const value = parseFloat(row[column]);
    if (!isNaN(value)) {
      if (value < min) min = value;
      if (value > max) max = value;
    }
  });
  return { min, max };
}

// PREPARAR DATOS PARA LA RED NEURONAL
async function normalize(inputFile, normalizeFile) {
  try {
    const { headers, results } = await readCSV(inputFile);

    // OBTENER NUEVOS MÍNIMO Y MÁXIMO DE LA SEGUNDA Y TERCERA FILA
    const { results: results1 } = await readCSV(normalizeFile);
    if (results1.length === 0) throw new Error('ARCHIVO DE NORMALIZACIÓN VACÍO.');

    // OBTENER MIN Y MAX PARA CADA COLUMNA
    const minMaxValues = {};
    headers.forEach(header => {
      const { min, max } = getColumnMinAndMax(results, header);
      minMaxValues[header] = { min, max };
    });

    // NORMALIZAR LOS DATOS
    const normalizedData = results.map(row => {
      const newRow = {};
      headers.forEach(header => {
        const { min, max } = minMaxValues[header];
        if (!isNaN(min) && !isNaN(max) && min !== max) {
          // NORMALIZAR Y MANEJAR CASO DE VALOR CERO
          const normalizedValue = normalizeValue(row[header], min, max, parseFloat(results1[0][header]), parseFloat(results1[1][header]));
          newRow[header] = (normalizedValue === 0) ? '0' : normalizedValue; // ASIGNAR '0' EN VEZ DE 0
        } 
        else {
          newRow[header] = row[header];  // SIN CAMBIOS SI NO SE PUEDE NORMALIZAR
        }
      });
      return newRow;
    });
    return normalizedData;
  } 
  catch (error) {
    console.error('! ERROR ! ', error);
  }
}

// EJECUTAR Y GUARDAR RESULTADOS
const args = process.argv.slice(2);
if (args.length !== 4) {
  console.error('! ERROR: SE REQUIEREN INPUT, OUTPUT, ARCHIVO DE NULOS Y CONFIGURACIÓN !'); 
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];
const normalizeFile = args[2];
const configPath = args[3] ? args[3] : './config.json';

// CARGAR CONFIGURACIÓN
const config = loadConfig(configPath);

// PROCESAR NULOS Y NORMALIZAR
normalizes(inputFile, normalizeFile)
  .then(data => normalize(inputFile, normalizeFile))
  .then(data => {
    saveToCSV(data, data.length ? Object.keys(data[0]) : [], outputFile); 
  })
  .catch(error => console.error('! ERROR ! ', error));
