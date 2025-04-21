import { useCallback, useState } from "react"
import DatePickerApp from "../../assets/components/DatePicker"

export default function DatePickerAccept({ label , value , onAcceptData , sxTextField , minDate }) {
    const [tempValue, setTempValue] = useState(null)

    const onChange = useCallback((date) => {
        date["$L"] = "th"
        setTempValue(date)
    }, [])

    const onAccept = useCallback(() => {
        if(tempValue) {
            tempValue["$L"] = "th"
            onAcceptData?.(tempValue)
        }
    }, [onAcceptData, tempValue])

    const onClose = useCallback(() => {
        setTempValue(null)
    }, [])

    return(
        <DatePickerApp
            label={label}
            value={tempValue ?? value}
            onChange={onChange}
            onAccept={onAccept}
            onClose={onClose}
            sxTextField={sxTextField}
            minDate={minDate}
        />
    )
}