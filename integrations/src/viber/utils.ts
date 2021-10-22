import Integrations, { IIntegration } from '../models/Integrations';
import {
  createMessage,
  createOrUpdateConversation,
  getOrCreateCustomer
} from './store';
import * as crypto from 'crypto';
import { FILE_MIME_TYPES } from '../constants';
import { ViberClient } from 'messaging-api-viber';
import { getConfig } from '../utils';

export const receiveMessage = async (requestBody, integration) => {
  const { sender, message, message_token } = requestBody;

  const customer = await getOrCreateCustomer(sender, integration);

  const customerIds = {
    customerId: customer.id,
    customerErxesApiID: customer.erxesApiId
  };

  const integrationIds = {
    integrationId: integration.id,
    integrationErxesApiId: integration.erxesApiId
  };

  const conversation = await createOrUpdateConversation(
    message,
    customerIds,
    integrationIds
  );

  const conversationIds = {
    conversationId: conversation._id,
    conversationErxesApiId: conversation.erxesApiId,
    customerErxesApiId: customer.erxesApiId
  };

  await createMessage(message_token, message, conversationIds);
};

export const findIntegrationFromSignature = async (
  rawBody: string,
  signature: string
) => {
  const integrations = await Integrations.find({
    kind: 'messaging-api-viber'
  }).lean();

  let result = null;

  for (const integration of integrations) {
    const hashBufferFromBody = crypto
      .createHmac('sha256', integration.viberBotToken || '')
      .update(rawBody)
      .digest();

    const bufferFromSignature = Buffer.from(signature, 'hex');

    if (bufferFromSignature.length !== hashBufferFromBody.length) {
      continue;
    }

    if (crypto.timingSafeEqual(bufferFromSignature, hashBufferFromBody)) {
      result = integration;
    }
  }

  return result;
};

const getMimeType = (url, name) => {
  const urlString = url.split('?')[0];
  let ext = urlString.substr(urlString.lastIndexOf('.') + 1);

  let type = FILE_MIME_TYPES.find(e => e.extension === `.${ext}`);

  if (type) {
    return type.value;
  }

  ext = name.substr(name.lastIndexOf('.') + 1);

  type = FILE_MIME_TYPES.find(e => e.extension === `.${ext}`);

  if (type) {
    return type.value;
  }

  return 'unknown';
};

export const generateContent = async message => {
  let attachments = [];
  let content = '';
  let type = 'unknown';

  if (message.media) {
    type = await getMimeType(message.media, message.file_name);
  }

  switch (message.type) {
    case 'text':
      content = message.text;
      break;

    case 'sticker':
      content = 'Customer has sent sticker';
      attachments = [{ type, url: message.media }];
      break;

    case 'picture':
      content = 'Customer has sent image';
      attachments = [{ type, url: message.media, name: message.file_name }];
      break;

    case 'video':
      content = 'Customer has sent video';
      attachments = [
        {
          type,
          url: message.media,
          name: message.file_name,
          size: message.size
        }
      ];
      break;

    case 'file':
      content = 'Customer has sent file';
      attachments = [
        {
          type,
          url: message.media,
          name: message.file_name,
          size: message.size
        }
      ];
      break;

    case 'contact':
      const { name, phone_number, avatar } = message.contact;
      content = `Customer has shared a contact. Contact info: name:${name}, phone: ${phone_number}, avatar: ${avatar} `;
      break;

    case 'location':
      const { lat, lon } = message.location;
      content = `Customer has shared a location. Location info: Latitude: ${lat}, Longitude: ${lon}`;
      break;

    default:
      break;
  }

  return { content, attachments };
};

export const setWebhook = async (integration: IIntegration) => {
  const client = new ViberClient({
    accessToken: integration.viberBotToken,
    sender: {
      name: integration.name
    }
  });

  const webhookUrl = await getConfig('VIBER_WEBHOOK_CALLBACK_URL');

  return await client.setWebhook(webhookUrl).catch(error => {
    throw new Error(error);
  });
};

export const removeWebhook = async (integration: IIntegration) => {
  const client = new ViberClient({
    accessToken: integration.viberBotToken,
    sender: {
      name: integration.name
    }
  });

  return client.removeWebhook();
};
