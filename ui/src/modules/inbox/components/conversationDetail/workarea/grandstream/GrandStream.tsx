import { IConversation } from 'modules/inbox/types';
import React from 'react';

type Props = {
  conversation: IConversation;
};

class GrandStream extends React.Component<Props, {}> {
  render() {
    return (
      <>
        <audio controls={true}>
          <source type="audio/ogg" />
        </audio>
      </>
    );
  }
}

export default GrandStream;
