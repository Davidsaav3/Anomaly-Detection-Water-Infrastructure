1. Identificación del Dispositivo [device]
end_device_ids.device_id
end_device_ids.application_ids.application_id
end_device_ids.dev_eui
end_device_ids.join_eui
end_device_ids.dev_addr
        
2. Metadatos de la Mensajería [message]
correlation_ids
received_at
uplink_message.session_key_id
uplink_message.f_port
uplink_message.f_cnt
uplink_message.frm_payload
uplink_message.decoded_payload.bytes
uplink_message.received_at
uplink_message.consumed_airtime

3. Datos de la Red y Puertas de Enlace [network]
rx_metadata.gateway_ids.gateway_id
rx_metadata.gateway_ids.eui
rx_metadata.time
rx_metadata.timestamp
rx_metadata.rssi
rx_metadata.channel_rssi
rx_metadata.snr
rx_metadata.location.latitude
rx_metadata.location.longitude
rx_metadata.location.altitude
rx_metadata.location.source
rx_metadata.uplink_token
rx_metadata.channel_index
rx_metadata.received_at

4. Configuraciones de Transmisión [device_configuration]
uplink_message.settings.data_rate.lora.bandwidth
uplink_message.settings.data_rate.lora.spreading_factor
uplink_message.settings.data_rate.lora.coding_rate
uplink_message.settings.frequency
uplink_message.settings.timestamp
uplink_message.settings.time
uplink_message.version_ids.brand_id
uplink_message.version_ids.model_id
uplink_message.version_ids.hardware_version
uplink_message.version_ids.firmware_version
uplink_message.version_ids.band_id
uplink_message.network_ids.net_id
uplink_message.network_ids.ns_id
uplink_message.network_ids.tenant_id
uplink_message.network_ids.cluster_id
uplink_message.network_ids.cluster_address