angular.module('wctp', ['format']);


//not used I think
angular.module('wctp').factory('WCTPMessageFormatter', ['$http', '$q', function ($http, $q) {
    return function (xml) {
        var delay = $q.defer();
        var data = angular.fromJson({"content": xml});

        $http.post("api/xml/format", data, {timeout: 60000}).then(
            function (response) {
                delay.resolve(response.data.content);
            },
            function (response) {
                delay.reject(response.data);
            }
        );
        return delay.promise;
    };
}]);

angular.module('wctp').factory('WCTPTreeService',
    ['WCTPCursorService', 'TreeService' , 'WCTPNodeFinder', function (WCTPCursorService, TreeService,WCTPNodeFinder) {

        var WCTPTreeServiceClass = function () {
            TreeService.call(this, arguments);
        };

       	WCTPTreeServiceClass.prototype = Object.create(TreeService.prototype);
        WCTPTreeServiceClass.prototype.constructor = WCTPTreeServiceClass;


        /**
         *
         * @param treeObject
         * @param cursorObject
         */
        WCTPTreeServiceClass.prototype.selectNode = function (treeObject, cursorObject) {
            var found = this.find(treeObject, cursorObject);
            if (found !== null) {
                var selectedNode = treeObject.get_selected_branch();
                if (selectedNode !== found) {
                    treeObject.collapse_all();
                    treeObject.select_branch(found);
                    treeObject.expand_branch(found);
                    cursorObject.start = found.data.start;
                    cursorObject.end = found.data.end;
                }
            }
        };

        /**
         *
         * @param node
         * @returns {*|Object|Array|string|number|Object|Array|Date|string|number}
         */
        WCTPTreeServiceClass.prototype.getCoordinate = function (node) {
            return WCTPCursorService.createCoordinate(node.data.start, node.data.end);
        };

        /**
         *
         * @param node
         * @param cursorObject
         */
            WCTPTreeServiceClass.prototype.setCoordinate = function (node, cursorObject) {
                try {
                    var coordinate = this.getCoordinate(node);
                    if (coordinate !== null) {
                        cursorObject.start = coordinate.start;
                        cursorObject.end = coordinate.end;
                        cursorObject.notify();
                    }
                } catch (e) {

                }
            };



        /**
         *
         * @param tree
         * @param cursorObject
         * @returns {*}
         */
        WCTPTreeServiceClass.prototype.findByIndex = function (tree, cursorObject, message) {
            var firstNode = tree.get_first_branch();
            var children = tree.get_siblings(firstNode);
            if (children) {
                var node = children[0];
                if (node == null) return null;
                if( cursorObject.start)
                return WCTPNodeFinder.findNodeByLineNumber(tree, node, cursorObject.start.line);
            }
            return null;
        };

        /**
         *
         * @param tree
         * @param line
         * @param path
         * @returns {*}
         */
        WCTPTreeServiceClass.prototype.findByPath = function (tree, line) {
//            var parent = this.findNodeByLineNumber(tree, line);
//            if (parent == undefined || parent == null) return null;
//            return XMLNodeFinder.findNodeByLineNumber(tree, parent, line);
//
            if(typeof tree.get_first_branch  == 'function') {
                var firstNode = tree.get_first_branch();
                var children = tree.get_siblings(firstNode);
                if (children) {
                    var parent = children[0];
                    if (parent == null) return null;
                    return WCTPNodeFinder.findNodeByLineNumber(tree, parent, line);
                }
            }
            return null;
        };

        /**
         *
         * @param tree
         * @param node
         * @param lineNumber
         * @param startIndex
         * @param endIndex
         * @returns {*}
         */
        WCTPTreeServiceClass.prototype.findNodeByPath = function (tree, node, lineNumber) {
            return WCTPNodeFinder.findNodeByLineNumber(tree, node, lineNumber);
         };


        /**
         *
         * @param tree
         * @param node
         * @param lineNumber
         * @param startIndex
         * @param endIndex
         * @returns {*}
         */
        WCTPTreeServiceClass.prototype.findNodeByIndex = function (tree, node, lineNumber) {
            if (node.data.lineNumber <= lineNumber) {
//                var endInd = this.getEndIndex(node, message);
//                if (angular.equals(node.data.startIndex, startIndex) && angular.equals(endInd, endIndex)) {
//                    return this.findLastChild(tree, node);
//                }
                if (node.data.lineNumber == lineNumber) {
                    return node;
                }

                var children = tree.get_children(node);
                if (children && children.length > 0) {
                    for (var i = 0; i < children.length; i++) {
                        var found = WCTPNodeFinder.findNodeByIndex(tree, children[i], lineNumber);
                        if (found != null) {
                            return found;
                        }
                    }
                }
            }
            return null;
        };


        WCTPTreeServiceClass.prototype.selectNodeByPath = function (treeObject, lineNumber) {
            var found = this.findByPath(treeObject, lineNumber);
            if (found !== null) {
                var selectedNode = treeObject.get_selected_branch();
                if (selectedNode !== found) {
                    treeObject.collapse_all();
                    treeObject.select_branch(found);
                    treeObject.expand_branch(found);
                }
            }
            return found;

        };

//        /**
//         *
//         * @param type
//         * @param path
//         * @param segment
//         * @returns {*}
//         */
//        HL7V2TreeServiceClass.prototype.getStringValue = function (type, path, segment) {
//            var position = HL7V2Service.getPosition(path, type);
//            var instanceNumber = HL7V2Service.getInstanceNumber(path, type);
//            switch (type) {
//                case "SEGMENT":
//                {
//                    return segment.replace("\r", "");
//                }
//                case "FIELD":
//                {
//                    if (segment.startsWith("MSH") && position == 1) return "";
//                    var index = segment.startsWith("MSH") ? position - 2 : position - 1;
//                    var container = segment.substring(4).split("|");
//                    return (instanceNumber > 1 ? container[index].split("~")[instanceNumber - 1] : container[index]).replace("\r", "");
//                }
//                case "COMPONENT":
//                {
//                    var container = this.getStringValue("FIELD", path, segment);
//                    return (instanceNumber > 1 ? container.split("^")[position - 1].split("~")[instanceNumber - 1] : container.split("^")[position - 1]).replace("\r", "");
//                }
//
//                case "SUB_COMPONENT":
//                {
//                    var container = this.getStringValue("COMPONENT", path, segment);
//                    var children = container.split("&");
//                    return  (instanceNumber > 1 ? children[position - 1].split("~")[instanceNumber - 1] : children[position - 1]).replace("\r", "");
//                }
//            }
//        };
//
//        HL7V2TreeServiceClass.prototype.getEndIndex = function (node, message) {
//            try {
//                var data = node.data;
//                if (data.endIndex != undefined && data.endIndex != -1) {
//                    return data.endIndex;
//                }
//
//                return this.getEndColumn(data.lineNumber, data.startIndex, data.type, data.path, message);
////                    var segments = message.toString().split('\n').length == 1 ? message.toString().split("\r") : message.toString().split('\n');
////                    return data.lineNumber - 1 < segments.length ? segments[data.lineNumber - 1] != null && !angular.equals("", segments[data.lineNumber - 1].toString().trim()) ? data.startIndex + this.getStringValue(data.type, data.path, segments[data.lineNumber - 1]).length : -1 : -1;
////
//            } catch (error) {
//                return -1;
//            }
//        };
//
//        HL7V2TreeServiceClass.prototype.getEndColumn = function (line, column, type, path, message) {
//            try {
//                var segments = message.toString().split('\n').length == 1 ? message.toString().split("\r") : message.toString().split('\n');
//                return line - 1 < segments.length ? segments[line - 1] != null && !angular.equals("", segments[line - 1].toString().trim()) ? column + this.getStringValue(type, path, segments[line - 1]).length : -1 : -1;
//            } catch (error) {
//                return -1;
//            }
//        };




        return new WCTPTreeServiceClass();

    }]);

