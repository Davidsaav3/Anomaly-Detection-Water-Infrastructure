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

// [ LEER CABECERAS CSV ]
const readCSVHeaders = (filePath) => {
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath)
            .pipe(csv({ headers: false }))
            .on('data', (row) => {
                stream.pause(); // SOLO LAMPRIMERA FILA
                resolve(row); // DEVUELVE
            })
            .on('error', reject);
    });
};


// [ LEER PESOS ]
const readWeightCSV = async (filePath) => {
    if (!filePath) {
        return null;
    }
    const weights = await readCSV(filePath); // LEER 
    return Object.values(weights[0]).map(parseFloat); // CREAR OBJETO CON LOS PESOS
};

// [ APLICAR PESOS ]
const processWeight = (data, weights) => {
    return data.map(row => {
        const rowData = Object.values(row).map(parseFloat); // OBTENER VALORES DE CSV
        return rowData.map((value, index) => !isNaN(value) && weights ? value * weights[index] : value); // MULTIPLICAR POR EL PESO
    }).filter(row => row.every(num => !isNaN(num))); // DEVOLVER COMO UN NUMERO
};

// [ CALCULAR MÉTRICAS ]
const calculateMetrics = (yTrue, yPred) => {
    iterationCounter += 1;
    const tp = yPred.filter((pred, idx) => pred === 1 && yTrue[idx] === 1).length; // VERDADEROS POSITIVOS
    const fp = yPred.filter((pred, idx) => pred === 1 && yTrue[idx] === 0).length; // FALSOS POSITIVOS
    const tn = yPred.filter((pred, idx) => pred === 0 && yTrue[idx] === 0).length; // VERDADEROS NEGATIVOS
    const fn = yPred.filter((pred, idx) => pred === 0 && yTrue[idx] === 1).length; // FALSOS NEGATIVOS

    const precision = tp / (tp + fp || 1); // PRECISIÓN: VERDADEROS POSITIVOS / (VERDADEROS POSITIVOS + FALSOS POSITIVOS)
    const recall = tp / (tp + fn || 1); // RECALL: VERDADEROS POSITIVOS / (VERDADEROS POSITIVOS + FALSOS NEGATIVOS)
    const f1Score = (2 * precision * recall) / (precision + recall || 1); // F1 SCORE: MEDIA ARMÓNICA DE PRECISIÓN Y RECALL
    const accuracy = (tp + tn) / yTrue.length; // EXACTITUD: (VERDADEROS POSITIVOS + VERDADEROS NEGATIVOS) / TOTAL

    const falsePositiveRate = fp / (fp + tn || 1); // TASA DE FALSOS POSITIVOS: FALSOS POSITIVOS / (FALSOS POSITIVOS + VERDADEROS NEGATIVOS)
    const trueNegativeRate = tn / (tn + fp || 1); // TASA DE VERDADEROS NEGATIVOS: VERDADEROS NEGATIVOS / (VERDADEROS NEGATIVOS + FALSOS POSITIVOS)

    return { iteration: iterationCounter, precision, recall, f1Score, accuracy, trueNegativeRate, falsePositiveRate };
};

// [ERROR CUADRÁTICO MEDIO (ECM)]
const calculateMSE = (yTrue, yPred) => {
    return yTrue.reduce((sum, trueVal, idx) => { // CALCULAR SUMA DE DIFERENCIAS AL CUADRADO
        const diff = trueVal - yPred[idx]; // CALCULAR DIFERENCIA
        return sum + diff * diff; // ACUMULAR DIFERENCIAS AL CUADRADO
    }, 0) / yTrue.length; // DIVIDIR POR EL NÚMERO DE ELEMENTOS
};

