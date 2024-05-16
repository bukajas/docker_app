from fastapi import APIRouter, Response, Security
import models, auth, schemas
from typing import Annotated
import pytz
from datetime import datetime
from dependencies import INFLUXDB_BUCKET, INFLUXDB_ORG, INFLUXDB_URL, INFLUXDB_TOKEN
from dependencies import client as clientt
from influxdb_client import InfluxDBClient
from io import StringIO
import Time_functions,Functions
from influxdb_client.client.write_api import SYNCHRONOUS
import asyncio


router = APIRouter()






@router.post("/export_csv", tags=["Export"])
async def export_csv(
    export_request: schemas.ExportDataRequest,
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin","read+write","read"],
    ): 
    formatted_timestamp_start = Time_functions.format_timestamp_cest_to_utc(export_request.start_time)
    formatted_timestamp_end = Time_functions.format_timestamp_cest_to_utc(export_request.end_time)
    flux_query = Functions.generate_flux_query2(export_request.data,formatted_timestamp_start,formatted_timestamp_end,INFLUXDB_BUCKET)
    print(flux_query)
    with InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG) as client:

        results = client.query_api().query_data_frame(query=flux_query, org=INFLUXDB_ORG)

        if isinstance(results, list):
        # Check if the list of results is not empty
            if results:
            # Create an empty StringIO object to store CSV content
                output = StringIO()

            # Loop through each result in the list
                for result in results:
                # Check if the result is not empty
                    if not result.empty:
                    # Write the CSV content of the result to the StringIO object
                        result.to_csv(output, index=False)
                # Move the cursor to the beginning of the StringIO object
                output.seek(0)
            
                # Get the CSV content from the StringIO object
                csv_content = output.getvalue()
            
                # Close the StringIO object
                output.close()

                # Return the CSV response
                return Response(content=csv_content, media_type="text/csv")
            else:
                # If the list of results is empty, return a plain text response
                return Response(content="No data found", media_type="text/plain")
        else:
            if not results.empty:
                output = StringIO()
                results.to_csv(output, index=False)
                output.seek(0)
                csv_content = output.getvalue()
                return Response(content=csv_content, media_type="text/csv")
            else:
                return Response(content="No data found", media_type="text/plain")
