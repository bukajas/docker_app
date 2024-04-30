import { useState, useEffect } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';








export default function DynamicDropdownMenu() {
  const data = {
    "measurements_with_tags": {
      "coil_list": [
        "host",
        "masterID",
        "modbusType",
        "protocol",
        "slaveID",
        "unit"
      ],
      "vibration": [
        "NetworkType",
        "VendorID",
        "host",
        "protocol",
        "speed",
        "unit"
      ]
    }
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const [checkedCategories, setCheckedCategories] = useState({});
  const [tagValues, setTagValues] = useState({}); // This will store input values for each tag

  useEffect(() => {
    const output = {};
    Object.keys(checkedCategories).forEach(category => {
      if (checkedCategories[category]) {
        output[category] = data.measurements_with_tags[category].reduce((acc, item) => {
          if (tagValues[`${category}-${item}`]) {
            acc[item] = tagValues[`${category}-${item}`];
          }
          return acc;
        }, {});
      }
    });
    // console.log(JSON.stringify(output, null, 2));  // Automatically printing to console
  }, [checkedCategories, tagValues]); // Dependency array includes tagValues

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
        {Object.keys(data.measurements_with_tags).map((category) => (
          <MenuItem key={category}>
            <FormControlLabel
              control={<Checkbox checked={!!checkedCategories[category]} onChange={() => handleCategoryCheck(category)} />}
              label={category}
            />
            {checkedCategories[category] && (
              <div style={{ marginLeft: 20 }}>
                {data.measurements_with_tags[category].map((item) => (
                  <div key={`${category}-${item}`} style={{ marginTop: 8 }}> {/* Ensures vertical stacking */}
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
