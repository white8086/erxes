import { Conversations } from './models';
import { generateAttachmentMessages, sendReply } from './utils';

/*
 * Handle requests from erxes api
 */
export const handleInstagramMessage = async msg => {
  const { action, payload } = msg;
  const doc = JSON.parse(payload || '{}');

  if (action === 'reply-messenger') {
    const { integrationId, conversationId, content, attachments } = doc;

    const conversation = await Conversations.getConversation({
      erxesApiId: conversationId
    });

    const { senderId } = conversation;

    try {
      if (content) {
        try {
          await sendReply(
            'me/messages',
            {
              recipient: { id: senderId },
              message: { text: content },
              tag: 'HUMAN_AGENT'
            },
            integrationId
          );

          return { status: 'success' };
        } catch (e) {
          throw new Error(e.message);
        }
      }

      for (const message of generateAttachmentMessages(attachments)) {
        try {
          await sendReply(
            'me/messages',
            { recipient: { id: senderId }, message },
            integrationId
          );
        } catch (e) {
          throw new Error(e.message);
        }
      }

      return { status: 'success' };
    } catch (e) {
      throw new Error(e.message);
    }
  }
};
