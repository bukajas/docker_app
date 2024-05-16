from fastapi import HTTPException, Security
from pydantic import BaseModel
from typing import Annotated
import  models, auth, schemas
from dependencies import client, INFLUXDB_BUCKET
from datetime import datetime
from fastapi import APIRouter
import pytz
import Time_functions
import Functions
import json


router = APIRouter()

class ReadData(BaseModel):
    range: int  # Updated to reflect the frontend's "Last Hours" parameter
    dataType: str
    data: str
    slaveId: int
    masterId: int
    modbusType: int


# TODO read data but manage so that there isnt same data fetched twice, so to save bandwidth
# TODO the data needs to have field or tag that specifies which protocos it is.
# TODO neco todo
@router.post("/read_data_dynamic", tags=["Read"])
async def read_data_dynamic(
    readData: schemas.DynamicReadData,
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin","read+write","read"]):
    try:

        formatted_timestamp_start = Time_functions.format_timestamp_cest_to_utc(readData.start_time)
        formatted_timestamp_end = Time_functions.format_timestamp_cest_to_utc(readData.end_time)
        flux_query = Functions.generate_flux_query(readData.data,formatted_timestamp_start,formatted_timestamp_end,INFLUXDB_BUCKET)

        tables = client.query_api().query(flux_query)
        data = []
        for table in tables:
            for record in table.records:
                # Convert the record to a dictionary, including all details
                record_dict = {key: getattr(record, key) for key in dir(record) if not key.startswith('_')}
                
                record_dict = record.values
                record_dict['time'] = record.get_time().isoformat() if record.get_time() else None
                data.append(record_dict)
        grouped_data = group_data(data)
        j = {"data": grouped_data}
        formatted_data = Time_functions.format_timestamps_utc_to_cest(j)
        
        # print(formatted_data)
        return formatted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

def group_data(data):
    """
    Groups data entries by all keys except time-related keys into a dictionary of lists.

    Parameters:
    data (list of dict): The list of dictionaries containing the data.

    Returns:
    dict: A dictionary where each key is a tuple of key-value pairs (except time-related keys),
          and the value is a list of entries matching these key-value pairs.
    """
    grouped = {}
    time_keys = {'_start', '_stop', '_time', 'time','_value','table'}  # Set of time-related keys to exclude
    
    for item in data:
        # Create a tuple of key-value pairs for all keys except the time-related ones
        key = tuple((k, v) for k, v in item.items() if k not in time_keys)
        
        # If the key doesn't exist in the dictionary, create a new entry
        if key not in grouped:
            grouped[key] = []
        
        # Append the current item to the list corresponding to the key
        grouped[key].append(item)
    
    # Convert tuple keys to more readable dictionary format for output
    result = {}
    for k, v in grouped.items():
        key_dict = {key: value for key, value in k}
        result[str(key_dict)] = v
    return result