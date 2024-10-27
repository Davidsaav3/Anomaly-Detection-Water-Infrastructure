const { IsolationForest } = require('isolation-forest-visualization');
const csv = require('csv-parser');
const fs = require('fs');
const { plot1, plot2, plot3, plot4, plot5, plot6, plot7 } = require('./plot');

const args = process.argv.slice(2);
if (args.length < 9) {
    console.error('! ERROR: INPUT, SCORES OUTPUT, METRICS OUTPUT, WEIGHT FILE, PLOT PATHS, ITERATIONS, CONFIG NEEDED !');
    process.exit(1);
}

const inputFilename = args[0];
const isolationModelPath = args[1]; // ARCHIVO DEL MODELO
const scoresOutputPath = args[2];
const metricsOutputPath = args[3]; // Nueva ruta para el archivo de métricas
const weightFilePath = args[4];
const plotCSVPath = args[5]; // ARCHIVO DE PLOT
const plot2CSVPath = args[6]; // ARCHIVO DE PLOT 2
const plot3CSVPath = args[7]; // ARCHIVO DE PLOT 3
const plot4CSVPath = args[8]; // ARCHIVO DE PLOT
const plot5CSVPath = args[9]; // ARCHIVO DE PLOT 2
const plot6CSVPath = args[10]; // ARCHIVO DE PLOT 3
const iterations = parseInt(args[11], 10);
const configPath = args[12];

let config = {};

// Cargar configuración
try {
    const configFile = fs.readFileSync(configPath);
    config = JSON.parse(configFile);
} catch (error) {
    console.error(`! ERROR: NO SE PUDO LEER ${configPath}, USANDO CONFIGURACIÓN POR DEFECTO !`, error);
    process.exit(1);
}

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

const readWeightCSV = async (filePath) => {
    if (!filePath) {
        return null;
    }
    const weights = await readCSV(filePath);
    return Object.values(weights[0]).map(parseFloat);
};

const preprocessData = (data, weights) => {
    return data.map(row => {
        const rowData = Object.values(row).map(parseFloat);
        return rowData.map((value, index) => !isNaN(value) && weights ? value * weights[index] : value);
    }).filter(row => row.every(num => !isNaN(num)));
};

let iterationCounter = 0; 
const calculateMetrics = (yTrue, yPred) => {
    iterationCounter += 1;
    const tp = yPred.filter((pred, idx) => pred === 1 && yTrue[idx] === 1).length; // Verdaderos positivos
    const fp = yPred.filter((pred, idx) => pred === 1 && yTrue[idx] === 0).length; // Falsos positivos
    const tn = yPred.filter((pred, idx) => pred === 0 && yTrue[idx] === 0).length; // Verdaderos negativos
    const fn = yPred.filter((pred, idx) => pred === 0 && yTrue[idx] === 1).length; // Falsos negativos

    const precision = tp / (tp + fp || 1);
    const recall = tp / (tp + fn || 1);
    const f1Score = (2 * precision * recall) / (precision + recall || 1);
    const accuracy = (tp + tn) / yTrue.length;
    const falsePositiveRate = fp / (fp + tn || 1); // Tasa de Falsos Positivos
    const trueNegativeRate = tn / (tn + fp || 1);  // Tasa de Verdaderos Negativos
    
    return { iteration: iterationCounter, precision, recall, f1Score, accuracy, trueNegativeRate, falsePositiveRate };
};


