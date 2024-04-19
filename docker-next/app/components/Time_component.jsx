import * as React from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { TextField, Grid, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/en';
dayjs.extend(customParseFormat);
dayjs.locale('en');




function DateTimeForm({ onStartDateChange, onEndDateChange, initialStartDate, initialEndDate }) {
  const [startDate, setStartDate] = React.useState(dayjs().subtract(1, 'minute')); 
  const [endDate, setEndDate] = React.useState(dayjs());
  const [range, setRange] = React.useState(1);
  const [rangeUnit, setRangeUnit] = React.useState('minutes');
  const [mode, setMode] = React.useState('relative');

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

  const updateDates = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    onStartDateChange(start);
    onEndDateChange(end);
  };

  const handleModeToggle = () => {
    const newMode = mode === 'absolute' ? 'relative' : 'absolute';
    setMode(newMode);
    if (newMode === 'relative') {
      updateDates(dayjs().subtract(range, rangeUnit), dayjs());
    }
  };

  const handleRangeChange = (e) => {
    const newRange = parseInt(e.target.value, 10);
    setRange(newRange);
    updateDates(dayjs().subtract(newRange, rangeUnit), dayjs());
  };

  const handleRangeUnitChange = (e) => {
    const newUnit = e.target.value;
    setRangeUnit(newUnit);
    updateDates(dayjs().subtract(range, newUnit), dayjs());
  };







  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Button onClick={handleModeToggle} style={{ margin: '10px' }}>
            Switch to {mode === 'absolute' ? 'Relative' : 'Absolute'} Time
          </Button>
        </Grid>
        {mode === 'absolute' ? (
          <>
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Start Date and Time"
                value={startDate}
                onChange={(newStartDate) => updateDates(newStartDate, endDate)}
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
                onChange={(newEndDate) => updateDates(startDate, newEndDate)}
                renderInput={(params) => <TextField {...params} />}
                ampm={false}
                views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
                minDateTime={startDate}
              />
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={6}>
              <TextField
                label="Range"
                variant="outlined"
                fullWidth
                type="number"
                value={range}
                onChange={handleRangeChange}
                sx={{ mt: 2 }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl variant="outlined" fullWidth sx={{ mt: 2 }}>
                <InputLabel id="range-unit-label">Unit</InputLabel>
                <Select
                  labelId="range-unit-label"
                  id="range-unit-select"
                  value={rangeUnit}
                  onChange={handleRangeUnitChange}
                  label="Unit"
                >
                  <MenuItem value="seconds">Seconds</MenuItem>
                  <MenuItem value="minutes">Minutes</MenuItem>
                  <MenuItem value="hours">Hours</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </>
        )}
      </Grid>
    </LocalizationProvider>
  );
}

export default DateTimeForm;