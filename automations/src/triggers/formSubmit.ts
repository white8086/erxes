import Automations from "../models/Automations"


export const isLogicFulfilled = (condition: any, valueToTest: any) => {
  const operator = condition.operator;
  const value: any = condition.value;

  // is
  if (operator === 'is' && valueToTest !== value) {
    return false;
  }

  // isNot
  if (operator === 'isNot' && valueToTest === value) {
    return false;
  }

  // isUnknown
  if (operator === 'isUnknown' && valueToTest) {
    return false;
  }

  // hasAnyValue
  if (operator === 'hasAnyValue' && !valueToTest) {
    return false;
  }

  // startsWith
  if (
    operator === 'startsWith' &&
    valueToTest &&
    !valueToTest.startsWith(value)
  ) {
    return false;
  }

  // endsWith
  if (
    operator === 'endsWith' &&
    valueToTest &&
    !valueToTest.endsWith(value)
  ) {
    return false;
  }

  // contains
  if (
    operator === 'contains' &&
    valueToTest &&
    !valueToTest.includes(value)
  ) {
    return false;
  }

  // greaterThan
  if (
    operator === 'greaterThan' &&
    valueToTest < parseInt(value, 10)
  ) {
    return false;
  }

  if (operator === 'lessThan' && valueToTest > parseInt(value, 10)) {
    return false;
  }

  if (operator === 'doesNotContain' && valueToTest.includes(value)) {
    return false;
  }

  return true;
};

export const formSubmit = async ({ trigger, data, targetId }) => {

  console.log("targetId: ", targetId)
  console.log("trigger: ", trigger)

  console.log("data: ", data)

  const automations = await Automations.find({ 'triggers.config.contentId': targetId, 'triggers.type': 'formSubmit' });


  if (automations.length === 0) {
    return false;
  }

  if (!trigger.actionId) {
    return false;
  }

  const submissions = data.submissions || [];

  const checkOrCondition = (conditions) => {
    for (const condition of conditions) {
      const submission = submissions.find(s => s._id === condition.fieldId);
      if (!submission) {
        break;
      }

      if (isLogicFulfilled(condition, submission.value)) {
        return true
      }

      return false;
    }
  }

  const checkAndCondition = (conditions) => {
    const results = [];

    for (const condition of conditions) {
      const submission = submissions.find(s => s._id === condition.fieldId);
      if (!submission) {
        return false;
      }

      if (isLogicFulfilled(condition, submission.value)) {
        results.push(true);
        break;
      }

      results.push(false);

    }

    if (results.includes(false)) {
      return false;
    }

    return true;
  }

  const checkIfAction = (action) => {
    const { config = {} } = action;

    const conditions = config.fieldConditions || [];

    if (config.condition && config.condition === 'OR') {
      checkOrCondition(conditions)
    }

    if (config.condition && config.condition === 'AND') {
      checkAndCondition(conditions)
    }
  }

  // check each actions of automations and process action
  for (const { actions } of automations) {
    const action = actions.find(e => e.id === trigger.actionId);

    if (!action) {
      break;
    }

    if (action.type === 'if') {
      checkIfAction(action);

    }

  }

  return true;
}