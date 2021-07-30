import { Customers } from './models';

import { debugError } from '../debuggers';
// import { sendRPCMessage } from '../messageBroker';
import { getInstagramUser } from './utils';
import { Integrations } from '../models';
import { sendRPCMessage } from '../messageBroker';

export const getOrCreateCustomer = async (
  pageId: string,
  userId: string,
  facebookPageIds: string[],
  facebookPageTokensMap: { [key: string]: string }
) => {
  let customer = await Customers.findOne({ userId });

  if (customer) {
    return customer;
  }

  const integration = await Integrations.getIntegration({
    $and: [{ instagramPageIds: { $in: pageId } }, { kind: 'instagram' }]
  });

  // create customer
  let instagramUser = {} as { name: string; profile_pic: string; id: string };

  try {
    instagramUser =
      (await getInstagramUser(
        userId,
        facebookPageIds,
        facebookPageTokensMap
      )) || {};
  } catch (e) {
    console.log('sds');
    debugError(`Error during get customer info: ${e.message}`);
  }

  // save on integrations db
  try {
    customer = await Customers.create({
      userId,
      firstName: instagramUser.name,
      integrationId: integration.erxesApiId,
      profilePic: instagramUser.profile_pic
    });
  } catch (e) {
    console.log(e);
    throw new Error(
      e.message.includes('duplicate')
        ? 'Concurrent request: customer duplication'
        : e
    );
  }

  // save on api
  try {
    const apiCustomerResponse = await sendRPCMessage({
      action: 'get-create-update-customer',
      payload: JSON.stringify({
        integrationId: integration.erxesApiId,
        firstName: instagramUser.name,
        avatar: instagramUser.profile_pic,
        isUser: true
      })
    });

    customer.erxesApiId = apiCustomerResponse._id;
    await customer.save();
  } catch (e) {
    console.log(e);
    await Customers.deleteOne({ _id: customer._id });
    throw new Error(e);
  }
  return customer;
};
