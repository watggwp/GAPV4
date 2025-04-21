import * as React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

dayjs.locale('th');

export default function DatePickerApp({ label , value , onChange , onAccept , onClose , minDate , sxTextField }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker 
            label={label}
            value={value ? dayjs(value) : null}
            onChange={onChange}
            onAccept={onAccept}
            onClose={onClose}
            slotProps={{
              textField : {
                size : "small",
                sx : sxTextField
              },
            }}
            minDate={minDate ? dayjs(minDate) : undefined}
        />
    </LocalizationProvider>
  );
}