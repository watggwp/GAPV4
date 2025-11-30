const axios = require("axios")
require('dotenv').config()

const WEBHOOK_NOTIFIER = process.env.WEBHOOK_NOTIFIER

const services = [
    { name: "GAP API", url: `http://localhost:${process.env.REACT_APP_API_PORT}/api/heartbeat` },
]

const heartbeatMessages = {
    200: {
        description: "Server is alive ✅",
        color: 0x00ff00
    }
}

async function apiHeartbeat(url) {
    try {
        const { status } = await axios.get(url, { validateStatus: () => true })
        return status
    } catch (err) {
        return 500
    }
}

async function sendWebhook(serviceName, status) {
    const message = heartbeatMessages[status] || {
        description: "⚠️ Server is down or not responding!",
        color: 0xff0000
    }

    const payload = {
        embeds: [
            {
                title: serviceName,
                description: message.description,
                color: message.color,
                timestamp: new Date().toISOString()
            }
        ]
    }

    await axios.post(WEBHOOK_NOTIFIER, payload).catch(err => {
        console.error("Failed to send webhook:", err.message)
    })
}

async function startHeartbeatChecker() {
    console.log("Heartbeat checker started")

    const lastStatus = {}
    const lastSentTime = {}
    const sendInterval = 30 * 60 * 1000 // 30 นาที
    const checkInterval = 10 * 1000 // 10 วินาที

    services.forEach(s => {
        lastStatus[s.name] = null
        lastSentTime[s.name] = 0
    })

    // ส่งครั้งแรก
    for (const service of services) {
        const status = await apiHeartbeat(service.url)
        await sendWebhook(service.name, status)
        lastStatus[service.name] = status
        lastSentTime[service.name] = Date.now()
    }

    // วนเช็คเรื่อย ๆ
    setInterval(async () => {
        const now = Date.now()

        for (const service of services) {
            try {
                const status = await apiHeartbeat(service.url)

                if (status !== lastStatus[service.name] || now - lastSentTime[service.name] >= sendInterval) {
                    await sendWebhook(service.name, status)
                    lastStatus[service.name] = status
                    lastSentTime[service.name] = now
                }
            } catch (err) {
                console.error(`Failed to check ${service.name}:`, err)
            }
        }
    }, checkInterval)
}

startHeartbeatChecker()