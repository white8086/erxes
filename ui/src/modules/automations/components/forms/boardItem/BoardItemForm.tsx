import BoardSelect from 'modules/boards/containers/BoardSelect';
import { SelectContainer } from 'modules/boards/styles/common';
import { HeaderRow, HeaderContent } from 'modules/boards/styles/item';

import React from 'react';
import {
  ControlLabel,
  FormControl,
  FormGroup
} from 'modules/common/components/form';

import { __ } from 'modules/common/utils';

type Props = {
  type: string;
  boardId?: string;
  pipelineId?: string;
  stageId?: string;
  cardId?: string;
  cardName?: string;
  onChange: (key: string, value: string) => void;
};

type State = {
  stageId: string;
  cardName: string;
  boardId: string;
  pipelineId: string;
  cards: any;
  cardId: string;
};

class AddForm extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      boardId: props.boardId || '',
      pipelineId: props.pipelineId || '',
      stageId: props.stageId || '',
      cardId: props.cardId || '',
      cards: [],
      cardName: props.cardName || ''
    };
  }

  onChangeField = <T extends keyof State>(name: T, value: State[T]) => {
    this.setState(({ [name]: value } as unknown) as Pick<State, keyof State>);
    this.props.onChange(name, value);
  };

  renderSelect() {
    const { type } = this.props;

    const { stageId, pipelineId, boardId } = this.state;

    const stgIdOnChange = stgId => this.onChangeField('stageId', stgId);
    const plIdOnChange = plId => this.onChangeField('pipelineId', plId);
    const brIdOnChange = brId => this.onChangeField('boardId', brId);

    return (
      <BoardSelect
        type={type}
        stageId={stageId || ''}
        pipelineId={pipelineId || ''}
        boardId={boardId || ''}
        onChangeStage={stgIdOnChange}
        onChangePipeline={plIdOnChange}
        onChangeBoard={brIdOnChange}
      />
    );
  }

  onChangeName = e => {
    const value = (e.target as HTMLInputElement).value;

    this.setState({ cardName: value });
    this.props.onChange('cardName', value);
  };

  renderName() {
    return (
      <SelectContainer>
        <HeaderRow>
          <HeaderContent>
            <FormGroup>
              <ControlLabel required={true}>Name</ControlLabel>
              <FormControl
                name="name"
                value={this.state.cardName}
                onChange={this.onChangeName}
              />
            </FormGroup>
          </HeaderContent>
        </HeaderRow>
      </SelectContainer>
    );
  }

  render() {
    return (
      <>
        {this.renderSelect()}
        {this.renderName()}
      </>
    );
  }
}

export default AddForm;
