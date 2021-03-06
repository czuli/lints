/*jslint node */

"use strict";

const R = require("ramda");
const Bluebird = require("bluebird");

const parseGlobs = require("./parse-globs");
const groupByFiles = require("./group-by-files");
const promiseOptions = require("./promise-options");
const promiseFiles = require("./promise-files");
const {pipeP} = require("./util");

const promiseConfig = pipeP([
    parseGlobs,
    groupByFiles,
    promiseOptions,
    promiseFiles
]);

module.exports = function lints(config, lintersDirectory) {
    return pipeP([
        promiseConfig,
        function instantiateAndRunLinters({
            fileLinters,
            linterConfigs,
            promisedFiles
        }) {
            /*
                eslint-disable
                global-require,
                security/detect-non-literal-require
            */
            const linters = R.mapObjIndexed(
                // eslint-disable-next-line import/no-dynamic-require
                (linterConfig, linterName) => require(
                    lintersDirectory + linterName
                )(linterConfig),
                linterConfigs
            );
            /* eslint-enable */

            return R.mapObjIndexed(
                (linterNames, fileName) => Bluebird.map(
                    linterNames,
                    (linterName) => linters[linterName]({
                        fileName,
                        promisedFile: promisedFiles[fileName]
                    })
                ),
                fileLinters
            );
        },
        Bluebird.props
    ])(config);
};
