import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import styles from './HelloWorldWebPart.module.scss';

export interface IHelloWorldWebPartProps { }

export default class HelloWorldWebPart extends BaseClientSideWebPart<IHelloWorldWebPartProps> {
  public render(): void {
    this.domElement.innerHTML = `
      <main class="${styles.bank}">
        <header class="${styles.topbar}"><span class="${styles.brandMark}">◈</span><strong>HORIZON <small>BANK</small></strong><nav>Personal <span>Business</span> Support</nav><button type="button">Sign in ↗</button></header>
        <section class="${styles.hero}"><div><p class="${styles.eyebrow}">BANKING THAT MOVES WITH YOU</p><h1>Your next chapter<br/>starts <em>here.</em></h1><p>Simple, thoughtful banking for the plans you’re building and the life you’re living.</p><button type="button" class="${styles.primary}">Explore accounts <b>→</b></button></div><div class="${styles.heroArt}" aria-hidden="true"><div class="${styles.sun}"></div><div class="${styles.arc}"></div><div class="${styles.card}"><small>HORIZON / EVERYDAY</small><strong>•••• &nbsp; 2048</strong><span>Good things are ahead.</span></div></div></section>
        <section class="${styles.quick}"><h2>Banking, made easy</h2><p>Find the right place to start.</p><div class="${styles.tiles}"><article><span>↗</span><h3>Everyday banking</h3><p>Keep the day-to-day running smoothly.</p></article><article><span>⌂</span><h3>Home &amp; lending</h3><p>Make room for what comes next.</p></article><article><span>◷</span><h3>Save for a goal</h3><p>Small steps add up to big things.</p></article></div></section>
        <footer>Horizon Bank · Sample experience <span>Secure banking · Help centre</span></footer>
      </main>`;
  }
  protected get dataVersion(): Version { return Version.parse('1.0'); }
}
