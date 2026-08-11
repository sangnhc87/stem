import requests, json

url = "https://asia-southeast1-gamelogic4u.cloudfunctions.net/saveDevice"
payload = {"data": {
            "apiKey": "AIzaSyB8Xtw5rP9__9g_9PXQ1tziRVF6HbQ6lKM",
            "deviceId": "8bbd4244-3cb6-4760-85a7-eddc32aae8d7",
            "gmail": "admin@teacher.c3nguyenhuucanh.edu.vn"
          }}
headers = {"Content-Type": "application/json"}

r = requests.post(url, data=json.dumps(payload), headers=headers)
print(r.status_code, r.text)