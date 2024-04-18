from fastapi import  HTTPException, Query, Depends, Security, APIRouter
from influxdb_client import  Point
from pydantic import BaseModel
from typing import  Annotated
import models, auth
from dependencies import write_api,INFLUXDB_BUCKET


router = APIRouter()


# TODO add normalization
# TODO add agregation (depends if on begining or when its read)
@router.post("/write_data", tags=["Write"])
async def write_data(value: int = Query(..., description="The data value to write"), scopes=["admin"], current_user: dict = Depends(auth.get_current_user)):
    try:
        # Create an InfluxDB point with a "data" field
        point = Point("data").field("values", value).tag("lol", "testik")
        
        # Write the point to the InfluxDB database
        write_api.write(bucket=INFLUXDB_BUCKET, record=point)

        return {"message": "Data written successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
class ModbusData(BaseModel):
    coils: list
    temperature_data: list  # Assuming temperature data is a list of floats
    slaveID: int
    masterID: int
    modbusType: int

# TODO probably do one huge method, that figures out which type of data it is
# TODO and in more detail seperate different data, 
# TODO table either for each protocol (what happens if new protocol is introduced), or one that applies for all
    
# TODO create complex table for modbus data that contains all important information about the data entry
# TODO add Function code to the bucket
# ? Should i do one more collumn for units of data measurements
# ? Do it not only for Modbus but for all types of protocols
    
@router.post("/modbus/", tags=["Write"])
async def receive_modbus_data(modbus_data: ModbusData, current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):
    # Process the received Modbus data
    coil = Point("coil_list")\
        .field("coils", modbus_data.coils[0])\
        .tag("slaveID", modbus_data.slaveID)\
        .tag("masterID", modbus_data.masterID)\
        .tag("modbusType", modbus_data.modbusType)
    
    temperature = Point("temperature_list")\
        .field("temperature", modbus_data.temperature_data[0])\
        .tag("slaveID", modbus_data.slaveID)\
        .tag("masterID", modbus_data.masterID)\
        .tag("modbusType", modbus_data.modbusType)

    write_api.write(bucket=INFLUXDB_BUCKET, record=[coil, temperature])
    
    return {"message": "Data received and stored in InfluxDB"}