// import { response } from 'express';
import { debugChatfuel, debugRequest, debugError } from '../debuggers';
import { routeErrorHandling } from '../helpers';
import { Configs, Integrations } from '../models';
// import { Conversations } from './models';

const init = async (app) => {
  app.post(
    '/chatbotmn/create-integration',
    routeErrorHandling(async (req, res) => {
      debugRequest(debugChatfuel, req);

      const { integrationId, data } = req.body;
      const { email, phone, firstname, lastname, pageId } = JSON.parse(
        data || '{}'
      );

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

      writeApi(content, token.token);

      res.send('success');
    })
  );
};

export const writeApi = (content: string, token: string) => {
  const fetch = require('node-fetch');

  // const userId = chatBotGetUser(fetch,);

  const myHeaders = new fetch.Headers();
  myHeaders.append('Operator-token', token);
  myHeaders.append('Content-Type', 'application/json');

  const raw = JSON.stringify({
    psid: '4437312439623497',
    // psid: '4415204355205778',
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
