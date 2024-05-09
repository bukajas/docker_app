#!/usr/bin/env python

from pymodbus.client import ModbusTcpClient
import logging
import time
import requests
from requests.auth import HTTPBasicAuth
import random
import threading

logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.DEBUG)

client = ModbusTcpClient('localhost', port=5020)
telegraf_url = 'https://localhost:8186/telegraf'
auth = HTTPBasicAuth('test', 'test')
ca_bundle = '/etc/ssl/telegraf.cert'

def read_and_send():
    while True:
        rr = client.read_holding_registers(1, 5, unit=1)
        if not rr.isError():
            log.debug(f"Read holding registers: {rr.registers}")
            current_time = time.localtime()
            seconds = current_time.tm_sec
            r = random.randint(1,100)
            data1 = 'coil_list,slaveID=2,masterID=2,unit=2,modbusType=2,protocol=modbus data={}'.format(100 + seconds + 1)
            new_list = [random.randint(0,100) for _ in range(len(rr.registers))]
            data_list = [
                f'vibration,VendorID={r},NetworkType=serial,unit={r},speed={r},protocol=ethernet/ip data={r}',
                f'vibration,VendorID=sonic,NetworkType=serial,unit=2,speed=30,protocol=ethernet/ip data={r+1}',
                f'vibration,VendorID=azonaj,NetworkType=tcp,unit=1,speed={r},protocol=ethernet/ip data={r+2}',
                f'coil_list,slaveID=1,masterID={r},unit=1,modbusType=1,protocol=modbus data={r+3}',
                f'coil_list,slaveID={r},masterID=2,unit=2,modbusType=1,protocol=modbus data={r+4}',
                f'vibration,VendorID=azonaj,NetworkType=tcp,unit=1,speed={r},protocol=ethernet/ip data={r+2}',
                f'coil_list,slaveID=1,masterID={r},unit=1,modbusType=1,protocol=modbus data={r+3}',
                f'coil_list,slaveID={r},masterID=2,unit=2,modbusType=1,protocol=modbus data={r+4}',
                f'vibration,VendorID=azonaj,NetworkType=tcp,unit=1,speed={r},protocol=ethernet/ip data={r+2}',
                f'coil_list,slaveID=1,masterID={r},unit=1,modbusType=1,protocol=modbus data={r+3}',
                f'coil_list,slaveID={r},masterID=2,unit=2,modbusType=1,protocol=modbus data={r+4}',
                f'vibration,VendorID=azonaj,NetworkType=tcp,unit=1,speed={r},protocol=ethernet/ip data={r+2}',
                f'coil_list,slaveID=1,masterID={r},unit=1,modbusType=1,protocol=modbus data={r+3}',
                f'coil_list,slaveID={r},masterID=2,unit=2,modbusType=1,protocol=modbus data={r+4}',
                                f'vibration,VendorID={r},NetworkType=serial,unit={r},speed={r},protocol=ethernet/ip data={r}',
                f'vibration,VendorID=sonic,NetworkType=serial,unit=2,speed=30,protocol=ethernet/ip data={r+1}',
                f'vibration,VendorID=azonaj,NetworkType=tcp,unit=1,speed={r},protocol=ethernet/ip data={r+2}',
                f'coil_list,slaveID=1,masterID={r},unit=1,modbusType=1,protocol=modbus data={r+3}',
                f'coil_list,slaveID={r},masterID=2,unit=2,modbusType=1,protocol=modbus data={r+4}',
                f'vibration,VendorID=azonaj,NetworkType=tcp,unit=1,speed={r},protocol=ethernet/ip data={r+2}',
                f'coil_list,slaveID=1,masterID={r},unit=1,modbusType=1,protocol=modbus data={r+3}',
                f'coil_list,slaveID={r},masterID=2,unit=2,modbusType=1,protocol=modbus data={r+4}',
                f'vibration,VendorID=azonaj,NetworkType=tcp,unit=1,speed={r},protocol=ethernet/ip data={r+2}',
                f'coil_list,slaveID=1,masterID={r},unit=1,modbusType=1,protocol=modbus data={r+3}',
                f'coil_list,slaveID={r},masterID=2,unit=2,modbusType=1,protocol=modbus data={r+4}',
                f'vibration,VendorID=azonaj,NetworkType=tcp,unit=1,speed={r},protocol=ethernet/ip data={r+2}',
                f'coil_list,slaveID=1,masterID={r},unit=1,modbusType=1,protocol=modbus data={r+3}',
                f'coil_list,slaveID={r},masterID=2,unit=2,modbusType=1,protocol=modbus data={r+4}',
                                f'vibration,VendorID={r},NetworkType=serial,unit={r},speed={r},protocol=ethernet/ip data={r}',
                f'vibration,VendorID=sonic,NetworkType=serial,unit=2,speed=30,protocol=ethernet/ip data={r+1}',
                f'vibration,VendorID=azonaj,NetworkType=tcp,unit=1,speed={r},protocol=ethernet/ip data={r+2}',
                f'coil_list,slaveID=1,masterID={r},unit=1,modbusType=1,protocol=modbus data={r+3}',
                f'coil_list,slaveID={r},masterID=2,unit=2,modbusType=1,protocol=modbus data={r+4}',
                f'vibration,VendorID=azonaj,NetworkType=tcp,unit=1,speed={r},protocol=ethernet/ip data={r+2}',
                f'coil_list,slaveID=1,masterID={r},unit=1,modbusType=1,protocol=modbus data={r+3}',
                f'coil_list,slaveID={r},masterID=2,unit=2,modbusType=1,protocol=modbus data={r+4}',
                f'vibration,VendorID=azonaj,NetworkType=tcp,unit=1,speed={r},protocol=ethernet/ip data={r+2}',
                f'coil_list,slaveID=1,masterID={r},unit=1,modbusType=1,protocol=modbus data={r+3}',
                f'coil_list,slaveID={r},masterID=2,unit=2,modbusType=1,protocol=modbus data={r+4}',
                f'vibration,VendorID=azonaj,NetworkType=tcp,unit=1,speed={r},protocol=ethernet/ip data={r+2}',
                f'coil_list,slaveID=1,masterID={r},unit=1,modbusType=1,protocol=modbus data={r+3}',
                f'coil_list,slaveID={r},masterID=2,unit=2,modbusType=1,protocol=modbus data={r+4}'
            ]

            data = "\n".join(data_list)
            try:
                requests.post(telegraf_url, data=data, auth=auth, verify=ca_bundle)
                log.info("Data sent to Telegraf")
            except Exception as e:
                log.error(f"Error sending data to Telegraf: {e}")
        else:
            log.error(f"Error reading holding registers: {rr}")
        time.sleep(1)  # Sleep for 1 second before next read

def main():
    threads = []
    for _ in range(1000):  # Create 10 threads
        thread = threading.Thread(target=read_and_send)
        thread.start()
        threads.append(thread)

    for thread in threads:
        thread.join()  # Wait for all threads to complete

if __name__ == '__main__':
    try:
        main()
    finally:
        client.close()
