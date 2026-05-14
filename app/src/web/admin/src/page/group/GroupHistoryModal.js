import { useCallback, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import "../../assets/style/page/GroupHistory.scss";

const ACTION_LABEL = {
    insert: "เพิ่มข้อมูล",
    edit: "แก้ไขข้อมูล",
    status: "เปลี่ยนสถานะ"
};

const statusLabel = (s) => (s ? "ENABLE" : "DISABLE");

const GroupHistoryModal = ({ groupId, groupLabel, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await clientMo.post("/api/admin/group/history", { group_id: groupId });
            const result = JSON.parse(response);
            if (result.status === 200) setLogs(result.data);
        } catch (err) {
            console.error("Error fetching group history:", err);
        }
        setLoading(false);
    }, [groupId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const renderChanges = (log) => {
        const before = log.before_data;
        const after = log.after_data;

        if (log.action_type === "status") {
            return (
                <div className="gh-change-status">
                    <span className={`gh-badge ${before?.status ? "enable" : "disable"}`}>
                        {statusLabel(before?.status)}
                    </span>
                    <span className="gh-arrow">→</span>
                    <span className={`gh-badge ${after?.status ? "enable" : "disable"}`}>
                        {statusLabel(after?.status)}
                    </span>
                </div>
            );
        }

        if (log.action_type === "insert") {
            return (
                <div className="gh-change-insert">
                    <div><span className="gh-field-label">ศัตรูพืช:</span> {log.after_pest_name || after?.pest_id}</div>
                    <div><span className="gh-field-label">สารเคมี:</span> {log.after_chemical_name || after?.chemical_id}</div>
                    <div><span className="gh-field-label">พืช:</span> {log.after_plant_name || after?.plant_id}</div>
                    <div><span className="gh-field-label">วันปลอดภัย:</span> {after?.safe_days} วัน</div>
                </div>
            );
        }

        // edit — แสดงเฉพาะ field ที่เปลี่ยน
        const fields = [
            { label: "ศัตรูพืช", before: log.before_pest_name, after: log.after_pest_name },
            { label: "สารเคมี", before: log.before_chemical_name, after: log.after_chemical_name },
            { label: "พืช", before: log.before_plant_name, after: log.after_plant_name },
            { label: "วันปลอดภัย", before: before?.safe_days, after: after?.safe_days }
        ];
        const changed = fields.filter((f) => String(f.before) !== String(f.after));

        if (changed.length === 0) return <span className="gh-no-change">ไม่มีการเปลี่ยนแปลง</span>;

        return (
            <div className="gh-change-edit">
                {changed.map((f, i) => (
                    <div key={i} className="gh-field-row">
                        <span className="gh-field-label">{f.label}:</span>
                        <span className="gh-before">{f.before}</span>
                        <span className="gh-arrow">→</span>
                        <span className="gh-after">{f.after}</span>
                    </div>
                ))}
            </div>
        );
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleString("th-TH", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="gh-modal-content">
            <div className="gh-modal-header">
                <div className="gh-header-title">
                    <h2>ประวัติการแก้ไข</h2>
                    <span className="gh-group-label">{groupLabel}</span>
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
                                    <td data-label="รายละเอียด">{renderChanges(log)}</td>
                                    <td className="gh-td-because" data-label="เหตุผล">
                                        {log.because ? (
                                            <span className="gh-because-text">{log.because}</span>
                                        ) : (
                                            <span className="gh-no-change">-</span>
                                        )}
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

export default GroupHistoryModal;
