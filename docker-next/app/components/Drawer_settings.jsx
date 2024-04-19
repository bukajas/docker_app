import React, { useState ,useEffect} from 'react';
import { Drawer,Box,Tabs,Tab, Checkbox, FormControlLabel, Accordion, AccordionSummary, AccordionDetails, Typography, Button } from '@mui/material';
import {stringToDictionary,aggregateDataDynamically} from '../components/Functions'


function filterDataBySelections(dataKeys, selectionsFromDrawer) {
    // Filter each data item
    return dataKeys.filter(item => {
        const measurement = item._measurement;
        console.log(measurement)
        // Check if there are selections for this measurement
        if (!selectionsFromDrawer[measurement]) {
            return false;  // No selections for this measurement type, filter it out
        }

        // Check each selected key in this measurement
        return Object.keys(selectionsFromDrawer[measurement]).every(key => {
            // Check if the item's key value matches any of the selected values for this key
            const selectedValues = selectionsFromDrawer[measurement][key];
            return selectedValues.includes(item[key]);
        });
    });
}


function RightDrawer({data, onSelectionsChange}) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState(0);
    const [values,setValues] = useState({})
    const [dataKeys,setDataKeys] = useState(null)
    const [selectedButtons, setSelectedButtons] = useState({});
    const [selections, setSelections] = useState({});

    useEffect(() => {
        if(data){
            setValues(data);
            const keys = Object.keys(data);
            const dictionary = stringToDictionary(keys);
            setDataKeys(aggregateDataDynamically(dictionary));
            if(dictionary){
                console.log(filterDataBySelections(dictionary, selections))
                setSelectedButtons(filterDataBySelections(dictionary, selections));
            }
              }
      }, [data]);

    useEffect(() => {
        onSelectionsChange(selections); // Pass selections up whenever it changes
    }, [selections]);


    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setIsOpen(open);
    };

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };



    const handleToggle = (measurement, key, value) => {
        const currentSelections = selections[measurement]?.[key] || [];
        const newSelections = currentSelections.includes(value)
          ? currentSelections.filter(v => v !== value)
          : [...currentSelections, value];
    
        setSelections({
          ...selections,
          [measurement]: {
            ...selections[measurement],
            [key]: newSelections
          }
        });
      };

    const tabContent = (index) => {
        switch (index) {
            case 0:
                return <Typography>This is the Selected content.</Typography>;
            case 1:
                return (
                    <div>
                        {selectedButtons.map(item => (
                            <div key={item.host + item._measurement}>
                                Measurement: {item._measurement} - Host: {item.host}
                                {/* Render other properties as needed */}
                            </div>
                        ))}
                    </div>
                );
            case 2:
                return (
                    <Box>
                    {dataKeys.map((measurement) => (
                      <Box key={measurement._measurement} margin={2} padding={2} border={1} borderRadius={2}>
                        <Typography variant="h6">{measurement._measurement}</Typography>
                        {Object.keys(measurement).filter(key => key !== '_measurement').map(key => (
                          <Accordion key={key}>
                            <AccordionSummary>
                              <Typography>{key}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              {measurement[key].map(value => (
                                <FormControlLabel
                                  key={value}
                                  control={
                                    <Checkbox
                                      checked={selections[measurement._measurement]?.[key]?.includes(value) || false}
                                      onChange={() => handleToggle(measurement._measurement, key, value)}
                                    />
                                  }
                                  label={value.toString()}
                                />
                              ))}
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Box>
                    ))}
                    <Button variant="contained" onClick={() => console.log(selections)}>Print Selections</Button>
                  </Box>
                );
              
                    
            default:
                return <Typography>Unknown Tab</Typography>;
        }
    };

    return (
        <div>
            <Button onClick={toggleDrawer(true)}>Open Right Drawer</Button>
            <Drawer
                anchor='right'
                open={isOpen}
                onClose={toggleDrawer(false)}
                sx={{ width: '30%', flexShrink: 0 }}
                PaperProps={{ style: { width: '30%' } }}
            >
                <Box
                    sx={{ width: '100%', height: '100%' }}
                    role="presentation"
                    onKeyDown={toggleDrawer(false)}
                >
                    <Tabs
                        value={selectedTab}
                        onChange={handleTabChange}
                        aria-label="Tab selection"
                        variant="fullWidth"
                    >
                        <Tab label="Selected" />
                        <Tab label="Query" />
                        <Tab label="Data" />
                    </Tabs>
                    <Box sx={{ p: 3 }}>
                        {tabContent(selectedTab)}
                    </Box>
                </Box>
            </Drawer>
        </div>
    );
}

export default RightDrawer;
