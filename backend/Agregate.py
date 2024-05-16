import pandas as pd
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
import asyncio
from dependencies import client, INFLUXDB_AGRO_BUCKET, INFLUXDB_URL, INFLUXDB_ORG, INFLUXDB_BUCKET, INFLUXDB_TOKEN, ACCESS_TOKEN_EXPIRE_MINUTES
from fastapi_utils.session import FastAPISessionMaker
from fastapi_utils.tasks import repeat_every
from fastapi import APIRouter
import pytz
from datetime import datetime, timedelta


router = APIRouter()




client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)
buckets_api = client.buckets_api()


def ensure_bucket_exists(bucket_name):
    try:
        buckets = buckets_api.find_buckets().buckets
        if not any(bucket.name == bucket_name for bucket in buckets):
            buckets_api.create_bucket(bucket_name=bucket_name, org=INFLUXDB_ORG)
            # print(f"Bucket '{bucket_name}' created.")
        # else:
        #     print(f"Bucket '{bucket_name}' already exists.")
    except Exception as e:
        print("An unexpected error occurred while checking/creating the bucket:", e)

async def read_last_timestamp():
    tz_cest = pytz.timezone('Europe/Berlin')
    tz_utc = pytz.timezone('UTC')
    query = f'from(bucket: "{INFLUXDB_AGRO_BUCKET}") |> range(start: -10m) |> last()'
    try:
        result1 = client.query_api().query(query, org=INFLUXDB_ORG)
    except Exception as e:
        print("An unexpected error occurred:", e)
        result1 = []


    newest_timestamp = None
    for table in result1:
        for record in table.records:
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
    if formatted_timestamp:
        start = formatted_timestamp
    else:
        start = (now_utc - timedelta(seconds=10)).strftime('%Y-%m-%dT%H:%M:%SZ')
    # start = formatted_timestamp if formatted_timestamp else formatted_now
    end = formatted_now
    query1 = f'''
    from(bucket: "{INFLUXDB_BUCKET}")
    |> range(start: {start}, stop: {end}) 
    |> yield()
    '''
    try:
        result = client.query_api().query(query1, org=INFLUXDB_ORG)
    except Exception as e:
        print("An unexpected error occurred while querying the second query:", e)
        result = []
    test = []
    for table in result:
        for record in table.records:
            point = Point("agregated")
            a = ""
            for tag_key, tag_value in record.values.items():
                if tag_key == "_measurement":
                    a = f"{tag_value};" + a
                if tag_key not in ["_time", "_measurement","result", "table", "_start", "_stop", "_value"]:
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

    ensure_bucket_exists(INFLUXDB_AGRO_BUCKET)

    write_api = client.write_api(write_options=SYNCHRONOUS)
    write_api.write(bucket=INFLUXDB_AGRO_BUCKET, org=INFLUXDB_ORG, record=[points])





async def periodic_task():
    while True:
        await read_last_timestamp()
        await asyncio.sleep(20)

@router.on_event("startup")
async def startup_event():
    asyncio.create_task(periodic_task())
