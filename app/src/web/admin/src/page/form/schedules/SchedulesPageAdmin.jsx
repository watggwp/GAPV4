import React, { useCallback, useEffect, useState } from "react";
import { clientMo } from "../../../../../../assets/js/moduleClient";
import "../../../assets/style/page/form/Schedules/SchedulesPageAdmin.scss";


const imgPlant = "/plant_glow.jpg";
const imgFertilizer = "/fertilizer.jpg";
const imgChemical = "/chemical.jpg";
const imgHarvest = "/เก็บ.png";

const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];
const thaiShortMonths = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

function formatThaiDate(dateString) {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function getPlanDateAndRemaining(datePlantStr, agePlant) {
    if (!datePlantStr || agePlant === undefined || agePlant === null) return { dateText: "", remainingText: "" };
    const d = new Date(datePlantStr);
    if (isNaN(d.getTime())) return { dateText: "", remainingText: "" };
    d.setDate(d.getDate() + Number(agePlant));

    const dateText = formatThaiDate(d);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const planDateZero = new Date(d);
    planDateZero.setHours(0, 0, 0, 0);

    const diffTime = planDateZero.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let remainingText = "";
    return { dateText, remainingText };
}

function getMismatches(plan, actual, isFertilizer) {
    const mismatches = [];
    if (!plan || !actual) return mismatches;
    const det = plan.details || {};

    const normalize = (val) => String(val ?? "").replace(/\s+/g, "").toLowerCase();

    if (isFertilizer) {
        // Compare fertilizer name + formula
        const planName = normalize(det.name_fertilizer);
        const planFormula = normalize(det.formula_fertilizer);
        const actualName = normalize(actual.name);
        const actualFormula = normalize(actual.formula_name);

        if (planName && actualName && !actualName.includes(planName) && !planName.includes(actualName)) {
            mismatches.push("name");
        } else if (planFormula && actualFormula && !actualFormula.includes(planFormula) && !planFormula.includes(actualFormula)) {
            mismatches.push("name");
        }

        // Compare volume
        const planVol = normalize(det.volume);
        const actualVol = normalize(actual.volume);
        if (planVol && actualVol && !actualVol.includes(planVol) && !planVol.includes(actualVol)) {
            mismatches.push("volume");
        }

        // Compare how use
        const planUse = normalize(det.how_use);
        const actualUse = normalize(actual.use_is);
        if (planUse && actualUse && !actualUse.includes(planUse) && !planUse.includes(actualUse)) {
            mismatches.push("how_use");
        }
    } else {
        // Chemical
        // Compare pest
        const planPest = normalize(det.pest);
        const actualInsect = normalize(actual.insect);
        if (planPest && actualInsect && !actualInsect.includes(planPest) && !planPest.includes(actualInsect)) {
            mismatches.push("pest");
        }

        // Compare chemical name
        const planName = normalize(det.chemical);
        const actualName = normalize(actual.name);
        if (planName && actualName && !actualName.includes(planName) && !planName.includes(actualName)) {
            mismatches.push("name");
        }

        // Compare rate
        const planRate = normalize(det.rate);
        const actualRate = normalize(actual.rate);
        if (planRate && actualRate && !actualRate.includes(planRate) && !planRate.includes(actualRate)) {
            mismatches.push("rate");
        }

        // Compare volume
        const planVol = normalize(det.volume);
        const actualVol = normalize(actual.volume);
        if (planVol && actualVol && !actualVol.includes(planVol) && !planVol.includes(actualVol)) {
            mismatches.push("volume");
        }

        // Compare how use
        const planUse = normalize(det.how_use);
        const actualUse = normalize(actual.use_is);
        if (planUse && actualUse && !actualUse.includes(planUse) && !planUse.includes(actualUse)) {
            mismatches.push("how_use");
        }
    }
    return mismatches;
}

function renderDetailLine(lineObj, idx, isMismatched) {
    if (!lineObj) return null;
    const line = lineObj.text;
    const colonIndex = line.indexOf(":");
    const style = isMismatched ? { color: '#e11d48' } : {};
    const valueStyle = isMismatched ? { color: '#e11d48', fontWeight: 'bold' } : { color: '#0f172a', fontWeight: 'bold' };

    if (colonIndex !== -1) {
        const label = line.substring(0, colonIndex + 1);
        const value = line.substring(colonIndex + 1).trim();
        return (
            <div key={idx} className="detail-line" style={{ display: 'flex', gap: '8px', margin: '6px 0', ...style }}>
                <span style={{ color: isMismatched ? '#e11d48' : '#475569', fontWeight: '600', minWidth: '85px', display: 'inline-block' }}>{label}</span>
                <span style={valueStyle}>{value}</span>
            </div>
        );
    }
    return (
        <div key={idx} className="detail-line" style={{ margin: '6px 0', color: isMismatched ? '#e11d48' : '#0f172a', fontWeight: 'bold' }}>
            {line}
        </div>
    );
}

/** สร้าง card item สำหรับแผนการปลูก (schedule plan) */
function buildPlanItem(plan, index, datePlantStr) {
    const isFertilizer = Number(plan.category) === 1;
    const det = plan.details || {};
    const { dateText, remainingText } = getPlanDateAndRemaining(datePlantStr, plan.age_plant);
    return {
        key: `plan-${plan.id}-${index}`,
        img: isFertilizer ? imgFertilizer : imgChemical,
        title: isFertilizer ? "ใส่ปุ๋ย" : "ใช้สารเคมี",
        repeatLabel: plan.title || (plan.age_plant ? `อายุ ${plan.age_plant} วัน` : ""),
        date: dateText ? `${dateText} ${remainingText}` : "",
        detailLines: isFertilizer ? [
            det.name_fertilizer ? { field: "name", text: `ปุ๋ย: ${det.name_fertilizer}${det.formula_fertilizer ? ` (${det.formula_fertilizer})` : ""}` } : null,
            det.volume ? { field: "volume", text: `ปริมาณ: ${det.volume}${det.unit_volume ? ` ${det.unit_volume}` : ""}` } : null,
            det.how_use ? { field: "how_use", text: `วิธีใช้: ${det.how_use}` } : null,
        ].filter(Boolean) : [
            det.pest ? { field: "pest", text: `ศัตรูพืช: ${det.pest}` } : null,
            det.chemical ? { field: "name", text: `สาร: ${det.chemical}` } : null,
            det.rate ? { field: "rate", text: `อัตราส่วนผสม: ${det.rate} CC/น้ำ20ลิตร` } : null,
            det.volume ? { field: "volume", text: `ปริมาณ: ${det.volume}${det.unit_volume ? ` ${det.unit_volume}` : ""}` } : null,
            det.how_use ? { field: "how_use", text: `วิธีใช้: ${det.how_use}` } : null,
        ].filter(Boolean),
        isEmpty: false,
        raw: plan,
    };
}

/** สร้าง card item สำหรับสิ่งที่บันทึกจริง */
function buildActualFertilizerItem(f, index) {
    return {
        key: `fer-${f.id}-${index}`,
        img: imgFertilizer,
        title: "วันที่ใส่ปุ๋ย",
        repeatLabel: `ครั้งที่ ${index + 1}`,
        date: formatThaiDate(f.date),
        detailLines: [
            f.name ? { field: "name", text: `ปุ๋ย: ${f.name}${f.formula_name ? ` สูตร ${f.formula_name}` : ""}` } : null,
            f.volume ? { field: "volume", text: `ปริมาณ: ${f.volume}` } : null,
            f.use_is ? { field: "how_use", text: `วิธีใช้: ${f.use_is}` } : null,
        ].filter(Boolean),
        isEmpty: false,
        raw: f,
    };
}

function buildActualChemicalItem(c, index) {
    return {
        key: `che-${c.id}-${index}`,
        img: imgChemical,
        title: "วันที่ใช้สารเคมี",
        repeatLabel: `ครั้งที่ ${index + 1}`,
        date: formatThaiDate(c.date),
        detailLines: [
            c.insect ? { field: "pest", text: `โรค/แมลง: ${c.insect}` } : null,
            c.name ? { field: "name", text: `ชื่อ: ${c.name}${c.formula_name ? `สูตร ${c.formula_name}` : ""}` } : null,
            c.rate ? { field: "rate", text: `อัตราส่วนผสม: ${c.rate} CC/น้ำ20ลิตร` } : null,
            c.volume ? { field: "volume", text: `ปริมาณ: ${c.volume}` } : null,
            c.use_is ? { field: "how_use", text: `วิธีใช้: ${c.use_is}` } : null,
        ].filter(Boolean),
        isEmpty: false,
        raw: c,
    };
}

const EMPTY_CARD = { isEmpty: true };

export default function SchedulesPopup({ id_form, onClose }) {
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState(null);
    const [schedulePlans, setSchedulePlans] = useState([]);
    const [fertilizers, setFertilizers] = useState([]);
    const [chemicals, setChemicals] = useState([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await clientMo.post("/api/admin/formplant/schedules", { id_plant: id_form });
            const data = typeof res === "string" ? JSON.parse(res) : res;
            setFormData(data?.formData || null);
            setSchedulePlans(data?.schedulePlans || []);
            setFertilizers(data?.fertilizers || []);
            setChemicals(data?.chemicals || []);
        } catch (err) {
            console.error("SchedulesPopup fetchData error:", err);
        }
        setLoading(false);
    }, [id_form]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const now = new Date();
    const formattedNow = `เวลา: ${now.getDate()} ${thaiShortMonths[now.getMonth()]} ${now.getFullYear() + 543} , ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} น.`;

    // แยก schedule plans เป็น 2 ประเภท (ปุ๋ย = category 1, สารเคมี = category 2)
    const planFertilizers = schedulePlans.filter(p => Number(p.category) === 1);
    const planChemicals = schedulePlans.filter(p => Number(p.category) === 2);

    // สร้าง rows สำหรับปุ๋ย: จับคู่แผน (ซ้าย) กับ บันทึกจริง (ขวา)
    const fertilizerRows = [];
    const maxFer = Math.max(planFertilizers.length, fertilizers.length);
    for (let i = 0; i < maxFer; i++) {
        const left = planFertilizers[i] ? buildPlanItem(planFertilizers[i], i, formData?.date_plant) : EMPTY_CARD;
        const right = fertilizers[i] ? buildActualFertilizerItem(fertilizers[i], i) : EMPTY_CARD;
        fertilizerRows.push({ left, right });
    }

    // สร้าง rows สำหรับสารเคมี: จับคู่แผน (ซ้าย) กับ บันทึกจริง (ขวา)
    const chemicalRows = [];
    const maxChe = Math.max(planChemicals.length, chemicals.length);
    for (let i = 0; i < maxChe; i++) {
        const left = planChemicals[i] ? buildPlanItem(planChemicals[i], i, formData?.date_plant) : EMPTY_CARD;
        const right = chemicals[i] ? buildActualChemicalItem(chemicals[i], i) : EMPTY_CARD;
        chemicalRows.push({ left, right });
    }

    const allRows = [...fertilizerRows, ...chemicalRows];
    const hasAnyData = allRows.length > 0;

    return (
        <div className="schedule-overlay" onClick={onClose}>

            <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="schedule-header">
                    <span className="schedule-header-title">แผนการปลูกและบันทึกกิจกรรม</span>
                    {/* <button className="schedule-close-btn" onClick={onClose}>✕</button> */}
                </div>

                {/* Body */}
                <div className="schedule-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '48px', color: '#189D85', fontWeight: '600', fontSize: '18px' }}>กำลังโหลดข้อมูล...</div>
                    ) : (
                        <>
                            {/* ชื่อพืช */}
                            <div className="schedule-plant-header">
                                <h2 className="schedule-plant-name">{formData?.name_plant || "ไม่พบข้อมูลพืช"}</h2>
                            </div>

                            {/* วันที่ปลูก */}
                            {formData?.date_plant && (
                                <div className="schedule-plant-date-wrap">
                                    <div className="schedule-plant-date-card">
                                        <img src={imgPlant} alt="" />
                                        <div>
                                            <div className="schedule-plant-date-title">วันที่เริ่มปลูก</div>
                                            <div className="schedule-plant-date-value">{formatThaiDate(formData.date_plant)}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ขั้นตอนและแผนการปลูก */}
                            {hasAnyData ? (
                                <div className="steps-container">
                                    {allRows.map((row, i) => {
                                        const mainTitle = row.left.isEmpty ? row.right.title : row.left.title;
                                        const isFertilizer = mainTitle.includes("ปุ๋ย");
                                        const mismatches = getMismatches(row.left.raw, row.right.raw, isFertilizer);

                                        return (
                                            <div key={i} className="step-card">
                                                <div className="step-header-row">
                                                    <span className="step-main-title">
                                                        {isFertilizer ? "การใส่ปุ๋ย" : "การใช้สารเคมี"}
                                                    </span>
                                                </div>

                                                <div className="comparison-container">
                                                    {/* แผนการแนะนำ */}
                                                    <div className="comparison-box plan-box" style={mismatches.length > 0 ? { borderTopColor: '#e11d48' } : {}}>
                                                        <div className="box-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            <span className="box-title-label plan-title-color" style={mismatches.length > 0 ? { color: '#e11d48' } : {}}>ตามแผนการปลูก</span>
                                                            {(!row.left.isEmpty && row.left.repeatLabel) && (
                                                                <span className="step-age-badge" style={{ fontSize: '12px', padding: '2px 8px' }}>
                                                                    {row.left.repeatLabel}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {row.left.isEmpty ? (
                                                            <div className="empty-text">ไม่มีกำหนดในแผนการปลูก</div>
                                                        ) : (
                                                            <div className="box-details">
                                                                {row.left.date && (
                                                                    <div className="detail-date">
                                                                        วันที่: {row.left.date}
                                                                    </div>
                                                                )}
                                                                {(row.left.detailLines || []).map((line, idx) => {
                                                                    const isMismatched = mismatches.includes(line.field);
                                                                    return renderDetailLine(line, idx, isMismatched);
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* ผลการปฏิบัติจริง */}
                                                    <div className={`comparison-box actual-box ${row.right.isEmpty ? "unrecorded" : ""}`} style={mismatches.length > 0 ? { borderTopColor: '#e11d48' } : {}}>
                                                        <div className="box-header">
                                                            <span className={`box-title-label ${row.right.isEmpty ? "unrecorded-title-color" : mismatches.length > 0 ? "destructive-title-color" : "actual-title-color"}`} style={mismatches.length > 0 ? { color: '#e11d48' } : {}}>
                                                                {row.right.isEmpty ? "ยังไม่ได้บันทึกกิจกรรม" : `บันทึกปฏิบัติจริง (${row.right.repeatLabel || ""})`}
                                                            </span>
                                                        </div>
                                                        {row.right.isEmpty ? (
                                                            <div className="empty-text actual-empty-text">ยังไม่มีข้อมูลการบันทึกงาน</div>
                                                        ) : (
                                                            <div className="box-details">
                                                                {row.right.date && (
                                                                    <div className="detail-date">
                                                                        วันที่บันทึก: {row.right.date}
                                                                    </div>
                                                                )}
                                                                {(row.right.detailLines || []).map((line, idx) => {
                                                                    const isMismatched = mismatches.includes(line.field);
                                                                    return renderDetailLine(line, idx, isMismatched);
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Warning banner if mismatched */}
                                                {(mismatches.length > 0 || (row.left.isEmpty && !row.right.isEmpty)) && (
                                                    <div style={{
                                                        marginTop: '12px',
                                                        padding: '8px 12px',
                                                        backgroundColor: '#fff1f2',
                                                        borderLeft: '4px solid #e11d48',
                                                        borderRadius: '4px',
                                                        color: '#9f1239',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}>
                                                        <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        <span>
                                                            {row.left.isEmpty ? "กิจกรรมนี้บันทึกอยู่นอกเหนือแผนการปลูกที่แนะนำ (ไม่ตรงตามแผน)" : "ข้อมูลบันทึกจริงไม่ตรงกับแผนการปลูกที่แนะนำ (ไม่เป็นไปตามแผน)"}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', backgroundColor: '#f1f5f9', padding: '32px', borderRadius: '8px', color: '#64748b', fontSize: '16px', border: '1px dashed #cbd5e1', margin: '20px 0' }}>
                                    ยังไม่มีแผนการปลูกหรือข้อมูลบันทึกในระบบ
                                </div>
                            )}

                            {/* วันเก็บเกี่ยว */}
                            {(formData?.date_harvest || formData?.date_success) && (
                                <div className="harvest-grid">
                                    <div className="harvest-card" style={{ borderTop: '4px solid #189D85' }}>
                                        <img src={imgHarvest} alt="" />
                                        <div>
                                            <div className="harvest-title">วันเก็บเกี่ยวตามแผน</div>
                                            <div className="harvest-date">{formData.date_harvest ? formatThaiDate(formData.date_harvest) : "-"}</div>
                                        </div>
                                    </div>
                                    <div className="harvest-card" style={{ borderTop: '4px solid #10b981' }}>
                                        <img src={imgHarvest} alt="" />
                                        <div>
                                            <div className="harvest-title">วันเก็บเกี่ยวจริง</div>
                                            <div className="harvest-date">{formData.date_success ? formatThaiDate(formData.date_success) : "ยังไม่ได้เก็บเกี่ยว"}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            {/* <div className="schedule-footer">
                                <p className="schedule-timestamp">{formattedNow}</p>
                                <button className="schedule-close-full-btn" onClick={onClose}>ปิดหน้าต่าง</button>
                            </div> */}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};