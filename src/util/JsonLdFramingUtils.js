'use strict';

import jsonld from "jsonld";
import Constants from "../constants/Constants.js";
import FormUtils from "../util/FormUtils";
import Utils from "./Utils";


var formShape = {
    root: {},
    expandProperties: [Constants.HAS_SUBQUESTION, Constants.IS_RELEVANT_IF, Constants.HAS_ANSWER]
};
formShape.root[Constants.HAS_LAYOUT_CLASS] = Constants.FORM;

export default class JsonLdFramingUtils { //TODO revise


    /**
     * Performs JSON-LD custom framing using shapes. Shape is declaration of the JSON-LD framing
     * in a language that is incompatible with JSON-LD specification.
     *
     * @param input the JSON-LD input to framing by a shape.
     * @param shape the JSON-LD custom frame configuration using shapes.
     * @param callback(err, framed) called once the operation completes.
     */
    static customFrame(input, shape, callback) {
        if (arguments.length < 2) {
            return jsonld.nextTick(function () {
                callback(new TypeError('Could not frame, too few arguments.'));
            });
        }

        if (shape === null) { //TODO remove
            shape = formShape;
        }

        var flattened = null,
            err = null,
            flattenedCallback = (e, f) => {
                flattened = f;
                err = e;
            };

        jsonld.flatten(input, null, null, flattenedCallback);
    }


    static modifyStructure(structure) {

        var defs = structure['@graph'],
            i, len, item,
            form, formElements,
            id2objectMap = {}; // mapping @id -> object

        for (i = 0, len = defs.length; i < len; i++) {
            item = defs[i];
            id2objectMap[item["@id"]] = item;
            if (FormUtils.isForm(item)) {
                form = item;
            }
        }

        try {
            this._expandGraph(form, formShape, id2objectMap);
        } catch (e) {
            console.error("Error '" + e + "' occured, while trying to apply frame-ing with custom shape.");
        }

        return;
    }

    static _expandGraph(parentNode, shape, id2ObjectMap) {
        var props = shape.expandProperties,
            childArray, child, childId;

        for (var prop of shape.expandProperties) {
            if (parentNode.hasOwnProperty(prop)) {
                parentNode[prop] = Utils.asArray(parentNode[prop]);
                childArray = parentNode[prop];
                for (var i = 0; i < childArray.length; i++) {
                    childId = childArray[i]["@id"];
                    child = id2ObjectMap[childId];
                    if (child !== undefined) {
                        childArray[i] = child;
                        console.log(childId + " expanded.");
                        this._expandGraph(child, shape, id2ObjectMap);
                    } else {
                        console.warn("object with @id " + childId + " was not defined in input data.")
                    }
                }
            }
        }

    }
}