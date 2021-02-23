const commonFields = `
      _id
      name
      description
      order
      isVisible
      isVisibleInDetail
      contentType
      lastUpdatedUser {
        details {
          fullName
        }
      }
      isDefinedByErxes
      fields {
        _id
        contentType
        type
        text
        isVisible
        isVisibleInDetail
        canHide
        validation
        order
        options
        groupId
        description
        isDefinedByErxes
        lastUpdatedUser {
          details {
            fullName
          }
        }
      }
    }
`;

const fieldsGroups = `
  query fieldsGroups($contentType: String!) {
    fieldsGroups(contentType: $contentType) {
      ${commonFields}
  }
`;

const getDefaulFieldsGroup = `
  query getDefaulFieldsGroup($contentType: String!) {
    getDefaulFieldsGroup(contentType: $contentType) {
      ${commonFields}
  }
`;

export default {
  fieldsGroups,
  getDefaulFieldsGroup
};
