import { useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import "../../assets/style/page/GroupHistory.scss";

const FIELD_LABELS = {
    plant: { name: "ชนิดพืช", type_plant: "ประเภทพืช", variety_name: "สายพันธุ์", qty_harvest: "วันเก็บเกี่ยว (วัน)" },
    fertilizer: { name: "ชื่อปุ๋ย", name_formula: "สูตรปุ๋ย", how_use: "วิธีการใช้" },
    chemical: { name: "ชื่อสารเคมี", name_formula: "ชื่อสามัญสารเคมี", how_use: "วิธีการใช้", date_safe_list: "วันปลอดภัย (วัน)" },
    source: { name: "ชื่อแหล่งที่ซื้อ" },
    pest: { pest_name: "ชื่อศัตรูพืช / โรคพืช", type_pest: "ประเภท" },
};

const ACTION_LABEL = { insert: "เพิ่มข้อมูล", edit: "แก้ไขข้อมูล", status: "เปลี่ยนสถานะ" };
const STATUS_TEXT = { 1: "เปิดใช้งาน", 0: "ปิดใช้งาน" };

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString("th-TH", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
    });
};

const renderChanges = (row, dataType) => {
    const labels = FIELD_LABELS[dataType] || {};
    const before = row.before_data || {};
    const after = row.after_data || {};

    if (row.action_type === "status") {
        return (
            <div className="gh-change-status">
                <span className={`gh-badge ${before.is_use ? "enable" : "disable"}`}>
                    {STATUS_TEXT[before.is_use] ?? before.is_use}
                </span>
                <span className="gh-arrow">→</span>
                <span className={`gh-badge ${after.is_use ? "enable" : "disable"}`}>
                    {STATUS_TEXT[after.is_use] ?? after.is_use}
                </span>
            </div>
        );
    }

    if (row.action_type === "insert") {
        return (
            <div className="gh-change-insert">
                {Object.entries(labels).map(([key, label]) =>
                    after[key] != null ? (
                        <div key={key}>
                            <span className="gh-field-label">{label}:</span>{" "}
                            {String(after[key])}
                        </div>
                    ) : null
                )}
            </div>
        );
    }

    // edit — แสดงเฉพาะ field ที่เปลี่ยน
    const changed = Object.keys(labels).filter(
        (key) => String(before[key] ?? "") !== String(after[key] ?? "")
    );
    if (!changed.length) return <span className="gh-no-change">ไม่มีการเปลี่ยนแปลง</span>;
    return (
        <div className="gh-change-edit">
            {changed.map((key) => (
                <div key={key} className="gh-field-row">
                    <span className="gh-field-label">{labels[key]}:</span>
                    <span className="gh-before">{String(before[key] ?? "-")}</span>
                    <span className="gh-arrow">→</span>
                    <span className="gh-after">{String(after[key] ?? "-")}</span>
                </div>
            ))}
        </div>
    );
};

const DataHistoryModal = ({ dataId, dataType, dataLabel, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await clientMo.post("/api/doctor/data/history", {
                    data_id: dataId,
                    data_type: dataType
                });
                setLogs(JSON.parse(res));
            } catch {
                setLogs([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [dataId, dataType]);

    return (
        <div className="gh-modal-content">
            <div className="gh-modal-header">
                <div className="gh-header-title">
                    <h2>ประวัติการแก้ไข</h2>
                    <span className="gh-group-label">{dataLabel}</span>
                </div>
                <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <div className="gh-modal-body">
                {loading ? (
                    <p className="gh-loading">กำลังโหลดข้อมูล...</p>
                ) : logs.length === 0 ? (
                    <p className="gh-no-data">ไม่มีประวัติการแก้ไข</p>
                ) : (
                    <table className="gh-table">
                        <thead>
                            <tr>
                                <th>ลำดับ</th>
                                <th>ผู้ดำเนินการ</th>
                                <th>วันที่</th>
                                <th>การกระทำ</th>
                                <th>รายละเอียด</th>
                                <th>เหตุผล</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, idx) => (
                                <tr key={log.id}>
                                    <td className="gh-td-center" data-label="ลำดับ">{idx + 1}</td>
                                    <td data-label="ผู้ดำเนินการ">{log.editor_name}</td>
                                    <td className="gh-td-date" data-label="วันที่">{formatDate(log.created_at)}</td>
                                    <td className="gh-td-action" data-label="การกระทำ">
                                        <span className={`gh-action-badge action-${log.action_type}`}>
                                            {ACTION_LABEL[log.action_type]}
                                        </span>
                                    </td>
                                    <td data-label="รายละเอียด">{renderChanges(log, dataType)}</td>
                                    <td data-label="เหตุผล">
                                        {log.because
                                            ? <span className="gh-because-text">{log.because}</span>
                                            : <span className="gh-no-change">-</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default DataHistoryModal;
