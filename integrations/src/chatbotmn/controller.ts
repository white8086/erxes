// import { response } from 'express';
import { debugChatfuel, debugRequest, debugError } from '../debuggers';
import { routeErrorHandling } from '../helpers';
import { Configs, Integrations } from '../models';
import { Customers, Conversations, ConversationMessages } from './models';
import { sendRPCMessage } from '../messageBroker';

const init = async (app) => {
  app.post(
    '/chatbotmn/create-integration',
    routeErrorHandling(async (req, res) => {
      debugRequest(debugChatfuel, req);

      const { integrationId, data } = req.body;
      const { email, phone, firstname, lastname, pageId } = JSON.parse(
        data || '{}'
      );

      console.log('data');
      console.log(data);

      // Check existing Integration
      // const integration = await Integrations.findOne({
      //   kind: 'chatbotmn',
      //   'chatbotmnConfigs.email': email
      // }).lean();

      // if (integration) {
      //   throw new Error(`Integration already exists with this email: ${email}`);
      // }

      try {
        await Integrations.create({
          kind: 'chatbotmn',
          erxesApiId: integrationId,
          facebookPageIds: [pageId],
          chatbotmnConfigs: {
            email,
            phone,
            firstname,
            lastname,
            pageId
          }
        });
      } catch (e) {
        debugError(`Failed to create integration: ${e}`);
        throw new Error(e);
      }

      return res.json({ status: 'ok' });
    })
  );

  app.post(
    '/chatbotmn-get-botData',
    routeErrorHandling(async (req, res) => {
      const body = req.body;
      console.log(body);
      res.send({
        status: 'success',
        data: { content: 'test data from integration', botData: {} }
      });
    })
  );

  app.post(
    '/chatbotmn-receive',
    routeErrorHandling(async (req, res) => {
      debugRequest(debugChatfuel, req);
      const body = req.body;

      const pageId = body['pageId'];
      const psid = body['psid'];
      const message = body['message'];
      const botData = body['botData'];
      const lastClickedButtonName = '';

      // get integration
      const integration = await Integrations.findOne({
        kind: 'chatbotmn',
        facebookPageIds: { $in: [pageId] }
      });

      if (!integration) {
        throw new Error(`${pageId} pageId not found, please check integration`);
      }

      const integrationId = integration.erxesApiId;

      // get customer
      let customer = await Customers.findOne({ psid });

      if (!customer) {
        try {
          customer = await Customers.create({
            psid,
            integrationId
          });
        } catch (e) {
          const errorMessage = e.message.includes('duplicate')
            ? 'Concurrent request: customer duplication'
            : e.message;

          debugError(errorMessage);
          throw new Error(errorMessage);
        }

        // save on api
        try {
          const apiCustomerResponse = await sendRPCMessage({
            action: 'get-create-update-customer',
            payload: JSON.stringify({
              integrationId,
              firstName: 'fromIntegration',
              lastName: 'fromIntegration',
              code: psid,
              isUser: true
            })
          });
          customer.erxesApiId = apiCustomerResponse._id;
          await customer.save();
        } catch (e) {
          await Customers.deleteOne({ _id: customer._id });
          throw new Error(e);
        }
      }

      // get conversation
      let conversation = await Conversations.findOne({ psid });

      // create conversation
      if (!conversation) {
        // save on integration db
        try {
          conversation = await Conversations.create({
            timestamp: new Date(),
            psid,
            integrationId
          });
        } catch (e) {
          throw new Error(
            e.message.includes('duplicate')
              ? 'Concurrent request: conversation duplication'
              : e
          );
        }

        // save on api
        try {
          const apiConversationResponse = await sendRPCMessage({
            action: 'create-or-update-conversation',
            payload: JSON.stringify({
              customerId: customer.erxesApiId,
              content: `Button name: ${lastClickedButtonName}, ${message}`,
              integrationId
            })
          });

          conversation.erxesApiId = apiConversationResponse._id;
          await conversation.save();
        } catch (e) {
          await Conversations.deleteOne({ _id: conversation._id });
          throw new Error(e);
        }
      }

      let botDataStr = JSON.stringify(botData);

      botDataStr = botDataStr.replace(
        '=========Message=========',
        'MessageTag'
      );
      botDataStr = botDataStr.replace('=========Result=========', 'ResultTag');

      const botDataJson = JSON.parse(botDataStr);
      let botDataFormatted;

      if (
        botDataJson.ResultTag.message === 'success' &&
        botDataJson.MessageTag.message &&
        botDataStr.indexOf('Failed to load')
      ) {
        console.log(botDataJson.MessageTag.message);

        if (botDataJson.MessageTag.message.attachment) {
          let buttons = [];
          if (botDataJson.MessageTag.message.attachment.payload.buttons) {
            console.log(
              botDataJson.MessageTag.message.attachment.payload.buttons
            );
            buttons = botDataJson.MessageTag.message.attachment.payload.buttons;
          }

          let payloadText = '';
          if (botDataJson.MessageTag.message.attachment.payload.text) {
            payloadText =
              botDataJson.MessageTag.message.attachment.payload.text;
          } else {
            payloadText = botDataJson.MessageTag.message.text;
          }

          let elements = [
            {
              title: payloadText,
              picture: '',
              subtitle: '',
              buttons
            }
          ];

          if (botDataJson.MessageTag.message.attachment.payload.elements) {
            let dataEleStr = JSON.stringify(
              botDataJson.MessageTag.message.attachment.payload.elements
            );
            dataEleStr = dataEleStr.replace('image_url', 'picture');
            dataEleStr = dataEleStr.replace('url', 'video');

            elements = JSON.parse(dataEleStr);
          }

          if (botDataJson.MessageTag.message.attachment.payload.url) {
            elements = [
              {
                title: '',
                picture: botDataJson.MessageTag.message.attachment.payload.url,
                subtitle: '',
                buttons
              }
            ];
          }

          botDataFormatted = [
            {
              type: 'carousel',
              elements
            }
          ];
        }

        if (botDataJson.MessageTag.message.quick_replies) {
          const quick_replies = botDataJson.MessageTag.message.quick_replies;
          const wrapText = botDataJson.MessageTag.message.text;

          botDataFormatted = [
            {
              type: 'custom',
              module: 'channel-web',
              component: 'QuickReplies',
              quick_replies,

              wrapped: {
                type: 'text',
                text: wrapText
              }
            }
          ];
        }
      }

      // throw new Error('stopped here');

      // save on integrations db
      const conversationMessage = await ConversationMessages.create({
        content: message,
        conversationId: conversation._id,
        botData
      });

      if (message) {
        // save message on api
        try {
          await sendRPCMessage({
            action: 'create-conversation-message',
            payload: JSON.stringify({
              content: message,
              conversationId: conversation.erxesApiId,
              customerId: customer.erxesApiId
            })
          });
        } catch (e) {
          await ConversationMessages.deleteOne({
            _id: conversationMessage._id
          });
          throw new Error(e);
        }
      } else if (!message && botDataFormatted) {
        try {
          await sendRPCMessage({
            action: 'create-conversation-message',
            payload: JSON.stringify({
              botData: botDataFormatted,
              conversationId: conversation.erxesApiId,
              customerId: customer.erxesApiId
            })
          });
        } catch (e) {
          await ConversationMessages.deleteOne({
            _id: conversationMessage._id
          });
          throw new Error(e);
        }
      }

      res.send({ status: 'success' });
    })
  );

  app.post(
    '/chatbotmn/reply',
    routeErrorHandling(async (req, res) => {
      debugRequest(debugChatfuel, req);

      const { integrationId, content } = req.body;

      const username = await Configs.findOne({ code: 'CHATBOT_USERNAME' });
      const password = await Configs.findOne({ code: 'CHATBOT_PASSWORD' });

      console.log('configs on integrations');
      console.log(username.value + ' ' + password.value);

      const integration = await Integrations.getIntegration({
        erxesApiId: integrationId
      });

      console.log('configs on integrations');
      console.log(integration.chatbotmnConfigs);

      const chatbotCongis = integration.chatbotmnConfigs;

      const customer = await Customers.findOne({ integrationId });

      console.log('customer');
      console.log(customer);

      const fetch = require('node-fetch');

      const responseData = await chatBotGetUser(
        fetch,
        username.value,
        password.value,
        chatbotCongis.email,
        chatbotCongis.phone,
        chatbotCongis.firstname,
        chatbotCongis.lastname
      );

      const userId = JSON.parse(responseData);

      const tokenInfo = await chatBotGetToken(
        fetch,
        username.value,
        password.value,
        userId.user_id
      );

      const token = JSON.parse(tokenInfo);

      console.log('tokenInfo');
      console.log(token.token);

      writeApi(fetch, content, token.token, customer.psid);

      res.send('success');
    })
  );
};

