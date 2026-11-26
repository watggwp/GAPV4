'use strict';

require('dotenv').config().parsed

// ตรวจ LIFF access token กับ LINE แล้วคืน userId ที่เชื่อถือได้
// (ห้ามเชื่อ uid ที่ client ส่งมาตรง ๆ เพราะปลอมเป็นผู้ใช้คนอื่นได้)

const TIMEOUT_MS = 5000
const CACHE_MAX_MS = 5 * 60 * 1000
const cache = new Map()

// LIFF ID มีรูปแบบ "<LINE Login channel id>-<suffix>" จึงหา channel id ที่อนุญาตได้จาก env
function allowedChannelIds() {
    const ids = new Set(
        (process.env.LINE_LOGIN_CHANNEL_ID || "").split(",").map((id) => id.trim()).filter(Boolean)
    )
    const liffIds = [
        process.env.REACT_APP_LINE_SIGNUP,
        process.env.REACT_APP_LINE_HOUSE,
        process.env.REACT_APP_LINE_HOUSELIST,
        process.env.REACT_APP_LINE_FORM,
        process.env.REACT_APP_LINE_GAP,
        process.env.REACT_APP_WEATHER_STATION,
        process.env.REACT_APP_LIFF_DOCTOR,
        process.env.REACT_APP_LINE_NOTIFICATIONS
    ]
    liffIds.forEach((liffId) => {
        const channelId = (liffId || "").trim().split("-")[0]
        if (/^\d+$/.test(channelId)) ids.add(channelId)
    })
    return ids
}

async function getUserIdFromAccessToken(accessToken) {
    if (typeof accessToken !== "string" || !accessToken) throw new Error("missing access token")

    const cached = cache.get(accessToken)
    if (cached && cached.expiresAt > Date.now()) return cached.userId
    cache.delete(accessToken)

    const verify = await fetch(
        `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(accessToken)}`,
        { signal: AbortSignal.timeout(TIMEOUT_MS) }
    )
    if (!verify.ok) throw new Error("invalid access token")
    const { client_id, expires_in } = await verify.json()

    const allowed = allowedChannelIds()
    if (allowed.size && !allowed.has(String(client_id))) throw new Error("access token from another channel")
    if (!(expires_in > 0)) throw new Error("access token expired")

    const profile = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(TIMEOUT_MS)
    })
    if (!profile.ok) throw new Error("cannot read profile")
    const { userId } = await profile.json()
    if (!userId) throw new Error("profile has no userId")

    if (cache.size > 1000) cache.clear()
    cache.set(accessToken, { userId, expiresAt: Date.now() + Math.min(expires_in * 1000, CACHE_MAX_MS) })
    return userId
}

// ยอมรับ uid ที่ไม่ผ่านการตรวจเฉพาะตอน dev (ใช้กับ REACT_APP_UID_USER_TEST)
// หรือเมื่อเปิด ALLOW_UNVERIFIED_LIFF=true ไว้ชั่วคราวระหว่าง rollout
function allowUnverifiedUid() {
    return process.argv[2] !== process.env.BUILD || process.env.ALLOW_UNVERIFIED_LIFF === "true"
}

// ใช้ใน route: คืน userId ที่ตรวจแล้ว หรือ "" ถ้าไม่ผ่าน
async function resolveLineUserId({ accessToken, uid } = {}) {
    if (accessToken) {
        try {
            return await getUserIdFromAccessToken(accessToken)
        } catch (err) {
            console.warn("LINE access token rejected:", err.message)
            return ""
        }
    }
    if (uid && allowUnverifiedUid()) return String(uid)
    return ""
}

module.exports = { getUserIdFromAccessToken, resolveLineUserId, allowUnverifiedUid }
