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

/* --------------- helpers: แกะ/แปลง response ของ API ให้แน่น --------------- */
function unwrap(res) {
  let v = res;
  if (v && v.data !== undefined) v = v.data; // axios
  if (v && typeof v === "string") {
    try { v = JSON.parse(v); } catch {}
  }
  return v || null;
}
function normalizePayload(raw) {
  if (!raw || typeof raw !== "object") return null;

  // รองรับ dataForm และ dataform
  const dataForm = raw.dataForm ?? raw.dataform ?? null;

  // farmer: รองรับ object เดี่ยว/array
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
    __raw: raw, // เก็บดิบไว้เผื่อใช้ภายหลัง
  };
}

/* --------- ดึง greenhouse_id/gap_id จาก URL (query หรือ path) ---------- */
function getIdsFromURL() {
  let greenhouse_id = null;
  let gap_id = null;

  try {
    const url = new URL(window.location.href);

    // 1) query ก่อน
    const qs = new URLSearchParams(url.search);
    greenhouse_id = qs.get("greenhouse_id");
    gap_id = qs.get("gap_id");

    // 2) path
    if (!greenhouse_id || !gap_id) {
      const parts = url.pathname.split("/").filter(Boolean);

      // .../pdf/:a/:b  หรือ  .../:a/:b/pdf
      const pdfIdx = parts.findIndex((p) => p.toLowerCase() === "pdf");
      if (pdfIdx >= 0) {
        const afterA = parts[pdfIdx + 1];
        const afterB = parts[pdfIdx + 2];
        const beforeA = parts[pdfIdx - 2];
        const beforeB = parts[pdfIdx - 1];
        if (afterA && afterB) {
          greenhouse_id = greenhouse_id ?? afterA;
          gap_id = gap_id ?? afterB;
        } else if (beforeA && beforeB) {
          greenhouse_id = greenhouse_id ?? beforeA;
          gap_id = gap_id ?? beforeB;
        }
      }

      // กันเคสท้ายเป็น .../:a/:b
      if ((!greenhouse_id || !gap_id) && parts.length >= 2) {
        const [a, b] = parts.slice(-2);
        if (a && b) {
          greenhouse_id = greenhouse_id ?? a;
          gap_id = gap_id ?? b;
        }
      }
    }
  } catch {}
  return { greenhouse_id, gap_id };
}

export default function PDFDownloadOnly() {
  const [{ greenhouse_id, gap_id }] = useState(getIdsFromURL());
  const [data, setData] = useState(null); // เก็บหลัง normalize แล้ว
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // ขนาดของ host ที่ซ่อน (responsive) เพื่อให้กราฟที่แคปเจอร์ปรับตามหน้าจอ
  const [hostSize, setHostSize] = useState(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 980;
    const maxW = w <= 480 ? 420 : 980;               // เล็กลงสำหรับมือถือ
    const width = Math.min(maxW, Math.max(300, w - 24));
    const height = Math.round(width * 0.5);          // สูงขึ้นนิดให้อ่านง่ายบนมือถือ
    return { width, height };
  });

  const hostRef = useRef(null);

  // แจ้งว่า Recharts พร้อม (รอ svg)
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

  // ปรับขนาด host เมื่อรีไซซ์หน้าจอ (ทำ responsive สำหรับกราฟที่ซ่อน)
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

  // โหลดข้อมูลล่วงหน้า
  useEffect(() => {
    if (!greenhouse_id || !gap_id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await clientMo.get(
          `/api/farmer/report/export?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`
        );
        const parsed = unwrap(res);
        const norm = normalizePayload(parsed);
        setData(norm);
      } catch (e) {
        console.error(e);
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [greenhouse_id, gap_id]);

  // ช่วงเวลาให้กราฟ (ใช้ data.dataForm ที่ normalize แล้ว)
  const range = useMemo(() => {
    if (!data?.dataForm) return null;
    const st = toMs(data.dataForm.date_plant);
    const et = endOfDayLocal2359(data.dataForm.date_harvest || new Date().toISOString());
    return st && et && et >= st ? { st, et } : null;
  }, [data]);

  // ดาวน์โหลด
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
        console.log("payload จาก API:", payload);
        alert("ไม่พบข้อมูลสำหรับสร้าง PDF");
        return;
      }

      // ExportPDF คาดหวัง farmer เป็น array
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

  return (
    <>
      {/* CSS แบบ responsive + mobile-first */}
      <style>{`
        :root { --pad: 16px; }
        .pdf-wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #f7faf9;
          padding: max(env(safe-area-inset-top), 12px)
                   max(env(safe-area-inset-right), 12px)
                   max(env(safe-area-inset-bottom), 12px)
                   max(env(safe-area-inset-left), 12px);
        }
        .pdf-card {
          width: 100%;
          max-width: 560px;
          background: #fff;
          border: 1px solid #e6efe9;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 20px rgba(0,0,0,.06);
          text-align: center;
        }
        .pdf-title {
          margin: 4px 0 12px;
          font-size: clamp(18px, 4.8vw, 24px);
          line-height: 1.35;
        }
        .pdf-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;                 /* ปุ่มเต็มความกว้างบนมือถือ */
          height: 54px;                /* touch target >= 48px */
          padding: 0 16px;
          border: 0;
          border-radius: 12px;
          font-size: clamp(15px, 4vw, 16px);
          font-weight: 800;
          letter-spacing: .2px;
          color: #fff;
          background: #1db954;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(0,0,0,.18);
          transition: transform .06s ease, box-shadow .12s ease, opacity .2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .pdf-btn:active {
          transform: translateY(1px) scale(0.995);
          box-shadow: 0 6px 16px rgba(0,0,0,.16);
        }
        .pdf-btn[disabled] {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .pdf-note {
          margin-top: 10px;
          color: #6a7a71;
          font-size: clamp(13px, 3.6vw, 14px);
        }

        /* -------- breakpoints -------- */
        @media (max-width: 480px) {
          .pdf-card {
            max-width: 92vw;
            padding: 16px;
            border-radius: 14px;
          }
          .pdf-title { margin-bottom: 10px; }
        }
        @media (max-width: 360px) {
          .pdf-card { padding: 14px; border-radius: 12px; }
          .pdf-btn { height: 50px; }
        }
        @media (min-width: 641px) {
          /* ปุ่มกลับมาเป็นกว้างพอเหมาะบนจอใหญ่ */
          .pdf-btn { width: auto; min-width: 220px; }
        }
        @media (min-width: 1024px) {
          .pdf-card { max-width: 640px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pdf-btn { transition: none; }
        }
      `}</style>

      <div className="pdf-wrap">
        {/* host กราฟซ่อน เพื่อให้ ExportPDF จับภาพกราฟได้ (ถ้ามี device_id) */}
        <div
          ref={hostRef}
          style={{
            position: "fixed",
            left: -10000,
            top: 0,
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

        <div className="pdf-card">
          <h1 className="pdf-title">ดาวน์โหลดรายงาน GAP</h1>
          <button
            className="pdf-btn"
            disabled={downloading || loading}
            onClick={handleDownload}
          >
            {downloading ? "กำลังสร้างไฟล์..." : "ดาวน์โหลด PDF"}
          </button>
          {loading && <div className="pdf-note">กำลังเตรียมข้อมูล…</div>}
        </div>
      </div>
    </>
  );
}
