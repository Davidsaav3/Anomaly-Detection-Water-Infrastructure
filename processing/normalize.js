const fs = require('fs');
const csv = require('csv-parser');

// [ EJECUTAR Y GUARDAR RESULTADOS ]
const args = process.argv.slice(2);
if (args.length !== 5) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];
const normalizeFile = args[2];
const outputMinMaxFile = args[3];
const configPath = args[4] ? args[4] : './sensors_config.json';

// [ CARGAR CONFIGURACIÓN ]
const loadConfig = (configPath) => {
  let config = {};
  try {
    const configFile = fs.readFileSync(configPath);
    config = JSON.parse(configFile);
  }
  catch (error) {
    console.error(`! ERROR: CONFIG ${configPath} !`, error);
    process.exit(1);
  }
  return config;
};
const config = loadConfig(configPath);

// [ LEER CSV Y DEVOLVER CABECERAS Y RESULTADOS ]
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

// [ GUARDAR CSV ]
const saveCSV = (data, headers, fileName) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header] ?? '').join(',')) // FORMAR ARCHIVO
  ].join('\n');
  fs.writeFileSync(fileName, csvContent);
  console.log(`[ NORMALIZE: ${fileName} ]`);
};

// [ *** NORMALIZAR UN VALOR ]
function normalizeValue(value, min, max, newMin, newMax) {
  if (min === max) { // SI TODOS LOS VALORES SON IGUALES EN LA COLUMNA
    return 0; // ASIGNAR 0 A TODA LA COLUMNA
  }
  const normalized = (value - min) / (max - min); // NORMALIZAR ENTRE 0 Y 1 PRIMERO
  return normalized * (newMax - newMin) + newMin;  // ESCALAR RANGO DEFINIDO EN EL ARCHIVO
}

// [ *** MIN Y MAX DE UNA COLUMNA ]
function columnMinMax(data, column) { // OBTENER MÍNIMO Y MÁXIMO
  let min = Infinity;
  let max = -Infinity;
  data.forEach(row => {
    const value = parseFloat(row[column]); // CONVERTIR A FLOAT
    if (!isNaN(value)) {
      if (value < min) min = value; // ACTUALIZAR MIN
      if (value > max) max = value; // ACTUALIZAR MAX
    }
  });
  return { min, max }; // RETORNAR MIN Y MAX
}

// [ GUARDAR MAX MIN ]
function saveMinMaxToCSV(headers, minMaxValues, outputFile) {
  const headerLine = headers.join(',');
  const maxLine = headers.map(header => minMaxValues[header].max).join(',');
  const minLine = headers.map(header => minMaxValues[header].min).join(',');
  
  const csvContent = `${headerLine}\n${maxLine}\n${minLine}\n`;
  
  fs.writeFile(outputFile, csvContent, (error) => {
    if (error) console.error('Error al guardar el archivo:', error);
    else console.log('Archivo guardado como', outputFile);
  });
}

// [ *** PREPARAR DATOS ]
async function normalizeData(inputFile, normalizeFile, outputMinMaxFile) {
  try {
    const { headers, results } = await readCSV(inputFile); // LEER DATOS
    const { results: results1 } = await readCSV(normalizeFile); // LEER NORMALIZACIÓN
    
    if (results1.length === 0) throw new Error('EMPTY NORMALIZATION FILE'); // VERIFICAR VACÍO
    const minMaxValues = {};

    headers.forEach(header => {
      const { min, max } = columnMinMax(results, header); // CALCULAR MIN-MAX
      minMaxValues[header] = { min, max };
    });
    saveMinMaxToCSV(headers, minMaxValues, outputMinMaxFile); // GUARDAR MAX Y MIN
    const normalizedData = results.map(row => {
      const newRow = {};
      headers.forEach(header => {
        const { min, max } = minMaxValues[header];
        if (!isNaN(min) && !isNaN(max) && min !== max) {
          const normalizedValue = normalizeValue(row[header], min, max, parseFloat(results1[0][header]), parseFloat(results1[1][header]));
          newRow[header] = (normalizedValue === 0) ? '0' : normalizedValue;
        } else {
          newRow[header] = row[header];
        }
      });
      return newRow;
    });
    return normalizedData;
  } catch (error) {
    console.error('! ERROR ! ', error);
  }
}

// [ MAIN ]
async function main(inputFile, normalizeFile) {
  try {
    const { headers, results } = await readCSV(inputFile); // LEER CSV 
    const { results: results1 } = await readCSV(normalizeFile); // LEER NORMALIZACIÓN
    if (results1.length === 0) throw new Error('EMPTY NORMALIZATION FILE'); // ARCHIVO DE NORMALIZACIÓN NO VACÍO
    const values1 = results1[0]; // VALORES DE NORMALIZACIÓN
    return results.map(row => { // RECORRER FILAS CSV 
      return headers.reduce((newRow, header) => { 
        newRow[header] = row[header]; // MANTENER VALOR ORIGINAL
        return newRow;
      }, {});
    });
  }
  catch (error) {
    console.error('! ERROR ! ', error); 
  }
}

main(inputFile, normalizeFile)
  .then(data => normalizeData(inputFile, normalizeFile, outputMinMaxFile))
  .then(data => {
    saveCSV(data, data.length ? Object.keys(data[0]) : [], outputFile); // GUARDAR
  })
  .catch(error => console.error('! ERROR ! ', error));
