from fastapi import APIRouter
from schemas import DeleteDataRequest
import models, auth, schemas
from fastapi import FastAPI, HTTPException, Query, Depends, Header, status, Response, Request, Security
from typing import Optional, List, Annotated, Dict
import pytz
from datetime import datetime, timedelta
from dependencies import client, INFLUXDB_BUCKET, INFLUXDB_ORG

router = APIRouter()

# ! create clases for upload, modification and deletion of data in/from database

# TODO delete class
# ? it can be, so that two types of deletion, where first the admin has something shown, and than when is deletes it deletes the timerange that he has shown and also can specify what to delete
# ? second is it will print the data, and he can specify what to delete from whole DB.

# class DeleteDataRequest(BaseModel):
#     measurement: str
#     hours: int

@router.delete("/delete_data", tags=["Delete"])
async def delete_data_from_database(
    request_body: DeleteDataRequest, 
    current_user: Annotated[models.User, Security(auth.get_current_active_user)],
):
    delete_api = client.delete_api()

    # Ensure the datetime is timezone-aware and formatted with microseconds and UTC offset
    if request_body.start_time and request_body.stop_time:
        # Assuming start_time and stop_time are already timezone-aware datetime objects
        start_str = request_body.start_time.replace(tzinfo=pytz.UTC).isoformat(timespec='microseconds')
        stop_str = request_body.stop_time.replace(tzinfo=pytz.UTC).isoformat(timespec='microseconds')
    elif request_body.minutes is not None:
        stop = datetime.now(pytz.UTC)
        start = stop - timedelta(minutes=request_body.minutes)
        start_str = start.isoformat(timespec='microseconds')
        stop_str = stop.isoformat(timespec='microseconds')
    else:
        raise HTTPException(status_code=400, detail="Either minutes or start_time and stop_time must be provided.")

    predicate = f'_measurement="{request_body.measurement}"'
    for tag_key, tag_value in request_body.tags.items():
        predicate += f' AND {tag_key}="{tag_value}"'

    try:
        delete_api.delete(start_str, stop_str, predicate, bucket=INFLUXDB_BUCKET, org=INFLUXDB_ORG)
        return {"message": f"Data from measurement '{request_body.measurement}' and specified tags deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))