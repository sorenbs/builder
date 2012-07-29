'use strict';

/* Controllers */


function MenuCtrl($scope, pubSub, dataBridge, versionManager, host) {
    $scope.versions = [];
    pubSub.sub('Server.history', function (data) {
        console.log(data);
        $scope.versions = data;
        $scope.$apply();
    });

    pubSub.sub('Server.newHistoryItem', function(data) {
        $scope.versions.unshift(data);
        $scope.$apply();
    });
    
    pubSub.sub('Server.templates', function (data) {
        $scope.templates = data;
        $scope.$apply();
    });

    if (versionManager.getId()) {
        getStateFromServer(versionManager.getId(), versionManager.getVersion());
    }
    getTemplatesFromServer();

    $scope.loadTemplate = function (name) {
        for(var template in $scope.templates) {
            if($scope.templates[template].name == name) {
                pubSub.pub('Server.code', $scope.templates[template].code);
                break;
            }
        }
    };

    $scope.saveToServer = function () {
        console.log(343434);
        $.ajax({
            type: 'POST',
            url: host + "/api/craft/" + versionManager.getId() +"/code/" + versionManager.getVersion(),
            data: { code: dataBridge.retrieve('Editor.value') },
            success: function (data) {
                if (data.error) {
                    pubSub.pub('Console.log', "Problem saving: " + data.error);
                } else {
                    versionManager.set(data.id, data.version);
                    pubSub.pub('Console.log', "Saved version " + data.version);
                    pubSub.pub('Server.newHistoryItem', data.newVersion);
                }
            }
        });
    };

    $scope.loadVersion = function (version) {
        getStateFromServer(versionManager.getId(), version);
    };

    function getStateFromServer(id, version) {
        $.ajax({
            url: host + "/api/craft/" + id + "/code/" + version,
            success: function (data) {
                if (data.error) {
                    pubSub.pub('Console.log', "AWK!, " + data.error);
                } else {
                    if (data && data.code != "") {
                        pubSub.pub('Server.code', data.code);
                    }
                    if (data.history) {
                        pubSub.pub('Server.history', data.history);
                    }
                }
            },
            dataType: 'json'
        });
    }
    
    function getTemplatesFromServer() {
        $.ajax({
            url: host + "/api/templates",
            success: function (data) {
                    if (data.templates) {
                        pubSub.pub('Server.templates', data.templates);
                    }
            },
            dataType: 'json'
        });
    }
}
//MenuCtrl.$inject = [];

