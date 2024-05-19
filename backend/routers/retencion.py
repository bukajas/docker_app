
from http.client import HTTPException
from influxdb_client import BucketRetentionRules
from dependencies import INFLUXDB_BUCKET,client
from fastapi import APIRouter,Security
from influxdb_client.client.exceptions import InfluxDBError
from pydantic import BaseModel
from typing import Annotated
import models, auth

router = APIRouter()



def get_bucket_by_name() -> str:
    """
    Function to get a bucket by name from InfluxDB.

    Inputs:
    - None

    Outputs:
    - The bucket object if found.
    
    Raises:
    - HTTPException with status code 500 if an error occurs during the query.
    - HTTPException with status code 404 if the bucket is not found.
    """

    # Get the buckets API instance
    buckets_api = client.buckets_api()
    try:
        buckets = buckets_api.find_buckets().buckets
        # Iterate through the list of buckets to find the one matching the specified name
        for bucket in buckets:
            if bucket.name == INFLUXDB_BUCKET:
                return bucket
            
    except InfluxDBError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    raise HTTPException(status_code=404, detail="Bucket not found")



def parse_duration_to_seconds(duration: str) -> int:
    """
    Function to parse a duration string and convert it to seconds.

    Inputs:
    - duration: A string representing a duration, e.g., "1h", "30m", "2d", etc.

    Outputs:
    - The equivalent duration in seconds as an integer.
    """

    import re
    matches = re.match(r"(\d+)([smhdw])", duration)
    if not matches:
        raise ValueError("Invalid retention format")
    value, unit = int(matches.group(1)), matches.group(2)
    units = {"s": 1, "m": 60, "h": 3600, "d": 86400, "w": 604800,"M": 2628288,"y":31556926}
    return value * units[unit]



@router.get("/get-retention", tags=["Retencion"])
async def get_retention(current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):
    """
    Endpoint to get the retention period of a specific InfluxDB bucket.

    Inputs:
    - current_user: The currently authenticated user.
    - scopes: List of allowed scopes for this endpoint.

    Outputs:
    - A JSON response containing the retention period in seconds.
    """
    
    bucket = get_bucket_by_name()
    if bucket:
        retention_seconds = bucket.retention_rules[0].every_seconds
        return {"retention": retention_seconds}
    



class RetentionPolicy(BaseModel):
    retention: str

@router.post("/update-retention", tags=["Retencion"])
async def update_retention(data: RetentionPolicy, current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):
    """
    Endpoint to update the retention policy of a specific InfluxDB bucket.

    Inputs:
    - data: A RetentionPolicy schema containing the new retention duration.
    - current_user: The currently authenticated user.
    - scopes: List of allowed scopes for this endpoint.

    Outputs:
    - A JSON response confirming the successful update of the retention policy.
    """
    
    bucket = get_bucket_by_name()
    try:
        retention_seconds = parse_duration_to_seconds(data.retention)
        if retention_seconds > 0:
            bucket.retention_rules = [BucketRetentionRules(
                type="expire", 
                every_seconds=retention_seconds,
                shard_group_duration_seconds=min(retention_seconds, retention_seconds-100)  # Example: Set shard duration
            )]
        else:
            bucket.retention_rules = [BucketRetentionRules(
                type="expire", 
                every_seconds=retention_seconds,
            )]
        buckets_api = client.buckets_api()

        updated_bucket = buckets_api.update_bucket(bucket)
    

        return {"message": "Retention policy updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

