'use strict';

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
