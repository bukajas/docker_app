import time
import logging
import requests
from requests.auth import HTTPBasicAuth
from scapy.all import sniff, IP, TCP, UDP
from datetime import datetime

# Configure logging
logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.DEBUG)

# Telegraf configuration
telegraf_url = 'https://localhost:8186/telegraf'  # URL to send data to Telegraf
auth = HTTPBasicAuth('test', 'test')  # Basic authentication
ca_bundle = '/etc/ssl/telegraf.cert'

# Global variable to control the packet capture rate
last_packet_time = 0

def packet_callback(packet):
    global last_packet_time

    current_time = time.time()
    # Check if one second has passed since the last packet
    if current_time - last_packet_time >= 1:
        last_packet_time = current_time
        

        # Get the current timestamp in Unix format and readable format
        unix_timestamp = int(current_time)
        readable_timestamp = datetime.fromtimestamp(unix_timestamp).strftime('%Y-%m-%d %H:%M:%S')


        # Check if the packet has an IP layer
        if IP in packet:
            ip_src = packet[IP].src
            ip_dst = packet[IP].dst
            ip_header_length = packet[IP].ihl * 4  # IHL is in 32-bit words, convert to bytes
            ip_checksum = packet[IP].chksum

            payload = ""
            protocol = ""
            checksum = ""
            payload_size = 0

            # Check if the packet has a TCP or UDP layer
            if TCP in packet:
                payload = bytes(packet[TCP].payload)
                payload_size = len(packet[TCP].payload)
                protocol = "TCP"
                checksum = packet[TCP].chksum
            elif UDP in packet:
                payload = bytes(packet[UDP].payload)
                payload_size = len(packet[UDP].payload)
                protocol = "UDP"
                checksum = packet[UDP].chksum
            else:
                exit

            # Formulate the data for Telegraf

            payload_str = payload.decode('utf-8', 'ignore')
            payload_str = payload_str.replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r")

            data = f"network_traffic,protocol={protocol},srcip={ip_src},dstip={ip_dst} \
            ipheaderlength={ip_header_length}i,ipchecksum={ip_checksum}i,protocolchecksum={checksum}i,payload=\"{payload_size}\" {unix_timestamp}"


            # Print the data and the readable timestamp
            print(f"Timestamp: {readable_timestamp}")
            print(f"Data: {data}\n")

        
            # 
            data1 = f'network_traffic1,protocol={protocol} payload2={payload_size}'
            data2 = f'network_traffic1,protocol={protocol} ipheaderlength={ip_header_length}'
            data3 = f'network_traffic1,protocol={protocol} protocolchecksum={checksum}'
            data4 = f'network_traffic1,protocol={protocol} payload={payload_size}'
            data5 = f'network_traffic1,protocol={protocol} ipchecksum={ip_checksum}'
            data_list = [data1,data2,data3,data4,data5]
            data = "\n".join(data_list)
            # Send the data to Telegraf
            try:
                print(data)
                response = requests.post(telegraf_url, data=data, auth=auth, verify=ca_bundle)
                response.raise_for_status()
                log.info("Data sent to Telegraf")
            except requests.exceptions.RequestException as e:
                log.error(f"Error sending data to Telegraf: {e}")

def start_sniffing(interface):
    # Start sniffing on the given interface
    sniff(iface=interface, prn=packet_callback, store=False)

if __name__ == "__main__":
    # Replace 'eth0' with your network interface
    network_interface = 'enp1s0'
    start_sniffing(network_interface)
