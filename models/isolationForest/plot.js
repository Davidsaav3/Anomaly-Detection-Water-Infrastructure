const { createCanvas } = require('canvas');
const { Chart, registerables } = require('chart.js');
const fs = require('fs');
Chart.register(...registerables);

// [ PLOT 1 ]
const plot1 = (datos, outputPath, config) => {
    const data = datos.map((element, index) => ({ x: element[0].valueX, y: element[0].valueY }));

    // MÍNIMOS Y MÁXIMOS
    const maxvalue = Math.max(...data.map(d => d.y));
    const minvalue = Math.min(...data.map(d => d.y));

    // CANVAS
    const canvasWidth = 2000;
    const canvasHeight = 1000;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // GRÁFICO
    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: "NORMAL DATA",
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                pointRadius: (context) => (datos[context.dataIndex][1]) ? 10 : 5,
                pointBackgroundColor: (context) => {
                    const truthValue = datos[context.dataIndex][0].truth; // VALOR DE TRUTH
                    if (truthValue === 1) {
                        return 'yellow'; // PINTAR DE AMARILLO SI TRUTH ES 1
                    }
                    return (datos[context.dataIndex][1]) ? 'red' : 'blue'; // COLOR ROJO SI ES ANOMALIA
                },
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: "INDEX", font: { size: 16, family: 'Arial' } },
                    grid: { color: 'rgba(200, 200, 200, 0.5)' },
                    ticks: {
                        stepSize: 1,
                        font: { size: 12 },
                        autoSkip: true,
                        maxTicksLimit: 20
                    },
                },
                y: {
                    title: { display: true, text: "VALUE", font: { size: 16, family: 'Arial' } },
                    grid: { color: 'rgba(200, 200, 200, 0.5)' },
                    ticks: {
                        font: { size: 12 },
                        beginAtZero: true,
                    },
                    min: minvalue,
                    max: maxvalue,
                },
            },
            plugins: {
                legend: { labels: { font: { size: 14 } } },
            },
        }
    });
    // GUARDAR
    fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
    console.log(`[ PLOT 1: ${outputPath}]`);
};

// [ PLOT 2 ]
const plot2 = (datos, outputPath2, config) => {
    const anomalyScores = datos.map(element => element[0].score); // SCORE ANOMALÍAS
    const isAnomalies = datos.map(element => element[1]); // SI ES UNA ANOMALÍA
    const canvasWidth = 1000;
    const canvasHeight = 600;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // DATOS
    const dataset = [{
        label: 'ANOMALY SCORES DISTRIBUTION',
        data: anomalyScores,
        backgroundColor: anomalyScores.map((_, index) => isAnomalies[index] ? 'rgba(255, 0, 0, 0.5)' : 'rgba(75, 192, 192, 0.5)'), // COLOR ROJO PARA ANOMALÍAS
        borderColor: anomalyScores.map((_, index) => isAnomalies[index] ? 'rgba(255, 0, 0, 1)' : 'rgba(75, 192, 192, 1)'),
        borderWidth: 1,
    }];

    // HISTOGRAMA DE PUNTAJES DE ANOMALÍAS
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: anomalyScores.map((_, index) => index + 1), // ETIQUETAS DE ÍNDICE
            datasets: dataset,
        },
        options: {
            scales: {
                x: {
                    title: { display: true, text: 'SAMPLE INDEX', font: { size: 16, family: 'Arial' } },
                    grid: { color: 'rgba(200, 200, 200, 0.5)' },
                    ticks: { font: { size: 12 } },
                },
                y: {
                    title: { display: true, text: 'ANOMALY SCORE', font: { size: 16, family: 'Arial' } },
                    beginAtZero: true,
                },
            },
            plugins: {
                legend: { display: true },
            },
        }
    });
    // GUARDAR 
    fs.writeFileSync(outputPath2, canvas.toBuffer('image/png'));
    console.log(`[ PLOT 2: ${outputPath2}]`);
};

