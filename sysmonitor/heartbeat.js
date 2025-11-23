const { Client, GatewayIntentBits } = require('discord.js')
const axios = require("axios")
require('dotenv').config()

const client = new Client({ intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
] })

const TOKEN = process.env.BOT_TOKEN
const CHANNEL_ID = process.env.CHANNEL_ID

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
    } catch(err) {
        return 500
    }
}

async function sendMessage(serviceName, status) {
    const channel = await client.channels.fetch(CHANNEL_ID)
    if (!channel) return console.error("Channel not found")

    const message = heartbeatMessages[status] || {
        description: "⚠️ Server is down or not responding!",
        color: 0xff0000
    }

    await channel.send({ embeds: [
        {   
            title: serviceName,
            ...message,
            timestamp: new Date()
        }
    ]})
}

client.once('ready', async () => {
    console.log(`Bot ready: ${client.user.tag}`)

    const lastStatus = {}
    const lastSentTime = {}
    const sendInterval = 30 * 60 * 1000
    const checkInterval = 10 * 1000

    services.forEach(s => {
        lastStatus[s.name] = null
        lastSentTime[s.name] = 0
    })

    setInterval(async () => {
        const now = Date.now()

        for (const service of services) {
            try {
                const status = await apiHeartbeat(service.url)

                if (status !== lastStatus[service.name] || now - lastSentTime[service.name] >= sendInterval) {
                    await sendMessage(service.name, status)
                    lastStatus[service.name] = status
                    lastSentTime[service.name] = now
                }
            } catch(err) {
                console.error(`Failed to check ${service.name}:`, err)
            }
        }
    }, checkInterval)

    for (const service of services) {
        const status = await apiHeartbeat(service.url)
        await sendMessage(service.name, status)
        lastStatus[service.name] = status
        lastSentTime[service.name] = Date.now()
    }
})

client.login(TOKEN)