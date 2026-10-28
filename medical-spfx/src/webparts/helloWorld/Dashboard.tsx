import * as React from 'react';
import styles from './HelloWorldWebPart.module.scss';

interface IStat { label: string; value: string; unit?: string; note: string; good?: boolean; }
interface INote { tone: 'amber' | 'green' | 'blue' | 'red'; icon: string; title: string; meta: string; }
interface ISite { stats: IStat[]; bars: [string, number][]; notes: INote[]; }

const data: Record<string, ISite> = {
  'City General Hospital': {
    stats: [
      { label: 'BED OCCUPANCY', value: '86', unit: '%', note: '412 of 480 beds in use' },
      { label: 'ER WAIT TIME', value: '24', unit: 'min', note: '↓ 6 min vs last week', good: true },
      { label: 'SURGERIES TODAY', value: '37', note: '29 completed · 8 scheduled' },
      { label: 'STAFF ON DUTY', value: '318', note: 'Night shift starts 20:00' }
    ],
    bars: [['Emergency', 92], ['Cardiology', 78], ['Maternity', 64], ['Orthopaedics', 71], ['Paediatrics', 55]],
    notes: [
      { tone: 'red', icon: '!', title: 'ICU nearing capacity', meta: '2 beds available · 10:05' },
      { tone: 'green', icon: '✓', title: 'Blood bank restocked', meta: 'O-negative supply normal · 09:30' },
      { tone: 'blue', icon: '↗', title: 'New ward rota published', meta: 'Nursing office · 08:15' }
    ]
  },
  'Riverside Clinic': {
    stats: [
      { label: 'BED OCCUPANCY', value: '71', unit: '%', note: '85 of 120 beds in use' },
      { label: 'ER WAIT TIME', value: '15', unit: 'min', note: 'Within target', good: true },
      { label: 'SURGERIES TODAY', value: '12', note: '9 completed · 3 scheduled' },
      { label: 'STAFF ON DUTY', value: '96', note: '4 agency nurses booked' }
    ],
    bars: [['Emergency', 74], ['Outpatients', 88], ['Radiology', 61], ['Day surgery', 69], ['Physiotherapy', 47]],
    notes: [
      { tone: 'amber', icon: '!', title: 'MRI scanner servicing', meta: 'Back online at 14:00 · 09:50' },
      { tone: 'green', icon: '✓', title: 'Infection audit passed', meta: 'All wards compliant · 09:10' },
      { tone: 'blue', icon: '↗', title: 'Telehealth slots added', meta: 'Outpatients desk · 08:30' }
    ]
  },
  'Northside Children\'s Centre': {
    stats: [
      { label: 'BED OCCUPANCY', value: '79', unit: '%', note: '126 of 160 beds in use' },
      { label: 'ER WAIT TIME', value: '31', unit: 'min', note: '↑ 4 min vs last week' },
      { label: 'SURGERIES TODAY', value: '18', note: '11 completed · 7 scheduled' },
      { label: 'STAFF ON DUTY', value: '142', note: 'Full specialist cover' }
    ],
    bars: [['Paediatric ER', 89], ['Neonatal ICU', 83], ['General wards', 72], ['Oncology', 58], ['Outpatients', 66]],
    notes: [
      { tone: 'amber', icon: '!', title: 'Flu season surge expected', meta: 'Extra beds on standby · 10:20' },
      { tone: 'green', icon: '✓', title: 'Vaccination drive complete', meta: '1,240 doses this week · 09:00' },
      { tone: 'blue', icon: '↗', title: 'Family lounge reopened', meta: 'Facilities team · 08:05' }
    ]
  }
};

const sites = Object.keys(data);

const Dashboard: React.FC = () => {
  const [site, setSite] = React.useState(sites[0]);
  const current = data[site];
  return <main className={styles.dashboard}>
    <header className={styles.header}>
      <div className={styles.logo}><span>✚</span> CarePoint Health</div>
      <div className={styles.headerRight}><span className={styles.live}><i /> SAMPLE DATA</span><div className={styles.avatar}>DR</div></div>
    </header>
    <div className={styles.content}>
      <div className={styles.heading}>
        <div><p className={styles.kicker}>HOSPITAL / TODAY</p><h1>Patient care at a glance.</h1><p className={styles.sub}>Capacity, waiting times and department load across your hospitals.</p></div>
        <label>HOSPITAL<select value={site} onChange={e => setSite(e.target.value)}>{sites.map(s => <option key={s}>{s}</option>)}</select></label>
      </div>
      <section className={styles.stats}>
        {current.stats.map(s => <article key={s.label}><span>{s.label}</span><strong>{s.value} {s.unit && <small>{s.unit}</small>}</strong><em className={s.good ? styles.good : undefined}>{s.note}</em></article>)}
      </section>
      <section className={styles.lower}>
        <article className={styles.panel}>
          <div className={styles.panelTitle}><div><h2>Department load</h2><p>Current occupancy by department</p></div></div>
          <div className={styles.chart}>{current.bars.map(([name, value]) => <div className={styles.barRow} key={name}><span>{name}</span><div><i style={{ width: `${value}%` }} /></div><b>{value}%</b></div>)}</div>
          <div className={styles.chartFoot}>Safe operating level <b>below 90%</b></div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelTitle}><div><h2>Care alerts</h2><p>Latest updates from the wards</p></div></div>
          {current.notes.map(n => <div className={styles.note} key={n.title}><i className={styles[n.tone]}>{n.icon}</i><div><b>{n.title}</b><p>{n.meta}</p></div></div>)}
        </article>
      </section>
      <footer>CarePoint Health · Fictional demonstration with sample data, no patient information</footer>
    </div>
  </main>;
};
export default Dashboard;