// [ PLOT 3 ]
const plot3 = (datos, outputPath3, config) => {

    // CREAR DATOS 
    const scatterData = datos.map((element, index) => ({
        x: index + 1,  // USAR ÍNDICE COMO EJE X PARA QUE COINCIDA CON PLOT2
        y: element[0].score,   // SCORE DE ANOMALÍA EN EJE Y
        isAnomaly: element[1]  // SI ES UNA ANOMALÍA O NO
    }));

    // NORMALIZAR COORDENADAS
    const yMin = Math.min(...scatterData.map(p => p.y));
    const yMax = Math.max(...scatterData.map(p => p.y));
    const canvasWidth = 1000;
    const canvasHeight = 600;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // LÍNEAS DE EJE
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 0); // EJE Y
    ctx.lineTo(50, canvasHeight);
    ctx.moveTo(0, canvasHeight - 50); // EJE X
    ctx.lineTo(canvasWidth, canvasHeight - 50);
    ctx.stroke();

    // REJILLA
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
    for (let i = 0; i <= 10; i++) {
        const xGrid = (i / 10) * (canvasWidth - 100) + 50;
        ctx.beginPath();
        ctx.moveTo(xGrid, 0);
        ctx.lineTo(xGrid, canvasHeight);
        ctx.stroke();
    }
    for (let i = 0; i <= 10; i++) {
        const yGrid = canvasHeight - ((i / 10) * (canvasHeight - 100));
        ctx.beginPath();
        ctx.moveTo(0, yGrid);
        ctx.lineTo(canvasWidth, yGrid);
        ctx.stroke();
    }

    // NUBE DE PUNTOS
    scatterData.forEach(point => {
        const normalizedX = ((point.x - 1) / (scatterData.length - 1)) * (canvasWidth - 100) + 50; // NORMALIZAR X y Y 
        const normalizedY = (canvasHeight - 50) - ((point.y - yMin) / (yMax - yMin)) * (canvasHeight - 100); // NORMALIZAR Y
        ctx.beginPath();
        ctx.arc(normalizedX, normalizedY, 5, 0, Math.PI * 2); // RADIO DE LOS PUNTOS
        ctx.fillStyle = point.isAnomaly ? 'red' : 'rgba(75, 192, 192, 1)'; // COLOR SEGÚN SI ES ANOMALÍA
        ctx.fill();
        ctx.closePath();
    });

    // TÍTULOS Y ETIQUETAS
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Anomaly Scores', canvasWidth / 2 - 100, 30);

    // ETIQUETAS DE EJES
    ctx.font = '12px Arial';
    ctx.fillText(config.index.text_X || 'X', canvasWidth - 150, canvasHeight - 10);
    ctx.save();
    ctx.translate(10, canvasHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(config.index.text_y || 'Y', 0, 0);
    ctx.restore();

    // VALORES A LOS EJES
    const xStep = scatterData.length / 10;
    const yStep = (yMax - yMin) / 10;
    for (let i = 0; i <= 10; i++) {
        // EJE X
        const xValue = Math.floor(i * xStep);
        const xLabelX = (i / 10) * (canvasWidth - 100) + 50;
        ctx.fillText(xValue, xLabelX - 15, canvasHeight - 30);
        // EJE Y
        const yValue = yMin + i * yStep;
        const yLabelY = canvasHeight - 50 - (i / 10) * (canvasHeight - 100);
        ctx.fillText(yValue.toFixed(2), 10, yLabelY + 5);
    }

    // GUARDAR 
    fs.writeFileSync(outputPath3, canvas.toBuffer('image/png'));
    console.log(`[ PLOT 3: ${outputPath3}]`);
};

// [ PLOT 4 ]
const plot4 = (metricsData, outputPath) => {
    // CANVAS
    const canvasWidth = 2000;
    const canvasHeight = 1000;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // DATOS
    const iterations = metricsData.map(d => d.iteration);
    const accuracies = metricsData.map(d => d.accuracy);
    const precisions = metricsData.map(d => d.precision);
    const recalls = metricsData.map(d => d.recall);
    const f1Scores = metricsData.map(d => d.f1Score);

    // GRÁFICO
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: iterations,
            datasets: [
                {
                    label: 'Accuracy',
                    data: accuracies,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    pointRadius: 5,
                },
                {
                    label: 'Precision',
                    data: precisions,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 2,
                    pointRadius: 5,
                },
                {
                    label: 'Recall',
                    data: recalls,
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 2,
                    pointRadius: 5,
                },
                {
                    label: 'F1 Score',
                    data: f1Scores,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    pointRadius: 5,
                }
            ],
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'ITERATIONS',
                        font: { size: 16, family: 'Arial' },
                    },
                    grid: { color: 'rgba(200, 200, 200, 0.5)' },
                    ticks: { stepSize: 1, font: { size: 12 }, autoSkip: true, maxTicksLimit: 20 },
                },
                y: {
                    title: {
                        display: true,
                        text: 'METRIC',
                        font: { size: 16, family: 'Arial' },
                    },
                    grid: { color: 'rgba(200, 200, 200, 0.5)' },
                    ticks: { font: { size: 12 }, beginAtZero: true },
                },
            },
            plugins: {
                legend: {
                    labels: { font: { size: 14 } },
                },
            },
        },
    });
    // GUARDAR
    fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
    console.log(`[ PLOT 4: ${outputPath}]`);
};

