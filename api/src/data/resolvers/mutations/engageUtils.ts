import { Transform } from 'stream';
import {
  Customers,
  EngageMessages,
  Integrations,
  Segments,
  Users
} from '../../../db/models';
import { IBrowserInfo } from '../../../db/models/Customers';
import { METHODS } from '../../../db/models/definitions/constants';
import { IMessageDocument } from '../../../db/models/definitions/conversationMessages';
import { ICustomerDocument } from '../../../db/models/definitions/customers';
import { IEngageMessageDocument } from '../../../db/models/definitions/engages';
import { IUserDocument } from '../../../db/models/definitions/users';
import Engages from '../../../db/models/Engages';
import { getNumberOfVisits } from '../../../events';
import messageBroker from '../../../messageBroker';
import { MESSAGE_KINDS } from '../../constants';
import { fetchBySegments } from '../../modules/segments/queryBuilder';
import { chunkArray, replaceEditorAttributes } from '../../utils';

interface IEngageParams {
  engageMessage: IEngageMessageDocument;
  customersSelector: any;
  user: IUserDocument;
}

interface ICheckRulesParams {
  rules: IRule[];
  browserInfo: IBrowserInfo;
  numberOfVisits?: number;
}

/*
 * Checks individual rule
 */
interface IRule {
  value?: string;
  kind: string;
  condition: string;
}

interface ICheckRuleParams {
  rule: IRule;
  browserInfo: IBrowserInfo;
  numberOfVisits?: number;
}
export const getVisitorMessage = async (
  visitor,
  brandId,
  browserInfo,
  integration
) => {
  const messages = await EngageMessages.find({
    'messenger.brandId': brandId,
    method: 'messenger',
    kind: 'visitorAuto',
    isLive: true
  });

  if (!messages || messages.length === 0) {
    return null;
  }

  const conversationMessages: IMessageDocument[] = [];

  for (const message of messages) {
    const messenger = message.messenger ? message.messenger.toJSON() : {};

    const user = await Users.findOne({ _id: message.fromUserId });

    if (!user) {
      continue;
    }
    const numberOfVisits = await getNumberOfVisits({
      url: browserInfo.url,
      visitorId: visitor.visitorId
    });

    const isPassedAllRules = Engages.checkRules({
      rules: messenger.rules,
      browserInfo,
      numberOfVisits
    });

    if (isPassedAllRules) {
      const { replacedContent } = await replaceEditorAttributes({
        content: messenger.content,
        user
      });

      if (messenger.rules) {
        messenger.rules = messenger.rules.map(r => ({
          kind: r.kind,
          text: r.text,
          condition: r.condition,
          value: r.value
        }));
      }

      const conversationMessage = await Engages.createOrUpdateConversationAndMessages(
        {
          visitorId: visitor.visitorId,
          integrationId: integration._id,
          user,
          replacedContent: replacedContent || '',
          engageData: {
            ...messenger,
            content: replacedContent,
            engageKind: message.kind,
            messageId: message._id,
            fromUserId: message.fromUserId
          }
        }
      );

      if (conversationMessage) {
        // collect created messages
        conversationMessages.push(conversationMessage);
      }
    }
  }
  return conversationMessages;
};

export const getCustomerMessage = async (
  customer,
  brandId,
  browserInfo,
  integration
) => {
  const messages = await EngageMessages.find({
    'messenger.brandId': brandId,
    method: 'messenger',
    isLive: true
  });

  const conversationMessages: IMessageDocument[] = [];

  for (const message of messages) {
    const messenger = message.messenger ? message.messenger.toJSON() : {};

    const {
      customerIds = [],
      segmentIds,
      tagIds,
      brandIds,
      fromUserId
    } = message;

    if (
      message.kind === 'manual' &&
      (customerIds || []).length > 0 &&
      !customerIds.includes(customer._id)
    ) {
      continue;
    }

    const customersSelector = {
      _id: customer._id,
      state: { $ne: 'visitor' },
      ...(await generateCustomerSelector({
        customerIds,
        segmentIds,
        tagIds,
        brandIds
      }))
    };

    const customerExists = await Customers.findOne(customersSelector);

    if (message.kind !== 'visitorAuto' && !customerExists) {
      continue;
    }

    if (
      customer &&
      message.kind === 'visitorAuto' &&
      customer.state !== 'visitor'
    ) {
      continue;
    }

    const user = await Users.findOne({ _id: fromUserId });

    if (!user) {
      continue;
    }

    // check for rules ===
    const numberOfVisits = await getNumberOfVisits({
      url: browserInfo.url,
      customerId: customer._id
    });

    const isPassedAllRules = Engages.checkRules({
      rules: messenger.rules,
      browserInfo,
      numberOfVisits
    });

    // if given visitor is matched with given condition then create
    // conversations
    if (isPassedAllRules) {
      // replace keys in content
      const { replacedContent } = await replaceEditorAttributes({
        content: messenger.content,
        customer,
        user
      });

      if (messenger.rules) {
        messenger.rules = messenger.rules.map(r => ({
          kind: r.kind,
          text: r.text,
          condition: r.condition,
          value: r.value
        }));
      }

      const conversationMessage = await Engages.createOrUpdateConversationAndMessages(
        {
          customerId: customer._id,
          integrationId: integration._id,
          user,
          replacedContent: replacedContent || '',
          engageData: {
            ...messenger,
            content: replacedContent,
            engageKind: message.kind,
            messageId: message._id,
            fromUserId: message.fromUserId
          }
        }
      );

      if (conversationMessage) {
        // collect created messages
        conversationMessages.push(conversationMessage);

        // add given customer to customerIds list
        await EngageMessages.updateOne(
          { _id: message._id },
          { $push: { customerIds: customer._id } }
        );
      }
    }
  }

  return conversationMessages;
};

