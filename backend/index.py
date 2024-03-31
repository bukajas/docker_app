from fastapi import FastAPI, HTTPException, Query, Depends, Header, status, Response, Request
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
from typing import Optional, List
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
INFLUXDB_TOKEN = "nQzsLuc5gMAEhByGrShv2NryOfaPExtEBxk0xQt7jlMrWzMa-ebBN43uDEYlIayHz5kOJZR75D_ycBlbXK_Lsg=="
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




SQLALCHEMY_DATABASE_URL = "mysql+pymysql://asszonyij:1234567890@mysql/auth_users"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)
 
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register", response_model=schemas.UserInDB)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
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

@app.post("/login")
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}






SECRET_KEY = "a very secret key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60







oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dummy database of users
fake_users_db = {
    "test": {
        "username": "test",
        "full_name": "Test User",
        "email": "test@example.com",
        "hashed_password": "fakehashedtest",
        "disabled": False,
    }
}

def require_role(*required_roles):
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user
    return role_checker


def fake_hash_password(password: str):
    return "fakehashed" + password

def get_user(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user or not auth.verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.post("/token", tags=["authentication"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        user = db.query(models.User).filter(models.User.username == username).first()
        if user is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return user

@app.get("/secure-endpoint", tags=["authentication"])
async def secure_endpoint(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Here you can use current_user directly as it is already authenticated
    return {"message": "Secure Information", "user": current_user}

@app.patch("/users/{user_id}/role", response_model=schemas.UserInDB)
def update_user_role(
    user_id: int, 
    new_role: str, 
    current_user: models.User = Depends(require_role('admin', 'employee')), 
    db: Session = Depends(get_db)
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
@app.post("/read_data", tags=["Read"])
async def read_data(readData: ReadData, current_user: dict = Depends(get_current_user)):  
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
        # print(len(data))
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# TODO add normalization
# TODO add agregation (depends if on begining or when its read)
@app.post("/write_data", tags=["Write"])
async def write_data(value: int = Query(..., description="The data value to write"), current_user: dict = Depends(get_current_user)):
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
async def receive_modbus_data(modbus_data: ModbusData, current_user: dict = Depends(get_current_user)):
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
async def delete_data_from_database(request_body: DeleteDataRequest):
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
    range_in_minutes: int = Query(6, description="Range in minutes"),
    measurement_name: str = Query("coil_list", description="Measurement name"),
    field_name: str = Query("coils", description="Field name"),
    slave_id: int = Query("1", description="Slave ID"),
    master_id: int = Query("2", description="Master ID"),
    modbus_type: int = Query("1", description="Modbus Type")
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


@app.post("/modify_data_update", tags=["Modify"])
async def modify_data_update(update_data: UpdateDataModel):
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
                    "value": int(update_data.value),
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
            coil = Point(data["measurement"])\
            .field(data["field"], data["value"])\
            .time(data["time"])\
            .tag("slaveID", data["tags"]["slaveID"])\
            .tag("masterID", data["tags"]["masterID"])\
            .tag("modbusType", data["tags"]["modbusType"])
    


            print(coil)
            write_api.write(bucket=INFLUXDB_BUCKET, record=coil)

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
async def modify_data_delete(delete_data: DeleteDataModel):
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
async def export_csv(measurement: Optional[str] = None, field: Optional[str] = None, slaveID: Optional[str] = None,
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
async def available_data_types(request: Request):

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
async def get_measurements():
    query_api = client.query_api()
    query = f'from(bucket:"{INFLUXDB_BUCKET}") |> range(start: -1h) |> keep(columns: ["_field"]) |> distinct(column: "_field")'
    result = query_api.query(org=INFLUXDB_ORG, query=query)
    measurements = [record.get_value() for table in result for record in table.records]
    return {"measurements": measurements}

@app.get("/filtered_measurements_with_fields")
async def get_filtered_measurements_with_fields(slaveID: Optional[str] = Query(None), masterID: Optional[str] = Query(None), modbusType: Optional[str] = Query(None)):
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
