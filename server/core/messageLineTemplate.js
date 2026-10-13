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

    // การ์ด "คำแนะนำจากหมอพืช / เจ้าหน้าที่" ที่ส่งให้เกษตรกร
    // imageUrl: รูปแนบ (ต้องเป็น https) แตะแล้วเปิดรูปเต็ม, url: ลิงก์ปุ่มไปหน้าคำแนะนำของแปลงนั้น
    static adviceMessage({ fromLabel = "หมอพืช", senderName, greenhouseName, plantName, advice, imageUrl, url, date = new Date() }) {
        const GREEN = "#1B7F5B"
        const dateText = date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" })
        const infoRow = (label, value) => ({
            "type": "box",
            "layout": "baseline",
            "spacing": "sm",
            "contents": [
                { "type": "text", "text": label, "size": "sm", "color": "#8C8C8C", "flex": 2 },
                { "type": "text", "text": value || "-", "size": "sm", "color": "#333333", "flex": 5, "wrap": true, "weight": "bold" }
            ]
        })

        return {
            "type": "flex",
            "altText": `คำแนะนำจาก${fromLabel}: ${advice || ""}`.slice(0, 400),
            "contents": {
                "type": "bubble",
                "size": "mega",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "backgroundColor": GREEN,
                    "paddingAll": "16px",
                    "contents": [
                        { "type": "text", "text": "🌱 คำแนะนำการปลูก", "color": "#FFFFFF", "weight": "bold", "size": "lg" },
                        { "type": "text", "text": `จาก${fromLabel}${senderName ? ` · ${senderName}` : ""}`, "color": "#D7F0E5", "size": "sm", "margin": "xs", "wrap": true }
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
                        infoRow("โรงเรือน", greenhouseName),
                        infoRow("พืชที่ปลูก", plantName),
                        {
                            "type": "box",
                            "layout": "vertical",
                            "backgroundColor": "#F1F8F4",
                            "cornerRadius": "8px",
                            "paddingAll": "12px",
                            "margin": "md",
                            "contents": [
                                { "type": "text", "text": "คำแนะนำ", "size": "xs", "color": GREEN, "weight": "bold" },
                                { "type": "text", "text": advice || "-", "size": "md", "color": "#222222", "wrap": true, "margin": "sm" }
                            ]
                        },
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
                            "color": GREEN,
                            "height": "sm",
                            "action": { "type": "uri", "label": "ดูคำแนะนำทั้งหมด", "uri": url }
                        }]
                    }
                } : {})
            }
        };
    }
}

module.exports = MessageLineTemplate;