from pymodbus.server.async_io import StartTcpServer
from pymodbus.device import ModbusDeviceIdentification
from pymodbus.datastore import ModbusSequentialDataBlock
from pymodbus.datastore import ModbusSlaveContext, ModbusServerContext
from twisted.internet import task, reactor
import logging
import random

logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.DEBUG)

def updating_writer():
    log.debug("updating the context")
    print(random.randint(0,5))


time = 1
loop = task.LoopingCall(updating_writer)
loop.start(2.0) # initially delay by time
reactor.run()
print("hello")

