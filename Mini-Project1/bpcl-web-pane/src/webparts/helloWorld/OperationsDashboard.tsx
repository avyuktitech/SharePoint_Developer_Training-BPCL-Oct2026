import * as React from 'react';
import styles from './HelloWorldWebPart.module.scss';

const sites = ['Mumbai Refinery', 'Kochi Refinery', 'Bina Refinery'];

const OperationsDashboard: React.FC = () => {
  const [site, setSite] = React.useState(sites[0]);
  return <main className={styles.dashboard}>
    <header className={styles.header}><div className={styles.logo}><span>bp</span> Bharat Petroleum</div><div className={styles.headerRight}><span className={styles.live}><i /> SAMPLE DATA</span><button type="button">Operations ▾</button><div className={styles.avatar}>OP</div></div></header>
    <div className={styles.content}><div className={styles.heading}><div><p className={styles.kicker}>OPERATIONS / OVERVIEW</p><h1>Good morning, operator.</h1><p className={styles.sub}>A clear view of today’s site activity and performance.</p></div><label>FACILITY<select value={site} onChange={e => setSite(e.target.value)}>{sites.map(s => <option key={s}>{s}</option>)}</select></label></div>
      <section className={styles.stats}><article><span>DAILY THROUGHPUT</span><strong>42,860 <small>KL</small></strong><em>↑ 4.8% vs yesterday</em></article><article><span>STOCK COVER</span><strong>8.4 <small>days</small></strong><em>Within operating range</em></article><article><span>SAFETY STATUS</span><strong className={styles.safe}>On track</strong><em>12 days incident-free</em></article><article><span>ACTIVE UNITS</span><strong>18 <small>/ 20</small></strong><em>2 units in maintenance</em></article></section>
      <section className={styles.lower}><article className={styles.panel}><div className={styles.panelTitle}><div><h2>Site performance</h2><p>Throughput by operating unit · today</p></div><button type="button">View report ↗</button></div><div className={styles.chart}>{[['Crude distillation',82],['Hydrocracker',68],['Diesel hydrotreater',91],['Catalytic reformer',57]].map(([name, value]) => <div className={styles.barRow} key={name as string}><span>{name}</span><div><i style={{width: `${value}%`}} /></div><b>{value}%</b></div>)}</div><div className={styles.chartFoot}>Nominal range <b>75–95%</b></div></article>
      <article className={styles.panel}><div className={styles.panelTitle}><div><h2>Shift notes</h2><p>Latest site updates</p></div><button type="button">All notes ↗</button></div><div className={styles.note}><i className={styles.noteAmber}>!</i><div><b>Unit 4 maintenance window</b><p>Planned inspection underway · 09:20</p></div></div><div className={styles.note}><i className={styles.noteGreen}>✓</i><div><b>Morning safety review complete</b><p>All teams briefed · 08:45</p></div></div><div className={styles.note}><i className={styles.noteBlue}>↗</i><div><b>Dispatch schedule updated</b><p>Regional logistics desk · 08:10</p></div></div></article></section>
      <footer>BPCL operations pane · Demonstration UI with sample data</footer></div></main>;
};
export default OperationsDashboard;