export const writeApi = (
  fetch: any,
  content: string,
  token: string,
  psid: string
) => {
  const myHeaders = new fetch.Headers();
  myHeaders.append('Operator-token', token);
  myHeaders.append('Content-Type', 'application/json');

  const raw = JSON.stringify({
    psid,
    text: content
  });

  const responseData = fetchFunction(
    'https://chatbot.mn/api/live/webhook',
    fetch,
    myHeaders,
    raw
  );

  console.log(' on writeApi');
  console.log(responseData);
};

export const chatBotGetUser = (
  fetch: any,
  user: string,
  password: string,
  email: string,
  phone: string,
  firstname: string,
  lastname: string
) => {
  const myHeaders = new fetch.Headers();
  myHeaders.append('Content-Type', 'application/json');

  const raw = JSON.stringify({
    user,
    password,
    email,
    phone,
    firstname,
    lastname
  });

  const responseData = fetchFunction(
    'https://chatbot.mn/api/live/get_user',
    fetch,
    myHeaders,
    raw
  );

  return responseData;
};

export const chatBotGetToken = (
  fetch: any,
  user: string,
  password: string,
  user_id: string
) => {
  const myHeaders = new fetch.Headers();
  myHeaders.append('Content-Type', 'application/json');

  const raw = JSON.stringify({
    user,
    password,
    user_id
  });

  const responseData = fetchFunction(
    'https://chatbot.mn/api/live/token',
    fetch,
    myHeaders,
    raw
  );

  return responseData;
};

export const fetchFunction = (
  url: string,
  fetch: any,
  myHeaders: any,
  raw: string
) => {
  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw
  };

  return fetch(url, requestOptions)
    .then((response) => response.text())
    .then(function (result) {
      console.log(result);
      return result;
    })
    .catch((error) => console.log('error', error));
};

export default init;
