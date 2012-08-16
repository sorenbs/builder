'use strict';

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
    	CodeMirror.commands.autocomplete = function (cm) {
    		CodeMirror.simpleHint(cm, CodeMirror.javascriptHint);
    	};
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
	    processInput();
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
            scriptTag.appendChild(document.createTextNode("try { (function() {\n" + script + "})()} catch (er) {\n angular.element('#codeContainer').scope().logError(er);}"));

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

    $scope.logError = function(ex) {
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