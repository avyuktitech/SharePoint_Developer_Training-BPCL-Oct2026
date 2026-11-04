import {
  BaseListViewCommandSet,
  type IListViewCommandSetExecuteEventParameters
} from '@microsoft/sp-listview-extensibility';
import { Dialog } from '@microsoft/sp-dialog';
import { sendForApproval, summarize } from './approvalLogic';
import { SharePointRequestList } from './SharePointRequestList';

export interface IApprovalCommandSetCommandSetProperties {
  targetListTitle: string;
}

const COMMAND_ID = 'SEND_FOR_APPROVAL';

export default class ApprovalCommandSetCommandSet extends BaseListViewCommandSet<IApprovalCommandSetCommandSetProperties> {

  public onInit(): Promise<void> {
    this._updateCommand();
    this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged);
    return Promise.resolve();
  }

  public onExecute(event: IListViewCommandSetExecuteEventParameters): void {
    if (event.itemId !== COMMAND_ID) throw new Error('Unknown command');
    this._sendSelected().catch(e => Dialog.alert(`Could not send for approval: ${e instanceof Error ? e.message : String(e)}`));
  }

  private _onListViewStateChanged = (): void => {
    this._updateCommand();
    this.raiseOnChange();
  };

  // The extension is registered for every generic list on the site, so it only shows on the configured list.
  private _updateCommand(): void {
    const command = this.tryGetCommand(COMMAND_ID);
    if (!command) return;
    const onTargetList = this.context.pageContext.list?.title === this.properties.targetListTitle;
    command.visible = onTargetList && (this.context.listView.selectedRows?.length || 0) > 0;
  }

  private async _sendSelected(): Promise<void> {
    const list = this.context.pageContext.list;
    const rows = this.context.listView.selectedRows || [];
    if (!list || rows.length === 0) return;

    if (!window.confirm(`Send ${rows.length} selected request${rows.length === 1 ? '' : 's'} for approval?`)) return;

    const ids = rows.map(row => Number(row.getValueByName('ID')));
    const requests = new SharePointRequestList(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl, list.id.toString());
    const result = await sendForApproval(ids, this.context.pageContext.legacyPageContext.userId, requests);

    await Dialog.alert(summarize(result));
    if (result.sent.length > 0) window.location.reload();
  }
}
