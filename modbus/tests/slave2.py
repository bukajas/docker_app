import random
import logging
from pymodbus.datastore import ModbusSequentialDataBlock, ModbusSlaveContext, ModbusServerContext
from pymodbus.server.async_io import StartTcpServer


# Enable logging
logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.DEBUG)

# Define the Modbus coils (as in your previous code)
coils = ModbusSequentialDataBlock(1, [False] * 10)

# Define the Modbus registers for temperature data
temperature_data = []
for i in range(0, 10):
    temperature_data.append(random.randint(1,10))

registers = ModbusSequentialDataBlock(1, temperature_data)

# Create the Modbus slave context with both coils and registers
slave_context = ModbusSlaveContext(
    co=coils,
    hr=registers  # hr stands for Holding Registers
)

# Create the Modbus server context
server_context = ModbusServerContext(slaves=slave_context, single=True)

# Start the Modbus TCP server
data = StartTcpServer(context=server_context, address=("localhost", 5020))

print("Hello")

