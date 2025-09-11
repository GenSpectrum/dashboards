import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import isoWeek from "dayjs/plugin/isoWeek";

export default function setupDayjs() {
    dayjs.extend(calendar);
    dayjs.extend(isoWeek);
}
