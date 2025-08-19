// src/type/deviceTypes.ts
export const deviceTypes = {
    weather: {
        label: "Weather Station",
        api_endpoint: `${import.meta.env.VITE_GAP_PORT}/api/sensor/weather-station`,
        fields: ["temperature", "humidity", "light", "pressure"],
    },
    greenhouse: {
        label: "Greenhouse",
        api_endpoint: `${import.meta.env.VITE_GAP_PORT}/api/sensor/weather-greenhouse`,
        fields: ["temperature", "humidity", "light", "soil_temperature", "soil_humidity", "pressure"],
    },
    pump: {
        label: "Pump",
        api_endpoint: "",
        fields: [],
    },
} as const;

export type DeviceTypeKey = keyof typeof deviceTypes;