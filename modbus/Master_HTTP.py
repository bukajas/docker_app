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
telegraf_url = 'https://localhost:8186/telegraf'  # URL to send data to Telegraf
auth = HTTPBasicAuth('test', 'test')  # Basic authentication
ca_bundle = '/home/asszonyij//ca.crt'

# ! problem with timestamps
def read_holding_registers():
    rr = client.read_holding_registers(1, 5, unit=1)
    if not rr.isError():
        log.debug(f"Read holding registers: {rr.registers}")
        
        print(rr.registers[0])
        data1 = 'coil_list,slaveID=2,masterID=2,unit=2,modbusType=2,protocol=modbus data={}'.format(rr.registers[0])  # Formulate your data here
        new_list = []
        for i in range(len(rr.registers)):
            new_list.append(random.randint(0,100))
        data2 = 'vibration,VendorID=1a3!de,NetworkType=serial,unit=1,speed=10.3,protocol=ethernet/ip data={}'.format(new_list[0])  # Formulate your data here
        data_list = [data1,data2]
        data = "\n".join(data_list)
        try:
            requests.post(telegraf_url, data=data, auth=auth, verify=False)
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