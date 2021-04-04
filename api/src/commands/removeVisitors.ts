import * as dotenv from 'dotenv';
import { stream } from '../data/bulkUtils';
import { connect } from '../db/connection';
import { Conversations, Customers } from '../db/models';

dotenv.config();

const command = async () => {
  console.log(`Process started at: ${new Date()}`);

  await connect();

  const usedCustomerIds = await Conversations.find(
    { customerId: { $exists: true } },
    { customerId: 1 }
  ).distinct('customerId');

  const selector = { $and: [{ state: 'visitor' }, { profileScore: 0 }] };

  const totalCustomersCount = await Customers.find(selector).count();

  console.log('total customers count', totalCustomersCount);

  const perPage = 10000;
  let page = 0;

  while (page * perPage <= totalCustomersCount) {
    console.log(page, perPage);

    const customers = await Customers.aggregate([
      { $match: selector },
      { $project: { _id: '$_id' } },
      { $skip: page * perPage },
      { $limit: perPage }
    ]);

    const customerIds = customers.map(c => c._id);

    console.log('visitors', customerIds.length);

    const idsToRemove = customerIds.filter(e => !usedCustomerIds.includes(e));

    console.log('idsToRemove', idsToRemove.length);

    let deletedCount = 0;

    await stream(
      async chunk => {
        deletedCount = deletedCount + chunk.length;
        console.log('deletedCount', deletedCount);
        await Customers.deleteMany({ _id: { $in: chunk } });
      },
      (variables, root) => {
        const parentIds = variables.parentIds || [];

        parentIds.push(root._id);

        variables.parentIds = parentIds;
      },
      () => {
        return Customers.find(
          {
            _id: { $in: idsToRemove }
          },
          { _id: 1 }
        ) as any;
      },
      1000
    );

    page++;
  }
};

command().then(() => {
  console.log(`Process finished at: ${new Date()}`);
  process.exit();
});
