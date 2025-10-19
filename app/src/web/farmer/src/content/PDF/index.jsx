import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { ExportPDF, buildExportData } from "../../../../../assets/js/Export";

export default function PDFIndexMobileFriendly() {
  const { greenhouse_id, gap_id } = useParams();
  const [pdfUrlRaw, setPdfUrlRaw] = useState("");
  const [zoom, setZoom] = useState("page-width"); // มือถือเริ่มที่พอดีกว้าง
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ตรวจจับว่าเป็น mobile (หยาบๆ)
  const isMobile = typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // src ของ viewer (รองรับ #zoom=…)
  const pdfSrc = useMemo(() => {
    if (!pdfUrlRaw) return "";
    const z = typeof zoom === "number" ? zoom : zoom; // "page-width" หรือเปอร์เซ็นต์
    // page=1, view=FitH ยังช่วยบางเบราว์เซอร์
    return `${pdfUrlRaw}#zoom=${z}&page=1`;
  }, [pdfUrlRaw, zoom]);

  useEffect(() => {
    let alive = true;
    let revoke = "";
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await clientMo.get(
          `/api/farmer/report/export?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`
        );
        const parsed = typeof res === "string" ? JSON.parse(res) : res;
        const built = buildExportData(parsed);
        const url = await ExportPDF(built, { mode: "url" }); // ได้ Blob URL
        revoke = url;
        if (!alive) return;
        setPdfUrlRaw(url);
      } catch (e) {
        console.error(e);
        setErr("ไม่สามารถสร้างไฟล์ PDF ได้");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [greenhouse_id, gap_id]);

  const filename = `${new Date().getDate()}_${new Date().getMonth()}_${new Date().getFullYear()}.pdf`;

  const zoomIn  = () => setZoom((z) => (typeof z === "number" ? Math.min(z + 25, 400) : 125));
  const zoomOut = () => setZoom((z) => (typeof z === "number" ? Math.max(z - 25, 50)  : 100));
  const fitWidth = () => setZoom("page-width");
  const z100     = () => setZoom(100);

  if (loading) return <div style={styles.page}>⏳ กำลังเตรียมไฟล์…</div>;
  if (err)      return <div style={{ ...styles.page, color: "crimson" }}>{err}</div>;
  if (!pdfSrc)  return <div style={styles.page}>❌ ไม่มีไฟล์สำหรับแสดง</div>;

  // viewer ใช้ <iframe> เป็นหลัก; ถ้า mobile ฝังไม่ได้ ให้ผู้ใช้เปิดแท็บใหม่
  const Viewer = (
    <iframe
      title="GAP PDF"
      src={pdfSrc}
      style={styles.iframe}
      // บางมือถือจะไม่ยอมโหลดภายใน container ถ้า sandbox; ไม่ระบุ sandbox
    />
  );

  return (
    <div style={styles.wrap}>
      {/* Toolbar (touch-friendly + safe-area) */}
      <div style={styles.toolbar}>
        <a href={pdfUrlRaw} download={filename} style={styles.primaryBtn}>
          ดาวน์โหลด PDF
        </a>

        <div style={styles.tools}>
          <button onClick={zoomOut}  style={styles.toolBtn} aria-label="Zoom out">−</button>
          <button onClick={z100}     style={styles.toolBtn}>100%</button>
          <button onClick={fitWidth} style={styles.toolBtn}>พอดีกว้าง</button>
          <button onClick={zoomIn}   style={styles.toolBtn} aria-label="Zoom in">＋</button>

          {/* ปุ่ม fallback เปิดเต็มจอ/แท็บใหม่ (ช่วยมือถือที่ฝัง PDF ไม่ได้) */}
          {isMobile && (
            <a href={pdfUrlRaw} target="_blank" rel="noreferrer" style={styles.toolBtnLink}>
              เปิดเต็มจอ
            </a>
          )}
        </div>
      </div>

      {/* Viewer area */}
      <div style={styles.viewer}>
        {Viewer}
      </div>
    </div>
  );
}

/* ===== styles (inline เพื่อก๊อปวางง่าย) ===== */
const styles = {
  wrap: {
    height: "100dvh",                 // สูงเท่าหน้าจอจริงบนมือถือ
    display: "flex",
    flexDirection: "column",
    background: "#f1f5f9",
  },
  toolbar: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px",
    paddingTop: "calc(env(safe-area-inset-top) + 12px)", // รองรับ notch
    background: "#e7f5ec",
    borderBottom: "1px solid #e2e8f0",
  },
  primaryBtn: {
    background: "#22c55e",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: 700,
    lineHeight: "24px",
    minHeight: 44, // touch target
  },
  tools: {
    marginLeft: "auto",
    display: "flex",
    gap: 8,
  },
  toolBtn: {
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    minWidth: 64,
    minHeight: 44, // touch target
    fontWeight: 600,
    cursor: "pointer",
  },
  toolBtnLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    minWidth: 84,
    minHeight: 44,
    fontWeight: 600,
    textDecoration: "none",
    color: "#0f172a",
  },
  viewer: {
    flex: 1,
    // safe area bottom เผื่อมี gesture bar
    paddingBottom: "env(safe-area-inset-bottom)",
    background: "#fff",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
    background: "#fff",
  },
  page: { padding: 16 },
};