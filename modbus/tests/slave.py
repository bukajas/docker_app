import random
import logging
from pymodbus.datastore import ModbusSequentialDataBlock, ModbusSlaveContext, ModbusServerContext
from pymodbus.server.async_io import StartTcpServer

# Enable logging (makes it easier to debug if something goes wrong)
logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.DEBUG)

# Define the Modbus registers

coils_data = []
discrete_inputs_data = []
holding_registers_data = []
input_registers_data = []
network_speed_data = []
temperature_data = []
for i in range(0,10):
    coils_data.append(bool(random.getrandbits(1)))
    discrete_inputs_data.append([bool(random.getrandbits(1))])
    holding_registers_data.append(random.randint(0,10))
    input_registers_data.append(random.randint(0,10))
    network_speed_data.append(random.uniform(0.0,10.0))
    temperature_data.append(random.randint(0,10))

coils = ModbusSequentialDataBlock(1, coils_data)
# discrete_inputs = ModbusSequentialDataBlock(1, discrete_inputs_data)
# holding_registers = ModbusSequentialDataBlock(1, holding_registers_data)
# input_registers = ModbusSequentialDataBlock(1, input_registers_data)
# network_speed = ModbusSequentialDataBlock(1, network_speed_data)
print(coils_data)
temperature = ModbusSequentialDataBlock(2, temperature_data)
print(temperature_data)

# Define custom Modbus registers for network speed and latency
# network_speed_register = ModbusSequentialDataBlock(1, [0] * 1)  # Single value for network speed
# latency_register = ModbusSequentialDataBlock(2, [0] * 1)  # Single value for latency

# Define the Modbus slave context
slave_context = ModbusSlaveContext(
    # di=discrete_inputs,
    co=coils,
    # hr=holding_registers,
    # ir=input_registers,
    # hr_custom=network_speed_register,
    # ir_custom=latency_register,
    # ns=network_speed,
    te=temperature
)

# Define the Modbus server context
server_context = ModbusServerContext(slaves=slave_context, single=True)

# Start the Modbus TCP server
StartTcpServer(context=server_context, address=("localhost", 5020))