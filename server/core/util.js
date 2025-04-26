

class RoyalGapUtil {
    static getDeviceData(deviceType) {
        switch(deviceType) {
            case "pump" :
                return {
                    table : "sensor_pump_greenhouse",
                    locationTable : "greenhouse_id"
                }
            case "weather_greenhouse" :
                return {
                    table : "sensor_weather_greenhouse",
                    locationTable : "greenhouse_id"
                }
            case "weather_station" :
                return {
                    table : "sensor_weather_station",
                    locationTable : "station_signature"
                }
            default :
                return {
                    table : "",
                    locationTable : ""
                }
        }
    }
}

module.exports = RoyalGapUtil