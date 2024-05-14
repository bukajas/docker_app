
from http.client import HTTPException
from influxdb_client import InfluxDBClient,BucketsApi,BucketRetentionRules
from typing import Dict
from dependencies import INFLUXDB_BUCKET, INFLUXDB_ORG, INFLUXDB_TOKEN, INFLUXDB_URL,client
from fastapi import APIRouter,Security
from influxdb_client.client.exceptions import InfluxDBError
from pydantic import BaseModel
from typing import Annotated
import models, auth, schemas

router = APIRouter()



def get_bucket_by_name() -> str:
    buckets_api = client.buckets_api()
    try:
        buckets = buckets_api.find_buckets().buckets
        for bucket in buckets:
            if bucket.name == INFLUXDB_BUCKET:
                return bucket
    except InfluxDBError as e:
        raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="Bucket not found")

def parse_duration_to_seconds(duration: str) -> int:
    import re
    matches = re.match(r"(\d+)([smhdw])", duration)
    if not matches:
        raise ValueError("Invalid retention format")
    value, unit = int(matches.group(1)), matches.group(2)
    units = {"s": 1, "m": 60, "h": 3600, "d": 86400, "w": 604800,"M": 2628288,"y":31556926}
    return value * units[unit]


@router.get("/get-retention", tags=["Retencion"])
async def get_retention(current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):
    bucket = get_bucket_by_name()
    if bucket:
        retention_seconds = bucket.retention_rules[0].every_seconds
        return {"retention": retention_seconds}
    

class RetentionPolicy(BaseModel):
    retention: str
# async def update_retention(data: RetentionPolicy, current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"],):

@router.post("/update-retention", tags=["Retencion"])
async def update_retention(data: RetentionPolicy, current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):
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
        # print(data.retention,retention_seconds)
        updated_bucket = buckets_api.update_bucket(bucket)
    

        # buckets_api.update_bucket_retention_rules(bucket.id, retention_seconds)
        return {"message": "Retention policy updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

