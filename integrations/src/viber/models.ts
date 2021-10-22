import { Document, Model, model, Schema } from 'mongoose';
import { field } from '../models/utils';

export interface ICustomer {
  erxesApiId: string;
  viberId: string;
  integrationId: string;
  name: string;
  avatar?: string;
  language: string;
  country: string;
}

export interface ICustomerDocument extends ICustomer, Document {}

export const customerSchema = new Schema({
  _id: field({ pkey: true }),
  viberId: { type: String, unique: true },
  erxesApiId: String,
  name: String,
  integrationId: String,
  avatar: String,
  language: String,
  country: String
});

export interface ICustomerModel extends Model<ICustomerDocument> {
  getCustomer(selector: any, isLean?: boolean): Promise<ICustomerDocument>;
}

export const loadCustomerClass = () => {
  class Customer {
    public static async getCustomer(selector: any, isLean: boolean) {
      const customer = isLean
        ? await Customers.findOne(selector).lean()
        : await Customers.findOne(selector);

      if (!customer) {
        throw new Error('Customer not found');
      }

      return customer;
    }
  }

  customerSchema.loadClass(Customer);

  return customerSchema;
};

// conversation ===========================

export interface IConversation {
  // id on erxes-api
  erxesApiId?: string;
  timestamp: Date;
  customerId: string;
  content: string;
  integrationId: string;
}

export interface IConversationDocument extends IConversation, Document {}

export const conversationSchema = new Schema({
  _id: field({ pkey: true }),
  erxesApiId: String,
  timestamp: Date,
  customerId: String,
  content: String,
  integrationId: String
});

// conversationSchema.index({ instanceId: 1, recipientId: 1 }, { unique: true });

export interface IConversationModel extends Model<IConversationDocument> {
  getConversation(selector): Promise<IConversationDocument>;
}

export const loadConversationClass = () => {
  class Conversation {
    public static async getConversation(selector) {
      const conversation = await Conversations.findOne(selector);

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      return conversation;
    }
  }

  conversationSchema.loadClass(Conversation);

  return conversationSchema;
};

// conversation message ===========================
export interface IConversationMessage {
  type: string;
  media?: string;
  thumbnail?: string;
  fileName?: string;
  size?: number;
  duration?: number;
  timestamp: Date;
  messageToken: string;
  text?: string;
}

export interface IConversationMessageDocument
  extends IConversationMessage,
    Document {}

export const conversationMessageSchema = new Schema({
  _id: field({ pkey: true }),
  messageToken: { type: String, unique: true },
  conversationId: String,
  type: String,
  media: String,
  thumbnail: String,
  fileName: String,
  size: Number,
  duration: Number,
  timestamp: Date,
  text: String
});

export interface IConversationMessageModel
  extends Model<IConversationMessageDocument> {}

loadCustomerClass();

loadConversationClass();

// tslint:disable-next-line:variable-name
export const Customers = model<ICustomerDocument, ICustomerModel>(
  'customers_ma_viber',
  customerSchema
);

// tslint:disable-next-line:variable-name
export const Conversations = model<IConversationDocument, IConversationModel>(
  'conversations_ma_viber',
  conversationSchema
);

// tslint:disable-next-line:variable-name
export const ConversationMessages = model<
  IConversationMessageDocument,
  IConversationMessageModel
>('conversation_messages_ma_viber', conversationMessageSchema);