// Ejecutar Isolation Forest múltiples veces y guardar resultados
const runIsolationForest = async () => {
    try {
        const csvData = await readCSV(inputFilename);
        const weights = await readWeightCSV(weightFilePath);
        let features = preprocessData(csvData, weights);

        if (features.length < 10) {
            console.error('! ERROR: Se necesitan al menos 10 filas !');
            return;
        }

        const scoresResults = [];
        const ids = csvData.map(row => row[config.index.id] || csvData.indexOf(row));
        const y_true = csvData.map(row => parseInt(row[config.index.truth])); // Asumiendo que existe una columna "truth"
        const mseResults = [];
        const thresholdIncrement = (1 - 0.1) / iterations; // Incremento del umbral

        for (let i = 1; i < iterations+1; i++) {
            //config.index.trees = i; 
            //config.index.score = i;

            const myForest = new IsolationForest(features, config.index.trees, features.length);
            const scores = myForest.dataAnomalyScore(config.index.score);
            scoresResults.push(scores);

            const y_pred = myForest.dataAnomalyScore(config.index.score).map(score => score > config.index.threshold ? 1 : 0);
            const mse = calculateMSE(y_true, y_pred);
            mseResults.push(mse);
            //config.index.threshold += thresholdIncrement;
        }


        // Crear archivo scores.csv con los puntajes de cada ejecución
        const scoresHeader = ['id', 'value_y', 'value_x', ...Array.from({ length: iterations }, (_, i) => `score_${i + 1}`), 'scores_total', 'score', 'anomaly'].join(',');
        const scoresRows = scoresResults[0].map((_, index) => {
            const scores = scoresResults.map(scoreArray => scoreArray[index].toFixed(2));
            const scoresTotal = scores.reduce((acc, score) => acc + parseFloat(score), 0);
            const scoresPercent = (scoresTotal / iterations).toFixed(2);
            const value_y = features[index][config.index.value_y]; // Obtener value_y
            const value_x = csvData[index][config.index.value_x]; // Obtener value_x
            const isAnomaly = scoresPercent > config.index.threshold; // Determinar si es una anomalía
            //console.log(`Index: ${index}, value_y: ${value_y}, value_x: ${value_x}, score: ${scoresPercent}`); // Registro para depuración
            return [ids[index], value_y, value_x, ...scores, scoresTotal.toFixed(2), scoresPercent, isAnomaly].join(',');
        }).join('\n');

        const datos = scoresResults[0].map((score, index) => {
            const isAnomaly = score > config.index.threshold; // Determinar si es una anomalía
            const value_y = features[index][config.index.value_y]; // Obtener valor
            const value_x = csvData[index][config.index.value_x]; // Obtener fecha
            const rowFeatures = features[index]; // Guardar las características de cada fila
            const id = csvData[index][config.index.id] || index; // Asignar un identificador único (puede ser el índice si no hay una columna de id)
            return [{ value_y, value_x, rowFeatures, id, score }, isAnomaly]; // Devolver resultado con detalles
        });

        // SCORES
        fs.writeFileSync(scoresOutputPath, `${scoresHeader}\n${scoresRows}`, 'utf8');
        console.log(`[ SCORES: ${scoresOutputPath} ]`);

        // CALCULATE METRICS
        const y_pred = scoresResults.map(scoreArray => scoreArray.map((score, idx) => score > config.index.threshold ? 1 : 0)); // Predicciones de cada ejecución
        const metricsResults = [];
        for (let i = 0; i < iterations; i++) {
            const metrics = calculateMetrics(y_true, y_pred[i]);
            metricsResults.push({ iteration: i + 1, ...metrics });
        }

        // METRICS
        const metricsHeader = 'iteration,precision,recall,f1Score,accuracy\n';
        const metricsRows = metricsResults.map(({ iteration, precision, recall, f1Score, accuracy }) => 
        `${iteration},${precision.toFixed(2)},${recall.toFixed(2)},${f1Score.toFixed(2)},${accuracy.toFixed(2)}`).join('\n');
        fs.writeFileSync(metricsOutputPath, `${metricsHeader}${metricsRows}`, 'utf8');
        console.log(`[ METRICS: ${metricsOutputPath} ]`);

        // ISOLATION
        scoresResults.forEach((result, index) => {
            const fileName = `isolation_${index + 1}.json`;
            const isolationModelPath2 = isolationModelPath + fileName; // Guardar cada resultado en un archivo JSON
            //fs.writeFileSync(isolationModelPath2, JSON.stringify(result, null, 2), 'utf8');
        });
        console.log(`[ ISOLATION: ${isolationModelPath}]`);

        // PLOT
        plot1(datos, plotCSVPath, config); 
        plot2(datos, plot2CSVPath, config); 
        plot3(datos, plot3CSVPath, config); 
        plot4(metricsResults, plot4CSVPath, config); 
        plot5(mseResults,plot5CSVPath, config); 
        plot6(metricsResults, plot6CSVPath, config);

    } 
    catch (error) {
        console.error('! ERROR: FALLÓ AL EJECUTAR EL ALGORITMO DE AISLAMIENTO !', error);
    }
};

const calculateMSE = (yTrue, yPred) => {
    return yTrue.reduce((sum, trueVal, idx) => {
        const diff = trueVal - yPred[idx];
        return sum + diff * diff;
    }, 0) / yTrue.length;
};

runIsolationForest();
