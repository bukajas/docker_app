def format_time_for_influxdb(time_str: Optional[str]) -> str:
    """Converts datetime string to InfluxDB's required format."""
    if time_str:
        # Parse the input time string to datetime object assuming it's in ISO format
        parsed_time = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
        # Convert the datetime object back to string in RFC3339 format
        return parsed_time.isoformat(timespec='seconds') + 'Z'
    return ''


@app.post("/available_data_types")
async def available_data_types(request: Request, current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):

    try:
        body = await request.json()
        # print(body)
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
    

