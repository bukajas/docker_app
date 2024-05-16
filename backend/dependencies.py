from influxdb_client import InfluxDBClient
from influxdb_client.client.write_api import SYNCHRONOUS
import os


INFLUXDB_TOKEN= os.getenv('INFLUXDB_TOKEN')
print(INFLUXDB_TOKEN)

INFLUXDB_URL = "http://docker-influxdb:8086"
INFLUXDB_ORG = "VUT"
INFLUXDB_BUCKET = "school_data"
#INFLUXDB_TOKEN = "r0RAuA2MvqvHTntNNMvIW8TrEJFguyDFofcsFvZnGhiRHc7Bzw_IT5xGz2BeLeBbV82BD_1gXlcSFFYB0LaNUQ=="
ACCESS_TOKEN_EXPIRE_MINUTES = 60
INFLUXDB_AGRO_BUCKET = INFLUXDB_BUCKET + "_agregated"

client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)
write_api = client.write_api(write_options=SYNCHRONOUS)