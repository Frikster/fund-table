import React, { useEffect, useState } from 'react';
import { usePapaParse } from 'react-papaparse';
import { DataGridPremium, GRID_AGGREGATION_FUNCTIONS, GridColDef, GridToolbar, GridAggregationFunction } from '@mui/x-data-grid-premium';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
// import Rating from '@mui/material/Rating';
import './App.css';

const CSV_DATA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSBULuD9RxIwHFhqDW431fnulpQ5HMT6jHdDWm5130HepSxDUB6_rq8FwkBEilJurnFQc-IMSKMYO3Q/pub?output=csv";
const FUNDS = {
  future: 'Long-Term Future Fund',
  infrastructure: 'Effective Altruism Infrastructure Fund',
  animal: 'Animal Welfare Fund',
  health: 'Global Health and Development Fund',
}
const COLUMNS: GridColDef[] = [
  { field: 'id', headerName: 'ID', type: 'number', flex: 1 },
  { field: 'firstName', headerName: 'First name', type: 'string', flex: 1 },
  { field: 'lastName', headerName: 'Last name', type: 'string', flex: 1 },
  { field: 'summary', headerName: 'Summary', type: 'string', flex: 4 },
  { field: 'date', headerName: 'Submission date', type: 'date', flex: 2 },
  {
    field: 'payout',
    headerName: 'Payout amount',
    type: 'number',
    flex: 2,
    valueFormatter: ({ value }) => {
      if (!value) {
        return value;
      }
      return currencyFormatter.format(value);
    }
  },
  { field: 'fund', headerName: 'Fund', type: 'string', flex: 3 },
  { field: 'rating',
    headerName: 'Rating',
    type: 'number',
    flex: 2,
    // Below code renders the rating as stars. Since rating can be negative this approach would require additional work
    // renderCell: (params) => {
    //   if (params.aggregation && !params.aggregation.hasCellUnit) {
    //     return params.formattedValue;
    //   }
    //   return (
    //     <Rating
    //       name={params.row.title}
    //       value={params.value / 2}
    //       readOnly
    //       precision={0.1}
    //       max={10}
    //     />
    //   );
    // },
  },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const medianAggregation: GridAggregationFunction<number, number | null> = {
  apply: (params) => {
    if (params.values.length === 0) {
      return null;
    }

    const sortedValues = params.values.sort() as number[];
    const halfIdx = Math.floor(sortedValues.length / 2);

    if (sortedValues.length % 2) {
      return sortedValues[halfIdx];
    } else {
      return (sortedValues[halfIdx - 1] + sortedValues[halfIdx]) / 2.0;
    }
  },
  label: 'Median',
  columnTypes: ['number'],
};

function App() {
  const [rows, setRows] =  useState<any>([]);  // TODO: Update any to RowData
  const [fund, setFund] = useState<keyof typeof FUNDS>('future');
  const { readRemoteFile } = usePapaParse();

  useEffect(() => {
    readRemoteFile(CSV_DATA, {
      download: true,
      header: true,
      complete: (results) => {
        const modifiedData = (results.data as Record<string, any>[]).map((item: Record<string, any>) => { // TODO: Update any to RowData
          const { 
            ID, 
            'First name': firstName, 
            Fund: fund, 
            'Last name': lastName, 
            'Payout amount': payout, 
            Rating: rating, 
            'Submission date': date, 
            Summary: summary,
            ...rest 
          } = item;
    
          return { 
            id: ID, 
            firstName, 
            fund, 
            lastName, 
            payout: parseFloat(payout.replace(/[$,]/g, "")), 
            rating: parseFloat(rating), 
            date: new Date(date),
            summary, 
            ...rest 
          };
        });
        console.log(modifiedData);
        setRows(modifiedData);
      },
    });
  }, []);
  console.log(FUNDS[fund as keyof typeof FUNDS])
  return (
    <div className="App">
      <FormControl>
        <FormLabel id="demo-row-radio-buttons-group-label">Fund Selection</FormLabel>
        <RadioGroup
          row
          aria-labelledby="demo-row-radio-buttons-group-label"
          name="row-radio-buttons-group"
          value={fund}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFund(event.target.value as keyof typeof FUNDS)} // TODO: replace lenient "as" typing
        > 
          {Object.keys(FUNDS).map((key) => <FormControlLabel value={key} control={<Radio />} label={FUNDS[key as keyof typeof FUNDS]} />)}
        </RadioGroup>
      </FormControl>
      <div style={{ height: 500, padding: '20px' }}>
        <DataGridPremium
          rows={rows}
          columns={COLUMNS}
          aggregationFunctions={{
            ...GRID_AGGREGATION_FUNCTIONS,
            median: medianAggregation,
          }}
          initialState={{
            aggregation: {
              model: {
                payout: 'sum',
                fund: 'size',
                rating: 'median',
              },
            },
          }}
          filterModel={{
            items: [{ field: 'fund', operator: 'equals', value: FUNDS[fund as keyof typeof FUNDS] }],
          }}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
        />
      </div>
    </div>
  );
}

export default App;
