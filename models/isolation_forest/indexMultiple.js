const { IsolationForest } = require('isolation-forest-visualization');
const csv = require('csv-parser');
const fs = require('fs');
const { plot, plot2, plot3, plot4, plot5, plot6 } = require('./plot');

// Obtener parámetros de la línea de comandos
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

// Calcular métricas
let iterationCounter = 0; // Contador global de iteración

const calculateMetrics = (yTrue, yPred) => {
    // Incrementar el contador de iteración
    iterationCounter += 1;

    // Cálculo de métricas
    const tp = yPred.filter((pred, idx) => pred === 1 && yTrue[idx] === 1).length; // Verdaderos positivos
    const fp = yPred.filter((pred, idx) => pred === 1 && yTrue[idx] === 0).length; // Falsos positivos
    const tn = yPred.filter((pred, idx) => pred === 0 && yTrue[idx] === 0).length; // Verdaderos negativos
    const fn = yPred.filter((pred, idx) => pred === 0 && yTrue[idx] === 1).length; // Falsos negativos

    const precision = tp / (tp + fp || 1);
    const recall = tp / (tp + fn || 1);
    const f1Score = (2 * precision * recall) / (precision + recall || 1);
    const accuracy = (tp + tn) / yTrue.length;

    // Nuevas métricas
    const falsePositiveRate = fp / (fp + tn || 1); // Tasa de Falsos Positivos
    const trueNegativeRate = tn / (tn + fp || 1);  // Tasa de Verdaderos Negativos
    
    return { 
        iteration: iterationCounter, 
        precision, 
        recall, 
        f1Score, 
        accuracy, 
        trueNegativeRate, 
        falsePositiveRate 
    };
};


// Ejecutar Isolation Forest múltiples veces y guardar resultados
const runIsolationForestMultiple = async () => {
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

        for (let i = 0; i < iterations; i++) {
            const myForest = new IsolationForest(features, config.index.trees, features.length);
            const scores = myForest.dataAnomalyScore(config.index.score);
            scoresResults.push(scores);
            
            // Calcular y guardar importancia de características en CSV
            //const featureImportance = calculateFeatureImportance(features, myForest);
            //saveFeatureImportance(featureImportance, 'importance.csv');
        }

        // Crear archivo scoresMultiple.csv con los puntajes de cada ejecución
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

        fs.writeFileSync(scoresOutputPath, `${scoresHeader}\n${scoresRows}`, 'utf8');
        console.log(`[ SCORES: ${scoresOutputPath} ]`);

        // Calcular métricas
        const y_pred = scoresResults.map(scoreArray => scoreArray.map((score, idx) => score > config.index.threshold ? 1 : 0)); // Predicciones de cada ejecución
        const metricsResults = [];

        for (let i = 0; i < iterations; i++) {
            const metrics = calculateMetrics(y_true, y_pred[i]);
            metricsResults.push({ iteration: i + 1, ...metrics });
        }

        // Guardar métricas en CSV
        const metricsHeader = 'iteration,precision,recall,f1Score,accuracy\n';
        const metricsRows = metricsResults.map(({ iteration, precision, recall, f1Score, accuracy }) => 
            `${iteration},${precision.toFixed(2)},${recall.toFixed(2)},${f1Score.toFixed(2)},${accuracy.toFixed(2)}`).join('\n');
        
        fs.writeFileSync(metricsOutputPath, `${metricsHeader}${metricsRows}`, 'utf8');
        console.log(`[ METRICS: ${metricsOutputPath} ]`);

        // Guardar el modelo en JSON
        scoresResults.forEach((result, index) => {
            // Crear un nombre de archivo dinámico
            const fileName = `isolation_${index + 1}.json`;
            // Unir la ruta y el nombre del archivo
            const isolationModelPath2 = isolationModelPath + fileName; // Guardar cada resultado en un archivo JSON
            //fs.writeFileSync(isolationModelPath2, JSON.stringify(result, null, 2), 'utf8');
        });
        // Imprimir el último nombre de archivo creado
        console.log(`[ MODEL: ${isolationModelPath}]`);


        // Graficar resultados con plot
        plot(datos, features, csvData, plotCSVPath, config); // Llamar a la función plot para graficar los resultados
        plot2(datos, features, csvData, plot2CSVPath, config); // Llamar a la función plot2 para graficar otros resultados
        plot3(datos, features, csvData, plot3CSVPath, config); // Llamar a la función plot3 para graficar otros resultados
        plot4(datos, features, csvData, plot4CSVPath, config); // Cambia esto a tu ruta deseada

        plot5(metricsResults,plot5CSVPath, config); // Cambia esto a tu ruta deseada
        plot6(metricsResults, plot6CSVPath, config); // Cambia esto a tu ruta deseada

    } 
    catch (error) {
        console.error('! ERROR: FALLÓ AL EJECUTAR EL ALGORITMO DE AISLAMIENTO !', error);
    }
};

const saveFeatureImportance = (importanceValues, outputPath) => {
    const header = 'feature,importance\n';
    const rows = importanceValues.map((importance, idx) => `feature_${idx + 1},${importance.toFixed(4)}`).join('\n');
    fs.writeFileSync(outputPath, `${header}${rows}`, 'utf8');
    console.log(`[ FEATURE IMPORTANCE: ${outputPath} ]`);
};

const calculateFeatureImportance = (features, model) => {
    const baselineScores = model.dataAnomalyScore(config.index.score);
    const featureImportance = Array(features[0].length).fill(0);

    features[0].forEach((_, featureIndex) => {
        // Crear copia de características
        const modifiedFeatures = features.map(row => [...row]);
        
        // Remover la característica estableciéndola en 0 o su media
        const featureMean = features.reduce((acc, row) => acc + row[featureIndex], 0) / features.length;
        modifiedFeatures.forEach(row => row[featureIndex] = featureMean);
        
        // Calcular puntajes modificados
        const modifiedScores = model.dataAnomalyScore(config.index.score);
        
        // Calcular importancia como el cambio promedio en la puntuación de anomalía
        const importance = modifiedScores.reduce((sum, score, idx) => sum + Math.abs(score - baselineScores[idx]), 0) / features.length;
        featureImportance[featureIndex] = importance;
    });

    return featureImportance;
};

// Ejecutar el proceso
runIsolationForestMultiple();
