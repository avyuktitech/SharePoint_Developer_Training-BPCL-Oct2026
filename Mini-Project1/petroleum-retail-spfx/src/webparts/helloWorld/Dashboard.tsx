import * as React from 'react';
import styles from './HelloWorldWebPart.module.scss';

interface IStat { label: string; value: string; unit?: string; note: string; good?: boolean; }
interface INote { tone: 'amber' | 'green' | 'blue' | 'red'; icon: string; title: string; meta: string; }
interface ICity { stats: IStat[]; bars: [string, number][]; notes: INote[]; }

const data: Record<string, ICity> = {
  'Metro North': {
    stats: [
      { label: 'FUEL SOLD TODAY', value: '486', unit: 'KL', note: '↑ 5.2% vs last Tuesday', good: true },
      { label: 'STATIONS ONLINE', value: '64', unit: '/ 66', note: '2 under maintenance' },
      { label: 'AVG TANK STOCK', value: '58', unit: '%', note: '3 stations below 25%' },
      { label: 'CARD PAYMENTS', value: '71', unit: '%', note: 'UPI and cards combined' }
    ],
    bars: [['Petrol', 82], ['Diesel', 74], ['Premium petrol', 41], ['CNG', 56], ['Lubricants', 28]],
    notes: [
      { tone: 'red', icon: '!', title: 'Low diesel at Station 17', meta: 'Tanker arriving 13:30 · 10:15' },
      { tone: 'green', icon: '✓', title: 'Pump calibration complete', meta: '12 stations certified · 09:20' },
      { tone: 'blue', icon: '↗', title: 'Weekend loyalty offer live', meta: 'Marketing team · 08:00' }
    ]
  },
  'Highway Belt': {
    stats: [
      { label: 'FUEL SOLD TODAY', value: '612', unit: 'KL', note: '↑ 8.9% vs last Tuesday', good: true },
      { label: 'STATIONS ONLINE', value: '38', unit: '/ 38', note: 'All stations open', good: true },
      { label: 'AVG TANK STOCK', value: '47', unit: '%', note: '5 stations below 25%' },
      { label: 'CARD PAYMENTS', value: '64', unit: '%', note: 'Fleet cards 22%' }
    ],
    bars: [['Petrol', 58], ['Diesel', 93], ['Premium petrol', 27], ['CNG', 39], ['Lubricants', 35]],
    notes: [
      { tone: 'amber', icon: '!', title: 'Truck traffic peak expected', meta: 'Extra staff on night shift · 10:40' },
      { tone: 'green', icon: '✓', title: 'Food court opened at Station 9', meta: 'Retail team · 09:35' },
      { tone: 'blue', icon: '↗', title: 'Fleet contract renewed', meta: 'B2B sales desk · 08:45' }
    ]
  },
  'Coastal South': {
    stats: [
      { label: 'FUEL SOLD TODAY', value: '298', unit: 'KL', note: '↓ 1.4% vs last Tuesday' },
      { label: 'STATIONS ONLINE', value: '41', unit: '/ 42', note: '1 closed for upgrade' },
      { label: 'AVG TANK STOCK', value: '69', unit: '%', note: 'Healthy across region', good: true },
      { label: 'CARD PAYMENTS', value: '76', unit: '%', note: 'Highest in network' }
    ],
    bars: [['Petrol', 77], ['Diesel', 62], ['Premium petrol', 49], ['CNG', 68], ['Lubricants', 31]],
    notes: [
      { tone: 'amber', icon: '!', title: 'Monsoon advisory issued', meta: 'Check drainage at 6 sites · 10:00' },
      { tone: 'green', icon: '✓', title: 'EV chargers installed', meta: 'Stations 3 and 11 · 09:10' },
      { tone: 'blue', icon: '↗', title: 'New price list effective 06:00', meta: 'Pricing desk · 06:00' }
    ]
  }
};

const cities = Object.keys(data);

const Dashboard: React.FC = () => {
  const [city, setCity] = React.useState(cities[0]);
  const current = data[city];
  return <main className={styles.dashboard}>
    <header className={styles.header}>
      <div className={styles.logo}><span>A</span> Apex Fuels Retail</div>
      <div className={styles.headerRight}><span className={styles.live}><i /> SAMPLE DATA</span><div className={styles.avatar}>RM</div></div>
    </header>
    <div className={styles.content}>
      <div className={styles.heading}>
        <div><p className={styles.kicker}>RETAIL / STATION NETWORK</p><h1>Every pump, one view.</h1><p className={styles.sub}>Sales, stock and station status across your fuel retail network.</p></div>
        <label>REGION<select value={city} onChange={e => setCity(e.target.value)}>{cities.map(c => <option key={c}>{c}</option>)}</select></label>
      </div>
      <section className={styles.stats}>
        {current.stats.map(s => <article key={s.label}><span>{s.label}</span><strong>{s.value} {s.unit && <small>{s.unit}</small>}</strong><em className={s.good ? styles.good : undefined}>{s.note}</em></article>)}
      </section>
      <section className={styles.lower}>
        <article className={styles.panel}>
          <div className={styles.panelTitle}><div><h2>Product demand</h2><p>Share of daily target reached · today</p></div></div>
          <div className={styles.chart}>{current.bars.map(([name, value]) => <div className={styles.barRow} key={name}><span>{name}</span><div><i style={{ width: `${value}%` }} /></div><b>{value}%</b></div>)}</div>
          <div className={styles.chartFoot}>Daily target <b>100%</b></div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelTitle}><div><h2>Network updates</h2><p>Latest from stations and head office</p></div></div>
          {current.notes.map(n => <div className={styles.note} key={n.title}><i className={styles[n.tone]}>{n.icon}</i><div><b>{n.title}</b><p>{n.meta}</p></div></div>)}
        </article>
      </section>
      <footer>Apex Fuels Retail · Fictional demonstration with sample data</footer>
    </div>
  </main>;
};
export default Dashboard;
