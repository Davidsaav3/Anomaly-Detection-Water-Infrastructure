const fs = require('fs');
const csv = require('csv-parser');

// [ OBTENER PARÁMETROS ]
const args = process.argv.slice(2);
if (args.length !== 4) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

const inputFile = args[0];
const dictFile = args[1];
const outputFile = args[2];
const configPath = args[3];
let config = {};

// [ CARGAR CONFIGURACIÓN ]
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
}
catch (error) {
  console.error(`! ERROR: CONFIG ${configPath} !`, error);
  process.exit(1);
}

// [ LEER CSV ]
const readCSV = (filePath) => new Promise((resolve, reject) => {
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => resolve(results))
    .on('error', (error) => reject(error));
});

// [ GUARDAR CSV ]
const saveCSV = (data, fileName) => {
  const csvContent = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).map(value => value === null ? 'null' : value).join(','))
  ].join('\n');
  fs.writeFileSync(fileName, csvContent);
  console.log(`[ ENCODING: ${fileName} ]`);
};

// [ GUARDAR DICCIONARIO ]
const saveDictionary = (dictionaries, dictFileName) => {
  const dictContent = [
    config.encoding.headers,
    ...Object.entries(dictionaries).flatMap(([header, dictionary]) =>
      Object.entries(dictionary)
        .sort(([, a], [, b]) => a - b)
        .map(([key, value]) => `${header},${key},${value}`)
    )
  ].join('\n');
  fs.writeFileSync(dictFileName, dictContent);
  console.log(`[ DICTIONARY: ${dictFileName} ]`);
};

// [ LEER DICCIONARIO EXISTENTE ]
const loadDictionary = async (dictFilePath) => {
  const dictionaries = {};
  if (fs.existsSync(dictFilePath)) {
    await new Promise((resolve, reject) => { // PROMESA PARA LEER
      fs.createReadStream(dictFilePath) // LEER
        .pipe(csv())
        .on('data', (row) => {
          if (!dictionaries[row.header]) dictionaries[row.header] = {};
          dictionaries[row.header][row.value] = parseInt(row.key, 10); // PASAR TERCERA COLUMNA A INT
        })
        .on('end', () => resolve())
        .on('error', (error) => reject(error));
    });
  }
  return dictionaries;
};

// // //

// [ MEDIA DE COLUMNA ]
function calculateMean(column) {
  const numericValues = column.filter(val => !isNaN(val)).map(Number);
  if (numericValues.length === 0) return null; // VERIFICAR VALORES NUMÉRICOS 
  const sum = numericValues.reduce((a, b) => a + b, 0); // CALCULAR SUMA 
  return sum / numericValues.length; // DEVOLVER MEDIA 
}

// [ MEDIANA DE COLUMNA ]
function calculateMedian(column) {
  const numericValues = column.filter(val => !isNaN(val)).map(Number);
  if (numericValues.length === 0) return null; // VERIFICAR VALORES NUMÉRICOS 
  numericValues.sort((a, b) => a - b); // ORDENAR VALORES 
  const middle = Math.floor(numericValues.length / 2); // ENCONTRAR MITAD 
  return numericValues.length % 2 === 0 // COMPROBAR PAR O IMPAR 
    ? (numericValues[middle - 1] + numericValues[middle]) / 2 // RETORNAR MEDIA DE MEDIANA 
    : numericValues[middle]; // DEVOLVER MEDIANA 
}

// [ GESTIONAR RELLENADO: #fill# ]
const fillHandling = config.encoding.fillTransform || "none"; // [ "none", "zero", "one", "mean", "median" ]
function fillValues(value, columnValues) {
  if (value === config.encoding.expandedValue) {
    switch (fillHandling) {
      case "zero":
        return 0;
      case "one":
        return 1;
      case "mean":
        return calculateMean(columnValues); // MEDIA
      case "median":
        return calculateMedian(columnValues); // MEDIANA
      default:
        return value; // NO HACER NADA
    }
  }
  return value;
}

// [ STRING TO NUMERIC ]
function stringToNumeric(existingDictionary = {}) {
  const uniqueMapping = existingDictionary; // INICIALIZAR
  let uniqueCounter = Object.keys(uniqueMapping).length; // CONTADOR DE VALORES ÚNICOS 
  const seenValues = new Set(Object.keys(uniqueMapping)); // CONJUNTO DE VALORES VIVIDOS 
  return (value) => {
    if (!seenValues.has(value)) { // VALOR ES NUEVO ?
      uniqueMapping[value] = uniqueCounter++; // ASIGNAR NUEVO ÍNDICE 
      seenValues.add(value); // AGREGAR VALOR A CONJUNTO 
    }
    return uniqueMapping[value]; // DEVOLVER ÍNDICE ASIGNADO 
  };
}

// [ *** VALOR ES NÚMERO ? ]
function isNumeric(value) {
  return !isNaN(value) && !isNaN(parseFloat(value)); // ES INT O FLOAT ?
}

// [ main ]
const main = async (inputFilename, dictFilename) => { // TRANSFORMAR A NÚMERICO
  const existingDictionaries = await loadDictionary(dictFilename); // CARGAR DICCIONARIOS
  const data = await readCSV(inputFilename); // LEER CSV
  const dictionaries = { ...existingDictionaries }; // COPIAR DICCIONARIOS
  const columnValues = {}; // VALORES DE COLUMNA
  data.forEach(row => { // RECORRER FILAS
    for (const key in row) { // RECORRER CLAVES
      if (!columnValues[key]) columnValues[key] = []; // INICIALIZAR
      columnValues[key].push(row[key]); // AGREGAR VALOR
    }
  });
  const transformedData = data.map(row => { // TRANSFORMAR DATOS
    const newRow = {}; // NUEVA FILA
    for (const key in row) {
      let value = row[key]; // OBTENER VALORES
      // RELLENAR SI ES NULO O CADENA VACÍA
      if (value === null || value === '' || value === undefined || value === 'null') {
        newRow[key] = null; // MANTENER COMO NULO
        continue; 
      }
      value = fillValues(value, columnValues[key]); // RELLENAR #fill#
      if (!dictionaries[key]) dictionaries[key] = {}; // INICIALIZAR DICCIONARIO
      const getNumericValue = stringToNumeric(dictionaries[key]); // OBTENER VALOR NUMÉRICO
      // Comprobar si el valor es numérico
      if (typeof value === 'string' && isNumeric(value.trim())) {
        value = parseFloat(value.trim()); // CONVERTIR A NÚMERICO
      } 
      else {
        value = getNumericValue(value); // CONVERTIR A NÚMERICO
      }
      newRow[key] = value; // ASIGNAR EL VALOR TRANSFORMADO
    }
    return newRow; 
  });

  return { transformedData, dictionaries }; // RETORNAR RESULTADOS
};
main(inputFile, dictFile)
  .then(({ transformedData, dictionaries }) => {
    saveCSV(transformedData, outputFile); // GUARDAR CSV
    saveDictionary(dictionaries, dictFile); // GUARDAR DICCIONARIO
  })
  .catch(error => console.error('! ERROR ! ', error));
