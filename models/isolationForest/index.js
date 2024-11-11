const { IsolationForest } = require('isolation-forest-visualization');
const csv = require('csv-parser');
const fs = require('fs');
const { plot1, plot2, plot3, plot4, plot5, plot6, plot7 } = require('./plot');

// [ OBTENER ARGUMENTOS ]
const args = process.argv.slice(2);
if (args.length < 6) {
    console.error('! ERROR: INPUT !');
    process.exit(1);
}

// [ ARGUMENTOS ]
const inputFilename = args[0]; // ENTRADA
const inputFilename2 = args[1]; // ENTRADA
const weightFilePath = args[2]; // PESOS
const iterations = parseInt(args[3], 10); // ITERACIONES ISOALTION
const numTrees = parseInt(args[4], 10); // ITERACIONES ISOALTION
const ruta = args[5]; // PLOT 1
const isolationOutputPath = `${ruta}${args[6]}`; // ISOLATION
const scoresOutputPath = `${ruta}${args[7]}`; // SCORES
const metricsOutputPath = `${ruta}${args[8]}`; // MÉTRICAS
const nombre_plot = args[9]; // PLOT
const configPath = args[10]; // CONFIGURACIÓN
let config = {};
let iterationCounter = 0;

const plotCSVPath = `${ruta}${nombre_plot}${1}.png`; // PLOT 1
const plot2CSVPath = `${ruta}${nombre_plot}${2}.png` // PLOT 2
const plot3CSVPath = `${ruta}${nombre_plot}${3}.png` // PLOT 3
const plot4CSVPath = `${ruta}${nombre_plot}${4}.png` // PLOT 4
const plot5CSVPath = `${ruta}${nombre_plot}${5}.png` // PLOT 5
const plot6CSVPath = `${ruta}${nombre_plot}${6}.png` // PLOT 6
const plot7CSVPath = `${ruta}${nombre_plot}${7}.png` // PLOT 7

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

    return { iteration: iterationCounter, tp, fp, tn, fn };
};

