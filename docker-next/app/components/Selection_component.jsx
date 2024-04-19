import { useState, useEffect } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';

export default function DynamicDropdownMenu({ onUpdate, startDate, endDate }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [data, setData] = useState({ measurements_with_tags: {} });
  const [checkedCategories, setCheckedCategories] = useState({});
  const [tagValues, setTagValues] = useState({}); // This will store input values for each tag


  
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/filtered_measurements_with_tags?start=${startDate.format('YYYY-MM-DD HH:mm:ss')}&end=${endDate.format('YYYY-MM-DD HH:mm:ss')}`, {
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
    }, [startDate,endDate]);

    useEffect(() => {
      fetchData();
    }, []);

  useEffect(() => {
    // Function to combine checked categories and tag values
    const combinedData = {};
    Object.keys(checkedCategories).forEach(category => {
      if (checkedCategories[category]) {  // Check if category is checked
        combinedData[category] = {};
        data[category]?.forEach(item => {
          const key = `${category}-${item}`;
          if (tagValues[key]) {
            combinedData[category][item] = tagValues[key];
          }
        });
      }
    });
    if (onUpdate) {  // Only call onUpdate if it's a function
      onUpdate(combinedData);}
  }, [checkedCategories, tagValues]);  // React to changes in these states

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
    <div>
      <Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
        Open Menu
      </Button>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {data && Object.keys(data).map((category) => (
          <MenuItem key={category}>
            <FormControlLabel
              control={<Checkbox checked={!!checkedCategories[category]} onChange={() => handleCategoryCheck(category)} />}
              label={category}
            />
            {checkedCategories[category] && (
              <div style={{ marginLeft: 20 }}>
                {data[category].map((item) => (
                  <div key={`${category}-${item}`} style={{ marginTop: 8 }}>
                    <TextField
                      fullWidth
                      label={item}
                      value={tagValues[`${category}-${item}`] || ''}
                      onChange={(e) => handleInputChange(category, item, e.target.value)}
                      variant="outlined"
                    />
                  </div>
                ))}
              </div>
            )}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}
