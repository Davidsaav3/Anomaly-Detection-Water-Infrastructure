const { IsolationForest } = require('isolation-forest-visualization');
const csv = require('csv-parser');
const fs = require('fs');
const { plot1, plot2, plot3, plot4, plot5, plot6, plot7 } = require('./plot');

// [ OBTENER ARGUMENTOS ]
const args = process.argv.slice(2);
if (args.length < 9) {
    console.error('! ERROR: INPUT !');
    process.exit(1);
}

// [ ARGUMENTOS ]
const inputFilename = args[0]; // ENTRADA
const isolationOutputPath = args[1]; // ISOLATION
const scoresOutputPath = args[2]; // SCORES
const metricsOutputPath = args[3]; // MÉTRICAS
const weightFilePath = args[4]; // PESOS
const plotCSVPath = args[5]; // PLOT 1
const plot2CSVPath = args[6]; // PLOT 2
const plot3CSVPath = args[7]; // PLOT 3
const plot4CSVPath = args[8]; // PLOT 4
const plot5CSVPath = args[9]; // PLOT 5
const plot6CSVPath = args[10]; // PLOT 6
const plot7CSVPath = args[11]; // PLOT 7
const iterations = parseInt(args[12], 10); // ITERACIONES ISOALTION
const configPath = args[13]; // CONFIGURACIÓN
let config = {};
let iterationCounter = 0;

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

// [ LEER PESOS ]
const readWeightCSV = async (filePath) => {
    if (!filePath) {
        return null;
    }
    const weights = await readCSV(filePath);
    return Object.values(weights[0]).map(parseFloat);
};

// [ APLICAR PESOS ]
const preprocessData = (data, weights) => {
    return data.map(row => {
        const rowData = Object.values(row).map(parseFloat);
        return rowData.map((value, index) => !isNaN(value) && weights ? value * weights[index] : value);
    }).filter(row => row.every(num => !isNaN(num)));
};

// [ CALCULAR MÉTRICAS ]
const calculateMetrics = (yTrue, yPred) => {
    iterationCounter += 1;
    const tp = yPred.filter((pred, idx) => pred === 1 && yTrue[idx] === 1).length; // VERDADEROS POSITIVOS
    const fp = yPred.filter((pred, idx) => pred === 1 && yTrue[idx] === 0).length; // FALSOS POSITIVOS
    const tn = yPred.filter((pred, idx) => pred === 0 && yTrue[idx] === 0).length; // VERDADEROS NEGATIVOS
    const fn = yPred.filter((pred, idx) => pred === 0 && yTrue[idx] === 1).length; // FALSOS NEGATIVOS

    const precision = tp / (tp + fp || 1);
    const recall = tp / (tp + fn || 1);
    const f1Score = (2 * precision * recall) / (precision + recall || 1);
    const accuracy = (tp + tn) / yTrue.length;
    const falsePositiveRate = fp / (fp + tn || 1); // TASA DE FALSOS POSITIVOS
    const trueNegativeRate = tn / (tn + fp || 1);  // TASA DE VERDADEROS NEGATIVOS

    return { iteration: iterationCounter, precision, recall, f1Score, accuracy, trueNegativeRate, falsePositiveRate };
};

