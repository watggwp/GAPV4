const axios = require("axios")
require('dotenv').config()

const WEBHOOK_NOTIFIER = process.env.WEBHOOK_NOTIFIER

const services = [
    { name: "GAP API", url: `http://localhost:${process.env.REACT_APP_API_PORT}/api/heartbeat` },
]

async function apiHeartbeat(url) {
    try {
        const { status } = await axios.get(url, { validateStatus: () => true })
        return status
    } catch (err) {
        return 500
    }
}

async function sendWebhook(errorServices) {
    const description = errorServices
        .map(s => `❌ **${s.name}** — Status: ${s.status}\n`)
        .join("\n\n")

    const payload = {
        username: "Service Monitor",
        embeds: [
            {
                title: "Services Status",
                description : errorServices.length ? description : "alive ✅",
                color: 0xff0000,
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

    const lastErrors = new Set()
    const sendInterval = 30 * 60 * 1000 // 30 นาที
    const checkInterval = 10 * 1000     // 10 วินาที
    let lastSentTime = 0

    setInterval(async () => {
        const now = Date.now()
        const errorList = []
        const currentErrors = new Set()

        for (const service of services) {
            const status = await apiHeartbeat(service.url)

            if (status !== 200) {
                errorList.push({ name: service.name, url: service.url, status })
                currentErrors.add(service.name)
            }
        }

        const errorsChanged =
            errorList.length !== lastErrors.size ||
            [...currentErrors].some(s => !lastErrors.has(s))

        const shouldSend =
            errorsChanged || (now - lastSentTime >= sendInterval)

        if (!shouldSend) return

        await sendWebhook(errorList)
        lastSentTime = now

        lastErrors.clear()
        currentErrors.forEach(e => lastErrors.add(e))

    }, checkInterval)
}

startHeartbeatChecker()