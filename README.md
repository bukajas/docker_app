


influxdb tokeny
- inicializace
- vygenerovani v web UI
- nahrani do env




telegraf
cd ./CA/
openssl genpkey -algorithm RSA -out ca.key -pkeyopt rsa_keygen_bits:2048
openssl req -x509 -new -nodes -key ca.key -sha256 -days 365 -out ca.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=MyCA"
openssl genpkey -algorithm RSA -out telegraf.key -pkeyopt rsa_keygen_bits:2048
openssl req -new -key telegraf.key -out telegraf.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
openssl x509 -req -in telegraf.csr -CA ca.pem -CAkey ca.key -CAcreateserial -out telegraf.cert -days 365 -sha256
mv telegraf.* ../telegraf/



