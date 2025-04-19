class DateGAP extends Date {
    getDayRangeFromNow(daysAgo = 0) {
        const now = new Date();

        const targetDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - daysAgo,
            23, 59, 59, 999
        );

        return {
            now: now,
            dayAgo: targetDate
        }
    }

    /**
     * 
     * @param format string
     *  - DD : Day
     *  - MM : Mount
     *  - YYYY : Year
     *  - HH : Hours
     *  - II : Minute
     *  - SS : Second
     */
    format2Str(format) {
        const year = this.getFullYear()
        const mount = this.getMonth()
        const day = this.getDate()

        const hours = this.getHours()
        const minute = this.getMinutes()
        const second = this.getSeconds()

        return format
            .replaceAll("DD" , day.toString().padStart(2 , "0"))
            .replaceAll("MM" , (mount + 1).toString().padStart(2 , "0"))
            .replaceAll("YYYY" , year.toString().padStart(2 , "0"))
            .replaceAll("HH" , hours.toString().padStart(2 , "0"))
            .replaceAll("II" , minute.toString().padStart(2 , "0"))
            .replaceAll("SS" , second.toString().padStart(2 , "0"))
    }

}

export default DateGAP