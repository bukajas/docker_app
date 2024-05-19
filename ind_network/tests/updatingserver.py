from pymodbus.server.async_io import StartTcpServer
from pymodbus.device import ModbusDeviceIdentification
from pymodbus.datastore import ModbusSequentialDataBlock
from pymodbus.datastore import ModbusSlaveContext, ModbusServerContext
from twisted.internet import task,reactor
import logging

logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.DEBUG)

def updating_writer(a):
    log.debug("updating the context")
    context = a[0]
    register = 3
    slave_id = 0x00
    address = 0x00
    values = context[slave_id].getValues(register, address, count=5)
    values = [v + 1 for v in values]
    log.debug("new values: " + str(values))
    context[slave_id].setValues(register, address, values)

def run_updating_server():
    store = ModbusSlaveContext(
        di=ModbusSequentialDataBlock(0, [17]*100),
        co=ModbusSequentialDataBlock(0, [17]*100),
        hr=ModbusSequentialDataBlock(0, [17]*100),
        ir=ModbusSequentialDataBlock(0, [17]*100))
    context = ModbusServerContext(slaves=store, single=True)

    identity = ModbusDeviceIdentification()
    identity.VendorName = 'pymodbus'
    identity.ProductCode = 'PM'
    identity.VendorUrl = 'http://github.com/riptideio/pymodbus/'
    identity.ProductName = 'pymodbus Server'
    identity.ModelName = 'pymodbus Server'
    identity.MajorMinorRevision = '1.0'

    time = 5 # 5 seconds delay
    loop = task.LoopingCall(f=updating_writer, a=(context,))
    StartTcpServer(context=context, identity=identity, address=("localhost", 5020))
    loop.start(time) # initially delay by time
    reactor.run()

if __name__ == "__main__":
   run_updating_server()
