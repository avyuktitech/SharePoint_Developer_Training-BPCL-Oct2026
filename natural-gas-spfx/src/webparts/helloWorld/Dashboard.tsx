import * as React from 'react';
import styles from './HelloWorldWebPart.module.scss';

interface IStat { label: string; value: string; unit?: string; note: string; good?: boolean; }
interface INote { tone: 'amber' | 'green' | 'blue' | 'red'; icon: string; title: string; meta: string; }
interface IRegion { stats: IStat[]; bars: [string, number][]; notes: INote[]; }

const data: Record<string, IRegion> = {
  'Western Corridor': {
    stats: [
      { label: 'DAILY SEND-OUT', value: '38.6', unit: 'MMSCMD', note: '↑ 2.1% vs yesterday', good: true },
      { label: 'LINE PRESSURE', value: '62', unit: 'bar', note: 'Within 55–70 bar band' },
      { label: 'STORAGE LEVEL', value: '74', unit: '%', note: '11 days of cover' },
      { label: 'OPEN ALARMS', value: '2', note: '0 critical · 2 minor' }
    ],
    bars: [['Compressor A1', 84], ['Compressor A2', 77], ['Compressor B1', 91], ['Booster C1', 63], ['Booster C2', 58]],
    notes: [
      { tone: 'amber', icon: '!', title: 'Pigging run in progress', meta: 'Section KM 120–180 · 09:40' },
      { tone: 'green', icon: '✓', title: 'Leak survey cleared', meta: 'No findings on spur line 4 · 08:55' },
      { tone: 'blue', icon: '↗', title: 'Nomination window open', meta: 'Shipper desk closes 16:00 · 08:00' }
    ]
  },
  'Southern Grid': {
    stats: [
      { label: 'DAILY SEND-OUT', value: '24.3', unit: 'MMSCMD', note: '↓ 0.8% vs yesterday' },
      { label: 'LINE PRESSURE', value: '58', unit: 'bar', note: 'Within 55–70 bar band' },
      { label: 'STORAGE LEVEL', value: '81', unit: '%', note: '14 days of cover', good: true },
      { label: 'OPEN ALARMS', value: '1', note: '0 critical · 1 minor' }
    ],
    bars: [['Compressor S1', 72], ['Compressor S2', 69], ['Booster S3', 88], ['City gate 1', 66], ['City gate 2', 54]],
    notes: [
      { tone: 'red', icon: '!', title: 'Third-party digging reported', meta: 'Crew dispatched to KM 42 · 10:10' },
      { tone: 'green', icon: '✓', title: 'Odorant top-up complete', meta: 'City gate 2 · 09:15' },
      { tone: 'blue', icon: '↗', title: 'Industrial demand forecast updated', meta: 'Planning team · 08:20' }
    ]
  },
  'Northern Spur': {
    stats: [
      { label: 'DAILY SEND-OUT', value: '15.9', unit: 'MMSCMD', note: '↑ 3.4% vs yesterday', good: true },
      { label: 'LINE PRESSURE', value: '66', unit: 'bar', note: 'Near upper band limit' },
      { label: 'STORAGE LEVEL', value: '62', unit: '%', note: '8 days of cover' },
      { label: 'OPEN ALARMS', value: '0', note: 'All stations normal', good: true }
    ],
    bars: [['Compressor N1', 93], ['Compressor N2', 81], ['Booster N3', 70], ['LNG terminal feed', 76], ['City gate 3', 61]],
    notes: [
      { tone: 'amber', icon: '!', title: 'Cold snap expected Friday', meta: 'Heating demand +12% · 10:30' },
      { tone: 'green', icon: '✓', title: 'Valve station N3 inspected', meta: 'Passed annual check · 09:05' },
      { tone: 'blue', icon: '↗', title: 'LNG cargo scheduled', meta: 'Arriving Thursday · 08:40' }
    ]
  }
};

const regions = Object.keys(data);

const Dashboard: React.FC = () => {
  const [region, setRegion] = React.useState(regions[0]);
  const current = data[region];
  return <main className={styles.dashboard}>
    <header className={styles.header}>
      <div className={styles.logo}><span>◆</span> Meridian Gas Network</div>
      <div className={styles.headerRight}><span className={styles.live}><i /> SAMPLE DATA</span><div className={styles.avatar}>GC</div></div>
    </header>
    <div className={styles.content}>
      <div className={styles.heading}>
        <div><p className={styles.kicker}>GAS CONTROL / NETWORK</p><h1>Keeping the gas flowing.</h1><p className={styles.sub}>Send-out, pressure and station status across the pipeline network.</p></div>
        <label>REGION<select value={region} onChange={e => setRegion(e.target.value)}>{regions.map(r => <option key={r}>{r}</option>)}</select></label>
      </div>
      <section className={styles.stats}>
        {current.stats.map(s => <article key={s.label}><span>{s.label}</span><strong>{s.value} {s.unit && <small>{s.unit}</small>}</strong><em className={s.good ? styles.good : undefined}>{s.note}</em></article>)}
      </section>
      <section className={styles.lower}>
        <article className={styles.panel}>
          <div className={styles.panelTitle}><div><h2>Station utilisation</h2><p>Compressor and gate load · last hour</p></div></div>
          <div className={styles.chart}>{current.bars.map(([name, value]) => <div className={styles.barRow} key={name}><span>{name}</span><div><i style={{ width: `${value}%` }} /></div><b>{value}%</b></div>)}</div>
          <div className={styles.chartFoot}>Design range <b>60–90%</b></div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelTitle}><div><h2>Control room log</h2><p>Latest field and network updates</p></div></div>
          {current.notes.map(n => <div className={styles.note} key={n.title}><i className={styles[n.tone]}>{n.icon}</i><div><b>{n.title}</b><p>{n.meta}</p></div></div>)}
        </article>
      </section>
      <footer>Meridian Gas Network · Fictional demonstration with sample data</footer>
    </div>
  </main>;
};
export default Dashboard;
