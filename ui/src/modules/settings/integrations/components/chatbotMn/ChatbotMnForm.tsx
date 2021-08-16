import Button from 'modules/common/components/Button';
import FormControl from 'modules/common/components/form/Control';
import Form from 'modules/common/components/form/Form';
import FormGroup from 'modules/common/components/form/Group';
import ControlLabel from 'modules/common/components/form/Label';
import { ModalFooter } from 'modules/common/styles/main';
import { IButtonMutateProps, IFormProps } from 'modules/common/types';
import { __ } from 'modules/common/utils';
import React from 'react';
import { INTEGRATION_KINDS } from '../../constants';
import SelectBrand from '../../containers/SelectBrand';
import SelectChannels from '../../containers/SelectChannels';

type Props = {
  renderButton: (props: IButtonMutateProps) => JSX.Element;
  closeModal: () => void;
};

type State = {
  channelIds: string[];
};

class ChatbotMnForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      channelIds: []
    };
  }

  onChangeChannel = (values: string[]) => {
    this.setState({ channelIds: values });
  };

  generateDoc = (values: {
    name: string;
    brandId: string;
    email: string;
    phone: string;
    firstname: string;
    lastname: string;
    pageId: string;
  }) => {
    return {
      name: values.name,
      brandId: values.brandId,
      kind: INTEGRATION_KINDS.CHATBOTMN,
      channelIds: this.state.channelIds,
      data: {
        email: values.email,
        phone: values.phone,
        firstname: values.firstname,
        lastname: values.lastname,
        pageId: values.pageId
      }
    };
  };

  renderContent = (formProps: IFormProps) => {
    const { renderButton, closeModal } = this.props;
    const { values, isSubmitted } = formProps;

    return (
      <>
        <FormGroup>
          <ControlLabel required={true}>Name</ControlLabel>
          <FormControl
            {...formProps}
            name="name"
            required={true}
            autoFocus={true}
          />
        </FormGroup>
        <FormGroup>
          <ControlLabel required={true}>Chatbot email</ControlLabel>
          <FormControl {...formProps} type="text" name="email" required={true} />
        </FormGroup>

        <FormGroup>
          <ControlLabel required={true}>Chatbot phone</ControlLabel>
          <FormControl {...formProps} type="text" name="phone" required={true} />
        </FormGroup>

        <FormGroup>
          <ControlLabel required={true}>Chatbot firstname</ControlLabel>
          <FormControl {...formProps} type="text" name="firstname" required={true} />
        </FormGroup>

        <FormGroup>
          <ControlLabel required={true}>Chatbot lastname</ControlLabel>
          <FormControl {...formProps} type="text" name="lastname" required={true} />
        </FormGroup>

        <FormGroup>
          <ControlLabel required={true}>Facebook pageId</ControlLabel>
          <FormControl {...formProps} type="text" name="pageId" required={true} />
        </FormGroup>

        <SelectBrand
          isRequired={true}
          formProps={formProps}
          description={__(
            'Which specific Brand does this integration belong to?'
          )}
        />
        <SelectChannels
          defaultValue={this.state.channelIds}
          isRequired={true}
          onChange={this.onChangeChannel}
        />
        <ModalFooter>
          <Button
            btnStyle="simple"
            type="button"
            onClick={closeModal}
            icon="times-circle"
          >
            Cancel
          </Button>
          {renderButton({
            name: 'integration',
            values: this.generateDoc(values),
            isSubmitted,
            callback: closeModal
          })}
        </ModalFooter>
      </>
    );
  };

  render() {
    return <Form renderContent={this.renderContent} />;
  }
}

export default ChatbotMnForm;
