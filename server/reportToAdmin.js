const RoyalGapLine = require("./configLine")

// ส่งรายงาน error ให้ผู้ดูแลทาง LINE เมื่อกำหนด ADMIN_REPORT_UID ไว้ ไม่งั้นบันทึกลง log
const reportAdmin = (reportText) => {
    const uid = (process.env.ADMIN_REPORT_UID || "").trim()
    if (!uid) {
        console.error("[reportAdmin]", reportText)
        return
    }
    RoyalGapLine.pushMessage(uid, {
        type : "text",
        text : String(reportText).slice(0, 4900)
    }).catch((e) => console.error("[reportAdmin] push failed", e.message))
}

module.exports = reportAdmin