function CodeEditorController($scope, pubSub, dataBridge) {
    var firstLogInSession = true, codeMirrorInstance = null, codeArea = null, markedErrorLine = 0;
    initCodemirror();

    dataBridge.provide('Editor.value', function () {
        return codeArea.value;
    });

    pubSub.sub('Server.code', function (value) {
        codeMirrorInstance.setValue(value);
    });

    pubSub.sub('Errors.mark', function (line) {
        console.log(line);
        codeMirrorInstance.setLineClass(markedErrorLine, null);
        codeMirrorInstance.setLineClass(line-1, "errorLine");
        markedErrorLine = line - 1;

        var errorPosition = codeMirrorInstance.charCoords({ line: line - 1, ch: 5 }, "local");
        //codeMirrorInstance.scrollTo(errorPosition.x, errorPosition.y);
    });

    pubSub.sub('Errors.clear', function(line) {
        codeMirrorInstance.setLineClass(markedErrorLine, null);
        markedErrorLine = 0;
    });

    function initCodemirror() {
        codeArea = document.getElementById('Code');
        codeMirrorInstance = CodeMirror.fromTextArea(codeArea,
        {
            mode: 'javascript',
            theme: 'ambiance',
            lineNumbers: true,
            indentUnit: 4,
            indentWithTabs: true,
            extraKeys: { "Ctrl-Space": "autocomplete" },
            lineWrapping: true,
            onChange: processInput
        });
    }

    function processInput() {
        codeMirrorInstance.save();
        firstLogInSession = true;
        Crafty.stop(true);

        if (containsSyntacticErrors(codeArea.value)) {
            logAndMark(JSLINT.errors[0].reason, JSLINT.errors[0].line, JSLINT.errors[0].character);
        } else {
            evalScript(codeArea.value);
        }

        //Clear the log if no errors
        if (firstLogInSession) {
            log("");
        }
    }

    function containsSyntacticErrors(script) {
        return !JSLINT(script, {
            browser: true,
            devel: true,
            passfail: true,
            bitwise: true,
            continue: true,
            debug: true,
            eqeq: true,
            es5: true,
            evil: true,
            forin: true,
            newcap: true,
            nomen: true,
            plusplus: true,
            regexp: true,
            undef: true,
            unparam: true,
            sloppy: true,
            stupid: true,
            sub: true,
            vars: true,
            white: true,
            css: true,
            cap: true,
            on: true,
            fragment: true,
            predef: { Crafty: true }
        });
    }

    ///
    /// modify the script to log errors and inject into script tag in body
    ///
    function evalScript(script) {
        try {
            var scriptTag = document.createElement('script');
            scriptTag.id = 'scriptEvaluator';
            scriptTag.type = 'text/javascript';
            scriptTag.appendChild(document.createTextNode("try { (function() {\n" + script + "})()} catch (er) {\n logError(er);}"));

            document.getElementById('scriptEvaluator').parentNode.replaceChild(scriptTag, document.getElementById('scriptEvaluator'));
        } catch (ex) {
            throw ex;
            //logError(ex);
        }
    }

    function log(msg) {
        console.log(msg);
        if (firstLogInSession) {
            pubSub.pub('Console.clear');
            pubSub.pub('Errors.clear');
        }
        firstLogInSession = false;
        pubSub.pub('Console.log', msg);
    }
    
    function logAndMark(msg, line, col) {
        log(msg + " " + line + ":" + col);
        pubSub.pub('Errors.mark', line);
    }

    function logError(ex) {
        console.log('tada');
        try {
            // get line and column from chrome stack trace. Syntax: 
            //ReferenceError: b is not defined
            //	at http://localhost:8080/craft/115/1:2:9
            //	at http://localhost:8080/craft/115/1:48:3
            //	at Object.onChange (http://localhost:8080/craft/115/1:137:21)
            //	at endOperation (http://localhost:8080/static/CodeMirror/lib/codemirror.js:1862:17)
            //	at p (http://localhost:8080/static/CodeMirror/lib/codemirror.js:833:9) 

            var interestingLine = ex.stack.split('\n')[1];
            var parts = interestingLine.split(':').length;
            var line = interestingLine.split(':')[parts - 2] - 1;
            var col = interestingLine.split(':')[parts - 1];
            logAndMark(ex.message, line, col);
        } catch (ex2) {
            log(ex);
        }
    }
}

function ConsoleController($scope, pubSub) {
    var codeMirrorInstance = null, consoleArea = null;
    initCodemirror();

    pubSub.sub('Console.log', function (msg) {
        if (codeMirrorInstance.getValue() === "") {
            codeMirrorInstance.setValue(msg);
        } else {
            codeMirrorInstance.setValue(codeMirrorInstance.getValue() + "\n" + msg);
        }
    });

    pubSub.sub('Console.clear', function () {
        codeMirrorInstance.setValue("");
    });


    function initCodemirror() {
        consoleArea = document.getElementById('Console');
        codeMirrorInstance = CodeMirror.fromTextArea(consoleArea,
        {
            mode: 'javascript',
            theme: 'ambiance',
            lineNumbers: true,
            indentUnit: 4,
            indentWithTabs: true,
            extraKeys: { "Ctrl-Space": "autocomplete" },
            lineWrapping: true
        });
    }
}