// [ PLOT 5 ]]
const plot5 = (metricasPorIteracion, outputPath5, config) => {
    const canvasWidth = 1000;
    const canvasHeight = 600;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // GRÁFICO
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: metricasPorIteracion.length }, (_, i) => i + 1), // ITERACIONES
            datasets: [
                {
                    label: 'MEAN SQUARED ERROR',
                    data: metricasPorIteracion,
                    borderColor: 'rgba(0, 0, 255, 1)',
                    fill: false,
                    borderDash: [5, 5], // LÍNEAS PUNTEADAS PARA MSE
                },
            ],
        },
        options: {
            scales: {
                x: {
                    title: { display: true, text: 'ITERATIONS', font: { size: 16, family: 'Arial' } },
                    grid: { color: 'rgba(200, 200, 200, 0.5)' },
                },
                y: {
                    title: { display: true, text: 'MSE', font: { size: 16, family: 'Arial' } },
                    beginAtZero: true,
                },
            },
            plugins: {
                legend: { display: true },
            },
        },
    });
    // GUARDAR 
    fs.writeFileSync(outputPath5, canvas.toBuffer('image/png'));
    console.log(`[ PLOT 5: ${outputPath5}]`);
};

// [ PLOT 6 ]
const plot6 = (metricasPorIteracion, outputPath6, config) => {
    const canvasWidth = 1000;
    const canvasHeight = 600;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // DATOS 
    const trueNegativeRateData = metricasPorIteracion.map(m => m.trueNegativeRate);
    const falsePositiveRateData = metricasPorIteracion.map(m => m.falsePositiveRate);

    // GRÁFICO DE LÍNEAS
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: metricasPorIteracion.length }, (_, i) => i + 1), // ITERACIONES
            datasets: [
                {
                    label: 'TRUE NEGATIVE RATE',
                    data: trueNegativeRateData,
                    borderColor: 'rgba(0, 255, 0, 1)',
                    fill: false,
                },
                {
                    label: 'FALSE `POSITIVE RATE',
                    data: falsePositiveRateData,
                    borderColor: 'rgba(255, 0, 0, 1)',
                    fill: false,
                },
            ],
        },
        options: {
            responsive: false,
            scales: {
                x: {
                    title: { display: true, text: 'ITERATIONS', font: { size: 16, family: 'Arial' } },
                    grid: { color: 'rgba(200, 200, 200, 0.5)' },
                },
                y: {
                    title: { display: true, text: 'METRIC VALUE', font: { size: 16, family: 'Arial' } },
                    beginAtZero: true,
                },
            },
            plugins: {
                legend: { labels: { font: { size: 14 } } },
            },
        },
    });
    // GUARDAR
    fs.writeFileSync(outputPath6, canvas.toBuffer('image/png'));
    console.log(`[ PLOT 6: ${outputPath6}]`);
};

// [ PLOT 7 ]
const plot7 = (datos, outputPath, config) => {
    const datosPlot = datos.map((element) => {
        const isAnomaly = element[1]; // ANOMALÍA
        const values_y = Object.values(element[0].rowFeatures); // FEATURES[INDEX]
        const valueX = element[0].valueX;
        return { values_y, valueX, isAnomaly };
    });

    // CANVAS
    const canvasWidth = 10000;
    const canvasHeight = 2000;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // GRÁFICO
    const datasets = Array.from({ length: datosPlot[0].values_y.length }, (_, i) => {
        const color = `hsl(${(i * 360) / datosPlot[0].values_y.length}, 100%, 50%)`; // COLOR ÚNICO POR SERIE
        return {
            label: `ELEMENT ${i + 1}`,
            data: datosPlot.map(d => ({ x: d.valueX, y: d.values_y[i] })), // DATOS EJE Y
            backgroundColor: color, // COLOR FONDO
            borderColor: color, // COLOR BORDE LÍNEA
            borderWidth: 3, // GROSOR LÍNEA
            fill: false, // LÍNEA NO LLENA
            pointRadius: (context) => (datosPlot[context.dataIndex].isAnomaly) ? 10 : 5, // TAMAÑO PUNTO ANOMALÍA
            pointBackgroundColor: (context) => {
                return datosPlot[context.dataIndex].isAnomaly ? 'red' : 'blue'; // COLOR PUNTO
            },
        };
    });

    new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'LINE ELEMENTS',
                    font: { size: 20 }
                },
                legend: { labels: { font: { size: 14 } } },
            },
            scales: {
                x: {
                    title: { display: true, text: config.index.text_X, font: { size: 16, family: 'Arial' } },
                    grid: { color: 'rgba(200, 200, 200, 0.5)' },
                    ticks: {
                        stepSize: 1,
                        font: { size: 12 },
                        autoSkip: true,
                        maxTicksLimit: 20
                    },
                },
                y: {
                    title: { display: true, text: config.index.text_y, font: { size: 16, family: 'Arial' } },
                    grid: { color: 'rgba(200, 200, 200, 0.5)' },
                    ticks: {
                        font: { size: 12 },
                        beginAtZero: true,
                    },
                },
            },
        }
    });
    // GUARDAR
    fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
    console.log(`[ PLOT 7: ${outputPath}]`);
};

module.exports = { plot1, plot2, plot3, plot4, plot5, plot6, plot7 };