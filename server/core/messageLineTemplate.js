class MessageLineTemplate {
    static bubbleTemplateUrl(alt, message, url, option = { buttonLabel: "ดูข้อมูล" }) {

        const { buttonLabel } = option;

        if (!alt || !message || !url) {
            throw new Error("Both alt , message and url are required");
        }

        return {
            "type": "flex",
            "altText": alt,
            "contents": {
                "type": "bubble",
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "spacing": "md",
                    "contents": [
                        {
                            "type": "text",
                            "text": message?.join("\n"),
                            "wrap": true
                        },
                        {
                            "type": "button",
                            "style": "primary",
                            "action": {
                                "type": "uri",
                                "label": buttonLabel,
                                "uri": url
                            }
                        }
                    ]
                }
            }
        }
    }

    static bubbleOnlyUrl(message, url, option = { buttonLabel: "ดูข้อมูล" }) {
        const { buttonLabel } = option;

        if (!message || !url) {
            throw new Error("Both message and url are required");
        }

        return {
            "type": "bubble",
            "body": {
                "type": "box",
                "layout": "vertical",
                "spacing": "md",
                "contents": [
                    {
                        "type": "text",
                        "text": message?.join("\n"),
                        "wrap": true
                    },
                    {
                        "type": "button",
                        "style": "primary",
                        "action": {
                            "type": "uri",
                            "label": buttonLabel,
                            "uri": url
                        }
                    }
                ]
            }
        }
    }

    static beautifulBubbleUrl({ title, subtitle, imageUrl, details, url, buttonLabel }) {
        const detailContents = details.map(item => ({
            "type": "box",
            "layout": "baseline",
            "spacing": "sm",
            "contents": [
                {
                    "type": "text",
                    "text": item.label,
                    "color": "#aaaaaa",
                    "size": "sm",
                    "flex": 2,
                    "wrap": true
                },
                {
                    "type": "text",
                    "text": item.value,
                    "wrap": true,
                    "color": "#444444",
                    "size": "sm",
                    "flex": 4
                }
            ]
        }));

        return {
            "type": "bubble",
            "hero": {
                "type": "image",
                "url": imageUrl || "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Greenhouse_interior.jpg/800px-Greenhouse_interior.jpg",
                "size": "full",
                "aspectRatio": "20:13",
                "aspectMode": "cover"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": title,
                        "weight": "bold",
                        "size": "xl",
                        "wrap": true,
                        "color": "#2c3e50"
                    },
                    ...(subtitle ? [{
                        "type": "text",
                        "text": subtitle,
                        "size": "sm",
                        "color": "#1DB446",
                        "weight": "bold",
                        "margin": "sm",
                        "wrap": true
                    }] : []),
                    {
                        "type": "separator",
                        "margin": "md"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "margin": "md",
                        "spacing": "sm",
                        "contents": detailContents
                    }
                ]
            },
            ...(url ? {
                "footer": {
                    "type": "box",
                    "layout": "vertical",
                    "spacing": "sm",
                    "contents": [
                        {
                            "type": "button",
                            "style": "primary",
                            "height": "sm",
                            "color": "#1DB446",
                            "action": {
                                "type": "uri",
                                "label": buttonLabel || "คลิกที่นี่",
                                "uri": url
                            }
                        }
                    ],
                    "flex": 0
                }
            } : {})
        };
    }

    static carouselTemplateUrl(alt, bubbles) {
        if (!alt || !bubbles || bubbles.length === 0) {
            throw new Error("Both alt and bubbles are required");
        }

        return {
            "type": "flex",
            "altText": alt,
            "contents": {
                "type": "carousel",
                "contents": bubbles
            }
        };
    }

    // การ์ดแจ้งเตือนถึงเกษตรกร: ทุกประเภทใช้โครงเดียวกัน (อ่านง่าย) แต่ต่างกันที่สีหัวการ์ด ไอคอน และหัวข้อ
    // จึงแยกได้ทันทีว่าเป็นเรื่องอะไร (ดู FARMER_CARD_THEMES)
    //   theme      : key ใน FARMER_CARD_THEMES
    //   title      : หัวข้อ (ไม่ใส่ = ใช้ของธีม)
    //   subtitle   : บรรทัดใต้หัวข้อ เช่น "จากหมอพืช · ชื่อ"
    //   rows       : [{ label, value }] ข้อมูลสั้นๆ (โรงเรือน พืช รหัส ฯลฯ)
    //   highlight  : { label, text } กล่องเนื้อหาหลัก (คำแนะนำ / หมายเหตุ)
    //   list       : { label, items: [string] } รายการ เช่น ช่องที่ถูกแก้ไข
    //   imageUrl   : รูปแนบ (https) แตะแล้วเปิดรูปเต็ม
    //   url, buttonLabel : ปุ่มด้านล่าง
    static farmerCard({ theme = "info", title, subtitle, rows = [], highlight, list, imageUrl, url, buttonLabel, altText, date = new Date() }) {
        const t = FARMER_CARD_THEMES[theme] || FARMER_CARD_THEMES.info
        const heading = title || t.title
        const dateText = date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" })
        const text = (value) => (value === null || value === undefined || value === "" ? "-" : String(value))
        const infoRow = ({ label, value }) => ({
            "type": "box",
            "layout": "baseline",
            "spacing": "sm",
            "contents": [
                { "type": "text", "text": text(label), "size": "sm", "color": "#8C8C8C", "flex": 2, "wrap": true },
                { "type": "text", "text": text(value), "size": "sm", "color": "#333333", "flex": 5, "wrap": true, "weight": "bold" }
            ]
        })
        const panel = (label, contents) => ({
            "type": "box",
            "layout": "vertical",
            "backgroundColor": t.soft,
            "cornerRadius": "8px",
            "paddingAll": "12px",
            "margin": "md",
            "contents": [
                { "type": "text", "text": label, "size": "xs", "color": t.color, "weight": "bold" },
                ...contents
            ]
        })
        const listItems = list && list.items && list.items.length ? list.items.slice(0, 12) : []

        return {
            "type": "flex",
            "altText": (altText || `${t.icon} ${heading}${highlight && highlight.text ? `: ${highlight.text}` : ""}`).slice(0, 400),
            "contents": {
                "type": "bubble",
                "size": "mega",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "backgroundColor": t.color,
                    "paddingAll": "16px",
                    "contents": [
                        { "type": "text", "text": t.tag, "color": "#FFFFFFCC", "size": "xxs", "weight": "bold" },
                        { "type": "text", "text": `${t.icon} ${heading}`, "color": "#FFFFFF", "weight": "bold", "size": "lg", "wrap": true, "margin": "xs" },
                        ...(subtitle ? [{ "type": "text", "text": subtitle, "color": "#FFFFFFDD", "size": "sm", "margin": "xs", "wrap": true }] : [])
                    ]
                },
                ...(imageUrl ? {
                    "hero": {
                        "type": "image",
                        "url": imageUrl,
                        "size": "full",
                        "aspectRatio": "4:3",
                        "aspectMode": "cover",
                        "action": { "type": "uri", "label": "ดูรูป", "uri": imageUrl }
                    }
                } : {}),
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "spacing": "md",
                    "paddingAll": "16px",
                    "contents": [
                        ...rows.filter(Boolean).map(infoRow),
                        ...(listItems.length ? [panel(list.label || "รายการ", listItems.map((item) => (
                            { "type": "text", "text": `• ${item}`, "size": "sm", "color": "#222222", "wrap": true, "margin": "sm" }
                        )))] : []),
                        ...(highlight && highlight.text ? [panel(highlight.label || "รายละเอียด", [
                            { "type": "text", "text": String(highlight.text), "size": "md", "color": "#222222", "wrap": true, "margin": "sm" }
                        ])] : []),
                        { "type": "text", "text": dateText, "size": "xs", "color": "#AAAAAA", "align": "end" }
                    ]
                },
                ...(url ? {
                    "footer": {
                        "type": "box",
                        "layout": "vertical",
                        "paddingAll": "12px",
                        "contents": [{
                            "type": "button",
                            "style": "primary",
                            "color": t.color,
                            "height": "sm",
                            "action": { "type": "uri", "label": (buttonLabel || t.button).slice(0, 40), "uri": url }
                        }]
                    }
                } : {})
            }
        };
    }

    // แถวโรงเรือน / พืช ที่ใช้ซ้ำในหลายการ์ด
    static gapRows(greenhouseName, plantName) {
        return [
            { label: "โรงเรือน", value: greenhouseName },
            { label: "พืชที่ปลูก", value: plantName }
        ]
    }

    // ประกาศเฝ้าระวังทุกชนิด: carousel ใส่ได้ 12 ใบต่อข้อความ จึงแบ่งเป็นหลายข้อความ ไม่ตัดชนิดที่เกินทิ้ง
    // คืน array ของข้อความ LINE (ส่งด้วย sendPestAlert ซึ่งส่งครั้งละไม่เกิน 5 ข้อความตามข้อจำกัดของ LINE)
    static pestAlertMessages(items) {
        const list = Array.isArray(items) ? items : []
        const chunks = []
        for (let i = 0; i < list.length; i += 12) chunks.push(list.slice(i, i + 12))
        return chunks.map((chunk, index) => {
            const message = MessageLineTemplate.pestAlertMessage(chunk)
            if (chunks.length > 1) message.altText = `(${index + 1}/${chunks.length}) ${message.altText}`.slice(0, 400)
            return message
        })
    }

    // ส่งประกาศเฝ้าระวังให้ทุก uid (multicast ได้ครั้งละ 5 ข้อความ)
    static async sendPestAlert(lineClient, uids, items) {
        const messages = MessageLineTemplate.pestAlertMessages(items)
        for (let i = 0; i < messages.length; i += 5) {
            await lineClient.multicast(uids, messages.slice(i, i + 5))
        }
    }

    // ประกาศเฝ้าระวังโรค/ศัตรูพืช: 1 ใบต่อ 1 ชนิด (carousel ได้สูงสุด 12 ใบ ถ้ามากกว่านั้นใช้ pestAlertMessages)
    // items: [{ pest_name, count, name_plants, chemical_used }]
    static pestAlertMessage(items) {
        const bubbles = items.slice(0, 12).map((item) => MessageLineTemplate.farmerCard({
            theme: "pestAlert",
            title: `เฝ้าระวัง: ${item.pest_name}`,
            subtitle: "ตรวจพบการระบาดในพื้นที่",
            rows: [
                { label: "พบแล้ว", value: `${item.count} ครั้ง` },
                { label: "พืชที่ควรระวัง", value: item.name_plants }
            ],
            highlight: item.chemical_used ? { label: "สารเคมีที่แนะนำ", text: item.chemical_used } : null
        }).contents)
        const altText = `📢 เฝ้าระวังโรคและศัตรูพืช: ${items.map((item) => item.pest_name).join(", ")}`.slice(0, 400)
        return bubbles.length === 1
            ? { "type": "flex", "altText": altText, "contents": bubbles[0] }
            : MessageLineTemplate.carouselTemplateUrl(altText, bubbles)
    }

    // การ์ด "คำแนะนำจากหมอพืช / เจ้าหน้าที่"
    static adviceMessage({ fromLabel = "หมอพืช", senderName, greenhouseName, plantName, advice, imageUrl, url, date = new Date() }) {
        return MessageLineTemplate.farmerCard({
            theme: "advice",
            subtitle: `จาก${fromLabel}${senderName ? ` · ${senderName}` : ""}`,
            rows: MessageLineTemplate.gapRows(greenhouseName, plantName),
            highlight: { label: "คำแนะนำ", text: advice },
            altText: `คำแนะนำจาก${fromLabel}: ${advice || ""}`,
            imageUrl, url, date
        })
    }
}

