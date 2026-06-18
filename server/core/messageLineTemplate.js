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
                    {
                        "type": "text",
                        "text": subtitle,
                        "size": "sm",
                        "color": "#1DB446",
                        "weight": "bold",
                        "margin": "sm",
                        "wrap": true
                    },
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
}

module.exports = MessageLineTemplate;