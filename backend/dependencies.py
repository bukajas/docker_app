from influxdb_client import InfluxDBClient
from influxdb_client.client.write_api import SYNCHRONOUS

INFLUXDB_URL = "http://docker-influxdb:8086"
INFLUXDB_ORG = "VUT"
INFLUXDB_BUCKET = "school_data"
INFLUXDB_TOKEN = "uSw9UaNW-cbxDFGV5mtHrXNR0wzp7pBo5J0jgRopYAkS183A7QEwGy91ME03SAgqEv2C-25RhhiT7qQsrP3ZSA=="
ACCESS_TOKEN_EXPIRE_MINUTES = 60

client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)
write_api = client.write_api(write_options=SYNCHRONOUS)