// ธีมของการ์ดแต่ละประเภท: สี (หัวการ์ด/ปุ่ม), สีอ่อน (กล่องเนื้อหา), ไอคอน, ป้ายหมวด, หัวข้อ และปุ่มตั้งต้น
const FARMER_CARD_THEMES = {
    advice:        { color: "#1B7F5B", soft: "#EAF6F0", icon: "🌱", tag: "คำแนะนำ",        title: "คำแนะนำการปลูก",              button: "ดูคำแนะนำทั้งหมด" },
    harvest:       { color: "#D35400", soft: "#FDF0E6", icon: "🧺", tag: "เก็บเกี่ยว",      title: "สั่งเก็บเกี่ยวตัวอย่างผลผลิต",  button: "ดูรายละเอียดการเก็บเกี่ยว" },
    checkPlant:    { color: "#1F618D", soft: "#EAF2F8", icon: "🔬", tag: "ผลตรวจผลผลิต",   title: "ผลการตรวจสอบผลผลิต",         button: "ดูผลการตรวจ" },
    checkFormPass: { color: "#117A65", soft: "#E8F6F3", icon: "✅", tag: "ผลตรวจแบบบันทึก", title: "แบบบันทึกผ่านการตรวจสอบ",      button: "ดูผลการตรวจ" },
    checkFormFail: { color: "#B03A2E", soft: "#FBEEEC", icon: "❌", tag: "ผลตรวจแบบบันทึก", title: "แบบบันทึกไม่ผ่านการตรวจสอบ",   button: "ดูสิ่งที่ต้องแก้ไข" },
    formEdited:    { color: "#6C3483", soft: "#F4ECF7", icon: "✏️", tag: "แก้ไขแบบบันทึก",  title: "เจ้าหน้าที่แก้ไขแบบบันทึก GAP", button: "ดูแบบบันทึก" },
    editRejected:  { color: "#A04000", soft: "#FBEEE6", icon: "⛔", tag: "คำขอแก้ไข",       title: "คำขอแก้ไขไม่ผ่านการตรวจสอบ",  button: "ดูแบบบันทึก" },
    accountOk:     { color: "#1E8449", soft: "#E9F7EF", icon: "🎉", tag: "บัญชีผู้ใช้",      title: "บัญชีผ่านการตรวจสอบแล้ว",     button: "เริ่มใช้งาน" },
    accountFail:   { color: "#922B21", soft: "#F9EBEA", icon: "⚠️", tag: "บัญชีผู้ใช้",      title: "บัญชีไม่ผ่านการตรวจสอบ",      button: "ติดต่อเจ้าหน้าที่" },
    accountLink:   { color: "#2E4053", soft: "#EBEDEF", icon: "🔗", tag: "บัญชีผู้ใช้",      title: "เชื่อมบัญชีเรียบร้อย",          button: "ดูข้อมูล" },
    profileEdited: { color: "#5B2C6F", soft: "#F5EEF8", icon: "👤", tag: "ข้อมูลส่วนตัว",    title: "เจ้าหน้าที่แก้ไขข้อมูลของท่าน",  button: "ดูข้อมูล" },
    pestAlert:     { color: "#C0392B", soft: "#FDEDEC", icon: "📢", tag: "ประกาศเฝ้าระวัง",  title: "เฝ้าระวังโรคและศัตรูพืช",       button: "ดูรายละเอียด" },
    planFertilizer:{ color: "#5D7A1F", soft: "#F1F6E6", icon: "🧪", tag: "แผนการปลูก",      title: "ถึงเวลาใส่ปุ๋ยตามแผน",          button: "ใส่ปุ๋ยแล้ว กรอกข้อมูลที่นี่" },
    planChemical:  { color: "#0B7A8A", soft: "#E6F4F5", icon: "🛡️", tag: "แผนการปลูก",      title: "ถึงเวลาใช้สารเคมีตามแผน",      button: "ใส่สารเคมีแล้ว กรอกข้อมูลที่นี่" },
    planReminder:  { color: "#3949AB", soft: "#ECEEF8", icon: "⏰", tag: "แจ้งล่วงหน้า",     title: "เตรียมตัวตามแผนการปลูก",       button: "ดูแผนการปลูก" },
    unrecorded:    { color: "#7E5109", soft: "#FBF3E8", icon: "📝", tag: "ตรวจตามแผน",      title: "เกษตรกรยังไม่บันทึกตามแผน",    button: "เปิดแบบบันทึก" },
    mismatch:      { color: "#B7950B", soft: "#FEF9E7", icon: "⚠️", tag: "ตรวจตามแผน",      title: "ข้อมูลไม่ตรงตามแผนการปลูก",   button: "ดูรายละเอียด" },
    device:        { color: "#424949", soft: "#F2F3F4", icon: "📟", tag: "อุปกรณ์",         title: "แจ้งเตือนอุปกรณ์",             button: "ดูรายละเอียด" },
    info:          { color: "#2C3E50", soft: "#F4F6F7", icon: "🔔", tag: "แจ้งเตือน",        title: "แจ้งเตือนจากระบบ",            button: "ดูข้อมูล" },
}
MessageLineTemplate.FARMER_CARD_THEMES = FARMER_CARD_THEMES

module.exports = MessageLineTemplate;