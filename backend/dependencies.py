from influxdb_client import InfluxDBClient
from influxdb_client.client.write_api import SYNCHRONOUS
import os


INFLUXDB_TOKEN= os.getenv('INFLUXDB_TOKEN')
INFLUXDB_ORG=os.getenv('DOCKER_INFLUXDB_INIT_ORG')
INFLUXDB_BUCKET=os.getenv('DOCKER_INFLUXDB_INIT_BUCKET')

INFLUXDB_URL = "http://docker-influxdb:8086"
# INFLUXDB_ORG = "VUT"
# INFLUXDB_BUCKET = "school_data"

ACCESS_TOKEN_EXPIRE_MINUTES = 60
INFLUXDB_AGRO_BUCKET = INFLUXDB_BUCKET + "_agregated"

client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)
write_api = client.write_api(write_options=SYNCHRONOUS)