angular.module('wctp').factory('WCTPNodeFinder',
    [ function () {
        return  {
            /**
             *
             * @param tree
             * @param cursor
             * @returns {*}
             */
            findNode: function (tree, line) {
                var firstNode = tree.get_first_branch();
                var children = tree.get_siblings(firstNode);
                if (children) {
                    var node = children[0];
                    if (node == null) return null;
                    return this.findNodeByLineNumber(tree, node, line);
                }
                return null;
            },

            /**
             *
             * @param tree
             * @param node
             * @param lineNumber
             * @returns {*}
             */
            findNodeByLineNumber: function (tree, node, lineNumber) {
                if (node.data.start.line <= lineNumber) {
                    if (node.data.start.line == lineNumber || node.data.end.line == lineNumber) {
                        return node;
                    }
                    var children = tree.get_children(node);
                    if (children && children.length > 0) {
                        for (var i = 0; i < children.length; i++) {
                            var found = this.findNodeByLineNumber(tree, children[i], lineNumber);
                            if (found != null) {
                                return found;
                            }
                        }
                    }
                }
                return null;
            }

        }
    }]);


angular.module('wctp').factory('WCTPCursorService',
    [ 'CursorService', 'WCTPNodeFinder', function (CursorService,WCTPNodeFinder) {

        var WCTPCursorServiceClass = function () {
            CursorService.call(this, arguments);
        };

        WCTPCursorServiceClass.prototype = Object.create(CursorService.prototype);
        WCTPCursorServiceClass.prototype.constructor = WCTPCursorServiceClass;

        /**
         *
         * @param editor
         * @returns {*|Object|Array|string|number|Object|Array|Date|string|number}
         */
        WCTPCursorServiceClass.prototype.getCoordinate = function (editor, tree) {
            try {
                var start, end, line;
                var found = WCTPNodeFinder.findNode(tree.root, editor.doc.getCursor(true).line + 1);
                if (found !== null) {
                    start = found.data.start;
                    end = found.data.end;
                }
                return this.createCoordinate(start, end);
            } catch (e) {
            }
        };

        /**
         *
         * @param line
         * @param startIndex
         * @param endIndex
         * @returns {*|Object|Array|string|number|Object|Array|Date|string|number}
         */
        WCTPCursorServiceClass.prototype.createCoordinate = function (start, end) {
            try {
                return  angular.fromJson({start: start, end: end});
            } catch (e) {

            }
        };

        /**
         *
         * @param index
         * @param container
         * @returns {number}
         */
        WCTPCursorServiceClass.prototype.getStartIndex = function (index, container) {
            return 0;
        };



        return new WCTPCursorServiceClass();

    }]);


