import FormControl from 'modules/common/components/form/Control';
import FormGroup from 'modules/common/components/form/Group';
import ControlLabel from 'modules/common/components/form/Label';
import { FlexItem, FlexPad } from 'modules/common/components/step/styles';
import { __ } from 'modules/common/utils';
import { MAIL_TOOLBARS_CONFIG } from 'modules/settings/integrations/constants';
import { IIntegration } from 'modules/settings/integrations/types';
import React from 'react';
import EditorCK from '../containers/EditorCK';
import { IEngageScheduleDate, IViberMessage } from '../types';
import Scheduler from './Scheduler';
import SmsPreview from './SmsPreview';

type Props = {
  integrations: IIntegration[];
  onChange: (
    name: 'viber' | 'scheduleDate',
    value?: IViberMessage | IEngageScheduleDate
  ) => void;
  messageKind: string;
  viber: IViberMessage;
  content: string;
  scheduleDate: IEngageScheduleDate;
  isSaved?: boolean;
};

type State = {
  viber: IViberMessage;
  scheduleDate: IEngageScheduleDate;
};

class ViberForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      viber: props.viber,
      scheduleDate: props.scheduleDate
    };
  }

  changeContent = (key, value) => {
    const viber = {
      ...this.state.viber
    };

    viber[key] = value;

    this.setState({ viber });

    this.props.onChange('viber', viber);
  };

  renderScheduler() {
    const { messageKind, onChange } = this.props;

    if (messageKind === 'manual') {
      return null;
    }

    return (
      <Scheduler
        scheduleDate={this.state.scheduleDate || ({} as IEngageScheduleDate)}
        onChange={onChange}
      />
    );
  }

  onEditorChange = e => {
    this.changeContent('content', e.editor.getData());
  };

  render() {
    const onChangeContent = e => {
      this.changeContent('integrationId', (e.target as HTMLInputElement).value);
    };

    const { viber, messageKind, integrations } = this.props;

    const integration = integrations.find(
      e => e._id === this.state.viber.integrationId
    );

    const title = !integration ? '' : integration.name || '';

    const tmp = document.createElement('DIV');
    tmp.innerHTML = this.state.viber.content;
    const message = tmp.textContent || tmp.innerText || '';

    return (
      <FlexItem>
        <FlexPad overflow="auto" direction="column" count="3">
          <FormGroup>
            <ControlLabel>{__('Message:')}</ControlLabel>

            <EditorCK
              content={this.props.content}
              onChange={this.onEditorChange}
              toolbar={[
                { name: 'insert', items: ['strinsert'] },
                ...MAIL_TOOLBARS_CONFIG
              ]}
              height={300}
              name={`engage_${messageKind}_${viber.integrationId}`}
              isSubmitted={this.props.isSaved}
            />
          </FormGroup>

          <FormGroup>
            <ControlLabel>From:</ControlLabel>
            <FormControl
              componentClass="select"
              onChange={onChangeContent}
              defaultValue={this.state.viber.integrationId}
            >
              <option />{' '}
              {this.props.integrations.map(b => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </FormControl>
          </FormGroup>
          {/* TODO enable after engage update */}
          {/* {this.renderScheduler()} */}
        </FlexPad>
        <FlexItem overflow="auto" count="2">
          <SmsPreview title={title} message={message} />
        </FlexItem>
      </FlexItem>
    );
  }
}

export default ViberForm;
