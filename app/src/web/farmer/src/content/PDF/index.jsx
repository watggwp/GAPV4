import React, { useEffect, useState } from "react";
import "./PDFPage.scss";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { useParams } from "react-router";
import { ExportPDF } from "../../../../../assets/js/Export";

export default function PDFPage() {
  const { greenhouse_id, gap_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ โหลดข้อมูลจาก API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await clientMo.get(
          `/api/farmer/report/export?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`
        );
        console.log("📦 ข้อมูลจาก API (raw):", res);

        // ✅ รองรับทั้ง string และ array
        let parsed = typeof res === "string" ? JSON.parse(res) : res;
        if (Array.isArray(parsed)) parsed = parsed[0] || {};

        console.log("✅ Parsed data:", parsed);
        setData(parsed);
      } catch (err) {
        console.error("❌ Error fetching PDF data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [greenhouse_id, gap_id]);

  // ✅ ฟังก์ชันแปลงวันที่ให้รองรับทั้ง " " และ "T"
  const toThaiDate = (input) => {
    if (!input) return "-";
    try {
      const iso = input.includes("T") ? input : input.replace(" ", "T");
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // ✅ ปุ่มดาวน์โหลด PDF
  const handleDownloadPDF = () => {
  try {
    if (typeof data === "object" && data !== null) {
      // ✅ ปรับให้ farmer เป็น array (ตามที่ ExportPDF ต้องการ)
      const formatted = {
        farmer: [data.farmer],       // <── แก้จาก data.farmer → [data.farmer]
        dataForm: data.dataForm,
        ferti: data.ferti || [],
        chemi: data.chemi || [],
      };
      ExportPDF([formatted]);
    } else {
      alert("ข้อมูลไม่ถูกต้อง หรือไม่มีข้อมูลให้สร้าง PDF");
    }
  } catch (err) {
    console.error("❌ Export PDF error:", err);
    alert("เกิดข้อผิดพลาดในการสร้าง PDF");
  }
};


  // ✅ Loading / Error State
  if (loading) return <div className="pdf-page">กำลังโหลดข้อมูล...</div>;
  if (!data) return <div className="pdf-page">ไม่พบข้อมูลฟอร์มในระบบ</div>;

  const { farmer, dataForm, ferti, chemi } = data;


  return (
    <div className="pdf-page">
      <div className="pdf-container">
        <h1 className="title">ข้อมูลฟอร์มเกษตรกร (PDF Preview)</h1>

        <div className="pdf-content">
          <h2>ข้อมูลเกษตรกร</h2>
          <p>ชื่อ: {farmer?.fullname || "-"}</p>
          <p>รหัสเกษตรกร: {farmer?.id_farmer || "-"}</p>
          <p>ศูนย์: {farmer?.station || "-"}</p>

          <h2>ข้อมูลการปลูก</h2>
          <p>ชนิดพืช: {dataForm?.name_plant || "-"}</p>
          <p>วันที่ปลูก: {toThaiDate(dataForm?.date_plant)}</p>
          <p>วันที่เก็บเกี่ยว: {toThaiDate(dataForm?.date_harvest)}</p>
          <p>จำนวนต้น: {dataForm?.qty || "-"}</p>
          <p>
            พื้นที่: {dataForm?.area > 0 ? dataForm.area : "-"}{" "}
            {dataForm?.unit || ""}
          </p>

          <h2>ปุ๋ยที่ใช้</h2>
          {ferti?.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ชื่อปุ๋ย</th>
                  <th>สูตร</th>
                  <th>ปริมาณ</th>
                  <th>วันที่ใช้</th>
                </tr>
              </thead>
              <tbody>
                {ferti.map((f, i) => (
                  <tr key={i}>
                    <td>{f.name}</td>
                    <td>{f.formula_name}</td>
                    <td>{f.volume}</td>
                    <td>{toThaiDate(f.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>ไม่มีข้อมูลปุ๋ย</p>
          )}

          <h2>สารเคมีที่ใช้</h2>
          {chemi?.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ชื่อสาร</th>
                  <th>แมลงเป้าหมาย</th>
                  <th>อัตรา</th>
                  <th>วันที่ใช้</th>
                </tr>
              </thead>
              <tbody>
                {chemi.map((c, i) => (
                  <tr key={i}>
                    <td>{c.name}</td>
                    <td>{c.insect}</td>
                    <td>{c.rate}</td>
                    <td>{toThaiDate(c.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>ไม่มีข้อมูลสารเคมี</p>
          )}
        </div>

        <button className="download-btn" onClick={handleDownloadPDF}>
          ดาวน์โหลด PDF
        </button>
      </div>
    </div>
  );
}
