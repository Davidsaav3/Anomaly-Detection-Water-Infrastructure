const { IsolationForest } = require('isolation-forest-visualization');
const csv = require('csv-parser');
const fs = require('fs');
const { plot,plot2,plot3 } = require('./plot');
const { calculateMetrics, saveMetricsToCSV } = require('./metrics');

// OBTENER PARÁMETROS DE LA LÍNEA DE COMANDOS
const args = process.argv.slice(2);
if (args.length < 6) {
    console.error('! ERROR: INPUT, MODEL, RESULT, METRICS, PLOT, CONFIG NEEDED !');
    process.exit(1);
}

const inputFilename = args[0]; // ARCHIVO DE DATOS DE ENTRADA
const isolationModelPath = args[1]; // ARCHIVO DEL MODELO
const resultsCSVPath = args[2]; // ARCHIVO DE RESULTADOS
const metricsCSVPath = args[3]; // ARCHIVO DE MÉTRICAS
const weightFilePath = args[4]; // ARCHIVO DE PESOS
const plotCSVPath = args[5]; // ARCHIVO DE PLOT
const plot2CSVPath = args[6]; // ARCHIVO DE PLOT 2
const plot3CSVPath = args[7]; // ARCHIVO DE PLOT 3
const configPath = args[8] ? args[8] : '.././config.json'; // ARCHIVO DE CONFIGURACIÓN

let config = {};

// CARGAR CONFIGURACIÓN DESDE EL ARCHIVO JSON
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
} 
catch (error) {
  console.error(`! ERROR: NO SE PUDO LEER ${configPath}, USANDO CONFIGURACIÓN POR DEFECTO !`, error);
  process.exit(1);
}

// LEER CSV
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

// LEER ARCHIVO DE PESOS
const readWeightCSV = async (filePath) => {
    if (!filePath) {
        return null; // SI NO SE PROPORCIONA ARCHIVO DE PESOS, RETORNAR NULL
    }
    const weights = await readCSV(filePath);
    return Object.values(weights[0]).map(parseFloat); // OBTENER PESOS COMO NÚMEROS
};

// PREPROCESAR DATOS: APLICAR PESOS
const preprocessData = (data, weights) => {
    return data.map(row => {
        const rowData = Object.values(row).map(parseFloat);
        return rowData.map((value, index) => !isNaN(value) && weights ? value * weights[index] : value); // APLICAR PESO SI NO ES NaN
    }).filter(row => row.every(num => !isNaN(num))); // FILTRAR FILAS CON VALORES NO NÚMERICOS
};

// EJECUTAR ISOLATION FOREST
const runIsolationForest = async () => {
    try {
        const csvData = await readCSV(inputFilename); // Leer datos
        const weights = await readWeightCSV(weightFilePath); // Leer pesos si se proporcionan
        let features = preprocessData(csvData, weights); // Preprocesar datos y aplicar pesos

        if (features.length < 10) {
            console.error('! ERROR: Se necesitan al menos 10 filas !');
            return;
        }

        // Crear el modelo de Isolation Forest
        const myForest = new IsolationForest(features, config.index.trees, features.length); 
        const scores = myForest.dataAnomalyScore(config.index.score); // Obtener los puntajes de anomalías

        // Generar salida detallada de anomalías
        const datos = scores.map((score, index) => {
            const isAnomaly = score > config.index.threshold; // Determinar si es una anomalía
            const value = features[index][config.index.value]; // Obtener valor
            const date = csvData[index][config.index.date]; // Obtener fecha
            const rowFeatures = features[index]; // Guardar las características de cada fila
            const id = csvData[index][config.index.id] || index; // Asignar un identificador único (puede ser el índice si no hay una columna de id)

            return [{ value, date, rowFeatures, id, score }, isAnomaly]; // Devolver resultado con detalles
        });

        // Extraer etiquetas reales
        const y_true = csvData.map(row => parseInt(row[config.index.truth])); // Asumiendo que existe una columna "truth"
        const y_pred = datos.map(([, isAnomaly]) => isAnomaly ? 1 : 0); // Predicciones

        // Calcular métricas
        const metrics = calculateMetrics(y_true, y_pred);

        // Guardar métricas en CSV
        saveMetricsToCSV(metrics, metricsCSVPath);

        // Guardar resultados detallados en CSV
        const resultsHeader = 'id,features,value,date,score,anomaly\n';
        const resultsRows = datos.map(({ 0: { id, rowFeatures, value, date, score }, 1: isAnomaly }) => 
            `${id},${JSON.stringify(rowFeatures)},${value},${date},${score},${isAnomaly}`).join('\n');
        fs.writeFileSync(resultsCSVPath, resultsHeader + resultsRows, 'utf8');
        console.log(`[ ISOLATION: ${resultsCSVPath} ]`);

        // Guardar el modelo en JSON
        fs.writeFileSync(isolationModelPath, JSON.stringify(myForest, null, 2), 'utf8');
        console.log(`[ MODEL: ${isolationModelPath}]`);

        // Graficar resultados con plot
        plot(datos, features, csvData, plotCSVPath, config); // Llamar a la función plot para graficar los resultados
        // Graficar resultados adicionales con plot2
        plot2(datos, features, csvData, plot2CSVPath, config); // Llamar a la función plot2 para graficar otros resultados
        // Graficar resultados adicionales con plot2
        plot3(datos, features, csvData, plot3CSVPath, config); // Llamar a la función plot3 para graficar otros resultados

    } 
    catch (error) {
        console.error('! ERROR !', error);
    }
};

runIsolationForest();
