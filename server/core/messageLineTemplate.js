class MessageLineTemplate {
    static bubbleTemplateUrl(alt , message, url) {

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
                                "label": "ดูข้อมูล",
                                "uri": url
                            }
                        }
                    ]
                }
            }
        }
    }
}

module.exports = MessageLineTemplate;