import React, { useState ,useEffect} from 'react';
import { Drawer,Box,Tabs,Tab, Checkbox, FormControlLabel, Accordion, AccordionSummary, AccordionDetails, Typography, Button,Paper } from '@mui/material';
import {stringToDictionary,aggregateDataDynamically} from '../components/Functions'
import DynamicDropdownMenu from '../components/Selection_component'
import DateTimeForm from '../components/Time_component'
import '../../styles.css';


function filterDataBySelections(dataKeys, selectionsFromDrawer) {
    // Filter each data item
    return dataKeys.filter(item => {
        const measurement = item._measurement;
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
      // console.log(selections,data)
        if(data){

            const keys = Object.keys(data);
            const dictionary = stringToDictionary(keys);
          
            setDataKeys(aggregateDataDynamically(dictionary));
            if(dictionary){
                setSelectedButtons(filterDataBySelections(dictionary, selections));
            }
              }
      }, [data]);

    useEffect(() => {
        onSelectionsChange(selections); // Pass selections up whenever it changes
    }, [selections]);


    const toggleDrawer = (open) => (event) => {
      // Prevent drawer toggle when keyboard events occur (like typing in inputs)
      if (event && event.type === 'keydown') {
          // You might want to allow toggling the drawer with specific keys, e.g., escape
          if (event.key === 'Escape') {
              setIsOpen(false);
          }
          return; // Prevent other key events from affecting the drawer state
      }
      setIsOpen(open);
  };

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };



    const handleToggle = (measurement, key, value) => {
      const currentSelections = selections[measurement]?.[key] || [];
      // console.log(selections);
      const newSelections = currentSelections.includes(value)
        ? currentSelections.filter(v => v !== value)
        : [...currentSelections, value];
  
      // Prepare updated selections for the current measurement
      const updatedMeasurementSelections = {
        ...selections[measurement],
        [key]: newSelections
      };
  
      // Check and delete any keys with empty lists
      for (const k in updatedMeasurementSelections) {
        if (updatedMeasurementSelections[k].length === 0) {
          delete updatedMeasurementSelections[k];
        }
      }
      
      // Update the entire selections object
      setSelections(prevSelections => ({
        ...prevSelections,
        [measurement]: updatedMeasurementSelections
      }));

  };


    return (
        <div>
            <Button className="custom-button2" onClick={toggleDrawer(true)} style={{ width: '100%' }}>
              Open Right Drawer
            </Button>
            <Drawer
                anchor='right'
                open={isOpen}
                onClose={() => setIsOpen(false)}
                sx={{ width: '30%', flexShrink: 0 }}
                PaperProps={{ style: { width: '30%' } }}
            >
                <Box
                    sx={{ width: '100%', height: '100%' }}
                    role="presentation"
                    onKeyDown={toggleDrawer(false)}
                >
<Box>
                    {dataKeys && dataKeys.map((measurement) => (
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
                    {/* <Box sx={{ p: 3 }}>
                        {tabContent(selectedTab)}
                    </Box> */}
                </Box>
            </Drawer>
        </div>
    );
}

export default RightDrawer;
