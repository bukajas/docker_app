import random

sensor = 1
temperature = 1
def read_temperature():
    temperature = random.randint(1,100)
    temperature = temperature +2 
    return temperature


import time
from threading import Thread

def update_modbus_context(context):
    while True:
        # Read temperature
        temperature = read_temperature()  # Your sensor reading function
        # Convert temperature to a format suitable for your Modbus register (e.g., integer)
        modbus_value = int(temperature)  # Example: convert 23.5°C to 235 for Modbus
        # Update the Modbus register (e.g., holding register 0)
        for i in range(5):
            context[0].setValues(3, 1, [modbus_value,modbus_value+2,modbus_value+3,modbus_value+12,modbus_value+43,modbus_value+11,modbus_value+50])

        time.sleep(1)  # Update every second
from pymodbus.device import ModbusDeviceIdentification

identity = ModbusDeviceIdentification()
identity.VendorName = 'pymodbus'
identity.ProductCode = 'PM'
identity.VendorUrl = 'http://github.com/riptideio/pymodbus/'
identity.ProductName = 'pymodbus Server'
identity.ModelName = 'pymodbus Server'


from pymodbus.server import StartTcpServer
from pymodbus.datastore import ModbusSequentialDataBlock, ModbusSlaveContext, ModbusServerContext

# Initialize your data store
store = ModbusSequentialDataBlock(0,[1,2,3,4,5,1,1,1,1,1,1,110])
context = ModbusSlaveContext(di=store, co=store, hr=store, ir=store)
context = ModbusServerContext(slaves=context, single=True)

# Run the updating function in a separate thread
update_thread = Thread(target=update_modbus_context, args=(context,))
update_thread.start()

# Start the Modbus server
StartTcpServer(context=context, identity=identity, address=("localhost", 5020))