export const generateCustomerSelector = async ({
  customerIds,
  segmentIds = [],
  tagIds = [],
  brandIds = []
}: {
  customerIds?: string[];
  segmentIds?: string[];
  tagIds?: string[];
  brandIds?: string[];
}): Promise<any> => {
  // find matched customers
  let customerQuery: any = {};

  if (customerIds && customerIds.length > 0) {
    customerQuery = { _id: { $in: customerIds } };
  }

  if (tagIds.length > 0) {
    customerQuery = { tagIds: { $in: tagIds } };
  }

  if (brandIds.length > 0) {
    let integrationIds: string[] = [];

    for (const brandId of brandIds) {
      const integrations = await Integrations.findIntegrations({ brandId });

      integrationIds = [...integrationIds, ...integrations.map(i => i._id)];
    }

    customerQuery = { integrationId: { $in: integrationIds } };
  }

  if (segmentIds.length > 0) {
    const segments = await Segments.find({ _id: { $in: segmentIds } });

    let customerIdsBySegments: string[] = [];

    for (const segment of segments) {
      const cIds = await fetchBySegments(segment);

      customerIdsBySegments = [...customerIdsBySegments, ...cIds];
    }

    customerQuery = { _id: { $in: customerIdsBySegments } };
  }

  return {
    ...customerQuery,
    $or: [{ doNotDisturb: 'No' }, { doNotDisturb: { $exists: false } }]
  };
};

const sendQueueMessage = (args: any) => {
  return messageBroker().sendMessage('erxes-api:engages-notification', args);
};

export const send = async (engageMessage: IEngageMessageDocument) => {
  const {
    customerIds,
    segmentIds,
    tagIds,
    brandIds,
    fromUserId,
    scheduleDate
  } = engageMessage;

  // Check for pre scheduled engages
  if (scheduleDate && scheduleDate?.type === 'pre' && scheduleDate.dateTime) {
    const scheduledDate = new Date(scheduleDate.dateTime);
    const now = new Date();

    if (scheduledDate.getTime() > now.getTime()) {
      return;
    }
  }

  const user = await Users.findOne({ _id: fromUserId });

  if (!user) {
    throw new Error('User not found');
  }

  if (!engageMessage.isLive) {
    return;
  }

  const customersSelector = await generateCustomerSelector({
    customerIds,
    segmentIds,
    tagIds,
    brandIds
  });

  if (engageMessage.method === METHODS.EMAIL) {
    return sendEmailOrSms(
      { engageMessage, customersSelector, user },
      'sendEngage'
    );
  }

  if (engageMessage.method === METHODS.SMS) {
    return sendEmailOrSms(
      { engageMessage, customersSelector, user },
      'sendEngageSms'
    );
  }
};

