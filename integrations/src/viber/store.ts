import { ConversationMessages, Conversations, Customers } from './models';

import { debugError } from '../debuggers';
import { sendRPCMessage } from '../messageBroker';
import { generateContent } from './utils';

export interface ISender {
  id: string;
  name: string;
  avatar: string;
  language: string;
  country: string;
}

export const getOrCreateCustomer = async (sender: ISender, integration) => {
  let customer = await Customers.findOne({ viberId: sender.id });
  if (customer) {
    return customer;
  }

  customer = await Customers.create({
    viberId: sender.id,
    integrationId: integration.id,
    ...sender
  });

  // save on api
  try {
    const apiCustomerResponse = await sendRPCMessage({
      action: 'get-create-update-customer',
      payload: JSON.stringify({
        integrationId: integration.erxesApiId,
        firstName: sender.name,
        avatar: sender.avatar,
        location: {
          countryCode: sender.country,
          language: sender.language
        }
      })
    });

    customer.erxesApiId = apiCustomerResponse._id;

    await customer.save();
  } catch (e) {
    await Customers.deleteOne({ _id: customer._id });
    throw e;
  }

  return customer;
};

export const createOrUpdateConversation = async (
  message,
  customerIds,
  integrationIds
) => {
  const { customerId, customerErxesApiID } = customerIds;

  const { integrationId, integrationErxesApiId } = integrationIds;

  let conversation = await Conversations.findOne({ customerId });

  if (conversation) {
    return conversation;
  }

  const { content } = await generateContent(message);

  conversation = await Conversations.create({
    timestamp: new Date(),
    customerId,
    content,
    integrationId
  });

  // save on api
  try {
    const apiConversationResponse = await sendRPCMessage({
      action: 'create-or-update-conversation',
      payload: JSON.stringify({
        customerId: customerErxesApiID,
        integrationId: integrationErxesApiId,
        content
      })
    });

    conversation.erxesApiId = apiConversationResponse._id;

    await conversation.save();
  } catch (e) {
    await Conversations.deleteOne({ _id: conversation._id });

    debugError(
      `Error ocurred while trying to create or update conversation ${e.message}`
    );

    throw e;
  }

  return conversation;
};

export const createMessage = async (messageToken, message, conversationIds) => {
  const {
    conversationId,
    conversationErxesApiId,
    customerErxesApiId
  } = conversationIds;

  const conversationMessage = await ConversationMessages.findOne({
    messageToken
  });

  if (conversationMessage) {
    return conversationMessage;
  }

  await ConversationMessages.create({
    conversationId,
    messageToken,
    timestamp: new Date(),
    ...message
  });

  const { content, attachments } = await generateContent(message);

  try {
    await sendRPCMessage({
      action: 'create-conversation-message',
      metaInfo: 'replaceContent',
      payload: JSON.stringify({
        content,
        attachments,
        conversationId: conversationErxesApiId,
        customerId: customerErxesApiId
      })
    });
  } catch (e) {
    await ConversationMessages.deleteOne({ mid: message.id });
    throw new Error(e);
  }

  return conversationMessage;
};
