import paho.mqtt.client as mqtt 
import json
import requests
from datetime import datetime
import pytz 
import time

# === CONFIG ===

BROKER = "as1.cloud.thethings.industries"
PORT = 1883
USERNAME = "test2-app@mootunlesyslab"
PASSWORD = "NNSXS.CZGZQNSZOBUJYB4AGDVMCRZ26RBXMDDXPH457IY.UTHV3QNMVH5LFYSRR6HJU2OIHWNHGT3IIF3JPAZU42MSDOU6PAXA"
TOPIC = "v3/test2-app@mootunlesyslab/devices/+/up"

with open("device_config.json") as f:
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
            timestamp_fixed = timestamp[:26] + "Z"
            dt_utc = datetime.strptime(timestamp_fixed, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=pytz.utc)
            dt_bangkok = dt_utc.astimezone(pytz.timezone("Asia/Bangkok"))

            config = DEVICE_CONFIG_MAP.get(device_id)
            if not config:
                # print(f"{dt_bangkok.isoformat()}  ไม่พบ config สำหรับอุปกรณ์: {device_id}", payload)
                return

            data = {
                "device_id": device_id,
                "timestamp": dt_bangkok.isoformat()
            }

            decoded = payload["uplink_message"]["decoded_payload"]

            for field in config["fields"]:
                value = decoded.get(field)
                if value is not None:
                    data[field] = value

            print(json.dumps(data, indent=2))

            try:
                response = requests.post(config["api"], json=data)
                # ไม่ต้อง print ถ้า post ไม่สำเร็จ
                if response.ok:
                    print(f"📤 ส่งไปยัง API: {config['api']} → {response.status_code}")
            except:
                pass  # ไม่โชว์ error

        except:
            pass  # ไม่โชว์ error ภายใน block นี้
    except:
        pass  # ไม่โชว์ error json load


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