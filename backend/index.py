from fastapi import FastAPI, HTTPException, Query, Depends, Header, status, Response, Request, Security
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime, timedelta
from networkx import expected_degree_graph
import requests
import json
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pytz
import random
from typing import Optional, List, Annotated
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, HTTPBasic, HTTPBasicCredentials
import secrets 
from jose import JWTError, jwt
from io import StringIO
import pandas as pd
import os
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
import  models, schemas, auth
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker










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
# Initialize InfluxDB client
client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)
write_api = client.write_api(write_options=SYNCHRONOUS)



ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



#! scopes - right now its just for one role, make it also in mysql database so taht user can have mutliple roles
#! when stoped and started it will remenger the last logged in user and will show, but the users doesnt have valid token repair
@app.post("/token", tags=["authentication"])
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(auth.get_db),) -> schemas.Token:
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "scopes": [user.role]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

#! TODO frontend 
#! TODO admin can change users roles
@app.post("/register", response_model=schemas.UserInDB)
def register_user(user: schemas.UserCreate, db: Session = Depends(auth.get_db)):
    # Check if the username already exists
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Hash the password and create a new user instance
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password, role='basic')  # Set role as 'basic'
    
    # Add the new user to the database and commit changes
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Return the newly created user
    return db_user


#TODO something like that if there will be that the user have permission for only specific data, than id should somehow know which data he wants to acces and only show it to him.
#TODO probably users that have permissions for specific DBs?

