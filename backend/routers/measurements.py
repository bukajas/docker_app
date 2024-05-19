from fastapi import Security, APIRouter
from typing import Optional, Annotated
import  models, auth
import Time_functions
import Functions


router = APIRouter()


@router.get("/filtered_measurements_with_tags", tags=["Measurements"])
async def get_filtered_measurements_with_tags(
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin","read+write","read"],
    start: Optional[str] = None,
    end: Optional[str] = None):
    """
    Endpoint to retrieve filtered measurements with tags within a specified time range.

    Inputs:
    - current_user: The currently authenticated user.
    - scopes: List of allowed scopes for this endpoint.
    - start: Optional start time for the time range filter (in CEST).
    - end: Optional end time for the time range filter (in CEST).

    Outputs:
    - A dictionary containing measurements with their associated tags within the specified time range.
    """
    
    # Convert the provided start and end timestamps from CEST to UTC
    start_date = Time_functions.format_timestamp_cest_to_utc(start)
    end_date = Time_functions.format_timestamp_cest_to_utc(end)
    
    # Get the measurements with tags within the specified time range
    measurements_with_tags = Functions.get_measurements_with_tags(start_date,end_date)
    
    return {"measurements_with_tags": measurements_with_tags}
