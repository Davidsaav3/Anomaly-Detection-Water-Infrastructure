require('@tensorflow/tfjs-node');
const tf = require('@tensorflow/tfjs');
const loadCSV = require('./load.js');
const RegresionLineal = require('./regresion.js'); 
const plot = require('node-remote-plot'); 

const pathCSV = '../../dataset/';

// CARGAR CSV 
const { features, labels, testFeatures, testLabels } = loadCSV(
    `${pathCSV}add.csv`, // RUTA DEL CSV
    ',',
    {
        shuffle: true,
        splitTest: 9,
        dataColumns: ['end_device_ids.application_ids.application_id', 'end_device_ids.dev_eui', 'end_device_ids.join_eui', 'end_device_ids.dev_addr', 'correlation_ids_0', 'received_at', 'uplink_message.session_key_id', 'uplink_message.f_port', 'uplink_message.f_cnt', 'uplink_message.frm_payload', 'uplink_message.decoded_payload.bytes_0', 'uplink_message.decoded_payload.bytes_1', 'uplink_message.decoded_payload.bytes_2', 'uplink_message.decoded_payload.bytes_3', 'uplink_message.rx_metadata_0.gateway_ids.gateway_id', 'uplink_message.rx_metadata_0.gateway_ids.eui', 'uplink_message.rx_metadata_0.time', 'uplink_message.rx_metadata_0.timestamp', 'uplink_message.rx_metadata_0.rssi', 'uplink_message.rx_metadata_0.channel_rssi', 'uplink_message.rx_metadata_0.location.latitude', 'uplink_message.rx_metadata_0.location.longitude', 'uplink_message.rx_metadata_0.location.altitude', 'uplink_message.rx_metadata_0.location.source', 'uplink_message.rx_metadata_0.uplink_token', 'uplink_message.rx_metadata_0.received_at', 'uplink_message.settings.data_rate.lora.bandwidth', 'uplink_message.settings.data_rate.lora.spreading_factor', 'uplink_message.settings.data_rate.lora.coding_rate', 'uplink_message.settings.frequency', 'uplink_message.settings.timestamp', 'uplink_message.settings.time', 'uplink_message.received_at', 'uplink_message.consumed_airtime', 'uplink_message.network_ids.net_id', 'uplink_message.network_ids.ns_id', 'uplink_message.network_ids.tenant_id', 'uplink_message.network_ids.cluster_id', 'uplink_message.network_ids.cluster_address', 'truth'], // COLUMNAS DE DATOS
        labelColumns: ['end_device_ids.device_id'] // COLUMNAS DE ETIQUETAS
    }
);

/*
const { features , labels, testFeatures, testLabels } = loadCSV(
    `${pathCSV}cars.csv`,
    ',',
    {
        shuffle: true,
        splitTest: 9,
        dataColumns: ['horsepower', 'weight', 'displacement'],
        labelColumns: ['mpg']
    }
)
*/

// INICIAR REGRESIÓN LINEAL
const regresionPrueba = new RegresionLineal(
    features,
    labels,
    {
        learningRate: 0.1,
        iterations: 100
    }
);

// ENTRENAMIENTO DEL MODELO
regresionPrueba.train();

// REALIZAR UNA PRUEBA
console.log(' ');
const r = regresionPrueba.test(testFeatures, testLabels);
console.log('[ ALGORITHM ACCURACY =>', r);

// MOSTRAR PESOS Y VALORES B
regresionPrueba.mostrarPesos();

// REALIZAR UNA PRUEBA
console.log('[ TEST ]');
console.log('[ DATA =>', features[1]);
console.log('[ ACTUAL RESULT =>', labels[1]);
const resultado = regresionPrueba.predictResult(features[1]);
console.log('[ PREDICTION RESULT =>', resultado);

// GRÁFICA DE RESULTADOS
console.log(' ');
plot({
    x: regresionPrueba.mseHistory.reverse(),
    xLabel: 'ITERATION #',
    yLabel: 'MEAN SQUARED ERROR'
});
