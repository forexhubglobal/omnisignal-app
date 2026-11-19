const fs = require('fs');

const dbPath = 'data/db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

db.economicCalendar = [
  {
    id: "ev-1",
    day: "Isnin",
    date: "9 Nov 2026",
    time: "20:30",
    country: "us",
    name: "US Initial Jobless Claims & Core PCE",
    impact: 3,
    previous: "216 K",
    forecast: "215 K"
  },
  {
    id: "ev-2",
    day: "Isnin",
    date: "9 Nov 2026",
    time: "22:00",
    country: "us",
    name: "US Existing Home Sales & Flash PMI",
    impact: 2,
    previous: "3.96 M",
    forecast: "4.10 M"
  },
  {
    id: "ev-3",
    day: "Selasa",
    date: "10 Nov 2026",
    time: "15:00",
    country: "gb",
    name: "UK Claimant Count & Unemployment Rate",
    impact: 3,
    previous: "4.0%",
    forecast: "4.1%"
  },
  {
    id: "ev-4",
    day: "Selasa",
    date: "10 Nov 2026",
    time: "18:00",
    country: "eu",
    name: "German ZEW Economic Sentiment",
    impact: 2,
    previous: "13.1",
    forecast: "14.0"
  },
  {
    id: "ev-5",
    day: "Rabu",
    date: "11 Nov 2026",
    time: "23:30",
    country: "us",
    name: "US EIA Crude Oil Inventories",
    impact: 2,
    previous: "+2.1 M",
    forecast: "-1.5 M"
  },
  {
    id: "ev-6",
    day: "Khamis",
    date: "12 Nov 2026",
    time: "15:00",
    country: "gb",
    name: "UK Prelim GDP q/q & Industrial Production",
    impact: 3,
    previous: "0.2%",
    forecast: "0.1%"
  },
  {
    id: "ev-7",
    day: "Khamis",
    date: "12 Nov 2026",
    time: "20:30",
    country: "us",
    name: "🔥 US CPI (Consumer Price Index) & Core CPI m/m",
    impact: 3,
    previous: "2.4%",
    forecast: "2.5%"
  },
  {
    id: "ev-8",
    day: "Khamis",
    date: "12 Nov 2026",
    time: "20:30",
    country: "us",
    name: "US Initial Jobless Claims",
    impact: 3,
    previous: "215 K",
    forecast: "218 K"
  },
  {
    id: "ev-9",
    day: "Jumaat",
    date: "13 Nov 2026",
    time: "20:30",
    country: "us",
    name: "US PPI (Producer Price Index) Final Demand",
    impact: 3,
    previous: "1.8%",
    forecast: "1.9%"
  },
  {
    id: "ev-10",
    day: "Jumaat",
    date: "13 Nov 2026",
    time: "22:00",
    country: "us",
    name: "US Prelim UoM Consumer Sentiment & Inflation",
    impact: 2,
    previous: "70.5",
    forecast: "71.0"
  }
];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Successfully updated economicCalendar in data/db.json with Week of Nov 9 - Nov 13, 2026!');
