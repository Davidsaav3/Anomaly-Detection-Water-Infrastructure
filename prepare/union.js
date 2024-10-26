const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// OBTENER PARÁMETROS DE LA LÍNEA DE COMANDOS
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('! ERROR: INPUT, OUTPUT, AND CONFIG NEEDED !');
  process.exit(1);
}

let config = {};

const inputFile = args[0];
const configPath = args[2] ? args[2] : './config.json';

// CARGAR CONFIGURACIÓN DESDE EL ARCHIVO JSON (O USAR VALORES POR DEFECTO)
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
} 
catch (error) {
  console.error(`! ERROR: NO SE PUDO LEER ${configPath}, USANDO CONFIGURACIÓN POR DEFECTO !`, error);
  process.exit(1);
}

// LEER CSV ORIGINAL
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    let headers = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', headerList => { headers = headerList; })
      .on('data', data => results.push(data))
      .on('end', () => resolve({ headers, results }))
      .on('error', reject);
  });
}

// GUARDAR CSV
const saveToCSV = (data, headers, fileName) => {
  const csvContent = [
    headers.join(','), 
    ...data.map(row => headers.map(header => row[header] ?? '').join(','))
  ].join('\n');
  fs.writeFileSync(fileName, csvContent); // ESCRIBIR CSV
  console.log(`[ UNION: ${fileName} ]`); // CONFIRMAR GUARDADO
};

// UNIR COLUMNAS
function uniteColumns(data, columnsToUnite) {
  return data.map(row => {
    const newRow = { ...row };
    const newColumnName = columnsToUnite.join('_'); // NOMBRE NUEVO CON BARRA BAJA

    // UNIR VALORES SIN COMILLAS SIMPLES Y AÑADIR COMILLAS AL FINAL
    const joinedValues = columnsToUnite.map(col => row[col].replace(/'/g, '')).join('_'); // QUITAR COMILLAS SIMPLES
    newRow[newColumnName] = `'${joinedValues}'`; // AÑADIR COMILLAS AL VALOR UNIDO
    
    return newRow; // DEVOLVER LA NUEVA FILA
  });
}


// PREPARAR DATOS
async function prepareData(inputFile) {
  try {
    const { headers, results } = await readCSV(inputFile);

    // OBTENER COLUMNAS DE LA CONFIGURACIÓN
    const columnsToUnite = config.union.union_files; // Array con los nombres de las columnas a unir

    // UNIR COLUMNAS Y GUARDAR
    const unitedData = uniteColumns(results, columnsToUnite);
    const newHeaders = [...headers, columnsToUnite.join('_')]; // Agregar nueva cabecera
    saveToCSV(unitedData, newHeaders, args[1]); // NOMBRE DE SALIDA
  } catch (error) {
    console.error('ERROR AL PROCESAR:', error);
  }
}

prepareData(inputFile);
