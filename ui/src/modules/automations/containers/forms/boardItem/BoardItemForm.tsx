import client from 'apolloClient';
import gql from 'graphql-tag';
import BoardItemForm from 'modules/automations/components/forms/boardItem/BoardItemForm';
import { queries } from 'modules/boards/graphql';
import React from 'react';

type IProps = {
  boardId?: string;
  pipelineId?: string;
  stageId?: string;
  relType?: string;
  cardId?: string;
  cardName?: string;
  type: string;
  onChange: (key: string, value: string) => void;
};

class BoardItemSelectContainer extends React.Component<IProps> {
  fetchCards = (stageId: string, callback: (cards: any) => void) => {
    const { type } = this.props;

    client
      .query({
        query: gql(queries[`${type}s`]),
        fetchPolicy: 'network-only',
        variables: { stageId, limit: 0 }
      })
      .then(({ data }: any) => {
        callback(data[`${type}s`]);
      });
  };

  render() {
    const extendedProps = {
      ...this.props,
      fetchCards: this.fetchCards
    };

    return <BoardItemForm {...extendedProps} />;
  }
}

export default BoardItemSelectContainer;
