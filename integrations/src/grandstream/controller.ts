import { debugError, debugGrandStream, debugRequest } from '../debuggers';
import { routeErrorHandling } from '../helpers';
import { sendRPCMessage } from '../messageBroker';
import { Integrations, Logs } from '../models';
import { Conversations, Customers } from './models';

const init = async app => {
  app.post(
    '/grandstream/create-integration',
    routeErrorHandling(async (req, res) => {
      debugRequest(debugGrandStream, req);

      const { integrationId, data } = req.body;
      const { phoneNumber, recordUrl } = JSON.parse(data || '{}');

      // Check existing Integration
      const integration = await Integrations.findOne({
        kind: 'grandstream',
        phoneNumber
      }).lean();

      if (integration) {
        const message = `Integration already exists with this phone number: ${phoneNumber}`;

        debugGrandStream(message);
        throw new Error(message);
      }

      await Integrations.create({
        kind: 'grandstream',
        erxesApiId: integrationId,
        phoneNumber,
        recordUrl
      });

      return res.json({ status: 'ok' });
    })
  );

  app.get(
    '/grandstream/get-audio',
    routeErrorHandling(async (req, res) => {
      debugRequest(debugGrandStream, req);

      const { erxesApiId, integrationId } = req.query;

      const integration = await Integrations.findOne({
        erxesApiId: integrationId
      });

      if (!integration) {
        const message = 'Integration not found';
        debugGrandStream(`Failed to get grandstreamp audio: ${message}`);

        throw new Error(message);
      }

      const conversation = await Conversations.findOne({ erxesApiId });

      if (!conversation) {
        const message = 'Conversation not found';

        debugGrandStream(`Failed to get grandstreamp audio: ${message}`);
        throw new Error(message);
      }

      const { recordUrl } = integration;
      const { callId } = conversation;

      let audioSrc = '';

      if (recordUrl) {
        audioSrc = `${recordUrl}&id=${callId}`;
      }

      return res.json({ audioSrc });
    })
  );

  app.post(
    '/grandstream-receive',
    routeErrorHandling(async (req, res) => {
      debugRequest(debugGrandStream, req);

      const { action_owner, src_trunk_name, disposition, uniqueid } = req.body;

      try {
        await Logs.createLog({
          type: 'grandstream',
          value: req.body,
          specialValue: action_owner || ''
        });
      } catch (e) {
        const message = `Failed creating call pro log. Error: ${e.message}`;

        debugError(message);
        throw new Error(message);
      }

      const integration = await Integrations.findOne({
        phoneNumber: src_trunk_name
      }).lean();

      if (!integration) {
        const message = `Integration not found with: ${src_trunk_name}`;

        debugGrandStream(message);
        throw new Error(message);
      }

      // get customer
      let customer = await Customers.findOne({ phoneNumber: action_owner });

      if (!customer) {
        try {
          customer = await Customers.create({
            phoneNumber: action_owner,
            integrationId: integration._id
          });
        } catch (e) {
          const message = e.message.includes('duplicate')
            ? 'Concurrent request: customer duplication'
            : e.message;

          debugError(message);
          throw new Error(message);
        }

        // save on api
        try {
          const apiCustomerResponse = await sendRPCMessage({
            action: 'get-create-update-customer',
            payload: JSON.stringify({
              integrationId: integration.erxesApiId,
              primaryPhone: action_owner,
              isUser: true,
              phones: [action_owner]
            })
          });

          customer.erxesApiId = apiCustomerResponse._id;
          await customer.save();
        } catch (e) {
          await Customers.deleteOne({ _id: customer._id });

          debugError(e.message);
          throw new Error(e);
        }
      }

      // get conversation
      let conversation = await Conversations.findOne({ callId: uniqueid });

      // create conversation
      if (!conversation) {
        // save on integration db
        try {
          conversation = await Conversations.create({
            state: disposition,
            callId: uniqueid,
            senderPhoneNumber: src_trunk_name,
            recipientPhoneNumber: action_owner,
            integrationId: integration._id
          });
        } catch (e) {
          const message = e.message.includes('duplicate')
            ? 'Concurrent request: conversation duplication'
            : e.message;

          debugError(message);
          throw new Error(message);
        }

        // save on api
        try {
          const apiConversationResponse = await sendRPCMessage({
            action: 'create-or-update-conversation',
            payload: JSON.stringify({
              customerId: customer.erxesApiId,
              content: disposition,
              integrationId: integration.erxesApiId
            })
          });

          conversation.erxesApiId = apiConversationResponse._id;
          await conversation.save();
        } catch (e) {
          await Conversations.deleteOne({ _id: conversation._id });

          debugError(e.message);
          throw new Error(e);
        }
      }

      // Check state of call and update
      if (conversation.state !== disposition) {
        await Conversations.updateOne(
          { callId: uniqueid },
          { $set: { state: disposition } }
        );

        try {
          await sendRPCMessage({
            action: 'create-or-update-conversation',
            payload: JSON.stringify({
              content: disposition,
              conversationId: conversation.erxesApiId
            })
          });
        } catch (e) {
          debugError(e.message);
          throw new Error(e);
        }

        return res.send('success');
      }

      res.send('success');
    })
  );
};

export default init;
