import { debugRequest, debugResponse, debugViber } from '../debuggers';
import { routeErrorHandling } from '../helpers';
import { Integrations } from '../models';
import { getConfig } from '../utils';
import { ViberClient } from 'messaging-api-viber';
import { findIntegrationFromSignature, receiveMessage } from './utils';
import { Conversations, Customers } from './models';

const init = async app => {
  app.post(
    '/viber/webhook',
    routeErrorHandling(async (req, res) => {
      const { body, rawBody, headers } = req;

      const integration = await findIntegrationFromSignature(
        rawBody,
        `${headers['x-viber-content-signature']}`
      );

      if (!integration) {
        return;
      }

      console.log(body);

      switch (body.event) {
        case 'message':
          await receiveMessage(body, integration);
          break;

        default:
          break;
      }

      res.sendStatus(200);
    })
  );

  app.post(
    '/messaging-api-viber/create-integration',
    routeErrorHandling(async (req, res) => {
      debugRequest(debugViber, req);

      const { integrationId, data } = req.body;
      const { token, displayName } = JSON.parse(data);

      let integration = await Integrations.findOne({
        $and: [{ viberBotToken: token }, { kind: 'messaging-api-viber' }]
      });

      if (integration) {
        throw new Error(`Integration already exists with this token: ${token}`);
      }

      const webhookUrl = await getConfig('VIBER_WEBHOOK_CALLBACK_URL');

      if (!webhookUrl) {
        throw new Error('Webhook url is not configured');
      }

      integration = await Integrations.create({
        kind: 'messaging-api-viber',
        erxesApiId: integrationId,
        viberBotToken: token,
        name: displayName
      });

      const client = new ViberClient({
        accessToken: token,
        sender: {
          name: integration.name
        }
      });

      await client.setWebhook(webhookUrl).catch(error => {
        throw new Error(error);
      });

      return res.json({ status: 'ok' });
    })
  );

  app.post(
    '/viber/reply',
    routeErrorHandling(async (req, res) => {
      const { attachments, conversationId, content, integrationId } = req.body;
      console.log(req.body);

      const conversation = await Conversations.getConversation({
        erxesApiId: conversationId
      });

      const integration = await Integrations.findOne({
        erxesApiId: integrationId
      });

      const client = new ViberClient({
        accessToken: integration.viberBotToken,
        sender: {
          name: integration.name
        }
      });

      const customerId = conversation.customerId;

      const customer = await Customers.getCustomer({ _id: customerId }, true);

      if (attachments.length === 0) {
        await client.sendText(customer.viberId, content);
      } else {
        for (const attachment of attachments) {
          await client.sendFile(customer.viberId, {
            fileName: attachment.name,
            media: attachment.url,
            size: attachment.size
          });
        }

        if (content && content.length > 0) {
          await client.sendText(customer.viberId, content);
        }
      }

      debugResponse(debugViber, req);

      res.sendStatus(200);
    })
  );
};

export default init;
