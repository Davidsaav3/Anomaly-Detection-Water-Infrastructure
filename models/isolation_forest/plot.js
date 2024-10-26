const { createCanvas } = require('canvas');
const { Chart, registerables } = require('chart.js');
const fs = require('fs');
Chart.register(...registerables);

// PLOT ORIGINAL //
const plot = (datos, features, csvData, outputPath, config) => {
    // OBTENCIÓN Y ORDENACIÓN DE DATOS
    const data = datos.map((element, index) => ({ x: element[0].value_x, y: element[0].value_y }));

    // OBTENCIÓN DE MÍNIMOS Y MÁXIMOS
    const maxvalue = Math.max(...data.map(d => d.y));
    const minvalue = Math.min(...data.map(d => d.y));

    // CONFIGURACIÓN DEL CANVAS
    const canvasWidth = 2000; 
    const canvasHeight = 1000; 
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // CREACIÓN DEL GRÁFICO
    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: config.index.label,
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                pointRadius: (context) => (datos[context.dataIndex][1]) ? 10 : 5,
                pointBackgroundColor: (context) => {
                    const truthValue = datos[context.dataIndex][0].truth; // Obtener el valor truth
                    if (truthValue === 1) {
                        return 'yellow'; // Pintar de amarillo si truth es 1
                    }
                    return (datos[context.dataIndex][1]) ? 'red' : 'blue'; // Otros colores
                },
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: config.index.text_X, font: { size: 16, family: 'Arial' }},
                    grid: { color: 'rgba(200, 200, 200, 0.5)' },
                    ticks: { 
                        stepSize: 1,
                        font: { size: 12 },
                        autoSkip: true,
                        maxTicksLimit: 20
                    },
                },
                y: {
                    title: { display: true, text: config.index.text_y, font: { size: 16, family: 'Arial' }},
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
                legend: { labels: { font: { size: 14 }}},
            },
        }
    });

    // GUARDAR LA IMAGEN 
    fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
    console.log(`[ PLOT: ${outputPath}]`);
};


// NUEVA FUNCIÓN PLOT2 - GRÁFICOS ADICIONALES //
const plot2 = (datos, features, csvData, outputPath2, config) => {
    // Graficar distribución de puntajes de anomalía (histograma)
    const anomalyScores = datos.map(element => element[0].score); // Puntajes de anomalías
    const isAnomalies = datos.map(element => element[1]); // Identificar si es una anomalía
    const canvasWidth = 1000;
    const canvasHeight = 600;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Crear datos para el histograma
    const dataset = [{
        label: 'Anomaly Scores',
        data: anomalyScores,
        backgroundColor: anomalyScores.map((_, index) => isAnomalies[index] ? 'rgba(255, 0, 0, 0.5)' : 'rgba(75, 192, 192, 0.5)'), // Color rojo para anomalías
        borderColor: anomalyScores.map((_, index) => isAnomalies[index] ? 'rgba(255, 0, 0, 1)' : 'rgba(75, 192, 192, 1)'),
        borderWidth: 1,
    }];

    // Histograma de puntajes de anomalías
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: anomalyScores.map((_, index) => index + 1), // Mantener etiquetas de índice
            datasets: dataset,
        },
        options: {
            scales: {
                x: {
                    title: { display: true, text: 'Sample Index', font: { size: 16, family: 'Arial' }},
                    grid: { color: 'rgba(200, 200, 200, 0.5)' },
                    ticks: { font: { size: 12 }},
                },
                y: {
                    title: { display: true, text: 'Anomaly Score', font: { size: 16, family: 'Arial' }},
                    beginAtZero: true,
                },
            },
            plugins: {
                legend: { display: true },
            },
        }
    });

    // Guardar imagen del histograma
    fs.writeFileSync(outputPath2, canvas.toBuffer('image/png'));
    console.log(`[ PLOT2 - Anomaly Scores Distribution: ${outputPath2}]`);
};

