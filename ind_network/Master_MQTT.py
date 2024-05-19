#!/usr/bin/env python

from pymodbus.client import ModbusTcpClient
import logging
import time
import paho.mqtt.client as mqtt  # Import paho-mqtt for MQTT communication

logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.DEBUG)

client = ModbusTcpClient('localhost', port=5020)
mqtt_broker = 'localhost'  # MQTT Broker address
mqtt_port = 1883  # MQTT Broker port
mqtt_topic = 'telegraf/modbus'  # MQTT topic to publish data

# Initialize MQTT client and connect to broker
mqtt_client = mqtt.Client()
mqtt_client.connect(mqtt_broker, mqtt_port, 60)

def read_holding_registers():
    rr = client.read_holding_registers(1, 5, unit=1)
    if not rr.isError():
        log.debug(f"Read holding registers: {rr.registers}")
        data = 'coil_list,slaveID=1,masterID=1,unit=1,modbusType=1 data={}'.format(rr.registers[0])  # Formulate your data here
        try:
            mqtt_client.publish(mqtt_topic, data)
            log.info("Data published to MQTT topic")
        except Exception as e:
            log.error(f"Error publishing data to MQTT: {e}")
    else:
        log.error(f"Error reading holding registers: {rr}")

try:
    while True:
        read_holding_registers()
        time.sleep(1)
finally:
    client.close()
    mqtt_client.disconnect()  # Disconnect from MQTT broker when done
