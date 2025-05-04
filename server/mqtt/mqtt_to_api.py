import paho.mqtt.client as mqtt 
import json
import requests
from datetime import datetime
import pytz 

# === CONFIG ===

BROKER = "as1.cloud.thethings.industries"
PORT = 1883
USERNAME = "test2-app@mootunlesyslab"
PASSWORD = "NNSXS.CZGZQNSZOBUJYB4AGDVMCRZ26RBXMDDXPH457IY.UTHV3QNMVH5LFYSRR6HJU2OIHWNHGT3IIF3JPAZU42MSDOU6PAXA"
TOPIC = "v3/test2-app@mootunlesyslab/devices/+/up"
with open("device_config.json") as f:
    DEVICE_CONFIG_MAP = json.load(f)


def on_message(client, userdata, msg):
    try :
        payload = json.loads(msg.payload.decode())
        try:
            device_id = payload["end_device_ids"]["device_id"]
            timestamp = payload["received_at"]
            timestamp_fixed = timestamp[:26] + "Z"
            dt_utc = datetime.strptime(timestamp_fixed, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=pytz.utc)
            dt_bangkok = dt_utc.astimezone(pytz.timezone("Asia/Bangkok"))

            config = DEVICE_CONFIG_MAP.get(device_id)
            if not config:
                print(f"{timestamp} ไม่พบ config สำหรับอุปกรณ์: {device_id}")
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

            print(json.dumps(data, indent=2) , decoded)

            response = requests.post(config["api"], json=data)
            print(f"ส่งไปยัง API: {config['api']} → {response.status_code} - {response.text}")

        except Exception as e:
            print("Error:", payload , e)
    except Exception as errJsonLoad :
        try :
            print("Error json load: ", errJsonLoad , msg.payload.decode())
        except Exception as errDecode :
            print("Error decode: " , errDecode)


# === Setup MQTT ===
client = mqtt.Client()
client.username_pw_set(USERNAME, PASSWORD)
client.on_message = on_message

client.connect(BROKER, PORT, 60)
client.subscribe(TOPIC)

print("Listening for MQTT messages from TTN...")

client.loop_forever()