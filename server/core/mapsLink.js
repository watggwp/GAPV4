'use strict';

const axios = require('axios')

// server ไปเปิดลิงก์ Google Maps ที่ผู้ใช้วางในช่องตำแหน่ง แล้วส่งหน้าเว็บให้ฝั่งหน้าเว็บตัดพิกัด
// ต้องจำกัดปลายทาง ไม่งั้นใช้สั่ง server ไปเปิด URL ภายใน (เช่น http://localhost:3306) ได้ (SSRF)
// - รับเฉพาะ http/https ไปยังโดเมนของ Google (google.*, goo.gl) ไม่ระบุ port ไม่มี user:pass
// - เช็กซ้ำทุกครั้งที่ถูก redirect (ลิงก์ย่อ maps.app.goo.gl จะ redirect ไป google.com/maps/...)

const GOOGLE_HOST = /^(?:[a-z0-9-]+\.)*google\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/i
const GOO_GL_HOST = /^(?:[a-z0-9-]+\.)*goo\.gl$/i

function isAllowedMapsUrl(value) {
    let url
    try {
        url = new URL(String(value))
    } catch (e) {
        return false
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
    if (url.username || url.password || url.port) return false
    return GOOGLE_HOST.test(url.hostname) || GOO_GL_HOST.test(url.hostname)
}

// ดึงหน้าเว็บของลิงก์แผนที่ คืน { PathMap, DataMaps } รูปแบบเดิมของ API
// throw ถ้าลิงก์/ปลายทาง redirect ไม่ใช่ Google หรือดึงไม่สำเร็จ
async function fetchMapsPage(link, { isAllowed = isAllowedMapsUrl } = {}) {
    if (!isAllowed(link)) throw new Error('maps link not allowed')

    const Maps = await axios.request({
        method: 'GET',
        url: String(link),
        headers: {},
        timeout: 15000,
        maxRedirects: 5,
        maxContentLength: 5 * 1024 * 1024,
        beforeRedirect: (options) => {
            const port = options.port ? `:${options.port}` : ''
            const next = options.href || `${options.protocol}//${options.hostname}${port}${options.path || ''}`
            if (!isAllowed(next)) throw new Error('maps redirect not allowed')
        }
    })

    return {
        PathMap: Maps.request.path,
        DataMaps: JSON.stringify(Maps.data)
    }
}

module.exports = { isAllowedMapsUrl, fetchMapsPage }
