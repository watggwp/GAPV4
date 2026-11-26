const fs = require('fs')
const path = require('path')
const readline = require("readline")

// jsonEnv.json เก็บค่าจริง (ไม่ commit) ถ้ายังไม่มีให้เริ่มจาก template
const jsonEnvPath = path.join(__dirname, "jsonEnv.json")
const jsonTemplatePath = path.join(__dirname, "jsonEnv.example.json")
const envPath = path.join(__dirname, "..", ".env")

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const fileJson = fs.readFileSync(fs.existsSync(jsonEnvPath) ? jsonEnvPath : jsonTemplatePath)
const readJson = JSON.parse(fileJson)

const JsonToArr = Object.entries(readJson)
let indexCurrent = 0

const inputValue = async () => {
    return await new Promise((resole , reject)=>{
        rl.question(`${JsonToArr[indexCurrent][0]} : `, (data) => {
            readJson[JsonToArr[indexCurrent][0]] = data.trim()
    
            if(indexCurrent == JsonToArr.length - 1) {
                resole(false)
            }
            else {
                rl.write("")
                indexCurrent++;
                resole(true)
            }
        })
        rl.write(JsonToArr[indexCurrent][1])
    })
}

const recovRead = async () => {
    const result = await inputValue()

    if(result) recovRead();
    else {
        const ToArray = Object.entries(readJson)
        const DataFile = ToArray.map(val=>val.join(" = ")).join("\n")

        if(fs.existsSync(envPath)) {
            rl.question(`Write Replace File (Yes : N) : `, (data) => {
                if(data.toUpperCase() === "Y") {
                    fs.writeFileSync(jsonEnvPath , JSON.stringify(readJson , null , 2))
                    fs.writeFileSync(envPath , DataFile)
                    console.log("Complete Install")
                } else console.log("Cancel Install");
                rl.close();
            })
        } else {
            fs.writeFileSync(jsonEnvPath , JSON.stringify(readJson , null , 2))
            fs.writeFileSync(envPath , DataFile)
            console.log("Complete Install")
            rl.close()
        }
    }
}

recovRead()