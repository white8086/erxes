import { Document, Model, model, Schema } from 'mongoose';

interface IStatus {
  date: Date;
  status: string;
}

export interface IRequest {
  engageMessageId?: string;
  to?: string;
  status?: string;
  requestData?: string;
  responseData?: string;
  viberMessageId?: string;
  statusUpdates?: IStatus[];
  errorMessages?: string[];
}

export interface IRequestDocument extends IRequest, Document {}

export interface IRequestModel extends Model<IRequestDocument> {
  createRequest(doc: IRequest): Promise<IRequestDocument>;
  updateRequest(_id: string, doc: IRequest): Promise<IRequestDocument>;
}

const statusSchema = new Schema(
  {
    date: { type: Date, label: 'Status update date' },
    status: { type: String, label: 'Sms delivery status' }
  },
  { _id: false }
);

const schema = new Schema({
  createdAt: { type: Date, default: new Date(), label: 'Created at' },
  engageMessageId: { type: String, label: 'Engage message id' },
  to: { type: String, label: 'Receiver id' },
  requestData: { type: String, label: 'Stringified request JSON' },
  // telnyx data
  status: { type: String, label: 'Sms delivery status' },
  responseData: { type: String, label: 'Stringified response JSON' },
  viberMessageId: { type: String, label: 'viber message id' },
  statusUpdates: { type: [statusSchema], label: 'viber status updates' },
  errorMessages: { type: [String], label: 'Error messages' }
});

export const loadLogClass = () => {
  class Request {
    public static createRequest(doc: IRequest) {
      return Requests.create(doc);
    }

    public static async updateRequest(_id: string, doc: IRequest) {
      await Requests.updateOne({ _id }, { $set: doc });

      return Requests.findOne({ _id });
    }
  }

  schema.loadClass(Request);

  return schema;
};

loadLogClass();

// tslint:disable-next-line
const Requests = model<IRequestDocument, IRequestModel>(
  'engage_viber_requests',
  schema
);

export default Requests;