// NUEVA FUNCIÓN PLOT3 - GRAFICAR NUBES DE PUNTOS //
const plot3 = (datos, features, csvData, outputPath3, config) => {
    // EXTRAER VALORES PARA NUBES DE PUNTOS
    const scatterData = datos.map(element => ({
        x: element[0].value_y,  // Usar el valor como eje X
        y: element[0].score,   // Usar el puntaje de anomalía como eje Y
        isAnomaly: element[1]  // Identificar si es una anomalía
    }));

    // Asegurarse de que scatterData no tenga duplicados
    const uniqueData = [...new Map(scatterData.map(point => [point.x + '-' + point.y, point])).values()];

    // Normalizar coordenadas
    const xMin = Math.min(...uniqueData.map(p => p.x));
    const xMax = Math.max(...uniqueData.map(p => p.x));
    const yMin = Math.min(...uniqueData.map(p => p.y));
    const yMax = Math.max(...uniqueData.map(p => p.y));

    const canvasWidth = 1000;
    const canvasHeight = 600;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // NO RELLENAR EL CANVAS (FONDO TRANSPARENTE)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // DIBUJAR LÍNEAS DE EJE
    ctx.strokeStyle = 'white'; // Color de las líneas de los ejes
    ctx.lineWidth = 2; // Grosor de la línea
    ctx.beginPath();
    ctx.moveTo(50, 0); // Eje Y
    ctx.lineTo(50, canvasHeight); 
    ctx.moveTo(0, canvasHeight - 50); // Eje X
    ctx.lineTo(canvasWidth, canvasHeight - 50);
    ctx.stroke();

    // DIBUJAR REJILLA
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)'; // Color de la rejilla
    for (let i = 0; i <= 10; i++) {
        const xGrid = (i / 10) * (canvasWidth - 100) + 50; // Espaciado en el eje X
        ctx.beginPath();
        ctx.moveTo(xGrid, 0);
        ctx.lineTo(xGrid, canvasHeight);
        ctx.stroke();
    }
    for (let i = 0; i <= 10; i++) {
        const yGrid = canvasHeight - ((i / 10) * (canvasHeight - 100)); // Espaciado en el eje Y
        ctx.beginPath();
        ctx.moveTo(0, yGrid);
        ctx.lineTo(canvasWidth, yGrid);
        ctx.stroke();
    }

    // CREAR GRAFICO DE NUBES DE PUNTOS
    uniqueData.forEach(point => {
        const normalizedX = ((point.x - xMin) / (xMax - xMin)) * (canvasWidth - 100) + 50; // Normalizar X y ajustar
        const normalizedY = (canvasHeight - 50) - ((point.y - yMin) / (yMax - yMin)) * (canvasHeight - 100); // Normalizar Y y ajustar

        ctx.beginPath();
        ctx.arc(normalizedX, normalizedY, 5, 0, Math.PI * 2); // Radio de los puntos
        ctx.fillStyle = point.isAnomaly ? 'red' : 'rgba(75, 192, 192, 1)'; // Color según si es anomalía
        ctx.fill();
        ctx.closePath();
    });

    // AGREGAR TITULOS Y ETIQUETAS
    ctx.fillStyle = 'white'; // Cambiar a blanco
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Scatter Plot of Anomaly Scores', canvasWidth / 2 - 100, 30); // Título

    // Etiquetas de ejes
    ctx.font = '12px Arial';
    ctx.fillText(config.index.text_X || 'Eje X', canvasWidth - 150, canvasHeight - 10); // Etiqueta eje X
    ctx.save();
    ctx.translate(10, canvasHeight / 2);
    ctx.rotate(-Math.PI / 2); // Rotar para eje Y
    ctx.fillText(config.index.text_y || 'Eje Y', 0, 0); // Etiqueta eje Y
    ctx.restore();

    // AGREGAR VALORES A LOS EJES
    const xStep = (xMax - xMin) / 10; // Paso para el eje X
    const yStep = (yMax - yMin) / 10; // Paso para el eje Y

    for (let i = 0; i <= 10; i++) {
        // Eje X
        const xValue = xMin + i * xStep;
        const xLabelX = (i / 10) * (canvasWidth - 100) + 50; // Normalizar posición en el canvas
        ctx.fillText(xValue.toFixed(2), xLabelX - 15, canvasHeight - 30); // Etiqueta del eje X

        // Eje Y
        const yValue = yMin + i * yStep;
        const yLabelY = canvasHeight - 50 - (i / 10) * (canvasHeight - 100); // Normalizar posición en el canvas
        ctx.fillText(yValue.toFixed(2), 10, yLabelY + 5); // Etiqueta del eje Y
    }

    // GUARDAR LA IMAGEN 
    fs.writeFileSync(outputPath3, canvas.toBuffer('image/png'));
    console.log(`[ PLOT3 - Scatter Plot: ${outputPath3}]`);
};

module.exports = { plot, plot2, plot3 };
