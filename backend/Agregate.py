import pandas as pd
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
import asyncio
from dependencies import client
from fastapi_utils.session import FastAPISessionMaker
from fastapi_utils.tasks import repeat_every
from fastapi import APIRouter
import pytz
from datetime import datetime


router = APIRouter()


# Connection settings
INFLUXDB_URL = "http://docker-influxdb:8086"
INFLUXDB_ORG = "VUT"
INFLUXDB_BUCKET = "school_data"
INFLUXDB_TOKEN = "uSw9UaNW-cbxDFGV5mtHrXNR0wzp7pBo5J0jgRopYAkS183A7QEwGy91ME03SAgqEv2C-25RhhiT7qQsrP3ZSA=="
ACCESS_TOKEN_EXPIRE_MINUTES = 60

client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)


async def read_last_timestamp():
    tz_cest = pytz.timezone('Europe/Berlin')
    tz_utc = pytz.timezone('UTC')
    query = 'from(bucket: "test") |> range(start: -10m) |> last()'
    try:
        result1 = client.query_api().query(query, org=INFLUXDB_ORG)
    except:
        print("An exception occurred") 
        return None


    newest_timestamp = None
    for table in result1:
        for record in table.records:
            # print(record.get_time())
            record_time = record.get_time()
            if newest_timestamp is None or record_time > newest_timestamp:
                newest_timestamp = record_time
    if newest_timestamp is not None:
        dt_utc = newest_timestamp.astimezone(tz_utc)
        formatted_timestamp = dt_utc.strftime('%Y-%m-%dT%H:%M:%SZ')
    else:
        formatted_timestamp = None
    now_utc = datetime.now(tz_utc)
    formatted_now = now_utc.strftime('%Y-%m-%dT%H:%M:%SZ')
    start = formatted_timestamp if formatted_timestamp else formatted_now
    end = formatted_now
    # print(f"Start time: {start}")
    # print(f"End time: {end}")

    query1 = f'''
    from(bucket: "{INFLUXDB_BUCKET}")
    |> range(start: {start}, stop: {end}) 
    |> yield()
    '''
    result = client.query_api().query(query1, org=INFLUXDB_ORG)
    test = []
    for table in result:
        for record in table.records:
            point = Point("agregated")
            a = ""
            for tag_key, tag_value in record.values.items():
                if tag_key == "_measurement":
                    a = f"{tag_value};" + a
                if tag_key not in ["_time", "_measurement", "_field","result", "table", "_start", "_stop", "_value"]:
                    a += (f"{tag_key}={tag_value};")
            test.append([record.get_time().replace(microsecond=0),a,record.get_value()])

    first_values = set()
    for sublist in test:
        first_values.add(sublist[0])
    points = []
    for i in first_values:
        t= True
        point = Point("agregated")
        for sublist in test:
            if sublist[0] == i:
                if t == True:
                    point = point.field("data",0).time(sublist[0],WritePrecision.NS)
                    t = False
                point = point.tag(sublist[1],sublist[2])
        points.append(point)


    write_api = client.write_api(write_options=SYNCHRONOUS)
    write_api.write(bucket="test", org=INFLUXDB_ORG, record=[points])





async def periodic_task():
    while True:
        await read_last_timestamp()
        await asyncio.sleep(20)

@router.on_event("startup")
async def startup_event():
    asyncio.create_task(periodic_task())
