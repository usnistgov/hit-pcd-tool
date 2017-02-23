'use strict';


angular.module('cf').controller('CFTestingCtrl', ['$scope', '$http', 'CF', '$window', '$modal', '$filter', '$rootScope', 'CFTestCaseListLoader','CFUserTestCaseListLoader', '$timeout', 'StorageService', 'TestCaseService', 'TestStepService','userInfoService','Notification','modalService','$routeParams','$location', function ($scope, $http, CF, $window, $modal, $filter, $rootScope, CFTestCaseListLoader, CFUserTestCaseListLoader, $timeout, StorageService, TestCaseService, TestStepService,userInfoService, Notification,modalService,$routeParams,$location) {

        $scope.cf = CF;
        $scope.loading = false;
        $scope.loadingTC = false;
        $scope.error = null;
        $scope.testCases = [];
       
        $scope.testCase = null;
        $scope.tree = {};
        $scope.tabs = new Array();
        $scope.error = null;
        $scope.collapsed = false;
        
        $scope.userTestCases = [];
        $scope.userTree = {};

        var testCaseService = new TestCaseService();

        $scope.token = $routeParams.x;	
    	
         
        
        $scope.setActiveTab = function (value) {
            $scope.tabs[0] = false;
            $scope.tabs[1] = false;
            $scope.tabs[2] = false;
            $scope.tabs[3] = false;
            $scope.activeTab = value;
            $scope.tabs[$scope.activeTab] = true;
        };

        $scope.getTestCaseDisplayName = function (testCase) {
            return testCase.parentName + " - " + testCase.label;
        };

        
        $scope.selectTestCase = function (testCase,isUser) {
            $scope.loadingTC = true;
            $timeout(function () {
                var previousId = StorageService.get(StorageService.CF_LOADED_TESTCASE_ID_KEY);
                if (previousId != null)TestStepService.clearRecords(previousId);
                if (testCase.testContext && testCase.testContext != null) {
                	if (isUser){
                		$scope.tree.select_branch(null);
                		testCase.isUserDefined = true;
                	}else{
                		$scope.userTree.select_branch(null);
                		testCase.isUserDefined = false;
                	}
                	CF.testCase = testCase;
                    $scope.testCase = CF.testCase;
                    
                    var id = StorageService.get(StorageService.CF_LOADED_TESTCASE_ID_KEY);
                    if (id != testCase.id) {
                        StorageService.set(StorageService.CF_LOADED_TESTCASE_ID_KEY, testCase.id);
                        StorageService.remove(StorageService.CF_EDITOR_CONTENT_KEY);
                    }
                    $scope.$broadcast('cf:testCaseLoaded', $scope.testCase);
                    $scope.$broadcast('cf:profileLoaded', $scope.testCase.testContext.profile);
                    $scope.$broadcast('cf:valueSetLibraryLoaded', $scope.testCase.testContext.vocabularyLibrary);
                }
                $scope.loadingTC = false;
            });
        };


        $scope.refreshTree = function () {
            $timeout(function () {
                if ($scope.testCases != null) {
                    if (typeof $scope.tree.build_all == 'function') {
                        $scope.tree.build_all($scope.testCases);
                        var testCase = null;
                        var id = StorageService.get(StorageService.CF_LOADED_TESTCASE_ID_KEY);
                        if (id != null) {
                            for (var i = 0; i < $scope.testCases.length; i++) {
                                var found = testCaseService.findOneById(id, $scope.testCases[i]);
                                if (found != null) {
                                    testCase = found;
                                    break;
                                }
                            }
                        }
                        if (testCase != null) {
                            $scope.selectNode(testCase.id, testCase.type);
                        }
                        $scope.expandAll();
                        $scope.error = null;
                    } else {
                        $scope.error = "Ooops, Something went wrong. Please refresh your page again.";
                    }
                }
                $scope.loading = false;
            },1000);
        };
        
        $scope.refreshUserTree = function () {
            $timeout(function () {
                if ($scope.userTestCases != null) {
                    if (typeof $scope.userTree.build_all == 'function') {
                        $scope.userTree.build_all($scope.userTestCases);
                        var testCase = null;
                        var id = StorageService.get(StorageService.CF_LOADED_TESTCASE_ID_KEY);
                        if (id != null) {
                            for (var i = 0; i < $scope.userTestCases.length; i++) {
                                var found = testCaseService.findOneById(id, $scope.userTestCases[i]);
                                if (found != null) {
                                    testCase = found;
                                    break;
                                }
                            }
                        }
                        if (testCase != null) {
                            $scope.selectUserNode(testCase.id, testCase.type);
                        }
                        $scope.expandUserAll();
                        $scope.error = null;
                    } else {
                        $scope.error = "Ooops, Something went wrong. Please refresh your page again.";
                    }
                }
                $scope.userLoading = false;
            },1000);
        };

        $scope.initTesting = function () {
            StorageService.remove(StorageService.ACTIVE_SUB_TAB_KEY);
            $scope.initPreLoadedTesting();
            $scope.initUserTesting();
        };
        
        $scope.initUserTesting = function () {
            $scope.error = null;
            $scope.userTestCases = [];
            $scope.userLoading = true;
            if (userInfoService.isAuthenticated()) {
	            var userTcLoader = new CFUserTestCaseListLoader(); 
	            userTcLoader.then(function (testCases) {
	                angular.forEach(testCases.user, function (testPlan) {
	                    testCaseService.buildCFTestCases(testPlan);
	                });
	                $scope.userTestCases = $filter('orderBy')(testCases.user, 'position');
	                $scope.refreshUserTree();
	            }, function (error) {
	                $scope.error = "Sorry, Cannot load the user profiles. Try again";
	                $scope.userLoading = false;
	            });
            }
            
        };
        
        $scope.initPreLoadedTesting = function () {
            $scope.error = null;
            $scope.testCases = [];
            $scope.loading = true;
            var tcLoader = new CFTestCaseListLoader();
            tcLoader.then(function (testCases) {
                angular.forEach(testCases, function (testPlan) {
                    testCaseService.buildCFTestCases(testPlan);
                });
                $scope.testCases = $filter('orderBy')(testCases, 'position');
                $scope.refreshTree();
            }, function (error) {
                $scope.error = "Sorry, Cannot load the profiles. Try again";
                $scope.loading = false;
            });
        };
            
            

            $scope.$on("$destroy", function () {
                var testStepId = StorageService.get(StorageService.CF_LOADED_TESTCASE_ID_KEY);
                if (testStepId != null) TestStepService.clearRecords(testStepId);
            });
        


        $scope.selectNode = function (id, type) {
            $timeout(function () {
                testCaseService.selectNodeByIdAndType($scope.tree, id, type);
            }, 0);
        };
        
        $scope.selectUserNode = function (id, type) {
            $timeout(function () {
                testCaseService.selectNodeByIdAndType($scope.userTree, id, type);
            }, 0);
        };


        $scope.openProfileInfo = function () {
            var modalInstance = $modal.open({
                templateUrl: 'CFProfileInfoCtrl.html',
                windowClass: 'profile-modal',
                controller: 'CFProfileInfoCtrl'
            });
        };

        $scope.isSelectable = function (node) {
            return node.testContext && node.testContext != null;
        };


        $scope.expandAll = function () {
            if ($scope.tree != null)
                $scope.tree.expand_all();
        };
        
        $scope.expandUserAll = function () {
            if ($scope.userTree != null)
                $scope.userTree.expand_all();
        };

        $scope.collapseAll = function () {
            if ($scope.tree != null)
                $scope.tree.collapse_all();
        };
        
        $scope.collapseUserAll = function () {
            if ($scope.userTree != null)
                $scope.userTree.collapse_all();
        };

        $scope.openUploadModal = function () {
            var modalInstance = $modal.open({
                templateUrl: 'views/upload/upload.html',
                controller: 'UploadCtrl',
                windowClass: 'upload-modal',
                backdrop  : 'static',
                keyboard  : false
                
            });
            
            modalInstance.result.then(
                    function(result) {
                    	 $scope.initUserTesting();                    
                    },
                    function(result) {
                    	
                    }
                );
        };
        
        $scope.openUploadFromRemotedModal = function (){
        	var modalInstance = $modal.open({
                templateUrl: 'views/upload/uploadFromRemote.html',
                controller: 'UploadTokenCtrl',
                windowClass: 'upload-modal',
                backdrop  : 'static',
                keyboard  : false
                
            });
            
        	modalInstance.result.then(
                    function(result) {
                    	$location.url("/cf");                
                    },
                    function(result) {
                    	$location.url("/cf");  
                    }
                );
        };
  
        	
        
        
       
        
        $scope.deleteTestCase = function (testCase) {
        
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete test case',
                headerText: 'Delete ' + testCase.Name + '?',
                bodyText: 'Are you sure you want to delete this test case?'
            };

            modalService.showModal({}, modalOptions).then(function (result) {
            	$http.post('api/upload/deleteprofile',{id: testCase.id}).then(function (result) {  	
            		$scope.initUserTesting();     
            		CF.testCase = null;
            	}, function (error) {
                	Notification.error({message: error.data, templateUrl: "NotificationErrorTemplate.html", scope: $rootScope, delay: 10000});
                }); 
            	
            });        	
        	
        };
        
        
        if ($scope.token !== undefined && $location.path() === '/addprofiles'){
        	if (!userInfoService.isAuthenticated()) {
        		$scope.$emit('event:loginRequiredWithRedirect',$location.url());
        		
        	}else{
        		$scope.openUploadFromRemotedModal();
        	}
        	
        	
        }
       

    }]);

