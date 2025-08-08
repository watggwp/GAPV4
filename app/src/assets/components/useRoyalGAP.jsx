import { useEffect, useRef, useState } from "react"

export function useDebounce(timestamp , debounceTime) {
    const [ debounce , setDebounce ] = useState(0)
    
    const intervalDebounce = useRef(0)
    useEffect(() => {
        const now_time = new Date()
        const last_time = new Date(timestamp)

        const debounceCalculate = Math.ceil((now_time - last_time) / 1000)
        if(debounceCalculate && debounceCalculate <= debounceTime) {
            setDebounce(debounceTime - debounceCalculate)

            intervalDebounce.current = setInterval(() => {
                setDebounce((prev) => prev - 1)
            } , 1000)
        }

        return(() => 
            clearInterval(intervalDebounce.current)
        )
    } , [debounceTime, timestamp])

    return debounce
}