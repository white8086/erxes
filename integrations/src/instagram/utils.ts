import * as graph from 'fbgraph';
import { debugError, debugInstagram } from '../debuggers';
import { getPageAccessTokenFromMap } from '../facebook/utils';
import { Integrations } from '../models';
import { generateAttachmentUrl } from '../utils';
import { IAttachment, IAttachmentMessage } from './types';

export const graphRequest = {
  base(method: string, path?: any, accessToken?: any, ...otherParams) {
    // set access token
    graph.setAccessToken(accessToken);
    graph.setVersion('7.0');

    return new Promise((resolve, reject) => {
      graph[method](path, ...otherParams, (error, response) => {
        if (error) {
          return reject(error);
        }
        return resolve(response);
      });
    });
  },
  get(...args): any {
    return this.base('get', ...args);
  },

  post(...args): any {
    return this.base('post', ...args);
  },

  delete(...args): any {
    return this.base('del', ...args);
  }
};

export const getPageList = async (accessToken?: string) => {
  const response: any = await graphRequest.get(
    '/me/accounts?fields=instagram_business_account, access_token,id,name',
    accessToken
  );

  const pages = [];

  for (const page of response.data) {
    if (page.instagram_business_account) {
      const pageId = page.instagram_business_account.id;
      const accounInfo: any = await graphRequest.get(
        `${pageId}?fields=username`,
        accessToken
      );

      pages.push({ id: accounInfo.id, name: accounInfo.username });
    }
  }

  return pages;
};

export const getFacebookPageIdsForInsta = async (
  accessToken: string,
  instagramPageIds: string[]
) => {
  const response: any = await graphRequest.get(
    '/me/accounts?fields=instagram_business_account, access_token,id,name',
    accessToken
  );

  const pageIds = [];

  for (const page of response.data) {
    if (page.instagram_business_account) {
      const pageId = page.instagram_business_account.id;
      if (pageId === instagramPageIds[0]) {
        pageIds.push(page.id);
      }
    }
  }

  return pageIds;
};

export const getInstagramUser = async (
  userId: string,
  facebookPageIds: string[],
  facebookPageTokensMap: { [key: string]: string }
) => {
  const token = await getPageAccessTokenFromMap(
    facebookPageIds[0],
    facebookPageTokensMap
  );

  const accounInfo: any = await graphRequest.get(
    `${userId}?fields=name,profile_pic`,
    token
  );

  return accounInfo;
};

export const generateAttachmentMessages = (attachments: IAttachment[]) => {
  const messages: IAttachmentMessage[] = [];

  for (const attachment of attachments || []) {
    let type = 'file';

    if (attachment.type.startsWith('image')) {
      type = 'image';
    }

    const url = generateAttachmentUrl(attachment.url);

    messages.push({
      attachment: {
        type,
        payload: {
          url
        }
      }
    });
  }

  return messages;
};

export const sendReply = async (
  url: string,
  data: any,
  integrationId: string
) => {
  const integration = await Integrations.getIntegration({
    erxesApiId: integrationId
  });

  const { facebookPageTokensMap, facebookPageIds } = integration;

  let pageAccessToken;

  try {
    pageAccessToken = getPageAccessTokenFromMap(
      facebookPageIds[0],
      facebookPageTokensMap
    );
  } catch (e) {
    debugError(
      `Error ocurred while trying to get page access token with ${e.message}`
    );
    return e;
  }

  console.log(pageAccessToken);

  try {
    const response = await graphRequest.post(`${url}`, pageAccessToken, {
      ...data
    });
    debugInstagram(
      `Successfully sent data to instagram ${JSON.stringify(data)}`
    );
    return response;
  } catch (e) {
    debugError(
      `Error ocurred while trying to send post request to facebook ${
        e.message
      } data: ${JSON.stringify(data)}`
    );

    throw new Error(e.message);
  }
};
