export const FIELDS_GROUPS_CONTENT_TYPES = {
  CUSTOMER: 'customer',
  COMPANY: 'company',
  PRODUCT: 'product',
  ALL: ['customer', 'company', 'product'],
};

export const PROPERTY_GROUPS = [
  {
    label: 'Team inbox',
    value: 'inbox',
    types: [
      { value: 'customer', label: 'Customers' },
      { value: 'company', label: 'Companies' },
    ],
  },
  {
    label: 'Tickets',
    value: 'ticket',
    types: [{ value: 'ticket', label: 'Tickets' }],
  },
  { label: 'Tasks', value: 'task', types: [{ value: 'task', label: 'Tasks' }] },
  {
    label: 'Sales pipeline',
    value: 'deal',
    types: [
      { value: 'deal', label: 'Sales pipeline' },
      { value: 'product', label: 'Products & services' },
    ],
  },
  {
    label: 'Contacts',
    value: 'contact',
    types: [
      { value: 'visitor', label: 'Visitors' },
      { value: 'lead', label: 'Leads' },
      { value: 'customer', label: 'Customers' },
      { value: 'company', label: 'Companies' },
    ],
  },
];
