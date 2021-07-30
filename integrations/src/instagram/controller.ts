import { Accounts, Integrations } from '../models';
import { getConfig } from '../utils';
import loginMiddleware from './loginMIddleware';
import {
  debugError,
  debugFacebook,
  debugInstagram,
  debugRequest,
  debugResponse
} from '../debuggers';
import { getFacebookPageIdsForInsta, getPageList } from './utils';
import receiveMessage from './receiveMessage';
import { getPageAccessToken, subscribePage } from '../facebook/utils';

const init = async app => {
  app.get('/instalogin', loginMiddleware);

  app.post('/instagram/create-integration', async (req, res, next) => {
    debugRequest(debugInstagram, req);

    const { accountId, integrationId, data, kind } = req.body;

    const instagramPageIds = JSON.parse(data).pageIds;
    const account = await Accounts.getAccount({ _id: accountId });

    const facebookPageIds = await getFacebookPageIdsForInsta(
      account.token,
      instagramPageIds
    );

    const integration = await Integrations.create({
      kind,
      accountId,
      erxesApiId: integrationId,
      instagramPageIds,
      facebookPageIds
    });

    const facebookPageTokensMap: { [key: string]: string } = {};

    for (const pageId of facebookPageIds) {
      try {
        const pageAccessToken = await getPageAccessToken(pageId, account.token);

        facebookPageTokensMap[pageId] = pageAccessToken;

        try {
          await subscribePage(pageId, pageAccessToken);
          debugFacebook(`Successfully subscribed page ${pageId}`);
        } catch (e) {
          debugError(
            `Error ocurred while trying to subscribe page ${e.message || e}`
          );
          return next(e);
        }
      } catch (e) {
        debugError(
          `Error ocurred while trying to get page access token with ${e.message ||
            e}`
        );
        return next(e);
      }
    }

    integration.facebookPageTokensMap = facebookPageTokensMap;

    await integration.save();

    debugResponse(debugInstagram, req);

    return res.json({ status: 'ok ' });
  });

  app.get('/instagram/get-accounts', async (req, res, next) => {
    debugRequest(debugInstagram, req);
    const accountId = req.query.accountId;

    const account = await Accounts.getAccount({ _id: req.query.accountId });

    const accessToken = account.token;

    let pages = [];

    try {
      pages = await getPageList(accessToken);
    } catch (e) {
      if (!e.message.includes('Application request limit reached')) {
        await Integrations.updateOne(
          { accountId },
          { $set: { healthStatus: 'account-token', error: `${e.message}` } }
        );
      }

      debugError(`Error occured while connecting to facebook ${e.message}`);
      return next(e);
    }

    debugResponse(debugInstagram, req, JSON.stringify(pages));

    return res.json(pages);
  });

  // Facebook endpoint verifier
  app.get('/instagram/receive', async (req, res) => {
    const FACEBOOK_VERIFY_TOKEN = await getConfig('FACEBOOK_VERIFY_TOKEN');

    // when the endpoint is registered as a webhook, it must echo back
    // the 'hub.challenge' value it receives in the query arguments
    if (req.query['hub.mode'] === 'subscribe') {
      if (req.query['hub.verify_token'] === FACEBOOK_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
      } else {
        res.send('OK');
      }
    }
  });

  app.post('/instagram/receive', async (req, res, next) => {
    const data = req.body;

    if (data.object !== 'instagram') {
      return;
    }

    for (const entry of data.entry) {
      // receive chat
      if (entry.messaging[0]) {
        const messageData = entry.messaging[0];

        try {
          await receiveMessage(messageData);

          return res.send('success');
        } catch (e) {
          return res.send('success');
        }
      }
    }

    next();
  });
};

export default init;
