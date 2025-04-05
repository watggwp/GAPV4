import paho.mqtt.client as mqtt
import json
import requests

# === CONFIG ===
API_URL = "http://localhost:3001/api/sensor"  # ชี้ไปยัง Node.js API 

BROKER = "as1.cloud.thethings.industries"
PORT = 1883
USERNAME = "test-device@gap-weather-station"
PASSWORD = "NNSXS.CN46PUYZYUZQXFBFDIFS2LM6MPFNWZYXHALE2YY.BFBOPV4GWJXFWCBKYRY2ZV7KSVG5RCPFG2NCVDYPKA5CWG6XWRTQ" # API Key
TOPIC = "v3/test-device@gap-weather-station/devices/+/up"

# === MQTT Callback ===
def on_message(client, userdata, msg):
    try:
        print(f"Topic: {msg.topic}")
        payload = json.loads(msg.payload.decode())

        device_id = payload["end_device_ids"]["device_id"]
        station_id = payload["uplink_message"]["decoded_payload"].get("station_id")
        temp = payload["uplink_message"]["decoded_payload"].get("temperature")
        humidity = payload["uplink_message"]["decoded_payload"].get("humidity")
        light = payload["uplink_message"]["decoded_payload"].get("light") 
        rainfall = payload["uplink_message"]["decoded_payload"].get("rainfall")
        timestamp = payload["received_at"]  # หรือใช้ datetime.now()

        if station_id is not None:
            # สร้างข้อมูลที่จะส่งไปยัง API
            data = {
                "device_id": device_id,
                "station_id": station_id,
                "timestamp": timestamp,
                "temperature": temp,
                "humidity": humidity,
                "light": light,
                "rainfall": rainfall
            }
            # print(json.dumps(data, indent=2))  # เอาไว้ Debug ดูข้อมูล

            # ส่ง POST ไปยัง API
            response = requests.post(API_URL, json=data)
            print(f"ส่งไปยัง API แล้ว: {response.status_code} - {response.text}")

    except Exception as e:
        print("Error:", e)

# === Setup MQTT ===
client = mqtt.Client()
client.username_pw_set(USERNAME, PASSWORD)
client.on_message = on_message

client.connect(BROKER, PORT, 60)
client.subscribe(TOPIC)

print("Listening for MQTT messages from TTN...")

client.loop_forever()
