#!/usr/bin/env python

from pymodbus.client import ModbusTcpClient
import logging
import time
import requests  # Import requests library for sending data to Telegraf
from requests.auth import HTTPBasicAuth  # Import for basic authentication


logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.DEBUG)

client = ModbusTcpClient('localhost', port=5020)
telegraf_url = 'https://localhost:8186/telegraf'  # URL to send data to Telegraf
auth = HTTPBasicAuth('test', 'test')  # Basic authentication
ca_bundle = '/home/asszonyij//ca.crt'


def read_holding_registers():
    rr = client.read_holding_registers(1, 5, unit=1)
    if not rr.isError():
        log.debug(f"Read holding registers: {rr.registers}")
        data = 'coil_list,slaveID=2,masterID=2,unit=2,modbusType=2 data={}'.format(rr.registers[0])  # Formulate your data here
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