// Nueva función para calcular métricas finales basadas en los totales
const calculateMetricsFromTotals = (tp, fp, tn, fn) => {
    const precision = tp / (tp + fp); // PRECISIÓN
    const recall = tp / (tp + fn); // RECALL
    const f1Score = (2 * precision * recall) / (precision + recall); // F1 SCORE
    const accuracy = (tp + tn) / (tp + fp + tn + fn * iterations); // EXACTITUD
    return { precision, recall, f1Score, accuracy };
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
        const csvData2 = await readCSV(inputFilename2); // LEER CSV
        const weights = await readWeightCSV(weightFilePath); // LEER PESOS
        let features = processWeight(csvData, weights); // PROCESAR PESOS
        
        if (features.length < 10) { // VALIDAR FILAS
            console.error('! ERROR: AT LEAST 10 ROWS ARE NEEDED !'); // ERROR
            return; // SALIR
        }
        
        const scoresResults = []; // RESULTADOS PUNTUACIONES
        const ids = csvData.map(row => row[config.index.id] || csvData.indexOf(row)); // IDENTIFICADORES
        const y_true = csvData2.map(row => parseInt(row[config.index.columnName])); // COLUMNA "TRUTH"
        const mseResults = []; // RESULTADOS MSE
        const isolationData = []; // DATOS AISLAMIENTO

        // 0. ISOLATION
        for (let i = 1; i < iterations + 1; i++) {
            const myForest = new IsolationForest(features, numTrees, features.length); // INICIALIZAR FOREST
            const scores = myForest.dataAnomalyScore(config.index.score); // CALCULAR SCORES
            scoresResults.push(scores); // ALMACENAR RESULTADOS
            const y_pred = scores.map(score => score > config.index.threshold ? 1 : 0); // PREDICCIÓN DE ANOMALÍAS
            const mse = calculateMSE(y_true, y_pred); // CALCULAR MSE
            mseResults.push(mse); // MSE
            
            isolationData.push({ // DATOS DE AISLAMIENTO
                'iteration': i, // ITERACIÓN
                'data_size': csvData.length, // TAMAÑO DE DATOS
                'number_of_attributes': features[0].length, // NÚMERO DE ATRIBUTOS
                'number_of_trees': numTrees, // NÚMERO DE ARBOLES
            });
        }


        // 1. SCORES
        const scoresHeader = [
            'id','valueYName','valueY','valueXName','valueX',
            ...Array.from({ length: iterations }, (_, i) => `score_${i + 1}`),
            'scores_total','score','anomaly'
        ].join(',');
        
        // GENERAR FILAS DE DATOS
        const scoresRows = scoresResults[0].map((_, index) => {
            const scores = scoresResults.map(scoreArray => scoreArray[index].toFixed(2)); // OBTENER PUNTUACIONES
            const scoresTotal = scores.reduce((acc, score) => acc + parseFloat(score), 0); // TOTAL PUNTUACIONES
            const scoresPercent = (scoresTotal / iterations).toFixed(2); // PORCENTAJE PUNTUACIONES
            const valueYName = headers[config.index.valueY];
            const valueY = features[index][config.index.valueY];
            const valueXName = config.index.valueX;
            const valueX = csvData[index][config.index.valueX];
            const isAnomaly = scoresPercent > config.index.threshold;
    
            return [
                ids[index], valueYName, valueY, valueXName, valueX, ...scores, scoresTotal.toFixed(2), scoresPercent, isAnomaly
            ].join(',');
        }).join('\n');
        
        // ESCRIBIR ARCHIVO
        fs.writeFileSync(scoresOutputPath, `${scoresHeader}\n${scoresRows}`, 'utf8');


        // 2. MÉTRICAS
        const y_pred = scoresResults.map(scoreArray => scoreArray.map((score, idx) => score > config.index.threshold ? 1 : 0)); // PREDICCIONES
        const metricsResults = [];

        let totalTp = 0, totalFp = 0, totalTn = 0, totalFn = 0;

        for (let i = 0; i < iterations; i++) {
            const metrics = calculateMetrics(y_true, y_pred[i]); // CALCULAR MÉTRICAS
            metricsResults.push({ iteration: i + 1, ...metrics }); // ALMACENAR RESULTADOS

            // Acumular totales para cada columna
            totalTp += metrics.tp;
            totalFp += metrics.fp;
            totalTn += metrics.tn;
            totalFn += metrics.fn;
        }

        // Calcular las métricas finales basadas en los totales
        const finalMetrics = calculateMetricsFromTotals(totalTp, totalFp, totalTn, totalFn);

        // Agregar la fila de totales "S" con las métricas adicionales
        metricsResults.push({ 
            iteration: 'S', 
            tp: totalTp, 
            fp: totalFp, 
            tn: totalTn, 
            fn: totalFn, 
            precision: finalMetrics.precision, 
            recall: finalMetrics.recall, 
            f1Score: finalMetrics.f1Score, 
            accuracy: finalMetrics.accuracy 
        });

        let metricsHeader = 'iteration,tp,fp,tn,fn,precision,recall,f1Score,accuracy\n'; // CABECERA DE MÉTRICAS
        let metricsRows = metricsResults.map(({ iteration, tp, fp, tn, fn, precision = '', recall = '', f1Score = '', accuracy = '' }) => {
            return `${iteration},${tp},${fp},${tn},${fn},${precision},${recall},${f1Score},${accuracy}`; // DEVOLVER FILA DE MÉTRICAS
        }).join('\n');

        // ESCRIBIR MÉTRICAS 
        //fs.writeFileSync(metricsOutputPath, `${metricsHeader}${metricsRows}`, 'utf8'); 
        //console.log(`[ METRICS: ${metricsOutputPath} ]`);

        // Definir matrices para almacenar las métricas por iteración




        // 2.2 MÉTRICAS
        const tpArray = [];
        const tnArray = [];
        const fpArray = [];
        const fnArray = [];

        // Calcular métricas por cada iteración
        for (let i = 0; i < iterations; i++) {
            const y_pred = scoresResults[i].map(score => score > config.index.threshold ? 1 : 0);
            const metrics = calculateMetrics(y_true, y_pred); // Calcula tp, tn, fp, fn para cada iteración
            
            // Agregar cada métrica a su respectiva matriz
            tpArray.push(metrics.tp);
            tnArray.push(metrics.tn);
            fpArray.push(metrics.fp);
            fnArray.push(metrics.fn);
        }

        // Construir el contenido del archivo CSV
         metricsHeader = [...Array.from({ length: iterations }, (_, i) => i + 1)].join(',');
         metricsRows = [
            `${tpArray.join(',')}`,
            `${tnArray.join(',')}`,
            `${fpArray.join(',')}`,
            `${fnArray.join(',')}`
        ].join('\n');

        fs.writeFileSync(metricsOutputPath, `${metricsHeader}\n${metricsRows}`, 'utf8');
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
            const valueY = features[index][config.index.valueY]; // VALOR Y
            const valueX = csvData[index][config.index.valueX]; // VALOR X (FECHA)
            const rowFeatures = features[index]; // CARACTERÍSTICAS DE CADA FILA
            const id = csvData[index][config.index.id] || index; // UN IDENTIFICADOR ÚNICO
            const scores = scoresResults.map(scoreArray => scoreArray[index].toFixed(2)); // OBTENER PUNTUACIONES
            const anomalies = scores.map(score => (parseFloat(score) > config.index.threshold ? 1 : 0));
            const anomalyAverage = (anomalies.reduce((sum, value) => sum + value, 0) / iterations).toFixed(2);
            const isAnomaly = parseFloat(anomalyAverage) > config.index.anomalyThreshold;
            return [{ valueY, valueX, rowFeatures, id, score }, isAnomaly]; 
        });

        const datos2 = scoresResults.map((score, index) => {
            //const isAnomaly = score > config.index.threshold;
            const values_y = Object.values(features[index]); 
            const valueX = csvData[index][config.index.valueX];
            const rowFeatures = features[index];
            const id = csvData[index][config.index.id] || index;
            const scores = scoresResults.map(scoreArray => scoreArray[index].toFixed(2)); // OBTENER PUNTUACIONES
            const anomalies = scores.map(score => (parseFloat(score) > config.index.threshold ? 1 : 0));
            const anomalyAverage = (anomalies.reduce((sum, value) => sum + value, 0) / iterations).toFixed(2);
            const isAnomaly = parseFloat(anomalyAverage) > config.index.anomalyThreshold;
            return [{ values_y, valueX, rowFeatures, id, score }, isAnomaly];
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
