import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';

export default function setupDayjs() {
    dayjs.extend(calendar);
}
