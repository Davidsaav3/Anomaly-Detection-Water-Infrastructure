require('@tensorflow/tfjs-node'); 
const tf = require('@tensorflow/tfjs'); 
const loadCSVPercentage = require('./load.js'); 
const RedNeuronal = require('./network.js'); 
const plot = require('node-remote-plot'); 
const { forEach } = require('lodash'); 
const pathCSV = '../../dataset/'; 

// CARGAMOS CSV
const { features, labels, testFeatures, testLabels } = loadCSVPercentage(
    `${pathCSV}add.csv`, // RUTA DEL CSV
    ',',
    {
        shuffle: true, // MEZCLA LOS DATOS
        percentageTest: 10, // PORCENTAJE DE TEST
        dataColumns: ['end_device_ids.application_ids.application_id', 'end_device_ids.dev_eui', 'end_device_ids.join_eui', 'end_device_ids.dev_addr', 'correlation_ids_0', 'received_at', 'uplink_message.session_key_id', 'uplink_message.f_port', 'uplink_message.f_cnt', 'uplink_message.frm_payload', 'uplink_message.decoded_payload.bytes_0', 'uplink_message.decoded_payload.bytes_1', 'uplink_message.decoded_payload.bytes_2', 'uplink_message.decoded_payload.bytes_3', 'uplink_message.rx_metadata_0.gateway_ids.gateway_id', 'uplink_message.rx_metadata_0.gateway_ids.eui', 'uplink_message.rx_metadata_0.time', 'uplink_message.rx_metadata_0.timestamp', 'uplink_message.rx_metadata_0.rssi', 'uplink_message.rx_metadata_0.channel_rssi', 'uplink_message.rx_metadata_0.location.latitude', 'uplink_message.rx_metadata_0.location.longitude', 'uplink_message.rx_metadata_0.location.altitude', 'uplink_message.rx_metadata_0.location.source', 'uplink_message.rx_metadata_0.uplink_token', 'uplink_message.rx_metadata_0.received_at', 'uplink_message.settings.data_rate.lora.bandwidth', 'uplink_message.settings.data_rate.lora.spreading_factor', 'uplink_message.settings.data_rate.lora.coding_rate', 'uplink_message.settings.frequency', 'uplink_message.settings.timestamp', 'uplink_message.settings.time', 'uplink_message.received_at', 'uplink_message.consumed_airtime', 'uplink_message.network_ids.net_id', 'uplink_message.network_ids.ns_id', 'uplink_message.network_ids.tenant_id', 'uplink_message.network_ids.cluster_id', 'uplink_message.network_ids.cluster_address', 'truth'], // COLUMNAS DE DATOS
        labelColumns: ['end_device_ids.device_id'] // COLUMNAS DE ETIQUETAS
    }
);

// CREAMOS UNA NUEVA INSTANCIA DE LA CLASE RED NEURONAL
const redneuronalPrueba = new RedNeuronal(
    features, // VARIABLES INDEPENDIENTES
    labels, // VARIABLES DEPENDIENTES
    {
        learningRate: 0.01, // TASA DE APRENDIZAJE
        epochs: 250, // NÚMERO DE ÉPOCAS
        neurons: 32, // NÚMERO DE NEURONAS
        activation: 'relu', // FUNCIÓN DE ACTIVACIÓN
        percentage_train: 80, // PORCENTAJE DE ENTRENAMIENTO
        batchsize: 50 // TAMAÑO DEL LOTE
    }
);

// FUNCIÓN ASINCRONA PARA COMPILAR Y ENTRENAR EL ALGORITMO
async function network() {
    redneuronalPrueba.compilar(); // COMPILA LA RED NEURONAL
    const historial = await redneuronalPrueba.entrenar(); // ESPERA A QUE EL ENTRENAMIENTO FINALICE

    // GUARDAMOS RESULTADOS DE PREDICCIÓN (DESCOMENTAR PARA VER RESULTADOS)
    const resultado = redneuronalPrueba.prediccion(testFeatures);
    console.log('RESULTADOS OBTENIDOS:');  
    resultado.print();
    console.log('RESULTADOS REALES:');
    console.log(testLabels);
    console.log('TESTEO');
    console.log(redneuronalPrueba.testeo(testFeatures, testLabels)); //...

    // PLOTEAMOS RESULTADOS
    plot({
        x: historial.history.val_mape,
        xLabel: 'ITERACIÓN #',
        yLabel: 'ERROR PORCENTAJE PROMEDIO',
        title: 'MAPE',
        name: './result/plot'
    });
}

network(); 

