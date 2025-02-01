import React, { useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import "../../assets/style/page/PopupManage.scss";

const EditGroup = ({ selectedItem, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: "",
    pest_name: "",
    chemical_name: "",
    plant_name: "",
    safe_days: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedItem) {
      fetchGroupData();
    }
  }, [selectedItem]);

  const fetchGroupData = async () => {
    try {
      const response = await clientMo.post("/api/admin/group/get", { id: selectedItem.id });
      const result = JSON.parse(response)[0];
      setFormData({
        id: result.id,
        pest_name: result.pest_name,
        chemical_name: result.chemical_name,
        plant_name: result.plant_name,
        safe_days: result.safe_days,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching group data:", error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const response = await clientMo.post("/api/admin/group/edit", formData);
      if (response === "success") {
        alert("บันทึกข้อมูลสำเร็จ");
        onSave();
        onClose();
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error) {
      console.error("Error saving group data:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>แก้ไขข้อมูล</h2>
        {loading ? (
          <p>กำลังโหลดข้อมูล...</p>
        ) : (
          <>
            <label>โรคพืช / ศัตรูพืช:</label>
            <input type="text" name="pest_name" value={formData.pest_name} onChange={handleChange} />

            <label>สารเคมี:</label>
            <input type="text" name="chemical_name" value={formData.chemical_name} onChange={handleChange} />

            <label>พืช:</label>
            <input type="text" name="plant_name" value={formData.plant_name} onChange={handleChange} />

            <label>วันที่ปลอดภัย:</label>
            <input type="number" name="safe_days" value={formData.safe_days} onChange={handleChange} />

            <div className="modal-actions">
              <button onClick={onClose} className="close-btn">ยกเลิก</button>
              <button onClick={handleSubmit} className="save-btn" disabled={saving}>
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EditGroup;
