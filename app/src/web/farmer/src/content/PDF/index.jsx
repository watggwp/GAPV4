// app/src/web/farmer/src/content/PDF/index.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import WeatherManagement from "../../../../../assets/components/weather-management";
import { ExportPDF } from "../../../../../assets/js/Export"; // ถ้าไฟล์ชื่อ exports.js ให้แก้เป็น ../../../../../assets/js/exports

/* ---------------- helpers: วันที่/ช่วงเวลา ---------------- */
const toMs = (input) => {
  if (!input) return null;
  if (typeof input === "number") return input < 1e12 ? input * 1000 : input;
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

/* --------------- helpers: แกะ/แปลง response --------------- */
function unwrap(res) {
  let v = res;
  if (v && v.data !== undefined) v = v.data; // axios
  if (v && typeof v === "string") { try { v = JSON.parse(v); } catch {} }
  return v || null;
}
function normalizePayload(raw) {
  if (!raw || typeof raw !== "object") return null;
  const dataForm = raw.dataForm ?? raw.dataform ?? null;
  const farmerObj = Array.isArray(raw.farmer) ? raw.farmer[0] : raw.farmer;
  return {
    dataForm,
    farmer: farmerObj || null,
    ferti: raw.ferti || [],
    chemi: raw.chemi || [],
    report: raw.report || [],
    checkPlant: raw.checkPlant || [],
    checkForm: raw.checkForm || [],
    id_farm_house: raw.id_farm_house ?? raw.id_farmhouse ?? raw.id_farmHouse,
    device_id: raw.device_id ?? raw.deviceId,
    __raw: raw,
  };
}

/* --------- ดึง greenhouse_id/gap_id จาก URL ---------- */
function getIdsFromURL() {
  let greenhouse_id = null;
  let gap_id = null;
  try {
    const url = new URL(window.location.href);
    const qs = new URLSearchParams(url.search);
    greenhouse_id = qs.get("greenhouse_id");
    gap_id = qs.get("gap_id");
    if (!greenhouse_id || !gap_id) {
      const parts = url.pathname.split("/").filter(Boolean);
      const pdfIdx = parts.findIndex((p) => p.toLowerCase() === "pdf");
      if (pdfIdx >= 0) {
        const afterA = parts[pdfIdx + 1];
        const afterB = parts[pdfIdx + 2];
        const beforeA = parts[pdfIdx - 2];
        const beforeB = parts[pdfIdx - 1];
        if (afterA && afterB) { greenhouse_id ??= afterA; gap_id ??= afterB; }
        else if (beforeA && beforeB) { greenhouse_id ??= beforeA; gap_id ??= beforeB; }
      }
      if ((!greenhouse_id || !gap_id) && parts.length >= 2) {
        const [a, b] = parts.slice(-2);
        if (a && b) { greenhouse_id ??= a; gap_id ??= b; }
      }
    }
  } catch {}
  return { greenhouse_id, gap_id };
}

export default function PDFDownloadOnly() {
  const [{ greenhouse_id, gap_id }] = useState(getIdsFromURL());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // host สำหรับกราฟ (ซ่อน)
  const [hostSize, setHostSize] = useState(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 980;
    const maxW = w <= 480 ? 420 : 980;
    const width = Math.min(maxW, Math.max(300, w - 24));
    const height = Math.round(width * 0.5);
    return { width, height };
  });
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const obs = new MutationObserver(() => {
      const svg = host.querySelector("#weather-chart-export .recharts-wrapper");
      if (svg && svg.offsetWidth > 0 && svg.offsetHeight > 0) {
        window.dispatchEvent(new CustomEvent("weather-export:chart-ready"));
      }
    });
    obs.observe(host, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const maxW = w <= 480 ? 420 : 980;
      const width = Math.min(maxW, Math.max(300, w - 24));
      const height = Math.round(width * 0.5);
      setHostSize({ width, height });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!greenhouse_id || !gap_id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await clientMo.get(
          `/api/farmer/report/export?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`
        );
        setData(normalizePayload(unwrap(res)));
      } catch (e) {
        console.error(e);
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [greenhouse_id, gap_id]);

  const range = useMemo(() => {
    if (!data?.dataForm) return null;
    const st = toMs(data.dataForm.date_plant);
    const et = endOfDayLocal2359(data.dataForm.date_harvest || new Date().toISOString());
    return st && et && et >= st ? { st, et } : null;
  }, [data]);

  const handleDownload = useCallback(async () => {
    if (!greenhouse_id || !gap_id) {
      alert("ขาดพารามิเตอร์ greenhouse_id / gap_id ใน URL");
      return;
    }
    setDownloading(true);
    try {
      let payload = data;
      if (!payload) {
        const res = await clientMo.get(
          `/api/farmer/report/export?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`
        );
        payload = normalizePayload(unwrap(res));
      }
      if (!payload?.dataForm || !payload?.farmer) {
        console.log("payload:", payload);
        alert("ไม่พบข้อมูลสำหรับสร้าง PDF");
        return;
      }
      const formatted = {
        farmer: [payload.farmer],
        dataForm: payload.dataForm,
        ferti: payload.ferti || [],
        chemi: payload.chemi || [],
        report: payload.report || [],
        checkPlant: payload.checkPlant || [],
        checkForm: payload.checkForm || [],
        id_farm_house: payload.id_farm_house,
        device_id: payload.device_id,
      };
      const st = toMs(payload?.dataForm?.date_plant);
      const et = endOfDayLocal2359(payload?.dataForm?.date_harvest || new Date().toISOString());
      const timeRange = st && et && et >= st ? { st, et } : null;
      await ExportPDF([formatted], { range: timeRange, download: true });
    } catch (e) {
      console.error(e);
      alert("ดาวน์โหลดไม่สำเร็จ");
    } finally {
      setDownloading(false);
    }
  }, [greenhouse_id, gap_id, data]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  }, []);

  return (
    <>
      {/* สไตล์: ย่อกรอบขาวให้เล็กลง */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .pdf-shell{
          width:100%;
          min-height:100vh;
          background:#eef6f2;
          display:flex;
          flex-direction:column;
          padding-top:max(env(safe-area-inset-top),8px);
        }

        /* ปุ่มย้อนกลับใต้โลโก้ */
        .pdf-topbar{
          width:100%;
          padding:8px 12px 6px;
          display:flex;
          justify-content:flex-start;
          gap:8px;
        }
        .btn-back{
          display:inline-flex;
          align-items:center;
          gap:8px;
          height:38px;
          padding:0 12px;
          border:1px solid #cfe6db;
          background:#fff;
          border-radius:10px;
          color:#2e6b4e;
          font-weight:700;
          font-size:14px;
          box-shadow:0 3px 8px rgba(0,0,0,.06);
          -webkit-tap-highlight-color:transparent;
        }
        .btn-back:active{ transform:translateY(1px); }
        .i-back{
          display:inline-block; width:10px; height:10px;
          border-left:2px solid currentColor; border-bottom:2px solid currentColor;
          transform:rotate(45deg); margin-top:1px;
        }

        /* เนื้อหากลาง: ลด padding ให้การ์ดเล็กลง */
        .pdf-content{
          flex:1 1 auto;
          display:flex;
          justify-content:center;
          padding:4px 8px 12px;
        }

        /* การ์ดเล็กลงทั้งกว้าง/สูง */
        .pdf-card{
          width:100%;
          max-width:420px;                 /* เล็กลงจาก 480/640 */
          background:#fff;
          border:1px solid #e6efe9;
          border-radius:12px;              /* ลดมุมโค้งลง */
          padding:12px;                    /* ลด padding */
          box-shadow:0 6px 14px rgba(0,0,0,.05);
          display:flex;
          flex-direction:column;
          min-height:min(48vh, 420px);     /* เตี้ยลงอย่างชัดเจน */
        }

        /* หัวข้อเล็กลงอีกนิด */
        .pdf-title{
          margin:2px 0 6px;
          text-align:center;
          font-size:clamp(16px,3.8vw,18px);
          font-weight:800;
          color:#103d2b;
        }

        .pdf-body{ flex:1 1 auto; }

        .pdf-actions{
          margin-top:8px;
          display:grid;
          grid-template-columns:1fr;
          gap:6px;
        }

        /* ปุ่มหลักยังอ่านง่าย */
        .btn-primary{
          width:100%;
          height:46px;
          border:0;
          border-radius:12px;
          background:#24b25f;
          color:#fff;
          font-size:15.5px;
          font-weight:800;
          letter-spacing:.2px;
          box-shadow:0 6px 16px rgba(36,178,95,.35);
        }
        .btn-primary:active{ transform:translateY(1px); }
        .btn-primary[disabled]{ opacity:.75; background:#97e0b9; box-shadow:none; cursor:not-allowed; }

        .pdf-note{
          margin-top:6px; color:#6a7a71; font-size:13.5px; text-align:center;
        }

        /* จอเล็กมาก */
        @media (max-width:400px){
          .pdf-card{
            max-width:340px;
            padding:10px;
            min-height:min(46vh, 380px);
          }
          .btn-primary{ height:44px; }
        }

        /* จอกว้างขึ้นแต่ยังคงขนาดเล็กกะทัดรัด */
        @media (min-width:768px){
          .pdf-content{ padding:8px 12px 14px; }
          .pdf-card{
            max-width:460px;               /* เดสก์ท็อปก็ยังเล็ก */
            min-height:min(44vh, 400px);
          }
        }
      `}</style>

      <div className="pdf-shell">
        {/* ปุ่มย้อนกลับใต้โลโก้ */}
        <div className="pdf-topbar">
          <button className="btn-back" onClick={handleBack} aria-label="ย้อนกลับ">
            <span className="i-back" aria-hidden="true"></span>
            <span>ย้อนกลับ</span>
          </button>
        </div>

        <div className="pdf-content">
          {/* host กราฟซ่อน */}
          <div
            ref={hostRef}
            style={{
              position: "fixed",
              inset: "0 auto auto -10000px",
              width: hostSize.width,
              height: hostSize.height,
              opacity: 0,
              pointerEvents: "none",
              zIndex: -1,
            }}
            aria-hidden
          >
            <div id="weather-chart-export" style={{ width: "100%", height: "100%" }}>
              {data?.device_id && range?.st && range?.et && (
                <WeatherManagement
                  endpointData={`/api/sensor/weather-greenhouse/${data.id_farm_house || greenhouse_id}/${data.device_id}`}
                  query={{ r: "farmer" }}
                  startTime={range.st}
                  endTime={range.et}
                  columnTimestamp="timestamp"
                  columns={[
                    { field: "air_temperature",  name: "อุณหภูมิ",      color: "green"  },
                    { field: "air_humidity",     name: "ความชื้น",       color: "yellow" },
                    { field: "light",            name: "แสง",            color: "orange" },
                    { field: "soil_temperature", name: "อุณหภูมิดิน",     color: "red"    },
                    { field: "soil_humidity",    name: "ความชื้นดิน",     color: "blue"   },
                    { field: "pressure",         name: "ความกดอากาศ",     color: "#4a4573"},
                    { field: "batt",             name: "แบตเตอรี่",       color: "red"    },
                  ]}
                  showTable={false}
                />
              )}
            </div>
          </div>

          {/* การ์ดหลัก + ปุ่มอยู่ในกรอบ */}
          <div className="pdf-card">
            <h1 className="pdf-title">ดาวน์โหลดรายงาน GAP</h1>

            <div className="pdf-body">
              {loading && <div className="pdf-note">กำลังเตรียมข้อมูล…</div>}
            </div>

            <div className="pdf-actions">
              <button
                className="btn-primary"
                disabled={downloading || loading}
                onClick={handleDownload}
              >
                {downloading ? "กำลังสร้างไฟล์..." : "ดาวน์โหลด PDF"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