angular.module('cf').controller('CFProfileInfoCtrl', function ($scope, $modalInstance) {
    $scope.close = function () {
        $modalInstance.dismiss('cancel');
    };
});

angular.module('cf')
    .controller('CFValidatorCtrl',[ '$scope', '$http', 'CF', '$window', '$timeout', '$modal', 'NewValidationResult', '$rootScope', 'ServiceDelegator', 'StorageService', 'TestStepService','MessageUtil','FileUpload','Notification',function ($scope, $http, CF, $window, $timeout, $modal, NewValidationResult, $rootScope, ServiceDelegator, StorageService, TestStepService,MessageUtil,FileUpload,Notification) {
        $scope.cf = CF;
        $scope.testCase = CF.testCase;
        $scope.message = CF.message;
        $scope.selectedMessage = {};
        $scope.loading = true;
        $scope.userLoading = true;
        $scope.error = null;
        $scope.vError = null;
        $scope.vLoading = true;
        $scope.mError = null;
        $scope.mLoading = true;
        $scope.delimeters = [];
        $scope.counter = 0;
        $scope.type = "cf";
        $scope.loadRate = 4000;
        $scope.tokenPromise = null;
        $scope.editorInit = false;
        $scope.nodelay = false;

        $scope.resized = false;
        $scope.selectedItem = null;
        $scope.activeTab = 0;

        $scope.tError = null;
        $scope.tLoading = false;
        $scope.hasNonPrintable = false;
        $scope.dqaCodes = StorageService.get(StorageService.DQA_OPTIONS_KEY) != null ? angular.fromJson(StorageService.get(StorageService.DQA_OPTIONS_KEY)) : [];

        $scope.showDQAOptions = function () {
            var modalInstance = $modal.open({
                templateUrl: 'DQAConfig.html',
                controller: 'DQAConfigCtrl',
                windowClass: 'dq-modal',
                animation: true,
                keyboard: false,
                backdrop: false
            });
            modalInstance.result.then(function (selectedCodes) {
                $scope.dqaCodes = selectedCodes;
            }, function () {
            });
        };

        $scope.hasContent = function () {
            return  $scope.cf.message.content != '' && $scope.cf.message.content != null;
        };


        $scope.refreshEditor = function () {
            $timeout(function () {
                if ($scope.editor)
                    $scope.editor.refresh();
            }, 1000);
        };

        $scope.uploadMessage = function(file, errFiles) {
            $scope.f = file;
            FileUpload.uploadMessage(file,errFiles).then(function(response){
                $timeout(function () {
                    file.result = response.data;
                    var result = response.data;
                    var fileName = file.name;
                    $scope.nodelay = true;
                    var tmp = angular.fromJson(result);
                    $scope.cf.message.name = fileName;
                    $scope.cf.editor.instance.doc.setValue(tmp.content);
                    $scope.mError = null;
                    $scope.execute();
                    Notification.success({message: "File " + fileName + " successfully uploaded!", templateUrl: "NotificationSuccessTemplate.html", scope: $rootScope, delay: 30000});
                });
            }, function(response){
                $scope.mError = response.data;
            });
        };

        $scope.loadMessage = function () {
            if ($scope.cf.testCase.testContext.message && $scope.cf.testCase.testContext.message != null) {
                $scope.nodelay = true;
                $scope.selectedMessage = $scope.cf.testCase.testContext.message;
                if ($scope.selectedMessage != null && $scope.selectedMessage.content != null) {
                    $scope.editor.doc.setValue($scope.selectedMessage.content);
                } else {
                    $scope.editor.doc.setValue('');
                    $scope.cf.message.id = null;
                    $scope.cf.message.name = '';
                }
                $scope.execute();
            }
        };

        $scope.setLoadRate = function (value) {
            $scope.loadRate = value;
        };


        $scope.initCodemirror = function () {
            $scope.editor = CodeMirror.fromTextArea(document.getElementById("cfTextArea"), {
                lineNumbers: true,
                fixedGutter: true,
                theme: "elegant",
                readOnly: false,
                showCursorWhenSelecting: true,
                gutters: ["CodeMirror-linenumbers", "cm-edi-segment-name"]
            });

            $scope.editor.setSize("100%", 345);

            $scope.editor.on("keyup", function () {
                $timeout(function () {
                    var msg = $scope.editor.doc.getValue();
                    $scope.error = null;
                    if ($scope.tokenPromise) {
                        $timeout.cancel($scope.tokenPromise);
                        $scope.tokenPromise = undefined;
                    }
                    CF.message.name = null;
                    if (msg.trim() !== '') {
                        $scope.tokenPromise = $timeout(function () {

                            $scope.execute();
                        }, $scope.loadRate);
                    } else {
                        $scope.execute();
                    }
                });
            });

            $scope.editor.on("dblclick", function (editor) {
                $timeout(function () {
                    var coordinate = ServiceDelegator.getCursorService($scope.testCase.testContext.format).getCoordinate($scope.editor, $scope.cf.tree);
                    coordinate.lineNumber = coordinate.line;
                    coordinate.startIndex = coordinate.startIndex + 1;
                    coordinate.endIndex = coordinate.endIndex + 1;
                    $scope.cf.cursor.init(coordinate, true);
                    ServiceDelegator.getTreeService($scope.testCase.testContext.format).selectNodeByIndex($scope.cf.tree.root, CF.cursor, CF.message.content);
                });
            });
        };

        /**
         * Validate the content of the editor
         */
        $scope.validateMessage = function () {
            try {
                $scope.vLoading = true;
                $scope.vError = null;
                if ($scope.cf.testCase != null && $scope.cf.message.content !== "") {
                    var id = $scope.cf.testCase.testContext.id;
                    var content = $scope.cf.message.content;
                    var label = $scope.cf.testCase.label;
                    var validated = ServiceDelegator.getMessageValidator($scope.testCase.testContext.format).validate(id, content, null, "Free", $scope.cf.testCase.testContext.dqa === true ? $scope.dqaCodes : [], "1223");
                    validated.then(function (mvResult) {
                        $scope.vLoading = false;
                        $scope.loadValidationResult(mvResult);
                    }, function (error) {
                        $scope.vLoading = false;
                        $scope.vError = error;
                        $scope.loadValidationResult(null);
                    });
                } else {
                    $scope.loadValidationResult(null);
                    $scope.vLoading = false;
                    $scope.vError = null;
                }
            } catch (error) {
                $scope.vLoading = false;
                $scope.vError = error;
                $scope.loadValidationResult(null);
            }
        };

        $scope.loadValidationResult = function (mvResult) {
            $timeout(function () {
                $rootScope.$emit('cf:validationResultLoaded', mvResult, $scope.cf.testCase);
            });
        };

        $scope.select = function (element) {
            if (element != undefined && element.path != null && element.line != -1) {
                var node = ServiceDelegator.getTreeService($scope.testCase.testContext.format).selectNodeByPath($scope.cf.tree.root, element.line, element.path);
                var data = node != null ? node.data : null;
                $scope.cf.cursor.init(data != null ? data.lineNumber : element.line, data != null ? data.startIndex - 1 : element.column - 1, data != null ? data.endIndex - 1 : element.column - 1, data != null ? data.startIndex - 1 : element.column - 1, false);
                ServiceDelegator.getEditorService($scope.testCase.testContext.format).select($scope.editor, $scope.cf.cursor);
            }
        };

        $scope.clearMessage = function () {
            $scope.nodelay = true;
            $scope.mError = null;
            if ($scope.editor) {
                $scope.editor.doc.setValue('');
                $scope.execute();
            }
        };

        $scope.saveMessage = function () {
            $scope.cf.message.download();
        };

        $scope.parseMessage = function () {
            try {
                if ($scope.cf.testCase != null && $scope.cf.testCase.testContext != null && $scope.cf.message.content != '') {
                    $scope.tLoading = true;
                    var parsed = ServiceDelegator.getMessageParser($scope.testCase.testContext.format).parse($scope.cf.testCase.testContext.id, $scope.cf.message.content);
                    parsed.then(function (value) {
                        $scope.tLoading = false;
                        $scope.cf.tree.root.build_all(value.elements);
                        ServiceDelegator.updateEditorMode($scope.editor, value.delimeters, $scope.cf.testCase.testContext.format);
                        ServiceDelegator.getEditorService($scope.testCase.testContext.format).setEditor($scope.editor);
                        ServiceDelegator.getTreeService($scope.testCase.testContext.format).setEditor($scope.editor);
                    }, function (error) {
                        $scope.tLoading = false;
                        $scope.tError = error;
                    });
                } else {
                    if (typeof $scope.cf.tree.root.build_all == 'function') {
                        $scope.cf.tree.root.build_all([]);
                    }
                    $scope.tError = null;
                    $scope.tLoading = false;
                }
            } catch (error) {
                $scope.tLoading = false;
                $scope.tError = error;
            }
        };

        $scope.onNodeSelect = function (node) {
            ServiceDelegator.getTreeService($scope.testCase.testContext.format).getEndIndex(node, $scope.cf.message.content);
            $scope.cf.cursor.init(node.data, false);
            ServiceDelegator.getEditorService($scope.testCase.testContext.format).select($scope.editor, $scope.cf.cursor);
        };

        $scope.execute = function () {
            if ($scope.cf.testCase != null) {
                if ($scope.tokenPromise) {
                    $timeout.cancel($scope.tokenPromise);
                    $scope.tokenPromise = undefined;
                }
                $scope.error = null;
                $scope.tError = null;
                $scope.mError = null;
                $scope.vError = null;
                $scope.cf.message.content = $scope.editor.doc.getValue();
                $scope.setHasNonPrintableCharacters();
                StorageService.set(StorageService.CF_EDITOR_CONTENT_KEY, $scope.cf.message.content);
                $scope.validateMessage();
                $scope.parseMessage();
                $scope.refreshEditor();
            }
        };

        $scope.removeDuplicates = function () {
            $scope.vLoading = true;
            $scope.$broadcast('cf:removeDuplicates');
        };


        $scope.initValidation = function () {
            $scope.vLoading = false;
            $scope.tLoading = false;
            $scope.mLoading = false;
            $scope.error = null;
            $scope.tError = null;
            $scope.mError = null;
            $scope.vError = null;
            $scope.initCodemirror();
            $scope.refreshEditor();

            $scope.$on('cf:testCaseLoaded', function (event, testCase) {
                $scope.testCase = testCase;
                if ($scope.testCase != null) {
                    var content = StorageService.get(StorageService.CF_EDITOR_CONTENT_KEY) == null ? '' : StorageService.get(StorageService.CF_EDITOR_CONTENT_KEY);
                    $scope.nodelay = true;
                    $scope.mError = null;
                    $scope.cf.editor = ServiceDelegator.getEditor($scope.testCase.testContext.format);
                    $scope.cf.editor.instance = $scope.editor;
                    $scope.cf.cursor = ServiceDelegator.getCursor($scope.testCase.testContext.format);
                    TestStepService.clearRecords($scope.testCase.id);
                    if ($scope.editor) {
                        $scope.editor.doc.setValue(content);
                        $scope.execute();
                    }
                }
            });

            $rootScope.$on('cf:duplicatesRemoved', function (event, report) {
                $scope.vLoading = false;
            });
        };

        $scope.expandAll = function () {
            if ($scope.cf.tree.root != null)
                $scope.cf.tree.root.expand_all();
        };

        $scope.collapseAll = function () {
            if ($scope.cf.tree.root != null)
                $scope.cf.tree.root.collapse_all();
        };


        $scope.setHasNonPrintableCharacters = function () {
            $scope.hasNonPrintable = MessageUtil.hasNonPrintable($scope.cf.message.content);
        };

        $scope.showMessageWithHexadecimal = function () {
            var modalInstance = $modal.open({
                templateUrl: 'MessageWithHexadecimal.html',
                controller: 'MessageWithHexadecimalDlgCtrl',
                windowClass: 'valueset-modal',
                animation:false,
                keyboard:true,
                backdrop:true,
                resolve: {
                    original: function () {
                        return  $scope.cf.message.content;
                    }
                }
            });
        };


    }]);


angular.module('cf')
    .controller('CFReportCtrl', ['$scope', '$sce', '$http', 'CF', function ($scope, $sce, $http, CF) {
        $scope.cf = CF;
    }]);

angular.module('cf')
    .controller('CFVocabularyCtrl', ['$scope', 'CF', function ($scope, CF) {
        $scope.cf = CF;
    }]);

angular.module('cf')
    .controller('CFProfileViewerCtrl', ['$scope', 'CF', '$rootScope', function ($scope, CF, $rootScope) {
        $scope.cf = CF;
    }]);