from pymodbus.client import ModbusTcpClient
import time

# Connect to the Modbus TCP server
client = ModbusTcpClient('localhost', port=5020)
client.connect()

try:
    while True:
        # Read the values from the Modbus coils
        # coils = client.read_coils(address=0, count=10)
        # if coils.isError():
        #     print('Error getting coils:', coils)
        #     raise Exception('Error getting coils:', coils)
        # print("Coils:", coils.bits)

        # Read the values from the Modbus registers (temperature data)
        registers = client.read_holding_registers(address=0, count=10)
        if registers.isError():
            print('Error getting registers:', registers)
            raise Exception('Error getting registers:', registers)
        print("Registers (Temperature):", registers.registers)

        time.sleep(5)

except KeyboardInterrupt:
    pass
finally:
    client.close()
