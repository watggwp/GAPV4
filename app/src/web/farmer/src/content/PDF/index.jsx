// app/src/web/farmer/src/content/PDF/index.jsx
// หน้าแบบมินิมอล: ปุ่ม "ดาวน์โหลด PDF" ปุ่มเดียว ทำงานกับ ExportPDF(download:true)

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import WeatherManagement from "../../../../../assets/components/weather-management";
import { ExportPDF } from "../../../../../assets/js/Export";

/* --------------------- helpers: วันที่/ช่วงเวลา --------------------- */
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

/* --------- ดึง greenhouse_id/gap_id จาก URL (query หรือ path) --------- */
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
        greenhouse_id = greenhouse_id ?? parts[pdfIdx + 1] ?? null;
        gap_id = gap_id ?? parts[pdfIdx + 2] ?? null;
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
  const hostRef = useRef(null); // host กราฟแบบซ่อน เพื่อให้ ExportPDF จับภาพ

  // แจ้ง ExportPDF ว่า Recharts พร้อมแล้ว
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

  // โหลดข้อมูลไว้ล่วงหน้า
  useEffect(() => {
    if (!greenhouse_id || !gap_id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await clientMo.get(
          `/api/farmer/report/export?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`
        );
        let parsed = res && res.data !== undefined ? res.data : res;
        if (typeof parsed === "string") {
          try { parsed = JSON.parse(parsed); } catch {}
        }
        setData(parsed || null);
      } catch (e) {
        console.error(e);
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [greenhouse_id, gap_id]);

  // คำนวณช่วงเวลาให้กราฟ
  const range = useMemo(() => {
    if (!data?.dataForm) return null;
    const st = toMs(data.dataForm.date_plant);
    const et = endOfDayLocal2359(data.dataForm.date_harvest || new Date().toISOString());
    return st && et && et >= st ? { st, et } : null;
  }, [data]);

  // ปุ่มดาวน์โหลด
  const handleDownload = useCallback(async () => {
    if (!greenhouse_id || !gap_id) {
      alert("ขาดพารามิเตอร์ greenhouse_id / gap_id ใน URL");
      return;
    }
    setDownloading(true);
    try {
      // ถ้ารีบกดก่อนโหลด data เสร็จ ให้ดึงซ้ำ
      let payload = data;
      if (!payload) {
        const res = await clientMo.get(
          `/api/farmer/report/export?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`
        );
        payload = res && res.data !== undefined ? res.data : res;
        if (typeof payload === "string") {
          try { payload = JSON.parse(payload); } catch {}
        }
      }
      if (!payload?.dataForm) {
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

  return (
    <div style={styles.wrap}>
      {/* โฮสต์กราฟซ่อน เพื่อให้ ExportPDF จับภาพกราฟได้ (ถ้ามี device_id) */}
      <div ref={hostRef} style={styles.hiddenHost} aria-hidden>
        <div id="weather-chart-export" style={{ width: "100%", height: "100%" }}>
          {data?.device_id && range?.st && range?.et && (
            <WeatherManagement
              endpointData={`/api/sensor/weather-greenhouse/${data.id_farm_house || greenhouse_id}/${data.device_id}`}
              query={{ r: "farmer" }}
              startTime={range.st}
              endTime={range.et}
              columnTimestamp="timestamp"
              columns={[
                { field: "air_temperature",  name: "อุณหภูมิ",       color: "green"  },
                { field: "air_humidity",     name: "ความชื้น",        color: "yellow" },
                { field: "light",            name: "แสง",             color: "orange" },
                { field: "soil_temperature", name: "อุณหภูมิดิน",      color: "red"    },
                { field: "soil_humidity",    name: "ความชื้นดิน",      color: "blue"   },
                { field: "pressure",         name: "ความกดอากาศ",      color: "#4a4573"},
                { field: "batt",             name: "แบตเตอรี่",        color: "red"    },
              ]}
              showTable={false}
            />
          )}
        </div>
      </div>

      {/* UI มินิมอล: ปุ่มเดียว */}
      <button
        style={{ ...styles.btn, ...(downloading || loading ? styles.btnDisabled : {}) }}
        disabled={downloading || loading}
        onClick={handleDownload}
      >
        {downloading ? "กำลังสร้างไฟล์..." : "ดาวน์โหลด PDF"}
      </button>
    </div>
  );
}

/* ------------------------ inline styles ------------------------ */
const styles = {
  wrap: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f7faf9",
    padding: 16,
  },
  btn: {
    height: 56,
    minWidth: 240,
    padding: "0 20px",
    border: 0,
    borderRadius: 14,
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: ".2px",
    color: "#fff",
    background: "#1db954",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(0,0,0,.18)",
  },
  btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
  hiddenHost: {
    position: "fixed",
    left: -10000,
    top: 0,
    width: 980,
    height: 360,
    opacity: 0,
    pointerEvents: "none",
    zIndex: -1,
  },
};
