import TaggerPopover from 'modules/tags/components/TaggerPopover';
import React from 'react';
import { refetchSidebarConversationsOptions } from '../utils';
import { InboxManagementActionConsumer } from './Inbox';

const Tagger = props => {
  const { refetchQueries } = refetchSidebarConversationsOptions();
  const { emptyBulk, ...otherProps } = props;

  return (
    <InboxManagementActionConsumer>
      {({ notifyConsumersOfManagementAction }) => (
        <TaggerPopover
          {...otherProps}
          type="conversation"
          refetchQueries={refetchQueries}
          successCallback={() => {
            notifyConsumersOfManagementAction();
            emptyBulk();
          }}
        />
      )}
    </InboxManagementActionConsumer>
  );
};

export default Tagger;
