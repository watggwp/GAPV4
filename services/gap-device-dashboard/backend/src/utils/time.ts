import dayjs from 'dayjs'
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(tz);
export function shouldLogDaily(): boolean {
    const nowTH = dayjs().tz('Asia/Bangkok');
    const hhmm = nowTH.format('HH:mm');
    return ['23:50', '23:55', '00:00'].includes(hhmm);
}

export function parseUtc(iso: string): Date {
    return new Date(iso);           // เก็บเป็น UTC Date
}