angular.module('wctp').factory('WCTPEditorService',
    ['EditorService',function ( EditorService) {

        var WCTPEditorServiceClass = function () {
            EditorService.call(this, arguments);
        };

        WCTPEditorServiceClass.prototype = Object.create(EditorService.prototype);
        WCTPEditorServiceClass.prototype.constructor = WCTPEditorServiceClass;

        /**
         *
         * @param tree
         * @param cursor
         * @returns {*}
         */
        WCTPEditorServiceClass.prototype.select = function (editorObject,cursorObject) {
            editorObject.doc.setSelection({
                line: cursorObject.start.line - 1,
                ch: cursorObject.start.index
            }, {
                line: cursorObject.end.line - 1,
                ch: cursorObject.end.index
            });
        };

        WCTPEditorServiceClass.prototype.isXML = function (message) {
            return message.startsWith("<");
        };

        return new WCTPEditorServiceClass();

    }]);

angular.module('wctp').factory('WCTPCursor',
    ['CursorClass', function (CursorClass) {
        var WCTPCursorClass = function () {
            CursorClass.call(this, arguments);
            this.start = {line: 1, index: -1};
            this.end = {line: 1, index: -1};
            this.updateIndicator = '0';
        };

        WCTPCursorClass.prototype = Object.create(CursorClass.prototype);
        WCTPCursorClass.prototype.constructor = WCTPCursorClass;


        WCTPCursorClass.prototype.setLine = function (line) {
            this.line = line;
            this.notify();
        };


        WCTPCursorClass.prototype.toString = function (line) {
            return  this.line + "," + this.start + "," + this.end;
        };

        WCTPCursorClass.prototype.notify = function () {
            this.updateIndicator = new Date().getTime();
        };


        WCTPCursorClass.prototype.init = function (coordinate) {
            this.line = coordinate.start.line;
            this.start = {line:coordinate.start.line,index:coordinate.start.index - 1};
            this.end = {line:coordinate.end.line,index:coordinate.end.index - 1};
            this.index = coordinate.start.index - 1;
            this.notify();
        };

        WCTPCursorClass.prototype.notify = function () {
            this.updateIndicator = new Date().getTime();
        };

        return new WCTPCursorClass();

    }]);



angular.module('wctp').factory('WCTPEditor', function (EditorClass) {
    var WCTPEditorClass = function () {
        EditorClass.apply(this, arguments);
    };

    WCTPEditorClass.prototype = Object.create(EditorClass.prototype);
    WCTPEditorClass.prototype.constructor = WCTPEditorClass;

    WCTPEditorClass.prototype.format = function () {
        this.instance.doc.setValue(this.instance.doc.getValue().replace(/\n/g, "")
            .replace(/[\t ]+\</g, "<")
            .replace(/\>[\t ]+\</g, "><")
            .replace(/\>[\t ]+$/g, ">"));
        var totalLines = this.instance.lineCount();
        var totalChars = this.instance.getTextArea().value.length;
        this.instance.autoFormatRange({line: 0, ch: 0}, {line: totalLines, ch: totalChars});
    };

    return new WCTPEditorClass();
});




angular.module('wctp').factory('WCTPMessageValidator', function ($http, $q, MessageValidatorClass) {

    var WCTPMessageValidatorClass = function () {
        MessageValidatorClass.call(this, 'wctp');
    };

    WCTPMessageValidatorClass.prototype = Object.create(MessageValidatorClass.prototype);
    WCTPMessageValidatorClass.prototype.constructor = WCTPMessageValidatorClass;

    return new WCTPMessageValidatorClass();
});

angular.module('wctp').factory('WCTPMessageParser', function ($http, $q, MessageParserClass) {
    var WCTPMessageParserClass = function () {
        MessageParserClass.call(this, 'wctp');
     };

    WCTPMessageParserClass.prototype = Object.create(MessageParserClass.prototype);
    WCTPMessageParserClass.prototype.constructor = WCTPMessageParserClass;
    return new WCTPMessageParserClass();
});

angular.module('wctp').factory('WCTPReportService', function ($http, $q, ReportServiceClass) {
    var WCTPReportServiceClass = function () {
        ReportServiceClass.call(this, 'wctp');
     };
    WCTPReportServiceClass.prototype = Object.create(ReportServiceClass.prototype);
    WCTPReportServiceClass.prototype.constructor = WCTPReportServiceClass;
    return new WCTPReportServiceClass();
});





