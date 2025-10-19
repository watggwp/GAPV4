import React, { useEffect, useMemo, useRef, useState } from "react";
import "./PDFPage.scss";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { useParams } from "react-router";
import { ExportPDF } from "../../../../../assets/js/Export";
import WeatherManagement from "../../../../../assets/components/weather-management";

export default function PDFPage() {
  const { greenhouse_id, gap_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const hostRef = useRef(null);

  /* ------------ helpers: date ------------ */
  const toThaiDate = (input) => {
    if (!input) return "-";
    try {
      const iso = String(input).includes("T") ? input : String(input).replace(" ", "T");
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    } catch { return "-"; }
  };
  const toMs = (input) => {
    if (input == null) return null;
    if (typeof input === "number") return input < 1e12 ? input * 1000 : input; // sec→ms
    const iso = String(input).includes("T") ? input : String(input).replace(" ", "T");
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d.getTime();
  };
  const endOfDayLocal2359 = (input) => {
    const ms = toMs(input);
    if (ms == null) return null;
    const d = new Date(ms);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  };
  const canExport = !!(data && data.farmer && data.dataForm && range?.st && range?.et);
  /* ------------ load data ------------ */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await clientMo.get(
          `/api/farmer/report/export?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`
        );
        let parsed = (res && res.data !== undefined) ? res.data : res;
        if (typeof parsed === "string") { try { parsed = JSON.parse(parsed); } catch { } }
        // แนะนำให้ API ส่งมาเพิ่ม: id_farm_house, device_id (ดูบันทาย)
        setData(parsed);
      } catch (err) {
        console.error("❌ Error fetching PDF data:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [greenhouse_id, gap_id]);

  /* ------------ range: ปลูก → เก็บเกี่ยว(23:59) ------------ */
  const range = useMemo(() => {
    const datePlant = data?.dataForm?.date_plant;
    const dateHarvest = data?.dataForm?.date_harvest;
    const st = toMs(datePlant);
    const et = endOfDayLocal2359(dateHarvest || new Date().toISOString());
    if (st && et && et >= st) return { st, et };
    return null;
  }, [data]);

  /* ------------ แจ้ง ExportPDF เมื่อกราฟพร้อม ------------ */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const obs = new MutationObserver(() => {
      const chartBox = host.querySelector("#weather-chart-export .recharts-wrapper");
      if (chartBox && chartBox.offsetWidth > 0 && chartBox.offsetHeight > 0) {
        window.dispatchEvent(new CustomEvent("weather-export:chart-ready"));
      }
    });
    obs.observe(host, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  /* ------------ export ------------ */
  const handleDownloadPDF = () => {
    try {
      if (typeof data === "object" && data !== null) {
        const formatted = {
          farmer: [data.farmer],
          dataForm: data.dataForm,
          ferti: data.ferti || [],
          chemi: data.chemi || [],
        };
        ExportPDF([formatted]); // ภายในจะไปจับ #weather-chart-export เอง
      } else {
        alert("ข้อมูลไม่ถูกต้อง หรือไม่มีข้อมูลให้สร้าง PDF");
      }
    } catch (err) {
      console.error("❌ Export PDF error:", err);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  if (loading) return <div className="pdf-page">กำลังโหลดข้อมูล...</div>;
  if (!data) return <div className="pdf-page">ไม่พบข้อมูลฟอร์มในระบบ</div>;

  const { farmer, dataForm, ferti, chemi } = data;

  return (
    <div className="pdf-page">
      {/* ====== โฮสต์กราฟซ่อน: ใช้ช่วง ปลูก→เก็บเกี่ยว(23:59) ====== */}
      <div
        ref={hostRef}
        style={{
          position: "fixed", left: -10000, top: 0,
          width: 1000, height: 360, opacity: 0, pointerEvents: "none", zIndex: -1
        }}
        aria-hidden
      >
        <div id="weather-chart-export" style={{ width: "100%", height: "100%" }}>
          {data?.device_id && range?.st && range?.et && (
            <WeatherManagement
              endpointData={`/api/sensor/weather-greenhouse/${data.id_farm_house || greenhouse_id}/${data.device_id}`}
              query={{ r: "farmer" }}
              startTime={range.st}     // ms จากวันปลูก (เริ่มวัน)
              endTime={range.et}       // ms ถึงวันเก็บเกี่ยว 23:59:59.999
              columnTimestamp="timestamp"
              columns={[
                { field: 'air_temperature', name: 'อุณหภูมิ', color: 'green' },
                { field: 'air_humidity', name: 'ความชื้น', color: 'yellow' },
                { field: 'light', name: 'แสง', color: 'orange' },
                { field: 'soil_temperature', name: 'อุณหภูมิดิน', color: 'red' },
                { field: 'soil_humidity', name: 'ความชื้นดิน', color: 'blue' },
                { field: 'pressure', name: 'ความกดอากาศ', color: '#4a4573' },
                { field: 'batt', name: 'แบตเตอรี่', color: 'red' },
              ]}
              showTable={false}
            />
          )}
        </div>
      </div>
      {/* ============================================ */}

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
          <p>พื้นที่: {dataForm?.area > 0 ? dataForm.area : "-"} {dataForm?.unit || ""}</p>

          <h2>ปุ๋ยที่ใช้</h2>
          {Array.isArray(ferti) && ferti.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ชื่อปุ๋ย</th><th>สูตร</th><th>ปริมาณ</th><th>วันที่ใช้</th>
                </tr>
              </thead>
              <tbody>
                {ferti.map((f, i) => (
                  <tr key={i}>
                    <td>{f?.name || "-"}</td>
                    <td>{f?.formula_name || "-"}</td>
                    <td>{f?.volume ?? "-"}</td>
                    <td>{toThaiDate(f?.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>ไม่มีข้อมูลปุ๋ย</p>}

          <h2>สารเคมีที่ใช้</h2>
          {Array.isArray(chemi) && chemi.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ชื่อสาร</th><th>แมลงเป้าหมาย</th><th>อัตรา</th><th>วันที่ใช้</th>
                </tr>
              </thead>
              <tbody>
                {chemi.map((c, i) => (
                  <tr key={i}>
                    <td>{c?.name || "-"}</td>
                    <td>{c?.insect || "-"}</td>
                    <td>{c?.rate ?? "-"}</td>
                    <td>{toThaiDate(c?.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>ไม่มีข้อมูลสารเคมี</p>}
        </div>

        <button className="download-btn" onClick={handleDownloadPDF} disabled={!canExport || loading}>
          ดาวน์โหลด PDF
        </button>
      </div>
    </div>
  );
}
