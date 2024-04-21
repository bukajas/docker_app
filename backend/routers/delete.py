from fastapi import APIRouter, HTTPException, Security
from schemas import DeleteDataRequest
import models, auth
from typing import  Annotated
import pytz
from datetime import datetime, timedelta
from dependencies import client, INFLUXDB_BUCKET, INFLUXDB_ORG
import Time_functions
import Functions


router = APIRouter()

# ! create clases for upload, modification and deletion of data in/from database

# TODO delete class
# ? it can be, so that two types of deletion, where first the admin has something shown, and than when is deletes it deletes the timerange that he has shown and also can specify what to delete
# ? second is it will print the data, and he can specify what to delete from whole DB.

@router.delete("/delete_data", tags=["Delete"])
async def delete_data_from_database(
    request_body: DeleteDataRequest, 
    current_user: Annotated[models.User, Security(auth.get_current_active_user)],
):
    delete_api = client.delete_api()
    formatted_timestamp_start = Time_functions.format_timestamp_cest_to_utc(request_body.start_time)
    formatted_timestamp_end = Time_functions.format_timestamp_cest_to_utc(request_body.end_time)
    print(request_body.data.items())
    for measurement,tags in request_body.data.items():
        predicate = f'_measurement="{measurement}"'
        for tag_key, tag_value in tags.items():
            predicate += f' AND "{tag_key}"="{tag_value}"'
            print(formatted_timestamp_start, formatted_timestamp_end)
        try:
            print(predicate)
            delete_api.delete(formatted_timestamp_start, formatted_timestamp_end, predicate, bucket=INFLUXDB_BUCKET, org=INFLUXDB_ORG)
            print("hel")
        
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return {"message": f"Data from measurement '{request_body}' and specified tags deleted successfully."}