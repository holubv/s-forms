import JsonLdUtils from 'jsonld-utils';
import jsonld from 'jsonld';

import Constants from '../constants/Constants';
import Utils from './Utils';
import JsonLdObjectMap from './JsonLdObjectMap';
import JsonLdObjectUtils from './JsonLdObjectUtils';

export default class FormUtils {
  static isForm(structure) {
    return JsonLdUtils.hasValue(structure, Constants.LAYOUT_CLASS, Constants.LAYOUT.FORM);
  }

  static isWizardStep(structure) {
    return JsonLdUtils.hasValue(structure, Constants.LAYOUT_CLASS, Constants.LAYOUT.WIZARD_STEP);
  }

  static isSection(question) {
    return JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.QUESTION_SECTION);
  }

  static isAnswerable(question) {
    return JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.ANSWERABLE);
  }

  static isTypeahead(question) {
    return JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.QUESTION_TYPEAHEAD);
  }

  static getPossibleValuesQuery(question) {
    return JsonLdUtils.getJsonAttValue(question, Constants.HAS_OPTIONS_QUERY);
  }

  static isDisabled(question) {
    return JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.DISABLED);
  }

  static isHidden(question) {
    return JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.HIDDEN);
  }

  static isTextarea(question, answerValue) {
    return (
      (answerValue && answerValue.length > Constants.INPUT_LENGTH_THRESHOLD && !FormUtils.isTypeahead(question)) ||
      JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.TEXTAREA)
    );
  }

  static isText(question) {
    return JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.TEXT);
  }

  static isCalendar(question) {
    return FormUtils.isDate(question) || FormUtils.isTime(question) || FormUtils.isDateTime(question);
  }

  static isDate(question) {
    return JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.DATE);
  }

  static isTime(question) {
    return JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.TIME);
  }

  static isDateTime(question) {
    return JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.DATETIME);
  }

  static isCheckbox(question) {
    return JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.CHECKBOX);
  }

  static isMaskedInput(question) {
    return JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.MASKED_INPUT);
  }

  static isSparqlInput(question) {
    return JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.SPARQL);
  }

  static isTurtleInput(question) {
    return JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.TURTLE);
  }

  static isCollapsed(question) {
    return JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.COLLAPSED);
  }

  static isEmphasised(question) {
    return JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, Constants.LAYOUT.EMPHASISED);
  }

  static getCategory(question) {
    return Constants.LAYOUT.CATEGORY.find((c) => JsonLdUtils.hasValue(question, Constants.LAYOUT_CLASS, c));
  }

  static resolveValue(answer) {
    if (!answer) {
      return null;
    }
    if (answer[Constants.HAS_OBJECT_VALUE]) {
      return answer[Constants.HAS_OBJECT_VALUE]['@id'];
    } else {
      return JsonLdUtils.getJsonAttValue(answer, Constants.HAS_DATA_VALUE);
    }
  }

  static resolveValueObject(answer) {
    if (!answer) {
      return null;
    }
    if (answer[Constants.HAS_OBJECT_VALUE]) {
      return Utils.asArray(answer[Constants.HAS_OBJECT_VALUE])[0];
    }
    if (answer[Constants.HAS_DATA_VALUE]) {
      return Utils.asArray(answer[Constants.HAS_DATA_VALUE])[0];
    }
    return null;
  }

  static isRelevant(question) {
    if (!question[Constants.IS_RELEVANT_IF]) {
      return true;
    }

    for (let cond of Utils.asArray(question[Constants.IS_RELEVANT_IF])) {
      if (FormUtils.testCondition(cond)) {
        return true;
      }
    }

    return false;
  }

  static hasValidationLogic(question) {
    if (question[Constants.REQUIRES_ANSWER_VALUE]) {
      return true;
    }
    if (question[Constants.REQUIRES_ANSWER]) {
      return true;
    }
    if (question[Constants.REQUIRES_ANSWER_IF]) {
      return true;
    }
    return false;
  }

  static isValid(question) {
    if (question[Constants.HAS_VALID_ANSWER] === false) {
      return false;
    }
    for (const subQ of Utils.asArray(question[Constants.HAS_SUBQUESTION])) {
      if (this.isValid(subQ) === false) {
        return false;
      }
    }

    return true;
  }

  static hasAnyAnswer(question) {
    if (!question) {
      return false;
    }

    if (question.hasOwnProperty(Constants.HAS_ANSWER)) {
      const answers = jsonld.getValues(question, Constants.HAS_ANSWER);
      if (answers.length) {
        const qValue = FormUtils.resolveValueObject(answers[0]);
        if (qValue && qValue['@value']) {
          return true;
        }
      }
    }

    for (const subQ of Utils.asArray(question[Constants.HAS_SUBQUESTION])) {
      if (FormUtils.hasAnyAnswer(subQ)) {
        return true;
      }
    }

    return false;
  }

  static testCondition(condition) {
    const acceptedValidationsValues = condition[Constants.ACCEPTS_VALIDATION_VALUE];
    const acceptedAnswerValues = condition[Constants.ACCEPTS_ANSWER_VALUE];
    const acceptedNonEmptyAnswerValues = condition[Constants.ACCEPTS_NON_EMPTY_ANSWER_VALUE];
    const testedQuestions = condition[Constants.HAS_TESTED_QUESTION];

    let question;

    if (acceptedValidationsValues && acceptedAnswerValues) {
      console.warn('Support for validation and requirement constraints at same time is not implemented !');
    }

    // valid answers
    if (acceptedValidationsValues && testedQuestions) {
      const arr = Utils.asArray(acceptedValidationsValues);
      if (arr.length !== 1 || (arr[0] !== true && arr[0] !== 'true')) {
        console.warn('Validation values other than "true" are not implemented !');
      }
      for (const q of Utils.asArray(testedQuestions)) {
        question = JsonLdObjectMap.getObject(q['@id']);
        if (question === undefined) {
          console.warn('Questions is not loaded in an object map.');
          return true;
        }
        if (this.isValid(question) === false) {
          return false;
        }
      }
      return true;
    }

    // any non empty value
    if (acceptedNonEmptyAnswerValues && testedQuestions) {
      question = JsonLdObjectMap.getObject(testedQuestions['@id']);
      return FormUtils.hasAnyAnswer(question);
    }

    // concrete values
    if (acceptedAnswerValues && testedQuestions) {
      question = JsonLdObjectMap.getObject(testedQuestions['@id']);
      for (const expValue of Utils.asArray(acceptedAnswerValues)) {
        if (!question) {
          console.warn('Question is not defined.');
          return true;
        }
        if (!question.hasOwnProperty(Constants.HAS_ANSWER)) {
          console.warn('Question does not have answer value defined.');
          return true;
        }
        const answers = jsonld.getValues(question, Constants.HAS_ANSWER);

        if (answers.length === 0) {
          return false;
        }
        const qValue = FormUtils.resolveValueObject(answers[0]);

        if (
          qValue &&
          expValue &&
          qValue.hasOwnProperty('@value') &&
          expValue.hasOwnProperty('@id') &&
          qValue['@value'] == expValue['@id']
        ) {
          // TODO remove !, this is temporary fix as type-ahead component returns data-value instead of
          // code-value
          return true;
        }

        if (JsonLdObjectUtils.compareValues(qValue, expValue)) {
          return true;
        }
      }
    }
    return false;
  }
}
