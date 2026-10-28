import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import styles from './HelloWorldWebPart.module.scss';

export interface IHelloWorldWebPartProps {
}

export default class HelloWorldWebPart extends BaseClientSideWebPart<IHelloWorldWebPartProps> {
  public render(): void {
    const title: string = this.context.pageContext.web.title;
    const user: string = this.context.pageContext.user.displayName;
    const url: string = this.context.pageContext.web.absoluteUrl;

    this.domElement.innerHTML = '';

    const container = document.createElement('div');
    container.className = styles.helloWorld;

    const heading = document.createElement('h2');
    heading.textContent = 'Hello from ' + title + '!';

    const info = document.createElement('p');
    info.textContent = 'Signed in as ' + user + ' | ' + url;

    container.appendChild(heading);
    container.appendChild(info);
    this.domElement.appendChild(container);
  }

  protected onInit(): Promise<void> {
    return super.onInit();
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }
}