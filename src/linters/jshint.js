/*jslint node */

"use strict";

const jshint = require("jshint").JSHINT;
const Bluebird = require("bluebird");

const {pipeP} = require("../util");

module.exports = function makeLinter({promisedOptions}) {
    return function lint({promisedFile}) {
        return pipeP([
            Bluebird.props,
            function lintAndAdaptWarnings({options, file}) {
                jshint(file, options);

                return {
                    linterName: "JSHint",
                    warnings: jshint.errors.map(function adaptWarning({
                        line,
                        character: column,
                        reason: message,
                        code: ruleId
                    }) {
                        return {
                            line,
                            column,
                            message,
                            ruleId
                        };
                    })
                };
            }
        ])({
            options: promisedOptions,
            file: promisedFile
        });
    };
};
