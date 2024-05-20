#!/bin/bash


echo "teststeste"
# Variables
INFLUX_TOKEN="${DOCKER_INFLUXDB_INIT_ADMIN_TOKEN}"
ORG="${DOCKER_INFLUXDB_INIT_ORG}"
BUCKET="${DOCKER_INFLUXDB_INIT_BUCKET}_agregated"

echo $BUCKET
echo $ORG
echo $INFLUX_TOKEN
# Create second bucket
influx bucket create -name "$BUCKET" --org "$ORG" --token "$INFLUX_TOKEN"

echo "Buckets created successfully."