// Prepares queue data to engages-email-sender
const sendEmailOrSms = async (
  { engageMessage, customersSelector, user }: IEngageParams,
  action: 'sendEngage' | 'sendEngageSms'
) => {
  const engageMessageId = engageMessage._id;

  await sendQueueMessage({
    action: 'writeLog',
    data: {
      engageMessageId,
      msg: `Run at ${new Date()}`
    }
  });

  const customerInfos: Array<{
    _id: string;
    primaryEmail?: string;
    emailValidationStatus?: string;
    phoneValidationStatus?: string;
    primaryPhone?: string;
    replacers: Array<{ key: string; value: string }>;
  }> = [];
  const emailConf = engageMessage.email ? engageMessage.email : { content: '' };
  const emailContent = emailConf.content || '';

  const { customerFields } = await replaceEditorAttributes({
    content: emailContent
  });

  const onFinishPiping = async () => {
    if (
      engageMessage.kind === MESSAGE_KINDS.MANUAL &&
      customerInfos.length === 0
    ) {
      await EngageMessages.deleteOne({ _id: engageMessage._id });
      throw new Error('No customers found');
    }

    // save matched customers count
    await EngageMessages.setCustomersCount(
      engageMessage._id,
      'totalCustomersCount',
      customerInfos.length
    );

    await sendQueueMessage({
      action: 'writeLog',
      data: {
        engageMessageId,
        msg: `Matched ${customerInfos.length} customers`
      }
    });

    await EngageMessages.setCustomersCount(
      engageMessage._id,
      'validCustomersCount',
      customerInfos.length
    );

    if (
      engageMessage.scheduleDate &&
      engageMessage.scheduleDate.type === 'pre'
    ) {
      await EngageMessages.updateOne(
        { _id: engageMessage._id },
        { $set: { 'scheduleDate.type': 'sent' } }
      );
    }

    if (customerInfos.length > 0) {
      const data: any = {
        customers: [],
        fromEmail: user.email,
        engageMessageId,
        shortMessage: engageMessage.shortMessage || {}
      };

      if (engageMessage.method === METHODS.EMAIL && engageMessage.email) {
        const { replacedContent } = await replaceEditorAttributes({
          customerFields,
          content: emailContent,
          user
        });

        engageMessage.email.content = replacedContent;

        data.email = engageMessage.email;
      }

      const chunks = chunkArray(customerInfos, 3000);

      for (const chunk of chunks) {
        data.customers = chunk;

        await sendQueueMessage({ action, data });
      }
    }
  };

  const customerTransformerStream = new Transform({
    objectMode: true,

    async transform(customer: ICustomerDocument, _encoding, callback) {
      const { replacers } = await replaceEditorAttributes({
        content: emailContent,
        customer,
        customerFields
      });

      customerInfos.push({
        _id: customer._id,
        primaryEmail: customer.primaryEmail,
        emailValidationStatus: customer.emailValidationStatus,
        phoneValidationStatus: customer.phoneValidationStatus,
        primaryPhone: customer.primaryPhone,
        replacers
      });

      // signal upstream that we are ready to take more data
      callback();
    }
  });

  // generate fields option =======
  const fieldsOption = {
    primaryEmail: 1,
    emailValidationStatus: 1,
    phoneValidationStatus: 1,
    primaryPhone: 1
  };

  for (const field of customerFields || []) {
    fieldsOption[field] = 1;
  }

  const customersStream = (Customers.find(
    customersSelector,
    fieldsOption
  ) as any).stream();

  return new Promise((resolve, reject) => {
    const pipe = customersStream.pipe(customerTransformerStream);

    pipe.on('finish', async () => {
      try {
        await onFinishPiping();
      } catch (e) {
        return reject(e);
      }

      resolve('done');
    });
  });
};

export const checkRules = (params: ICheckRulesParams) => {
  const { rules, browserInfo, numberOfVisits } = params;

  let passedAllRules = true;

  rules.forEach(rule => {
    // check individual rule
    if (checkRule({ rule, browserInfo, numberOfVisits })) {
      passedAllRules = false;
      return;
    }
  });

  return passedAllRules;
};

const checkRule = (params: ICheckRuleParams) => {
  const { rule, browserInfo, numberOfVisits } = params;
  const { language, url, city, countryCode } = browserInfo;
  const { value, kind, condition } = rule;
  const ruleValue: any = value;

  let valueToTest: any;

  if (kind === 'browserLanguage') {
    valueToTest = language;
  }

  if (kind === 'currentPageUrl') {
    valueToTest = url;
  }

  if (kind === 'city') {
    valueToTest = city;
  }

  if (kind === 'country') {
    valueToTest = countryCode;
  }

  if (kind === 'numberOfVisits') {
    valueToTest = numberOfVisits;
  }

  // is
  if (condition === 'is' && valueToTest !== ruleValue) {
    return false;
  }

  // isNot
  if (condition === 'isNot' && valueToTest === ruleValue) {
    return false;
  }

  // isUnknown
  if (condition === 'isUnknown' && valueToTest) {
    return false;
  }

  // hasAnyValue
  if (condition === 'hasAnyValue' && !valueToTest) {
    return false;
  }

  // startsWith
  if (
    condition === 'startsWith' &&
    valueToTest &&
    !valueToTest.startsWith(ruleValue)
  ) {
    return false;
  }

  // endsWith
  if (
    condition === 'endsWith' &&
    valueToTest &&
    !valueToTest.endsWith(ruleValue)
  ) {
    return false;
  }

  // contains
  if (
    condition === 'contains' &&
    valueToTest &&
    !valueToTest.includes(ruleValue)
  ) {
    return false;
  }

  // greaterThan
  if (condition === 'greaterThan' && valueToTest < parseInt(ruleValue, 10)) {
    return false;
  }

  if (condition === 'lessThan' && valueToTest > parseInt(ruleValue, 10)) {
    return false;
  }

  if (condition === 'doesNotContain' && valueToTest.includes(ruleValue)) {
    return false;
  }

  return true;
};
