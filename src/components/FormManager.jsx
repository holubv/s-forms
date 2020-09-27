import React from 'react';
import QuestionAnswerProcessor from '../model/QuestionAnswerProcessor';
import { FormQuestionsContext } from '../contexts/FormQuestionsContext';
import Wizard from './wizard/Wizard';
import { FormUtils } from '../s-forms';
import Question from './Question';
import FormWindow from './FormWindow';

class FormManager extends React.Component {
  getFormData = () => {
    const data = this.context.getData();
    const formQuestionsData = this.context.getFormQuestionsData();

    return QuestionAnswerProcessor.buildQuestionAnswerModel(data, formQuestionsData);
  };

  onStepChange = (question, index, change) => {
    this.context.updateFormQuestionsData(index, { ...question, ...change });
  };

  render() {
    const { modalView } = this.props;

    const formQuestionsData = this.context.getFormQuestionsData();

    if (formQuestionsData.every((question) => !FormUtils.isWizardStep(question))) {
      return (
        <div className="p-4">
          {formQuestionsData.map((question, index) => (
            <Question
              key={question['@id']}
              question={question}
              onChange={(index, change) => this.onStepChange(question, index, change)}
              index={index}
            />
          ))}
        </div>
      );
    }

    if (modalView) {
      return (
        <FormWindow>
          <Wizard />
        </FormWindow>
      );
    }

    return <Wizard />;
  }
}

FormManager.contextType = FormQuestionsContext;

export default FormManager;
