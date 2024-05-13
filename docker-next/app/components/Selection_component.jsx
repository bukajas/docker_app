import { useState, useEffect } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Collapse from '@mui/material/Collapse';
import moment from 'moment';

export default function DynamicCollapsibleTabs({ onUpdate, startDate, endDate }) {
  const [data, setData] = useState({ measurements_with_tags: {} });
  const [checkedCategories, setCheckedCategories] = useState({});
  const [tagValues, setTagValues] = useState({});
  const [selectedTab, setSelectedTab] = useState(0);

  const fetchData = async () => {
    try {     
      
      const token = localStorage.getItem('token');
      const startMoment = moment(startDate);
      const endMoment = moment(endDate);

      // Check for valid, non-empty, and correctly ordered dates
      // if (!startMoment.isValid() || !endMoment.isValid() || startMoment.isSame(endMoment) || startMoment.isAfter(endMoment)) {
      if (!startMoment.isValid() || !endMoment.isValid() || startMoment.isAfter(endMoment) || startDate.isSame(endDate)) {
        return;
      }


      const response = await fetch(`https://localhost:8000/filtered_measurements_with_tags?start=${startDate.format('YYYY-MM-DD HH:mm:ss')}&end=${endDate.format('YYYY-MM-DD HH:mm:ss')}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setData(result.measurements_with_tags);
    } catch (error) {
      console.error('There was an error fetching the measurements:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  useEffect(() => {
    const combinedData = {};
    Object.keys(checkedCategories).forEach(category => {
      if (checkedCategories[category]) {
        combinedData[category] = {};
        data[category]?.forEach(item => {
          const key = `${category}-${item}`;
          if (tagValues[key]) {
            combinedData[category][item] = tagValues[key];
          }
        });
      }
    });
    onUpdate && onUpdate(combinedData);
  }, [checkedCategories, tagValues]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleCategoryCheck = (category) => {
    setCheckedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleInputChange = (category, item, value) => {
    const key = `${category}-${item}`;
    setTagValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div style={{ margin: '20px', backgroundColor: '#fff', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        aria-label="data tabs"
        variant="scrollable"
        scrollButtons="auto"
      >
        {data && Object.keys(data).map((category, index) => (
          <Tab label={category} id={`tab-${index}`} key={category} />
        ))}
        <Tab label="Collapse All" id="collapse-tab" />  {/* Static tab for collapsing */}
      </Tabs>
      {data && Object.keys(data).map((category, index) => (
        <Collapse in={selectedTab === index} timeout="auto" unmountOnExit key={category}>
          <div style={{ padding: '10px' }}>
            <FormControlLabel
              control={<Checkbox checked={!!checkedCategories[category]} onChange={() => handleCategoryCheck(category)} />}
              label={`Toggle ${category}`}
            />
            {checkedCategories[category] && (
              <div style={{ marginLeft: 20 }}>
                {data[category].map((item) => (
                  <TextField
                    fullWidth
                    key={`${category}-${item}`}
                    label={item}
                    value={tagValues[`${category}-${item}`] || ''}
                    onChange={(e) => handleInputChange(category, item, e.target.value)}
                    variant="outlined"
                    margin="dense"
                  />
                ))}
              </div>
            )}
          </div>
        </Collapse>
      ))}
    </div>
  );
}
