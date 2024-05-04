from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import delete, export, edit, authentication, users, measurements, read, write,agregate,retencion
import Agregate



# 1. user can access data only after signing in - partialy done
# 2. one graph will have its own inputs, so that user can have multiple gprahs, and can choose what is want to see, - DONE
# 3. export data from the graph, and overall


# TODO add security, authorization - where the functions are blocked for non authorized user
# TODO security - encrypted data transfer, and if in database is data stored plaintext or also encrypted
# TODO add users for administration + add administration
# TODO manage to stop and resume logging, > how if modbus inicates the comunication

 
# Replace with your InfluxDB details
INFLUXDB_URL = "http://docker-influxdb:8086"
INFLUXDB_ORG = "VUT"
INFLUXDB_BUCKET = "school_data"
INFLUXDB_TOKEN = "uSw9UaNW-cbxDFGV5mtHrXNR0wzp7pBo5J0jgRopYAkS183A7QEwGy91ME03SAgqEv2C-25RhhiT7qQsrP3ZSA=="
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(retencion.router)
app.include_router(agregate.router)
app.include_router(Agregate.router)
app.include_router(delete.router)
app.include_router(export.router)
app.include_router(edit.router)
app.include_router(authentication.router)
app.include_router(users.router)
app.include_router(measurements.router)
app.include_router(read.router)
# app.include_router(write.router)





@app.get("/api")
async def root():
    return {"message": "Awesome Leads Manager"}