@app.post("/login")
def login(user: schemas.UserCreate, db: Session = Depends(auth.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}



@app.get("/secure-endpoint", tags=["authentication"])
async def secure_endpoint(current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):
    # Here you can use current_user directly as it is already authenticated
    return {"message": "Secure Information", "user": current_user}



@app.patch("/users/{user_id}/role", response_model=schemas.UserInDB)
def update_user_role(
    user_id: int, 
    new_role: str, 
    current_user: Annotated[models.User, Security(auth.get_current_active_user, scopes=["admin"])], 
    db: Session = Depends(auth.get_db)
):
    # Fetch the user to update from the DB
    user_to_update = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    # Update the user's role and commit changes
    user_to_update.role = new_role
    db.commit()
    db.refresh(user_to_update)
    return user_to_update





@app.get("/api")
async def root():
    return {"message": "Awesome Leads Manager"}


class ReadData(BaseModel):
    range: int  # Updated to reflect the frontend's "Last Hours" parameter
    dataType: str
    data: str
    slaveId: int
    masterId: int
    modbusType: int


# TODO read data but manage so that there isnt same data fetched twice, so to save bandwidth
# TODO the data needs to have field or tag that specifies which protocos it is.
# TODO neco todo
@app.post("/read_data", tags=["Read"])
async def read_data(readData: ReadData, current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):  
    try:
        # Assuming INFLUXDB_BUCKET and client are defined elsewhere
        query = f'from(bucket: "{INFLUXDB_BUCKET}") |> range(start: -{readData.range}m) |> filter(fn: (r) => r["_measurement"] == "{readData.dataType}") |> filter(fn: (r) => r["_field"] == "{readData.data}")'
        # Adding filters for slaveId, masterId, and modbusType
        query += f' |> filter(fn: (r) => r["slaveID"] == "{readData.slaveId}") |> filter(fn: (r) => r["masterID"] == "{readData.masterId}") |> filter(fn: (r) => r["modbusType"] == "{readData.modbusType}")'
        
        tables = client.query_api().query(query)
        # Extract data values from the query result
        data = []
        for table in tables:
            for record in table.records:
                data.append({"time": record.get_time().isoformat(), "value": record.get_value(), "field": record.get_field()})
                
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# TODO add normalization
# TODO add agregation (depends if on begining or when its read)
@app.post("/write_data", tags=["Write"])
async def write_data(value: int = Query(..., description="The data value to write"), scopes=["admin"], current_user: dict = Depends(auth.get_current_user)):
    try:
        # Create an InfluxDB point with a "data" field
        point = Point("data").field("values", value).tag("lol", "testik")
        
        # Write the point to the InfluxDB database
        write_api.write(bucket=INFLUXDB_BUCKET, record=point)

        return {"message": "Data written successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
class ModbusData(BaseModel):
    coils: list
    temperature_data: list  # Assuming temperature data is a list of floats
    slaveID: int
    masterID: int
    modbusType: int

# TODO probably do one huge method, that figures out which type of data it is
# TODO and in more detail seperate different data, 
# TODO table either for each protocol (what happens if new protocol is introduced), or one that applies for all
    
# TODO create complex table for modbus data that contains all important information about the data entry
# TODO add Function code to the bucket
# ? Should i do one more collumn for units of data measurements
# ? Do it not only for Modbus but for all types of protocols
    
@app.post("/modbus/", tags=["Write"])
async def receive_modbus_data(modbus_data: ModbusData, current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):
    # Process the received Modbus data
    coil = Point("coil_list")\
        .field("coils", modbus_data.coils[0])\
        .tag("slaveID", modbus_data.slaveID)\
        .tag("masterID", modbus_data.masterID)\
        .tag("modbusType", modbus_data.modbusType)
    
    temperature = Point("temperature_list")\
        .field("temperature", modbus_data.temperature_data[0])\
        .tag("slaveID", modbus_data.slaveID)\
        .tag("masterID", modbus_data.masterID)\
        .tag("modbusType", modbus_data.modbusType)

    write_api.write(bucket=INFLUXDB_BUCKET, record=[coil, temperature])
    
    return {"message": "Data received and stored in InfluxDB"}

# ! create clases for upload, modification and deletion of data in/from database

# TODO delete class
# ? it can be, so that two types of deletion, where first the admin has something shown, and than when is deletes it deletes the timerange that he has shown and also can specify what to delete
# ? second is it will print the data, and he can specify what to delete from whole DB.

class DeleteDataRequest(BaseModel):
    measurement: str
    hours: int

@app.delete("/delete_data", tags=["Delete"])
async def delete_data_from_database(request_body: DeleteDataRequest, current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):
    delete_api = client.delete_api()
    stop = datetime.now(pytz.UTC)
    start = stop - timedelta(minutes=request_body.hours)
    start_str = start.isoformat()
    stop_str = stop.isoformat()

    try:
        delete_api.delete(start_str, stop_str, f'_measurement="{request_body.measurement}"', bucket=INFLUXDB_BUCKET, org=INFLUXDB_ORG)
        return {"message": f"data from measurement 'measurement' deleted succesfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    


# TODO modify class
# * Three subclasses
# * 1. Get data from database to edit
# * 2. send to DB updated data
# * 3. send to DB deleted data
# ! modify data not their values but the info (slaveid, masterid, type, etc.) and seperate or in bulk
    

# * Read data from database, and show them

@app.get("/modify_data_read", tags=["Modify"])
async def modify_data_read(
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"],
    range_in_minutes: int = Query(6, description="Range in minutes"),
    measurement_name: str = Query("coil_list", description="Measurement name"),
    field_name: str = Query("coils", description="Field name"),
    slave_id: int = Query("1", description="Slave ID"),
    master_id: int = Query("2", description="Master ID"),
    modbus_type: int = Query("1", description="Modbus Type"),

):
    try:
        query = f'from(bucket: "{INFLUXDB_BUCKET}") \
            |> range(start: -{range_in_minutes}m) \
            |> filter(fn: (r) => r["_measurement"] == "{measurement_name}")'

        # Additional filters based on provided parameters
        if field_name:
            query += f' |> filter(fn: (r) => r["_field"] == "{field_name}")'
        if slave_id is not None:
            query += f' |> filter(fn: (r) => r["slaveID"] == "{slave_id}")'
        if master_id is not None:
            query += f' |> filter(fn: (r) => r["masterID"] == "{master_id}")'
        if modbus_type is not None:
            query += f' |> filter(fn: (r) => r["modbusType"] == "{modbus_type}"'
        query += ')'

        # print(query)
        tables = client.query_api().query(query)
        # print(tables)

        # Extract data values from the query result
        data = []
        for table in tables:
            for record in table.records:
                data.append({
                    "time": record.get_time().isoformat(),
                    "value": record.get_value(),
                    "field": record.get_field(),
                    "masterID": record.values.get("masterID"),
                    "slaveID": record.values.get("slaveID"),
                    "modbusType": record.values.get("modbusType")
                })
        # print("data")
        # print(data)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class UpdateDataModel(BaseModel):
    start_time: datetime
    end_time: datetime
    measurement_name: str
    field_name: str
    slave_id: int
    master_id: int
    modbus_type: int
    value: float  # or the appropriate type


# ! problem - when i update the new data is written to it but it is exactly the same to than it lists it at the end of the list, and it looks like it isnt fetching new data
    
@app.post("/modify_data_update", tags=["Modify"])
async def modify_data_update(update_data: UpdateDataModel,):
    try:
        # print(update_data.slave_id)
        # Convert datetime to a string format suitable for InfluxDB
        start_str = update_data.start_time.isoformat()
        end_str = update_data.end_time.isoformat()

        # Construct the query with additional filters
        query = f'''from(bucket: "{INFLUXDB_BUCKET}") \
            |> range(start: {start_str}, stop: {end_str}) \
            |> filter(fn: (r) => r["_measurement"] == "{update_data.measurement_name}") \
            |> filter(fn: (r) => r["_field"] == "{update_data.field_name}") \
            |> filter(fn: (r) => r["slaveID"] == "{update_data.slave_id}")\
            |> filter(fn: (r) => r["masterID"] == "{update_data.master_id}") \
            |> filter(fn: (r) => r["modbusType"] == "{update_data.modbus_type}")'''

        # print(query)
        tables = client.query_api().query(query)
        print(update_data)

        # Placeholder for data modification logic
        modified_data = []
        for table in tables:
            for record in table.records:
                # Apply your data modification logic here
                modified_value = record.get_value() # This is a placeholder
                modified_data.append({
                    "time": record.get_time(),
                    "measurement": update_data.measurement_name,
                    "field": update_data.field_name,
                    "value": float(update_data.value),
                    "tags": {
                        "slaveID": str(update_data.slave_id),
                        "masterID": str(update_data.master_id),
                        "modbusType": str(update_data.modbus_type),
                        # Include any other tags necessary for identifying the point
                    }
                })
        # ! Here delete data and than write them.
        # Write the modified data back to InfluxDB
        write_api = client.write_api()
        for data in modified_data:
            print(data)
            print('data')
            point = {
                "measurement": data["measurement"],
                "time": data["time"],
                "fields": {
                    data["field"]: data["value"]
                },
                "tags": data["tags"],
            }
            data_point = Point(data["measurement"])\
            .field(data["field"], data["value"])\
            .time(data["time"])\
            .tag("slaveID", data["tags"]["slaveID"])\
            .tag("masterID", data["tags"]["masterID"])\
            .tag("modbusType", data["tags"]["modbusType"])
    


            print(data_point)
            write_api.write(bucket=INFLUXDB_BUCKET, record=data_point)

        return {"message": "Data updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
class DeleteDataModel(BaseModel):
    start_time: datetime
    end_time: datetime
    measurement_name: str
    field_name: str
    slave_id: int
    master_id: int
    modbus_type: int


# ! influxdb doesnt support specifying deletion with field values
@app.delete("/modify_data_delete", tags=["Modify"])
async def modify_data_delete(delete_data: DeleteDataModel, current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):
    try:
        # Convert datetime to string in the format InfluxDB expects
        start_str = delete_data.start_time.isoformat()
        end_str = delete_data.end_time.isoformat()
        # Construct the predicate string based on your delete data model
        predicate = (
        f'_measurement="{delete_data.measurement_name}"'
        f' AND slaveID="{delete_data.slave_id}"'
        f' AND masterID="{delete_data.master_id}"'
        f' AND modbusType="{delete_data.modbus_type}"'
        )
        print(predicate)
        print(start_str,end_str)
        # Use the delete API from your client
        delete_api = client.delete_api()
        delete_api.delete(
            start_str,
            end_str,
            predicate,
            bucket=INFLUXDB_BUCKET,
            org=INFLUXDB_ORG
        )
        return {"message": "Data deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# TODO customisebility



# ! module for exporting CSV
# TODO make it optional, so that i dont need to specify everything but only what i want, (i can have more general exports)
    
def format_time_for_influxdb(time_str: Optional[str]) -> str:
    """Converts datetime string to InfluxDB's required format."""
    if time_str:
        # Parse the input time string to datetime object assuming it's in ISO format
        parsed_time = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
        # Convert the datetime object back to string in RFC3339 format
        return parsed_time.isoformat(timespec='seconds') + 'Z'
    return ''


@app.get("/export_csv")
async def export_csv(current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"],
    measurement: Optional[str] = None, field: Optional[str] = None, slaveID: Optional[str] = None,
    masterID: Optional[str] = None, modbusType: Optional[str] = None, fromTime: Optional[str] = None,
    toTime: Optional[str] = None, minutesFromNow: Optional[int] = None):    # Ensure you adjust this part with your InfluxDB settings
    formatted_from_time = format_time_for_influxdb(fromTime)
    formatted_to_time = format_time_for_influxdb(toTime)
    
    
    with InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG) as client:
        print(fromTime)
        
        if minutesFromNow:
            time_to = datetime.utcnow()
            time_from = time_to - timedelta(minutes=minutesFromNow)
        else:
            time_from = datetime.fromisoformat(fromTime) if fromTime else datetime.utcnow() - timedelta(days=1)  # Default range: last 24 hours
            time_to = datetime.fromisoformat(toTime) if toTime else datetime.utcnow()
        

        query = f'''
        from(bucket: "{INFLUXDB_BUCKET}")
            |> range(start: {time_from.isoformat()}Z, stop: {time_to.isoformat()}Z)
            |> filter(fn: (r) => r["_measurement"] == "{measurement}" and r["_field"] == "{field}" and r["slaveID"] == "{slaveID}" and r["masterID"] == "{masterID}" and r["modbusType"] == "{modbusType}")
        '''
        print(query)
        query_parts = [f'from(bucket: "{INFLUXDB_BUCKET}")']
        
        # Add time range to the query
        if fromTime and toTime:
            query_parts.append(f'|> range(start: {formatted_from_time}, stop: {formatted_to_time})')
        elif fromTime:
            query_parts.append(f'|> range(start: {fromTime})')
        else:  # Default time range if none provided
            query_parts.append(f'|> range(start: -1h)')
        
        # Add filters for each parameter if provided
        if measurement:
            query_parts.append(f'|> filter(fn: (r) => r["_measurement"] == "{measurement}")')
        if field:
            query_parts.append(f'|> filter(fn: (r) => r["_field"] == "{field}")')
        if slaveID:
            query_parts.append(f'|> filter(fn: (r) => r["slaveID"] == "{slaveID}")')
        if masterID:
            query_parts.append(f'|> filter(fn: (r) => r["masterID"] == "{masterID}")')
        if modbusType:
            query_parts.append(f'|> filter(fn: (r) => r["modbusType"] == "{modbusType}")')
        
        # Combine all parts to form the final query
        final_query = ' '.join(query_parts)
        print(final_query)


        result = client.query_api().query_data_frame(query=final_query, org=INFLUXDB_ORG)
        if not result.empty:
            output = StringIO()
            result.to_csv(output, index=False)
            output.seek(0)
            csv_content = output.getvalue()
            return Response(content=csv_content, media_type="text/csv")
        else:
            return Response(content="No data found", media_type="text/plain")
        

@app.post("/available_data_types")
async def available_data_types(request: Request, current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):

    try:
        body = await request.json()
        print(body)
        slave_id = body.get("slaveId")
        master_id = body.get("masterId")
        modbus_type = body.get("modbusType")
        # Ensure all required parameters are provided
        if slave_id is None or master_id is None or modbus_type is None:
            raise HTTPException(status_code=400, detail="Missing parameters")

        query_api = client.query_api()
        # Query to get unique 'dataType' fields from the measurements
        # Adjust the query based on your data schema in InfluxDB
        query = f'''
        from(bucket: "{INFLUXDB_BUCKET}")
        |> range(start: -1h)  # Adjust time range as needed
        |> filter(fn: (r) => r["slaveId"] == "{slave_id}" and r["masterId"] == "{master_id}" and r["modbusType"] == "{modbus_type}")
        |> keep(columns: ["_measurement"])
        |> distinct(column: "_measurement")
        '''

        result = query_api.query_data_frame(query=query)
        # Extracting the unique data types
        data_types = result["_measurement"].unique().tolist()

        return {"dataTypes": data_types}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@app.get("/measurements")
async def get_measurements(current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):
    query_api = client.query_api()
    query = f'''
    import "influxdata/influxdb/schema"
    
    schema.measurements(bucket: "{INFLUXDB_BUCKET}")
    '''

    query = f'from(bucket:"{INFLUXDB_BUCKET}") |> range(start: -1h) |> keep(columns: ["_field"]) |> distinct(column: "_field")'
    result = query_api.query(org=INFLUXDB_ORG, query=query)
    print(result)
    measurements = [record.get_value() for table in result for record in table.records]
    print(measurements)
    return {"measurements": measurements}


@app.get("/filtered_measurements_with_fields")
async def get_filtered_measurements_with_fields(
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"],
    slaveID: Optional[str] = Query(None), masterID: Optional[str] = Query(None), modbusType: Optional[str] = Query(None)):
    query_api = client.query_api()
    
    # Construct the filter part of the query based on the provided tags
    filters = ""
    if slaveID:
        filters += f' |> filter(fn: (r) => r.slaveID == "{slaveID}")'
    if masterID:
        filters += f' |> filter(fn: (r) => r.masterID == "{masterID}")'
    if modbusType:
        filters += f' |> filter(fn: (r) => r.modbusType == "{modbusType}")'
    
    # Base query with filters applied
    base_query = f'from(bucket:"{INFLUXDB_BUCKET}") |> range(start: -1h) {filters}'
    
    # Query to get list of filtered measurements
    measurements_query = base_query + ' |> keep(columns: ["_measurement"]) |> distinct(column: "_measurement")'
    measurements_result = query_api.query(org=INFLUXDB_ORG, query=measurements_query)
    measurements = [record.get_value() for table in measurements_result for record in table.records]
    
    # Dictionary to hold the filtered measurements and their fields
    measurements_with_fields: Dict[str, List[str]] = {}

    # Loop through each filtered measurement to query their fields
    for measurement in measurements:
        fields_query = base_query + f' |> filter(fn: (r) => r._measurement == "{measurement}") |> keep(columns: ["_field"]) |> distinct(column: "_field")'
        fields_result = query_api.query(org=INFLUXDB_ORG, query=fields_query)
        fields = [record.get_value() for table in fields_result for record in table.records]
        measurements_with_fields[measurement] = fields
    
    return {"measurements_with_fields": measurements_with_fields}



@app.get("/filtered_measurements_with_tags")
async def get_filtered_measurements_with_tags(
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"],
    slaveID: Optional[str] = Query(None), masterID: Optional[str] = Query(None), modbusType: Optional[str] = Query(None)):
    query_api = client.query_api()
    # Construct the filter part of the query based on the provided tags
    filters = ""
    if slaveID:
        filters += f' |> filter(fn: (r) => r.slaveID == "{slaveID}")'
    if masterID:
        filters += f' |> filter(fn: (r) => r.masterID == "{masterID}")'
    if modbusType:
        filters += f' |> filter(fn: (r) => r.modbusType == "{modbusType}")'
    
    # Base query with filters applied
    base_query = f'from(bucket:"{INFLUXDB_BUCKET}") |> range(start: -1h) {filters}'
    
    # Query to get list of filtered measurements
    measurements_query = base_query + ' |> keep(columns: ["_measurement"]) |> distinct(column: "_measurement")'
    measurements_result = query_api.query(org=INFLUXDB_ORG, query=measurements_query)
    measurements = [record.get_value() for table in measurements_result for record in table.records]
    
    # Dictionary to hold the filtered measurements and their tags
    measurements_with_tags: dict[str, List[str]] = {}

    # Loop through each filtered measurement to query their tags
    for measurement in measurements:
        tags_query = base_query + f' |> filter(fn: (r) => r._measurement == "{measurement}") |> keys() |> keep(columns: ["_value"]) |> distinct(column: "_value")'
        tags_result = query_api.query(org=INFLUXDB_ORG, query=tags_query)
        tags = [record.get_value() for table in tags_result for record in table.records if record.get_value().startswith('_') is False]  # Exclude system tags/fields
        measurements_with_tags[measurement] = tags
    
    return {"measurements_with_tags": measurements_with_tags}
