import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { spfi, SPFI, SPFx } from '@pnp/sp';
import { graphfi, GraphFI, SPFx as graphSPFx } from '@pnp/graph';
import Workday from './Workday';

export interface IHelloWorldWebPartProps {
}

export default class HelloWorldWebPart extends BaseClientSideWebPart<IHelloWorldWebPartProps> {
  private _sp!: SPFI;
  private _graph!: GraphFI;

  protected async onInit(): Promise<void> {
    await super.onInit();
    // PnPjs picks up the current site URL and the signed-in user's tokens from the SPFx context.
    this._sp = spfi().using(SPFx(this.context));
    this._graph = graphfi().using(graphSPFx(this.context));
  }

  public render(): void {
    ReactDom.render(React.createElement(Workday, { sp: this._sp, graph: this._graph }), this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }
}
