'use strict';

function EmbedController($scope, pubSub, server, versionManager, dynamicHost, staticHost) {
    var codeMirrorInstance = null, codeArea = null;
    initCodemirror();

    pubSub.sub('Server.code', function (value) {
        console.log(value);
        codeMirrorInstance.setValue(value);
        codeMirrorInstance.save();
        Crafty.stop(true);
        evalScript(codeArea.value);
    });

    server.getState();

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
                readOnly: 'nocursor',
                lineWrapping: true
            });
    }

    $scope.display = function (what) {
        if (what === 'editor') {
            $('#codeContainer').removeClass('hidden');
            $('#gameContainer').addClass('hidden');
            codeMirrorInstance.refresh();
        } else {
            $('#codeContainer').addClass('hidden');
            $('#gameContainer').removeClass('hidden');
        }
    };

    $scope.display('game');

    function evalScript(script) {
        try {
            var scriptTag = document.createElement('script');
            scriptTag.id = 'scriptEvaluator';
            scriptTag.type = 'text/javascript';
            scriptTag.appendChild(document.createTextNode("try { (function() {\n" + script + "})()} catch (er) {\n console.log(er);}"));

            document.getElementById('scriptEvaluator').parentNode.replaceChild(scriptTag, document.getElementById('scriptEvaluator'));
        } catch (ex) {
            throw ex;
        }
    };


    $scope.fork = function () {
        $.ajax({
            type: 'POST',
            url: dynamicHost + "/api/craft/" + versionManager.getId() + "/fork/" + versionManager.getVersion(),
            data: {},
            success: function (data) {
                if (data.error) {
                    console.log("Problem forking: " + data.error);
                } else {
                    window.location = staticHost + 'index.html?id=' + data.id + '&version=0';
                }
            }
        });
    };
}
