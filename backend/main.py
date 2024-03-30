from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}
print("asdfasdfadfgdf")
import httpx

@app.get("/call-nextjs")
async def call_nextjs():
    async with httpx.AsyncClient() as client:
        response = await client.get("http://app:3000")
        return {"Next.js Response": response.text}

from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

# InfluxDB settings (update these with your actual settings)
INFLUXDB_URL = "http://influxdb:8086"
INFLUXDB_TOKEN = "ZqdB328qWerxyD32I6XcWPChj0xixkxcyUQ2-k4TunHzcn7FmSGwCZ93kaHTw1DGVFAC0mH9RU7F_5aCy11yJQ=="
INFLUXDB_ORG = "VUT"
INFLUXDB_BUCKET = "school_data"

client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)
write_api = client.write_api(write_options=SYNCHRONOUS)

@app.post("/write")
def write_data(number: int):
    point = Point("measurement_name").tag("location", "docker").field("value", number)
    write_api.write(bucket=INFLUXDB_BUCKET, org=INFLUXDB_ORG, record=point)
    return {"message": "Data written successfully"}

