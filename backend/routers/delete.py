from fastapi import APIRouter, HTTPException, Security
from schemas import DeleteDataRequest
import models, auth
from typing import  Annotated
from dependencies import client, INFLUXDB_BUCKET, INFLUXDB_ORG
import Time_functions



router = APIRouter()

@router.delete("/delete_data", tags=["Delete"])
async def delete_data_from_database(
    request_body: DeleteDataRequest, 
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin","read+write"],
):
    """
    Endpoint to delete data from the database.

    Inputs:
    - request_body: A DeleteDataRequest schema containing 'start_time', 'end_time', and data to be deleted.
    - current_user: The currently authenticated user.
    - scopes: List of allowed scopes for this endpoint.

    Outputs:
    - A message confirming the successful deletion of the specified data.
    """
    
    # Get the delete API from the InfluxDB client
    delete_api = client.delete_api()

    # Convert the provided timestamps from CEST to UTC
    formatted_timestamp_start = Time_functions.format_timestamp_cest_to_utc(request_body.start_time)
    formatted_timestamp_end = Time_functions.format_timestamp_cest_to_utc(request_body.end_time)

    # Build the predicate string for the delete query
    for measurement,tags in request_body.data.items():
        predicate = f'_measurement="{measurement}"'
        for tag_key, tag_value in tags.items():
            if tag_key == "_field":
                continue
            predicate += f' AND "{tag_key}"="{tag_value}"'

        try:
            # Attempt to delete the data within the specified time range and predicate
            delete_api.delete(formatted_timestamp_start, formatted_timestamp_end, predicate, bucket=INFLUXDB_BUCKET, org=INFLUXDB_ORG)

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return {"message": f"Data from measurement '{request_body}' and specified tags deleted successfully."}