// [ ISOLATION FOREST ]
const main = async () => {
    try {
        const headers = await readCSVHeaders(inputFilename)
        const csvData = await readCSV(inputFilename); // LEER CSV
        const weights = await readWeightCSV(weightFilePath); // LEER PESOS
        let features = processWeight(csvData, weights); // PROCESAR PESOS
        
        if (features.length < 10) { // VALIDAR FILAS
            console.error('! ERROR: AT LEAST 10 ROWS ARE NEEDED !'); // ERROR
            return; // SALIR
        }
        
        const scoresResults = []; // RESULTADOS PUNTUACIONES
        const ids = csvData.map(row => row[config.index.id] || csvData.indexOf(row)); // IDENTIFICADORES
        const y_true = csvData.map(row => parseInt(row[config.index.truth_key])); // COLUMNA "TRUTH"
        const mseResults = []; // RESULTADOS MSE
        const thresholdIncrement = (1 - 0.1) / iterations; // INCREMENTO UMBRAL
        const isolationData = []; // DATOS AISLAMIENTO

        // 0. ISOLATION
        for (let i = 1; i < iterations + 1; i++) {
            if(config.index.variable_trees){
                config.index.trees = i; 
            }
            if(config.index.variable_score){
                config.index.score = i;
            }

            const myForest = new IsolationForest(features, config.index.trees, features.length); // INICIALIZAR FOREST
            const scores = myForest.dataAnomalyScore(config.index.score); // CALCULAR SCORES
            scoresResults.push(scores); // ALMACENAR RESULTADOS
            
            const y_pred = myForest.dataAnomalyScore(config.index.score).map(score => score > config.index.threshold ? 1 : 0); // PREDICCIÓN DE ANOMALÍAS
            const mse = calculateMSE(y_true, y_pred); // CALCULAR MSE
            mseResults.push(mse); // MSE
            
            isolationData.push({ // DATOS DE AISLAMIENTO
                'iteration': i, // ITERACIÓN
                'data_size': csvData.length, // TAMAÑO DE DATOS
                'number_of_attributes': features[0].length, // NÚMERO DE ATRIBUTOS
                'number_of_trees': config.index.trees, // NÚMERO DE ARBOLES
            });
        }

        // 1. SCORES
        const scoresHeader = ['id', 'value_y_name', 'value_y', 'value_x_name', 'value_x', ...Array.from({ length: iterations }, (_, i) => `score_${i + 1}`), 'scores_total', 'score', 'anomaly'].join(','); // CABECERA DE SCORES
        const scoresRows = scoresResults[0].map((_, index) => {
            const scores = scoresResults.map(scoreArray => scoreArray[index].toFixed(2)); // OBTENER PUNTUACIONES
            const scoresTotal = scores.reduce((acc, score) => acc + parseFloat(score), 0); // TOTAL DE PUNTUACIONES
            const scoresPercent = (scoresTotal / iterations).toFixed(2); // PORCENTAJE DE PUNTUACIONES
            const value_y_name = headers[config.index.value_y]; // VALUE Y NAME
            const value_y = features[index][config.index.value_y]; // VALUE Y
            const value_x_name = csvData[0][config.index.value_x]; // VALUE X NME
            const value_x = csvData[index][config.index.value_x]; // VALUE X
            const isAnomaly = scoresPercent > config.index.threshold; // DETERMINAR ANOMALÍA
            return [ids[index], value_y_name, value_y, value_x_name, value_x, ...scores, scoresTotal.toFixed(2), scoresPercent, isAnomaly].join(','); // DEVOLVER FILA
        }).join('\n');
        fs.writeFileSync(scoresOutputPath, `${scoresHeader}\n${scoresRows}`, 'utf8'); // ESCRIBIR SCORES
        console.log(`[ SCORES: ${scoresOutputPath} ]`); 

        // 2. MÉTRICAS
        const y_pred = scoresResults.map(scoreArray => scoreArray.map((score, idx) => score > config.index.threshold ? 1 : 0)); // PREDICCIONES
        const metricsResults = [];
        for (let i = 0; i < iterations; i++) {
            const metrics = calculateMetrics(y_true, y_pred[i]); // CALCULAR MÉTRICAS
            metricsResults.push({ iteration: i + 1, ...metrics }); // ALMACENAR RESULTADOS
        }
        const metricsHeader = 'iteration,precision,recall,f1Score,accuracy,trueNegativeRate,falsePositiveRate,mse\n'; // CABECERA DE MÉTRICAS
        const metricsRows = metricsResults.map(({ iteration, precision, recall, f1Score, accuracy, trueNegativeRate, falsePositiveRate }, i) => {
            const mse = mseResults[i]; // OBTENER MSE
            return `${iteration},${precision.toFixed(2)},${recall.toFixed(2)},${f1Score.toFixed(2)},${accuracy.toFixed(2)},${trueNegativeRate.toFixed(2)},${falsePositiveRate.toFixed(2)},${mse.toFixed(2)}`; // DEVOLVER FILA DE MÉTRICAS
        }).join('\n');
        fs.writeFileSync(metricsOutputPath, `${metricsHeader}${metricsRows}`, 'utf8'); // ESCRIBIR MÉTRICAS 
        console.log(`[ METRICS: ${metricsOutputPath} ]`); 

        // 3. ISOLATION INFO
        const isolationHeader = 'iteration,data_size,number_of_attributes,number_of_trees\n'; // CABECERA DE AISLAMIENTO
        const isolationRows = isolationData.map(({ iteration, data_size, number_of_attributes, number_of_trees }) =>
            `${iteration},${data_size},${number_of_attributes},${number_of_trees}` // DEVOLVER FILA DE AISLAMIENTO
        ).join('\n');
        fs.writeFileSync(isolationOutputPath, `${isolationHeader}${isolationRows}`, 'utf8'); // ESCRIBIR AISLAMIENTO 
        console.log(`[ ISOLATION: ${isolationOutputPath}]`); 

        // 4. PLOTS
        const datos = scoresResults[0].map((score, index) => {
            const isAnomaly = score > config.index.threshold; // SI ES UNA ANOMALÍA
            const value_y = features[index][config.index.value_y]; // VALOR Y
            const value_x = csvData[index][config.index.value_x]; // VALOR X (FECHA)
            const rowFeatures = features[index]; // CARACTERÍSTICAS DE CADA FILA
            const id = csvData[index][config.index.id] || index; // UN IDENTIFICADOR ÚNICO
            return [{ value_y, value_x, rowFeatures, id, score }, isAnomaly]; 
        });

        const datos2 = scoresResults[0].map((score, index) => {
            const isAnomaly = score > config.index.threshold; // SI ES UNA ANOMALÍA
            const values_y = Object.values(features[index]); // TODOS LOS VALORES DE FEATURES[INDEX]
            const value_x = csvData[index][config.index.value_x]; // VALOR X (FECHA)
            const rowFeatures = features[index]; // CARACTERÍSTICAS DE CADA FILA
            const id = csvData[index][config.index.id] || index; // UN IDENTIFICADOR ÚNICO
            return [{ values_y, value_x, rowFeatures, id, score }, isAnomaly];
        });

        // PLOTS
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

main();
