import React, { useState ,useEffect} from 'react';


export function stringToDictionary(str) {
    const dictionaries = [];

    if (str){
        str.map((dict,index) => {
    const jsonString = dict.replace(/'/g, '"');
    const dictionary = JSON.parse(jsonString);
    dictionaries.push(dictionary);
        }          
        )
    }
    return dictionaries;
}

export const aggregateDataDynamically = (data) => {
    const measurementMap = {};
  
    data.forEach(item => {
      const measurement = item._measurement;
      if (!measurementMap[measurement]) {
        measurementMap[measurement] = {};
      }
  
      // Iterate over each property in the item
      for (const [key, value] of Object.entries(item)) {
        // Skip these specific fields to not aggregate
        if (['result', '_field', '_measurement'].includes(key)) continue;
        
        // Initialize the set if not already present
        if (!measurementMap[measurement][key]) {
          measurementMap[measurement][key] = new Set();
        }
        measurementMap[measurement][key].add(value);
      }
    });
  
    // Convert Sets to Arrays and prepare the final list
    return Object.keys(measurementMap).map(key => {
      const entry = { _measurement: key };
      for (const [subKey, subValue] of Object.entries(measurementMap[key])) {
        entry[subKey] = Array.from(subValue);
      }
      return entry;
    });
  };
  