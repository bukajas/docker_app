#!/usr/bin/env python

from pymodbus.client import ModbusTcpClient
import logging
import time
import requests  # Import requests library for sending data to Telegraf
from requests.auth import HTTPBasicAuth  # Import for basic authentication
import random

logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.DEBUG)

client = ModbusTcpClient('localhost', port=5020)
telegraf_url = 'https://192.168.122.118:8186/telegraf'  # URL to send data to Telegraf
auth = HTTPBasicAuth('test', 'test')  # Basic authentication
ca_bundle = '/home/asszonyij/docker_app/testCA/myCA/ca.crt'
client_cert = ('/home/asszonyij/docker_app/testCA/myCA/certs/client.crt', '/home/asszonyij/docker_app/testCA/myCA/private/client.key')  # Client certificate and key

# ! problem with timestamps
def read_holding_registers():
    rr = client.read_holding_registers(1, 5, unit=1)
    if not rr.isError():
        log.debug(f"Read holding registers: {rr.registers}")
        current_time = time.localtime()

        # Extract seconds from the current time
        seconds = current_time.tm_sec

        print(type(rr.registers[0]))
        data1 = 'coils,slaveID=2,masterID=2,unit=2,modbusType=2,protocol=modbus data={}'.format(100+seconds+1)  # Formulate your data here
        new_list = []
        for i in range(len(rr.registers)):
            new_list.append(random.randint(0,100))
        data2 = 'preasure,VendorID=1a3!de,NetworkType=serial,unit=1,speed=10.3,protocol=modbus data={}'.format(new_list[0]+random.randint(0,100))  # Formulate your data here
        data3 = 'preasure,VendorID=sonic,NetworkType=serial,unit=2,speed=30,protocol=modbus data={}'.format(new_list[0]+random.randint(0,100))  # Formulate your data here
        data4 = 'preasure,VendorID=azonaj,NetworkType=tcp,unit=1,speed=30,protocol=modbus data={}'.format(new_list[0]+random.randint(0,100))  # Formulate your data here
        data5 = 'vibration,slaveID=1,masterID=1,unit=1,type=1,protocol=modbus data={}'.format(rr.registers[0]+random.randint(0,100)) 

        print(f"data:::::: {data1}")


        data_list = [data1,data2,data3,data4,data5]

        data = "\n".join(data_list)
        print(data,data1)
        try:
            requests.post(telegraf_url, data=data, auth=auth, verify=ca_bundle, cert=client_cert)
            log.info("Data sent to Telegraf")
        except Exception as e:
            log.error(f"Error sending data to Telegraf: {e}")
    else:
        log.error(f"Error reading holding registers: {rr}")

try:
    while True:
        read_holding_registers()
        time.sleep(1)
finally:
    client.close()
