from fastapi import Query, Security, APIRouter
from typing import Optional, List, Annotated, Dict
import  models, auth
from dependencies import client,INFLUXDB_ORG,INFLUXDB_BUCKET
import Time_functions
import Functions


router = APIRouter()


@router.get("/filtered_measurements_with_tags", tags=["Measurements"])
async def get_filtered_measurements_with_tags(
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin","read+write","read"],
    start: Optional[str] = None,
    end: Optional[str] = None):
    start_date = Time_functions.format_timestamp_cest_to_utc(start)
    end_date = Time_functions.format_timestamp_cest_to_utc(end)
    measurements_with_tags = Functions.get_measurements_with_tags(start_date,end_date)
    return {"measurements_with_tags": measurements_with_tags}