// [ ISOLATION FOREST ]
const main = async () => {
    try {
        const csvData = await readCSV(inputFilename);
        const weights = await readWeightCSV(weightFilePath);
        let features = preprocessData(csvData, weights);

        if (features.length < 10) {
            console.error('! ERROR: AT LEAST 10 ROWS ARE NEEDED !');
            return;
        }

        const scoresResults = [];
        const ids = csvData.map(row => row[config.index.id] || csvData.indexOf(row));
        const y_true = csvData.map(row => parseInt(row[config.index.truth])); // COLUMNA "TRUTH"
        const mseResults = [];
        const thresholdIncrement = (1 - 0.1) / iterations; // UMBRAL
        const isolationData = [];

        // 0. ISOLATION
        for (let i = 1; i < iterations + 1; i++) {
            //config.index.trees = i; 
            //config.index.score = i;

            const myForest = new IsolationForest(features, config.index.trees, features.length);
            const scores = myForest.dataAnomalyScore(config.index.score);
            scoresResults.push(scores);

            const y_pred = myForest.dataAnomalyScore(config.index.score).map(score => score > config.index.threshold ? 1 : 0);
            const mse = calculateMSE(y_true, y_pred);
            mseResults.push(mse);

            isolationData.push({
                'iteration': i,
                'data_size': csvData.length,
                'number_of_attributes': features[0].length,
                'number_of_trees': config.index.trees,
            });
        }

        // 1. SCORES
        const scoresHeader = ['id', 'value_y', 'value_x', ...Array.from({ length: iterations }, (_, i) => `score_${i + 1}`), 'scores_total', 'score', 'anomaly'].join(',');
        const scoresRows = scoresResults[0].map((_, index) => {
            const scores = scoresResults.map(scoreArray => scoreArray[index].toFixed(2));
            const scoresTotal = scores.reduce((acc, score) => acc + parseFloat(score), 0);
            const scoresPercent = (scoresTotal / iterations).toFixed(2);
            const value_y = features[index][config.index.value_y]; // VALUE_Y
            const value_x = csvData[index][config.index.value_x]; // VALUE_X
            const isAnomaly = scoresPercent > config.index.threshold; // DETERMINAR SI ES UNA ANOMALÍA
            return [ids[index], value_y, value_x, ...scores, scoresTotal.toFixed(2), scoresPercent, isAnomaly].join(',');
        }).join('\n');
        fs.writeFileSync(scoresOutputPath, `${scoresHeader}\n${scoresRows}`, 'utf8');
        console.log(`[ SCORES: ${scoresOutputPath} ]`);

        // 2. MÉTRICAS
        const y_pred = scoresResults.map(scoreArray => scoreArray.map((score, idx) => score > config.index.threshold ? 1 : 0)); // PREDICCIONES DE CADA EJECUCIÓN
        const metricsResults = [];
        for (let i = 0; i < iterations; i++) {
            const metrics = calculateMetrics(y_true, y_pred[i]);
            metricsResults.push({ iteration: i + 1, ...metrics });
        }
        const metricsHeader = 'iteration,precision,recall,f1Score,accuracy,trueNegativeRate,falsePositiveRate,mse\n';
        const metricsRows = metricsResults.map(({ iteration, precision, recall, f1Score, accuracy, trueNegativeRate, falsePositiveRate }, i) => {
            const mse = mseResults[i]; // MSE CALCULADO 
            return `${iteration},${precision.toFixed(2)},${recall.toFixed(2)},${f1Score.toFixed(2)},${accuracy.toFixed(2)},${trueNegativeRate.toFixed(2)},${falsePositiveRate.toFixed(2)},${mse.toFixed(2)}`;
        }).join('\n');
        fs.writeFileSync(metricsOutputPath, `${metricsHeader}${metricsRows}`, 'utf8');
        console.log(`[ METRICS: ${metricsOutputPath} ]`);

        // 3. ISOLATION INFO
        const isolationHeader = 'iteration,data_size,number_of_attributes,number_of_trees\n';
        const isolationRows = isolationData.map(({ iteration, data_size, number_of_attributes, number_of_trees }) =>
            `${iteration},${data_size},${number_of_attributes},${number_of_trees}`
        ).join('\n');
        fs.writeFileSync(isolationOutputPath, `${isolationHeader}${isolationRows}`, 'utf8');
        console.log(`[ ISOLATION: ${isolationOutputPath}]`);

        // 4. PLOTS
        const datos = scoresResults[0].map((score, index) => {
            const isAnomaly = score > config.index.threshold; // DETERMINAR SI ES UNA ANOMALÍA
            const value_y = features[index][config.index.value_y]; // VALOR
            const value_x = csvData[index][config.index.value_x]; // FECHA
            const rowFeatures = features[index]; // CARACTERÍSTICAS DE CADA FILA
            const id = csvData[index][config.index.id] || index; // UN IDENTIFICADOR ÚNICO
            return [{ value_y, value_x, rowFeatures, id, score }, isAnomaly];
        });
        const datos2 = scoresResults[0].map((score, index) => {
            const isAnomaly = score > config.index.threshold;
            const values_y = Object.values(features[index]); // OBTENER TODOS LOS VALORES DE FEATURES[INDEX] 
            const value_x = csvData[index][config.index.value_x];
            const rowFeatures = features[index];
            const id = csvData[index][config.index.id] || index;
            return [{ values_y, value_x, rowFeatures, id, score }, isAnomaly]; // RETORNAR TODOS LOS VALORES COMO UN OBJETO
        });

        plot1(datos, plotCSVPath, config);
        plot2(datos, plot2CSVPath, config);
        plot3(datos, plot3CSVPath, config);
        plot4(metricsResults, plot4CSVPath, config);
        plot5(mseResults, plot5CSVPath, config);
        plot6(metricsResults, plot6CSVPath, config);
        plot7(datos2, plot7CSVPath, config);
    }
    catch (error) {
        console.error('! ERROR: ISOLATION !', error);
    }
};

// [ ERROR CUADRÁTICO MEDIO  ECM]
const calculateMSE = (yTrue, yPred) => {
    return yTrue.reduce((sum, trueVal, idx) => {
        const diff = trueVal - yPred[idx];
        return sum + diff * diff;
    }, 0) / yTrue.length;
};

main();
