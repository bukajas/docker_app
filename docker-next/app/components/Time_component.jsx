import * as React from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { TextField, Grid } from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/en';

dayjs.extend(customParseFormat);
dayjs.locale('en');

function DateTimeForm({ onStartDateChange, onEndDateChange, initialStartDate, initialEndDate }) {
  const [startDate, setStartDate] = React.useState(initialStartDate || dayjs());
  const [endDate, setEndDate] = React.useState(initialEndDate || dayjs().add(1, 'hour'));

  const handleStartDateChange = (newStartDate) => {
    setStartDate(newStartDate);
    if (onStartDateChange) {
      onStartDateChange(newStartDate);
    }
  };

  const handleEndDateChange = (newEndDate) => {
    setEndDate(newEndDate);
    if (onEndDateChange) {
      onEndDateChange(newEndDate);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Grid >
        <Grid item xs={12} sm={6}>
          <DateTimePicker
            label="Start Date and Time"
            value={startDate}
            onChange={handleStartDateChange}
            renderInput={(params) => <TextField {...params} />}
            ampm={false}
            views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
            maxDateTime={endDate}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DateTimePicker
            label="End Date and Time"
            value={endDate}
            onChange={handleEndDateChange}
            renderInput={(params) => <TextField {...params} />}
            ampm={false}
            views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
            minDateTime={startDate}
          />
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
}

export default DateTimeForm;
