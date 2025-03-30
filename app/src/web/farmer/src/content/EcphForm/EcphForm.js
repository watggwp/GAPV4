import React, { useCallback, useEffect, useState } from "react";
import "./EcphForm.scss";
import RequestAPI from "../../../../../assets/js/requestAPI";

const EcphForm = ({ setBody, setPage, houseID, formplantID, liff }) => {
  const [ecValue, setEcValue] = useState("");
  const [phValue, setPhValue] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await RequestAPI.post("/api/farmer/ecph/history",{
        id_formplant : formplantID,
      })
      setHistory(data);
    } catch (err) {
      console.error("Error loading history:", err);
    }
  } , [])
  

  const handleSubmit = useCallback(async () => {
    if (!ecValue || !phValue) {
      alert("กรุณากรอกค่า EC และ pH ให้ครบ");
      return;
    }

    try {
      setLoading(true);
      const { data } = await RequestAPI.post("/api/farmer/ecph/save", {
        id_formplant : formplantID,
        ec_value: ecValue,
        ph_value: phValue,
      })
      

      if (data.success) {
        alert("บันทึกเรียบร้อยแล้ว");
        setEcValue("");
        setPhValue("");
        fetchHistory();
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
      console.error(err);
    } finally {
      setLoading(false);
    }
  } , [ecValue, fetchHistory, phValue])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    setPage("EcphForm")
  } , [setPage])

  return (
    <section id="ecph-form-page">
      <div className="head">
        <div className="return" onClick={() => setPage("menu")}>
          <svg fill="#000000" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                        <g fillRule="evenodd">
                            <path d="M1052 92.168L959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z" />
                            <path d="M1920 92.168L1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z" />
                        </g>
                    </svg>
        </div>
        <span>บันทึกค่า EC / pH</span>
      </div>

      <div className="form">
        <div className="data-content">
          <div className="frame-content">
            <div className="step">
              <div className="body">
                <div className="row">
                  <label className="frame-textbox colume">
                    <span>ค่า EC</span>
                    <input
                      type="number"
                      step="0.01"
                      value={ecValue}
                      onChange={(e) => setEcValue(e.target.value)}
                      placeholder="กรอกค่า EC"
                    />
                  </label>
                </div>

                <div className="row">
                  <label className="frame-textbox colume">
                    <span>ค่า pH</span>
                    <input
                      type="number"
                      step="0.01"
                      value={phValue}
                      onChange={(e) => setPhValue(e.target.value)}
                      placeholder="กรอกค่า pH"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="step">
              <div className="body">
                <div className="row">
                  <label className="frame-textbox colume">
                    <span>ข้อมูลที่บันทึกไว้</span>
                    <div className="full" style={{ width: "100%", marginTop: "0.5em" }}>
                      {history.length === 0 ? (
                        <p style={{ color: "#777" }}>ยังไม่มีข้อมูล</p>
                      ) : (
                        <ul style={{ width: "100%" }}>
                          {history.map((item, idx) => (
                            <li key={idx}>
                              📅 {new Date(item.timestamp).toLocaleString("th-TH")}<br />
                              EC: {parseFloat(item.ec_value).toFixed(2)} | pH: {parseFloat(item.ph_value).toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bt">
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default EcphForm;
