import paho.mqtt.client as mqtt 
from dotenv import load_dotenv
import json , os
import requests
from datetime import datetime
import pytz 
import time

# === CONFIG ===

load_dotenv()

BROKER = os.environ["TTN_SENSOR_BROKER"]
PORT = 1883
USERNAME = os.environ["TTN_SENSOR_USERNAME"]
PASSWORD = os.environ["TTN_SENSOR_PASSWORD"]
TOPIC = os.environ["TTN_SENSOR_TOPIC"]

with open("./server/mqtt/device_config.json") as f:
    DEVICE_CONFIG_MAP = json.load(f)

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ MQTT connected successfully.")
        client.subscribe(TOPIC)
    else:
        print("❌ MQTT connection failed. Code:", rc)


def on_disconnect(client, userdata, rc):
    print("⚠️ MQTT disconnected. Code:", rc)
    while True:
        try:
            print("🔁 กำลังพยายามเชื่อมต่อใหม่กับ MQTT Broker...")
            client.reconnect()
            print("✅ เชื่อมต่อใหม่สำเร็จแล้วกับ MQTT Broker.")
            client.subscribe(TOPIC)  # re-subscribe หลัง reconnect
            break
        except Exception as e:
            print(f"⏳ การเชื่อมต่อใหม่ล้มเหลว: {e} → จะลองใหม่ในอีก 5 วินาที...")
            time.sleep(5)


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        try:
            device_id = payload["end_device_ids"]["device_id"]
            timestamp = payload["received_at"]
            print(f"📥 ข้อมูลใหม่จากอุปกรณ์: {device_id}")

            timestamp_fixed = timestamp[:26] + "Z"
            dt_utc = datetime.strptime(timestamp_fixed, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=pytz.utc)
            dt_bangkok = dt_utc.astimezone(pytz.timezone("Asia/Bangkok"))

            config = DEVICE_CONFIG_MAP.get(device_id)
            if not config:
                print(f"⚠️ ไม่พบ config สำหรับ device_id: {device_id}")
                return

            decoded = payload["uplink_message"].get("decoded_payload", {})
            print("🔍 Decoded payload:", decoded)

            data = {
                "device_id": device_id,
                "timestamp": dt_bangkok.isoformat()
            }

            for field in config["fields"]:
                value = decoded.get(field)
                if value is not None:
                    data[field] = value

            print("📦 Data to API:", data)

            try:
                response = requests.post(config["api"], json=data)
                if response.ok:
                    print(f"📤 ส่งไปยัง API: {config['api']} → {response.status_code}")
                else:
                    print(f"❌ ส่งไปยัง API ไม่สำเร็จ: {response.status_code} → {response.text}")
            except Exception as e:
                print(f"❗ เกิดข้อผิดพลาดในการส่ง API: {e}")
        except Exception as e:
            print(f"❌ เกิดข้อผิดพลาดใน on_message: {e}")
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดขณะ decode JSON: {e}")


# === Setup MQTT ===
client = mqtt.Client()
client.username_pw_set(USERNAME, PASSWORD)
client.on_connect = on_connect
client.on_disconnect = on_disconnect
client.on_message = on_message

# Try initial connection
try:
    client.connect(BROKER, PORT, 60)
except Exception as e:
    print("Initial connection failed:", e)
    exit(1)

# Start loop in background (non-blocking)
client.loop_start()

print("Listening for MQTT messages from TTN...")

try:
    while True:
        time.sleep(1)  # Main loop keeps process alive
except KeyboardInterrupt:
    print("Stopping...")
    client.loop_stop()
    client.disconnect()