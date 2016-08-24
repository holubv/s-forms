'use strict';

import React from 'react';
import JsonLdUtils from 'jsonld-utils';
import TestUtils from 'react-addons-test-utils';

import Environment from '../environment/Environment';
import Generator from '../environment/Generator';

import Answer from '../../src/components/Answer';
import Configuration from '../../src/model/Configuration';
import Constants from '../../src/constants/Constants';

describe('Answer component', () => {

    var question,
        onChange,
        answer,

        optionsStore,
        actions;

    beforeEach(() => {
        question = {
            "@id": Generator.getRandomUri()
        };
        question[Constants.LAYOUT_CLASS] = [];
        question[JsonLdUtils.RDFS_LABEL] = {
            "@language": "en",
            "@value": "1 - Aerodrome General"
        };
        question[JsonLdUtils.RDFS_COMMENT] = {
            "@language": "en",
            "@value": "The identification of the aerodrome/helicopter landing area by name, location and status."
        };
        onChange = jasmine.createSpy('onChange');
        Configuration.intl = {
            locale: 'en'
        };
        optionsStore = jasmine.createSpyObj('OptionsStore', ['listen', 'getOptions']);
        optionsStore.getOptions.and.returnValue([]);
        Configuration.optionsStore = optionsStore;
        actions = jasmine.createSpyObj('Actions', ['loadFormOptions']);
        Configuration.actions = actions;
    });

    it('renders a Typeahead when layout class is typeahead', () => {
        question[Constants.LAYOUT_CLASS].push(Constants.LAYOUT.QUESTION_TYPEAHEAD);
        var component = Environment.render(<Answer answer={{}} question={question} onChange={onChange}/>);

        var typeahead = TestUtils.findRenderedComponentWithType(component, require('react-bootstrap-typeahead'));
        expect(typeahead).not.toBeNull();
    });

    it('loads typeahead options when layout class is typeahead and no possible values are specified', () => {
        question[Constants.LAYOUT_CLASS].push(Constants.LAYOUT.QUESTION_TYPEAHEAD);
        var query = 'SELECT * WHERE { ?x ?y ?z .}';
        question[Constants.HAS_OPTIONS_QUERY] = query;
        var component = Environment.render(<Answer answer={{}} question={question} onChange={onChange}/>);

        expect(actions.loadFormOptions).toHaveBeenCalled();
        expect(actions.loadFormOptions.calls.argsFor(0)[1]).toEqual(query);
    });

    it('maps answer object value to string label for the typeahead component', () => {
        var value = Generator.getRandomUri(),
            valueLabel = 'masterchief';
        var options = Generator.generateTypeaheadOptions(value, valueLabel);
        answer = answerWithCodeValue(value);
        optionsStore.getOptions.and.returnValue(options);
        question[Constants.HAS_ANSWER] = [answer];
        question[Constants.LAYOUT_CLASS].push(Constants.LAYOUT.QUESTION_TYPEAHEAD);
        question[Constants.HAS_OPTIONS_QUERY] = 'SELECT * WHERE {?x ?y ?z. }';
        var component = Environment.render(<Answer answer={answer} question={question} onChange={onChange}/>);

        var typeahead = TestUtils.findRenderedComponentWithType(component, require('react-bootstrap-typeahead'));
        expect(typeahead).not.toBeNull();
        expect(typeahead.state.entryValue).toEqual(valueLabel);
    });

    function answerWithCodeValue(value) {
        var res = {
            "@id": Generator.getRandomUri()
        };
        res[Constants.HAS_OBJECT_VALUE] = {
            '@id': value
        };
        return res;
    }

    it('shows input with text value of the answer when no layout class is specified', () => {
        var value = 'masterchief';
        answer = answerWithTextValue(value);
        question[Constants.HAS_ANSWER] = [answer];
        var component = Environment.render(<Answer answer={answer} question={question} onChange={onChange}/>),

            input = TestUtils.findRenderedDOMComponentWithTag(component, 'input');
        expect(input).not.toBeNull();
        expect(input.type).toEqual('text');
        expect(input.value).toEqual(value);
    });

    function answerWithTextValue(value) {
        var res = {
            "@id": Generator.getRandomUri()
        };
        res[Constants.HAS_DATA_VALUE] = {
            "@language": "en",
            "@value": value
        };
        return res;
    }

    it('renders date picker with answer value when date layout class is specified', () => {
        var date = new Date(),
            value = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
        answer = answerWithTextValue(value);
        question[Constants.HAS_ANSWER] = [answer];
        question[Constants.LAYOUT_CLASS].push(Constants.LAYOUT.DATE);
        Configuration.dateTimeFormat = 'YYYY-MM-DD';
        var component = Environment.render(<Answer answer={answer} question={question} onChange={onChange}/>),

            picker = TestUtils.findRenderedComponentWithType(component, require('kbss-react-bootstrap-datetimepicker').default);
        expect(picker).not.toBeNull();
        expect(picker.props.mode).toEqual('date');
        expect(picker.props.dateTime).toEqual(value);
    });

    it('renders time picker with answer value when time layout class is specified', () => {
        var date = new Date(),
            value = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        answer = answerWithTextValue(value);
        question[Constants.HAS_ANSWER] = [answer];
        question[Constants.LAYOUT_CLASS].push(Constants.LAYOUT.TIME);
        Configuration.dateTimeFormat = 'hh:mm:ss';
        var component = Environment.render(<Answer answer={answer} question={question} onChange={onChange}/>),

            picker = TestUtils.findRenderedComponentWithType(component, require('kbss-react-bootstrap-datetimepicker').default);
        expect(picker).not.toBeNull();
        expect(picker.props.mode).toEqual('time');
        expect(picker.props.dateTime).toEqual(value);
    });

    it('renders datetime picker with answer value when datetime layout class is specified', () => {
        var date = new Date(),
            value = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        answer = answerWithTextValue(value);
        question[Constants.HAS_ANSWER] = [answer];
        question[Constants.LAYOUT_CLASS].push(Constants.LAYOUT.DATETIME);
        Configuration.dateTimeFormat = 'YYYY-MM-DD hh:mm:ss';
        var component = Environment.render(<Answer answer={answer} question={question} onChange={onChange}/>),

            picker = TestUtils.findRenderedComponentWithType(component, require('kbss-react-bootstrap-datetimepicker').default);
        expect(picker).not.toBeNull();
        expect(picker.props.mode).toEqual('datetime');
        expect(picker.props.dateTime).toEqual(value);
    });

    it('renders checkbox with answer value when checkbox layout class is specified', () => {
        var answer = {
            '@id': Generator.getRandomUri()
        };
        answer[Constants.HAS_DATA_VALUE] = true;
        question[Constants.HAS_ANSWER] = [answer];
        question[Constants.LAYOUT_CLASS].push(Constants.LAYOUT.CHECKBOX);
        var component = Environment.render(<Answer answer={answer} question={question} onChange={onChange}/>),

            input = TestUtils.findRenderedDOMComponentWithTag(component, 'input');
        expect(input).toBeDefined();
        expect(input.type).toEqual('checkbox');
        expect(input.checked).toBeTruthy();
    });
});