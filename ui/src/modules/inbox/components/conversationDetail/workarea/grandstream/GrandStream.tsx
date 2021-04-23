import { IConversation } from 'modules/inbox/types';
import React from 'react';

type Props = {
  conversation: IConversation;
};

class GrandStream extends React.Component<Props, {}> {
  render() {
    const { conversation } = this.props;
    const { grandStreamAudio } = conversation;

    if (!grandStreamAudio) {
      return <p>You dont have permission to listen</p>;
    }

    return (
      <>
        <audio controls={true}>
          <source src={grandStreamAudio} />
        </audio>
      </>
    );
  }
}

export default GrandStream;
