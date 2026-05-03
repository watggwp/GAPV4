
const RoyalGapEnv = {
    access_type : {
        doctor : 1,
        farmer : 2
    },
    url_line : {
        get_greenhouse : `https://liff.line.me/${process.env.REACT_APP_LINE_FORM}`
    },
    fields : {
        name_plant : "ชนิดพืช" ,
        generation : "รุ่นที่ปลูก" ,
        date_glow : "วันที่เพราะกล้า" ,
        date_plant : "วันที่ปลูก",
        posi_w : "ระยะการปลูก ความกว้าง",
        posi_h : "ระยะการปลูก ความยาว",
        qty : "จำนวนต้น",
        area : "พื้นที่",
        date_harvest : "วันที่คาดว่าจะเก็บเกี่ยว",
        system_glow : "รูปแบบการปลูก",
        water : "แหล่งน้ำ",
        water_flow : "วิธีการให้น้ำ",
        history : "ประวัติการใช้พื้นที่",
        insect : "โรคและแมลงที่พบ",
        qtyInsect : "ปริมาณการเกิดโรค และแมลงที่พบ",
        seft : "การป้องกัน กำจัด",
    }
}

module.exports = RoyalGapEnv