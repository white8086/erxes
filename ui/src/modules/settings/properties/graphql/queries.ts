const fieldsGroups = `
  query fieldsGroups($mainType: String, $contentType: String!) {
    fieldsGroups(mainType: $mainType, contentType: $contentType) {
      _id
      name
      description
      order
      isVisible
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
  }
`;

export default {
  fieldsGroups
};
