from fastapi import APIRouter, Response, Security
import models, auth, schemas
from typing import Annotated
import pytz
from datetime import datetime
from dependencies import INFLUXDB_BUCKET, INFLUXDB_ORG, INFLUXDB_URL, INFLUXDB_TOKEN
from influxdb_client import InfluxDBClient
from io import StringIO


router = APIRouter()



@router.post("/export_csv", tags=["Export"])
async def export_csv(
    export_request: schemas.ExportDataRequest,
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"],
    ): 
    if export_request.interval == "seconds":
        interval = "s"
    elif export_request.interval == "minutes":
        interval = "m"
    elif export_request.interval == "hours":
        interval = "h"

    if export_request.range == "":
        start_time = datetime.fromisoformat(export_request.start_time) # For example, 5 minutes before end_time
        end_time = datetime.fromisoformat(export_request.end_time)
        start_time = start_time.replace(tzinfo=pytz.UTC)
        end_time = end_time.replace(tzinfo=pytz.UTC)
        start_str = start_time.isoformat()
        end_str = end_time.isoformat()

        query = f'from(bucket: "{INFLUXDB_BUCKET}") |> range(start: {start_str}, stop: {end_str}) |> filter(fn: (r) => r["_measurement"] == "{export_request.measurement}")'
    else:
        query = f'from(bucket: "{INFLUXDB_BUCKET}") |> range(start: -{export_request.range}{interval}) |> filter(fn: (r) => r["_measurement"] == "{export_request.measurement}")'
        for tag, value in export_request.tag_filters.items():
            query += f' |> filter(fn: (r) => r["{tag}"] == "{value}")'

    with InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG) as client:

        result = client.query_api().query_data_frame(query=query, org=INFLUXDB_ORG)
        # print(result)
        if not result.empty:
            output = StringIO()
            result.to_csv(output, index=False)
            output.seek(0)
            csv_content = output.getvalue()
            return Response(content=csv_content, media_type="text/csv")
        else:
            return Response(content="No data found", media_type="text/plain")