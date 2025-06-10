/**
 * Created by haffo on 5/4/15.
 */

(function (angular) {
  'use strict';
  var mod = angular.module('hit-profile-viewer', []);
  mod.directive('profileViewer', [
    function () {
      return {
        restrict: 'A',
        scope: {
          type: '@'
        },
        templateUrl: 'ProfileViewer.html',
        replace: false,
        controller: 'ProfileViewerCtrl'
      };
    }
  ]);

  mod
    .controller('ProfileViewerCtrl', ['$scope', '$rootScope', 'PvTreetableParams', 'ProfileService', '$http', '$filter', '$cookies', '$sce', '$timeout', '$modalStack', 'VocabularyService', '$modal', function ($scope, $rootScope, PvTreetableParams, ProfileService, $http, $filter, $cookies, $sce, $timeout, $modalStack, VocabularyService, $modal) {
      $scope.testCase = null;
      $scope.elements = [];
      $scope.confStatementsActive = false;
	  $scope.testAssertionsActive = false;
      $scope.nodeData = [];
      $scope.loading = false;
      $scope.error = null;
      $scope.profile = null;
      $scope.profileService = new ProfileService();
      $scope.loading = false;
      $scope.loadingTabContent = false;
      $scope.error = null;
      $scope.csWidth = null;
      $scope.predWidth = null;
      $scope.tableWidth = null;
      $scope.parentsMap = {};
      $scope.componentsParentMap = {};
      $scope.options = {
        concise: true,
        relevance: true,
        collapse: true
      };
      $rootScope.pvNodesMap = {};
      $scope.model = null;
      $scope.onlyRelevantElementsModel = null;
      $scope.allElementsModel = null;

      /**
       *
       * @param collection
       * @returns {*}
       */
      var sortByPosition = function (collection) {
        var sorted = _.sortBy(collection, function (element) {
          return element.position;
        });
        return sorted;
      };

      /**
       *
       * @param predicates
       * @param targetPath
       * @returns {Array}
       */
      var findConstraintsByTargetPath = function (predicates, targetPath) {
        var rs = [];
        if (predicates != null && predicates.length > 0 && targetPath !== "" && targetPath !== null) {
          rs = _.filter(predicates, function (predicate) {
            return fixPath(predicate.constraintTarget) === fixPath(targetPath);
          });
        }
        return rs;
      };

      /**
     *
     * @param valueSetBindings
     * @param targetPath
     * @returns {Array}
     */
      var findValueSetBindingsByTargetPath = function (valueSetBindings, targetPath) {
        var rs = [];
        if (valueSetBindings != null && valueSetBindings.length > 0 && targetPath !== "" && targetPath !== null) {
          rs = _.filter(valueSetBindings, function (valueSetBinding) {
            return fixPath(valueSetBinding.valueSetBindingTarget) === fixPath(targetPath);
          });
        }
        return rs;
      };

      /**
         *
         * @param singleCodeBindings
         * @param targetPath
         * @returns {Array}
         */
      var findSingleCodeBindingsByTargetPath = function (singleCodeBindings, targetPath) {
        var rs = [];
        if (singleCodeBindings != null && singleCodeBindings.length > 0 && targetPath !== "" && targetPath !== null) {
          rs = _.filter(singleCodeBindings, function (singleCodeBindings) {
            return fixPath(singleCodeBindings.singleCodeBindingTarget) === fixPath(targetPath);
          });
        }
        return rs;
      };


      /**
       *
       * @param targetPath
       * @returns {*}
       */
      var fixPath = function (targetPath) {
        var path = targetPath;
        if (targetPath != null && targetPath != "") {
          var sections = targetPath.split(".");
          if (sections != null && sections.length > 0) {
            path = null;
            _.each(sections, function (section) {
              var res = section;
              if (section.indexOf("[") != -1 && section.indexOf("]") != -1) {
                var d = section.split("["); // 23, 1]
                res = d[0] + "[*]";
              }
              path = path != null ? path + "." + res : res;
            });
          }
        }
        return path;
      };

      /**
       *
       * @param value
       */
      $scope.setAllConcise = function (value) {
        $scope.loadingTabContent = true;
        $timeout(function () {
          $scope.options.concise = value;
          $scope.loadingTabContent = false;
        });
      };


      /**
       *
       * @param constraints
       * @returns {string}
       */
      $scope.getConstraintsAsString = function (constraints) {
        var str = '';
        for (var index in constraints) {
          str = str + "<p style=\"text-align: left\">" + constraints[index].id + " - " + constraints[index].description + "</p>";
        }
        return str;
      };

      /**
       *
       * @param node
       * @returns {boolean}
       */
      $scope.isBranch = function (node) {
        var children = getNodeChildren(node);
        return children != null && children.length > 0;
      };

      /**
       *
       * @param id
       */
      $scope.showRefSegment = function (id) {
        if ($scope.model.segmentAndGroupList.length > 0 && id)
          for (var i = 0; i < $scope.model.segmentAndGroupList.length; i++) {
            var element = $scope.model.segmentAndGroupList[i];
            if (element.id == id) {
              $scope.getTabContent(element);
            }
          }
      };

      /**
       *
       * @param node
       * @returns {boolean}
       */
      $scope.isRelevant = function (node) {
//		return (node === undefined && $scope.options.relevance) ? true : isNodeUsageRelevant(node);
        return isNodeUsageRelevant(node);
      };

      var isNodeUsageRelevant = function (node) {
//        if (node.hide == undefined || !node.hide || node.hide === false) {
//		if ($scope.options.relevance){
          if (node.selfPredicates && node.selfPredicates != null && node.selfPredicates.length > 0) {
            var predicateCheck = node.selfPredicates[0].trueUsage === "R" || node.selfPredicates[0].trueUsage === "RE" || node.selfPredicates[0].falseUsage === "R" || node.selfPredicates[0].falseUsage === "RE";
			if (predicateCheck === true){
				return true;
			}else if (node.possiblePredicates && node.possiblePredicates != null && node.possiblePredicates >0){
				//check for possible predicates
				for (i = 0; i< node.possiblePredicates.length ; i++){
					var possiblePredicate = node.possiblePredicates[i].trueUsage === "R" || node.possiblePredicates[i].trueUsage === "RE" || node.possiblePredicates[i].falseUsage === "R" || node.possiblePredicates[i].falseUsage === "RE";
					if (possiblePredicate === true) return true;
				}
				
			}
          } else {
            return node.usage == null || !node.usage || node.usage === "R" || node.usage === "RE";
          }
//        } else {
//          return false;
//        }
      };


      /**
       *
       * @param collapse
       */
      $scope.collapseAll = function (collapse) {
		
        $scope.options.collapse = collapse;
//		$scope.refreshWithState("collapsed");
        refresh();
      };

      /**
       *
       * @param tableId
       */
      $scope.showValueSetDefinition = function (tableId) {
        // $rootScope.$emit($scope.type + ':showValueSetDefinition', tableId);
        $modalStack.dismissAll('close');
        var t = VocabularyService.findValueSetDefinition(tableId);
        $modal.open({
          templateUrl: 'TableFoundCtrl.html',
          controller: 'ProfileViewerValueSetDetailsCtrl',
          windowClass: 'valueset-modal',
          animation: false,
          keyboard: true,
          backdrop: true,
          resolve: {
            table: function () {
              return t;
            }
          }
        });
      };
	  
	  function findDataTypetById(list, targetId) {
	      for (let i = 0; i < list.length; i++) {
	        if (list[i].id === targetId) {
	          return list[i];
	        }
	      }
	      return null; 
	    }
		
		function findSegmentById(list, targetId) {
	      for (let i = 0; i < list.length; i++) {
	        if (list[i].id === targetId) {
	          return list[i];
	        }
	      }
	      return null; 
	    }
	  
	  /**
	     *
	     * @param dataType
	     */
	    $scope.showDataType = function (dataType) {
	      $modalStack.dismissAll('close');
		  $scope.allChildren = [];
	      		  		  
	       function flattenChildren(items, parentId, type) {
	           angular.forEach(items, function(child) {
	               child.parentID = parentId;
	   	  		   child.realType= type;
	               $scope.allChildren.push(child);
	               if (child.children && child.children.length > 0) {	
					   child.children = processComponentChildrenConstraints(child,[]);				
	                   flattenChildren(child.children, child.id, "SUBCOMPONENT");
	               }
	           });
	       }
		   
//		   function processChildren(items, type) {
//		              angular.forEach(items, function(child) {
//		      	  		  child.realType= type;
//		                  if (child.children && child.children.length > 0) {	
//		   				   child.children = processComponentChildrenConstraints(child,[]);				
//		                  }
//		              });
//		          }
		   
		   var dt =  structuredClone(findDataTypetById($scope.model.datatypeList,dataType)); //angular.copy(findDataTypetById($scope.model.datatypeList,dataType));
		   dt.children = processFieldChildrenConstraints(dt,[]);		   
//		   processChildren(dt.children);
		   
          flattenChildren(dt.children, dt.id,"COMPONENT");
		  dt.children = $scope.allChildren;
	      $modal.open({
	        templateUrl: 'DataTypeDetailsModal.html',
	        controller: 'ProfileViewerDataTypeDetailsCtrl',
	        windowClass: 'valueset-modal',
	        animation: false,
	        keyboard: true,
	        backdrop: true,
	        resolve: {
	          dt: function () {
	            return  dt;
	          }
	        }
	      });
	    };

      /**
       *
       * @param tableStr
       * @returns {*}
       */
      $scope.getValueSet = function (node) { //older
        var tables = []
        if (node.table && node.table != null) {
          var tables = node.table.split(":");		  
        }       
        return tables;
      };
	  
	  /**
	     *
	     * @param tableStr
	     * @returns {*}
	     */
	    $scope.getValueSetBindings = function (node) {
	      var tables = []
	      if (node.selfValueSetBindings && node.selfValueSetBindings != null && node.selfValueSetBindings.length > 0) {
	        var parser = new DOMParser();
	        for (var j = 0; j < node.selfValueSetBindings.length; j++) {
	          tables.push(node.selfValueSetBindings[j]);        
	        }
	      }
	      return tables;
	    };
	  
	  $scope.getValueSetBindingIdentifiers = function (vsb){
		if (vsb.bindingList){
			var vs = [];
			var res = "";
			for (var i = 0; i < vsb.bindingList.length; i++) {
			  vs.push(vsb.bindingList[i].bindingIdentifier);
			   res += '<span ng-click="showValueSetDefinition('+vsb.bindingList[i].bindingIdentifier+')">'+vsb.bindingList[i].bindingIdentifier+'</span>'
			   if (i != vsb.bindingList.length){
				res += "<br>"
			   }
	        }
			return res;
		}
		
	  };

      $scope.getValueSetBindingLocations = function (vsb) {
        var res = "";
        if (vsb.bindingLocationList.length > 0) {
          res += "Binding Location: "
          for (var i = 0; i < vsb.bindingLocationList.length; i++) {
            res += vsb.bindingLocationList[i].codeLocation;
            if (i != vsb.bindingLocationList.length - 1) {
              res += ", ";
            }
          }
        }
        return res;
      };


      /**
         *
         * @param tableStr
         * @returns {*}
         */
      $scope.getSingleCodes = function (node) {
        var singleCodes = []
        if (node.table && node.table != null) {
          tables = node.table.split(":");
        }
        if (node.selfSingleCodeBindings && node.selfSingleCodeBindings != null && node.selfSingleCodeBindings.length > 0) {
          var parser = new DOMParser();
          for (var j = 0; j < node.selfSingleCodeBindings.length; j++) {
            singleCodes.push(node.selfSingleCodeBindings[j]);
          }
        }
        return singleCodes;
      };

      $scope.getSingleCodeBindingLocation = function (scb) {
        var res = "Code Sytem: " + scb.singleCodeBindingCodeSystem + " <br>";
        if (scb.bindingLocationList.length > 0) {
          res += "Binding Location: "
          for (var i = 0; i < scb.bindingLocationList.length; i++) {
            res += scb.bindingLocationList[i].codeLocation;
            if (i != scb.bindingLocationList.length - 1) {
              res += ", ";
            }
          }
        }
        return res;
      };
	  
	  $scope.getSingleCodeBindingText = function (scb) {
	     	return $sce.trustAsHtml(scb.singleCodeBindingCode +" : " +scb.singleCodeBindingCodeSystem);
	     		        
	        };





      /**
       *
       * @param segment
       * @returns {boolean}
       */
      $scope.isSegmentVisible = function (segment) {
        if ($scope.options.relevance) {
			if (segment.relevant === true) return true;
          if (segment.visible === undefined) {
            segment.visible = false;
            if (segment.referencers) {
              for (var i = 0; i < segment.referencers.length; i++) {
                var segRef = segment.referencers[i];
                if (segRef.usageRelevent) {
                  segment.visible = true;
                  break;
                }
              }
            }
          }
          return segment.visible;
        }
        return true;
      };

      /**
       *
       * @param datatype
       * @returns {boolean}
       */
      $scope.isDatatypeVisible = function (datatype) {
        if ($scope.options.relevance) {
			if (datatype.relevant === true) return true;
//          if (datatype.visible === undefined) {
//            datatype.visible = false;
//            if (datatype.referencers) {
//              for (var i = 0; i < datatype.referencers.length; i++) {
//                var fieldOrComponent = datatype.referencers[i];
//                var parent = $scope.parentsMap[fieldOrComponent.id];
//				
//				
//				
//                if ($scope.visible(fieldOrComponent) && ((fieldOrComponent.type === "FIELD" && $scope.isSegmentVisible(parent)) || fieldOrComponent.type === 'COMPONENT' && $scope.isDatatypeVisible(parent))) {
//                  datatype.visible = true;
//                  break;
//                }
//              }
//            }
//          }
//          return datatype.visible;
        }
        return true;
      };

      /**
       *
       * @param contraint
       * @param contraints
       * @returns {boolean}
       */
      var constraintExits = function (contraint, contraints) {
        if (contraints.length > 0) {
          for (var i = 0; i < contraints.length; i++) {
            var c = contraints[i];
            if (c=== contraint) {
              return true;
            }
          }
        }
        return false;
      };
	  
	  
	  var constraintIsTestAssertion = function (constraint){
		if (constraint.reference && constraint.reference.source === "testcase"){
			return true;	
		}else{
			return false;
		}
	  }
	  
	  $scope.constraintIsTestAssertion = function(item) {	      
			if (item.reference && item.reference.source === "testcase"){
						return true;	
			}
	    };
	  

      /**
       *
       * @param element
       * @param parent
       */
      var processElement = function (element, parent) {
        try {
          if (element.type === "GROUP") {
            processGroup(element, parent);
          } else if (element.type === "SEGMENT_REF") {
            processSegRef(element, parent);
          } else if (element.type === "SEGMENT") {
            processSegment(element, parent);
          } else if (element.type === "FIELD") {
            processField(element, parent);
          } else if (element.type === "COMPONENT") {
            processComponent(element, parent);
          } else if (element.type === "DATATYPE") {
            processDatatype(element, parent);
          }
//		  $scope.elementsMap[element.id] = element;
        } catch (e) {
          throw e;
        }
      };

      /**
       *
       * @param element
       * @param parent
       */
      var processConstraints = function (element, parent) {
        if (element.predicates && element.predicates.length > 0) {
          for (var i = 0; i < element.predicates.length; i++) {
            if (!constraintExits(element.predicates[i], $scope.model.predicateList)) {
              $scope.model.predicateList.push(element.predicates[i]);
            }
          }
        }
        if (element.conformanceStatements && element.conformanceStatements.length > 0) {
          for (var i = 0; i < element.conformanceStatements.length; i++) {
            if (!constraintExits(element.conformanceStatements[i], $scope.model.confStatementList)) {
				if (constraintIsTestAssertion(element.conformanceStatements[i])){
					$scope.model.testAssertionsList.push(element.conformanceStatements[i]);
				}else{
					$scope.model.confStatementList.push(element.conformanceStatements[i]);
				}             
            }
          }
        }
      };

      $scope.collectSelfConstraints = function (element, parent) {
        if (element.selfPredicates && element.selfPredicates.length > 0) {
          for (var i = 0; i < element.selfPredicates.length; i++) {
            if (!constraintExits(element.selfPredicates[i], $scope.model.predicateList)) {
              $scope.model.predicateList.push(element.selfPredicates[i]);
            }
          }
        }
        if (element.selfConformanceStatements && element.selfConformanceStatements.length > 0) {
          for (var i = 0; i < element.selfConformanceStatements.length; i++) {
            if (!constraintExits(element.selfConformanceStatements[i], $scope.model.confStatementList)) {
				if (constraintIsTestAssertion(element.selfConformanceStatements[i])){
					$scope.model.testAssertionsList.push(element.selfConformanceStatements[i]);
				}else{
					$scope.model.confStatementList.push(element.selfConformanceStatements[i]);
				}
            }
          }
        }
      };


      /**
       *
       * @param datatype
       * @param fieldOrComponent
       */
	  var processDatatype = function (datatype, fieldOrComponent) {
	          processConstraints(datatype, fieldOrComponent);
	          if (!datatype.referencers)
	            datatype.referencers = [];
	          if (datatype.referencers.indexOf(fieldOrComponent) === -1) {
	            datatype.referencers.push(fieldOrComponent);
	          }
	          if ($scope.model.datatypeList.indexOf(datatype) === -1) {
	            $scope.model.datatypeList.push(datatype);
	            if (datatype.children && datatype.children != null && datatype.children.length > 0) {
	              angular.forEach(datatype.children, function (component) {
	                processComponent(component, datatype, fieldOrComponent);
	              });
	              datatype.children = sortByPosition(datatype.children);
	            }
	          }
	        };


      /**
       *
       * @param segRef
       * @param messageOrGroup
       */
      var processSegRef = function (segRef, messageOrGroup) {
        segRef.position = parseInt(segRef.position);
        if (messageOrGroup && messageOrGroup != null) {
          $scope.parentsMap[segRef.id] = messageOrGroup;
        }
        processSegRefOrGroupConstraints(segRef);
        $scope.collectSelfConstraints(segRef, messageOrGroup);
        segRef.usageRelevent = messageOrGroup != undefined && messageOrGroup != null && messageOrGroup.usageRelevent != undefined ? messageOrGroup.usageRelevent && isNodeUsageRelevant(segRef) : isNodeUsageRelevant(segRef);
        var segment = $scope.model.segments[segRef.ref];
        processSegment(segment, segRef);
		$scope.elementsMap[segRef.id] = segRef;
      };

      /**
       *
       * @param group
       * @param parent
       */
      var processGroup = function (group, parent) {
        processConstraints(group, parent);
        group.position = parseInt(group.position);
        $scope.parentsMap[group.id] = parent;
        processSegRefOrGroupConstraints(group);
        group.usageRelevent = parent != undefined && parent != null && parent.usageRelevent != undefined ? parent.usageRelevent && isNodeUsageRelevant(group) : isNodeUsageRelevant(group);
        if (group.children && group.children != null && group.children.length > 0) {
          angular.forEach(group.children, function (segmentRefOrGroup) {
            processElement(segmentRefOrGroup, group);
          });
          group.children = sortByPosition(group.children);
        }
		$scope.elementsMap[group.id] = group;
      };


      /**
       *
       * @param segment
       * @param parent
       */
      var processSegment = function (segment, parent) {
        processConstraints(segment, parent);
        if (!segment.referencers)
          segment.referencers = [];
        if (segment.referencers.indexOf(parent) === -1) {
          segment.referencers.push(parent);
        }
        if ($scope.model.segmentList.indexOf(segment) === -1) {
          segment["path"] = segment["name"];
//          $scope.model.segmentList.push(segment);
          if (segment.children && segment.children.length > 0) {
            angular.forEach(segment.children, function (field) {
              processField(field, segment);
            });
            segment.children = sortByPosition(segment.children);
          }
        }
		$scope.elementsMap[segment.id] = segment;
      };


      /**
       *
       * @param field
       * @param parent
       */
      var processField = function (field, parent) {
        $scope.collectSelfConstraints(field, parent);
        field.position = parseInt(field.position);
        $scope.parentsMap[field.id] = parent;

        field["path"] = parent.path + "-" + field.position;
        var dt = field.datatype;
        // check for varies
        if (dt.toLowerCase().indexOf('var') !== -1) {
          var dynamicMaps = parent.dynamicMaps && parent.dynamicMaps != null && parent.dynamicMaps[field.position] != null ? parent.dynamicMaps[field.position] : null;
          field.children = [];
          if (dynamicMaps != null) {
            dynamicMaps = $filter('orderBy')(dynamicMaps);
            angular.forEach(dynamicMaps, function (id) {
              var datatype = $scope.model.datatypes[id];
              if (datatype != null && datatype != undefined) {
                field.children.push(datatype);
                processDatatype(datatype, field);
              }
            });
          }
        } else {
          processDatatype($scope.model.datatypes[field.datatype], field);
        }
		$scope.elementsMap[field.id] = field;
      };

      /**
       *
       * @param component
       * @param fieldOrComponent
       */
      var processComponent = function (component, fieldOrComponent) {
        processConstraints(component, fieldOrComponent);
        component.position = parseInt(component.position);
        $scope.parentsMap[component.id] = fieldOrComponent;
        processDatatype($scope.model.datatypes[component.datatype], component);
		$scope.elementsMap[component.id] = component;
      };
	  
//	  var processComponent = function (component, datatype, fieldOrComponent) {
//	        processConstraints(component, datatype);
//	        component.position = parseInt(component.position);
//	        $scope.parentsMap[component.id] = datatype;
//	        processDatatype($scope.model.datatypes[component.datatype], component);
//	  	$scope.elementsMap[component.id] = component;
//	      };

      /**
       *
       */
      var processMessage = function () {
		if ($scope.onlyRelevantElementsModel && $scope.allElementsModel) return;
        //process message constraints
        processConstraints($scope.model.message, null);

        //$scope.model.message.children = $filter('orderBy')($scope.model.message.children, 'position');

        angular.forEach($scope.model.message.children, function (segmentRefOrGroup) {
          processElement(segmentRefOrGroup);
        });
		
		console.time('completeMessageExecution');
		$scope.numberOfElement = 0;
		$scope.allElementsModel = structuredClone($scope.model);
		$scope.allElementsModel.message = completeMessage($scope.allElementsModel.message);
		$scope.allElementsModel.message.children = sortByPosition($scope.allElementsModel.message.children);
		$scope.allElementsModel.datatypeList  = processDataTypeList($scope.allElementsModel);
		$scope.allElementsModel.confStatementList.sort((a, b) => a.constraintId.localeCompare(b.constraintId));		
		console.timeEnd('completeMessageExecution');
		
		console.time('filtering only relevant ');
		$scope.onlyRelevantElementsModel = structuredClone($scope.allElementsModel);//angular.copy($scope.allElementsModel);
		$scope.onlyRelevantElementsModel.segmentList = [];
		$scope.onlyRelevantElementsModel.segmentAndGroupList = [];
		filterMessage($scope.onlyRelevantElementsModel.message);
		$scope.onlyRelevantElementsModel.datatypeList = filterDataTypeList($scope.onlyRelevantElementsModel.datatypeList);
		console.timeEnd('filtering only relevant');	
			
      };
	  
	  
	
	  
	  
	  
	  
	  
	  	var processDataTypeList = function(model) {			
			
  			angular.forEach(model.datatypeList, function(dataType) {
				dataType.selfConformanceStatements  = dataType.conformanceStatements;
				angular.forEach(dataType.children, function(component) {					
					component.selfConformanceStatements  = model.datatypes[component.datatype].conformanceStatements;
					angular.forEach(component.children, function(subcomponent) {
						subcomponent.selfConformanceStatements  = model.datatypes[subcomponent.datatype].conformanceStatements;
		  				subcomponent.type = "SUBCOMPONENT"; 						
		  			});
	  			});
  			});
			return model.datatypeList.toSorted(function(a, b) {
	            return a.name.localeCompare(b.name);
	          });
  		}
	  
	  
		var completeMessage = function(message) {
			if (message.conformanceStatements){
				message.selfConformanceStatements = message.conformanceStatements.filter(item => !constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
						message.testAssertionsList = message.conformanceStatements.filter(item => constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});	
			}		   
			message.children = processMessageTabChildrenConstraints(message,[]);	
			angular.forEach(message.children, function(segmentRefOrGroup) {
				processElementCM(segmentRefOrGroup,message);
			});
			return message; 
		}
		
		
		var processElementCM = function(element, parent) {
			try {
				if (element.type === "GROUP") {
					processGroupCM(element, parent);
				} else if (element.type === "SEGMENT_REF") {
					processSegRefCM(element, parent);
				}else{
//					console.log(element.type);
				}
			} catch (e) {
				throw e;
			}
		};
		
		
		
		  
		var processSegRefCM = function(segRef, messageOrGroup) {
			$scope.numberOfElement++;
			var seg = $scope.model.segments[segRef.ref];
			segRef.children = seg.children;
			segRef.dynamicMaps = seg.dynamicMaps;
			segRef.children = processSegmentRefChildrenConstraints(segRef, []);		
			$scope.allElementsModel.segmentList.push(segRef);
			$scope.allElementsModel.segmentAndGroupList.push(segRef);	
			angular.forEach(segRef.children, function(field) {
				processFieldCM(field, segRef);
			});
			
		};


		var processGroupCM = function(group, parent) {
			$scope.numberOfElement++;
			group.children = processGroupChildrenConstraints(group, []);
			$scope.allElementsModel.segmentAndGroupList.push(group);
			angular.forEach(group.children, function(segmentRefOrGroup) {
				processElementCM(segmentRefOrGroup, group);
			});
			
			
		};


		var processFieldCM = function(field, parent) {
			$scope.numberOfElement++;
			var dt = field.datatype;
			if (dt !== 'var'){
				field.children = $scope.model.datatypes[dt].children;			
				field.children = processFieldChildrenConstraints(field, []);
				angular.forEach(field.children, function(component) {
					processComponentCM(component, field);
				});
			}else{
				angular.forEach(field.children, function(datatype) {
					processDatatypeCM(datatype, field);
				});
			}
			
		};
		
		var processComponentCM = function(component, parent) {
			$scope.numberOfElement++;
			var dt = component.datatype;
			component.children = $scope.model.datatypes[dt].children;
			component.children = processComponentChildrenConstraints(component, []);
			angular.forEach(component.children, function(subcomponent) {
				processSubComponentCM(subcomponent, component);
			});
			
		};

		var processSubComponentCM = function(subcomponent, parent) {		
			$scope.numberOfElement++;
			subcomponent.children = processComponentChildrenConstraints(subcomponent, []);			
		};
		   
		var processDatatypeCM = function(datatype, parent) {
			$scope.numberOfElement++;	
			datatype.children = processDatatypeChildrenConstraints(datatype, []);
			angular.forEach(datatype.children, function(component) {
				processComponentCM(component, datatype);
			});
			
		};
		
		
		
		var filterMessage = function(message) {
			message.children = message.children.filter(item => item.relevant == true);	
			angular.forEach(message.children, function(segmentRefOrGroup) {
				filterElement(segmentRefOrGroup,message);
			});			
		}
		
		
		var filterElement = function(element, parent) {
			try {
				if (element.type === "GROUP") {
					filterGroup(element, parent);
				} else if (element.type === "SEGMENT_REF") {
					filterSegRef(element, parent);
				}else{
				}
			} catch (e) {
				throw e;
			}
		};
		
		
		
		  
		var filterSegRef = function(segRef, messageOrGroup) {					
			segRef.children = segRef.children.filter(item => item.relevant == true);	
			$scope.onlyRelevantElementsModel.segmentList.push(segRef);		
			$scope.onlyRelevantElementsModel.segmentAndGroupList.push(segRef);				
			angular.forEach(segRef.children, function(field) {
				filterField(field, segRef);
			});			
				
		};


		var filterGroup = function(group, parent) {
			group.children = group.children.filter(item => item.relevant == true);	
			$scope.onlyRelevantElementsModel.segmentAndGroupList.push(group);					
			angular.forEach(group.children, function(segmentRefOrGroup) {
				filterElement(segmentRefOrGroup, group);
			});
			
		};


		var filterField = function(field, parent) {
			if (field.datatype !== "var"){
				field.children = field.children.filter(item => item.relevant == true);										
			}			
			angular.forEach(field.children, function(component) {
				filterComponent(component, field);
			});
		};
		
		var filterComponent = function(component, parent) {
			component.children = component.children.filter(item => item.relevant == true);					
			angular.forEach(component.children, function(subcomponent) {
				filterSubComponent(subcomponent, component);
			});
			
		};

		var filterSubComponent = function(subcomponent) {		
			subcomponent.children = subcomponent.children.filter(item => item.relevant == true);			
		};
		    
		
		var filterDataTypeList = function(datatypeList) {	
			datatypeList = datatypeList.filter(item => item.relevant == true);		
  			angular.forEach(datatypeList, function(dataType) {
				dataType.children = dataType.children.filter(item => isNodeUsageRelevant(item) == true);		
				angular.forEach(dataType.children, function(component) {
					component.children = component.children.filter(item => isNodeUsageRelevant(item) == true);						
	  			});
  			});
			return datatypeList;
  		}
		
		
		
		
		
		
		
	  	 	  

      /**
       *
       */
      var initAll = function () {
        $scope.parentsMap = [];
        $scope.componentsParentMap = [];
        $scope.model = null;
        $rootScope.pvNodesMap = {};
        $scope.onlyRelevantElementsModel = null;
        $scope.allElementsModel = null;
		$scope.elementsMap = [];
      };


      $scope.$on($scope.type + ':profileLoaded', function (event, profile) {
        $scope.model = null;
        $scope.loading = true;
        $scope.error = null;
        $scope.options.collapse = true;
        $scope.nodeData = [];
        $scope.loadingTabContent = false;
        if (profile && profile.id != null) {
          $scope.profile = profile;
          $scope.profileService.getJson($scope.profile.id).then(function (jsonObject) {			
            initAll();
            $scope.originalModel = angular.fromJson(jsonObject);
            $scope.executeRelevance();

			$scope.getTabContent($scope.model.message);
            $scope.loading = false;
          }, function (error) {
            $scope.error = "Sorry, Cannot load the profile.";
            $scope.loading = false;
            initAll();
            refresh();
          });
        } else {
          $scope.loading = false;
          initAll();
          refresh();
        }
      });


	  
	  //to remove 	  
	  $scope.findDatatypePotentialPredicates= function(node){
		if (node.type === "MESSAGE" || node.type === "GROUP"){
			angular.forEach(node.children, function (child) {
				child.nodeParent = node;
				$scope.findDatatypePotentialPredicates(child);
			});
		}else if (node.type == "SEGMENT_REF"){
			var children =  getNodeChildren(node);
			angular.forEach(children, function (child) {
				child.nodeParent = node;
				$scope.findDatatypePotentialPredicates(child);
			});
		}else if (node.type == "FIELD" || node.type == "COMPONENT"){
//			var children = node.children;
			var children =  getNodeChildren(node);
			angular.forEach(children, function (child) {
			  child.nodeParent = node;
			  child.selfPredicates = [];
			  child.selfPredicates = child.selfPredicates.concat(getDatatypeLevelPredicates(child));
			  child.selfPredicates = child.selfPredicates.concat(getSegmentLevelPredicates(child));
			  child.selfPredicates = child.selfPredicates.concat(getMessageLevelPredicates(child));
			  child.selfPredicates = child.selfPredicates.concat(getGroupLevelPredicates(child));
			  
				  angular.forEach($scope.model.datatypeList, function (datatype) {
					if (child.datatype === datatype.id && child.selfPredicates.length > 0){
						datatype.possiblePredicates = child.selfPredicates;
					}	
			      });
			  
			  		
	      });
		}
		
	  }
	  
      /**
       *
       */
      $scope.executeRelevance = function () {
        if ($scope.options.relevance && $scope.onlyRelevantElementsModel != null) {
          $scope.model = $scope.onlyRelevantElementsModel;
        } else if (!$scope.options.relevance && $scope.allElementsModel != null) {
          $scope.model = $scope.allElementsModel;
        } else {
          initAll();
          $scope.model =   $scope.originalModel;
          if ($scope.model != null) {
            $scope.model.datatypeList = [];
			$scope.model.testAssertionsList = [];
            $scope.model.segmentList = [];
			$scope.model.segmentAndGroupList = [];
            $scope.model.predicateList = [];
            $scope.model.confStatementList = [];
            $scope.model.tmpConfStatementList = [];//.concat($scope.model.confStatementList);
			$scope.model.tmpTestAssertionsList = [];
            processMessage();
			if ($scope.options.relevance && $scope.onlyRelevantElementsModel != null) {
	          $scope.model = $scope.onlyRelevantElementsModel;
	        } else if (!$scope.options.relevance && $scope.allElementsModel != null) {
	          $scope.model = $scope.allElementsModel;
	        }
          }
        }
      };

      /**
       *
       * @param node
       * @returns {*}
       */
      var getNodeChildren = function (node) {
		return node.children;
//        if (node && $scope.model != null && $scope.model.segments != null) {
//          if (node.type === 'SEGMENT_REF') {
//            return getNodeChildren($scope.model.segments[node.ref]);
//          } else if (node.type === 'FIELD' || node.type === 'COMPONENT') {
//            return node.datatype && node.datatype.toLowerCase().indexOf('var') === -1 && $scope.model.datatypes ? $scope.model.datatypes[node.datatype].children : node.children;
//            //        	  return node.datatype && node.datatype !== 'varies' && $scope.model.datatypes ? $scope.model.datatypes[node.datatype].children : node.children;         
//          } else if (node.type === 'DATATYPE' || node.type == 'SEGMENT' || node.type === 'GROUP') {
//            return node.children;
//          }
//        }
//        return [];
      };

      /**
       *
       * @param removeCandidates
       * @param all
       * @returns {*}
       */
      var removeNotVisibles = function (removeCandidates, all) {
        if (removeCandidates.length > 0 && all != null && all.length > 0) {
          angular.forEach(removeCandidates, function (removeCandidate) {
            var index = all.indexOf(removeCandidate);
            all.splice(index, 1);
          });
        }
        return all;
      }

      /**
       *
       * @param parent
       * @param removeCandidates
       * @returns {*}
       */
		var processFieldChildrenConstraints = function(parent, removeCandidates, model) {
			var children = structuredClone(getNodeChildren(parent)); //angular.copy(getNodeChildren(parent));
			var wantedChildren = [];
			angular.forEach(children, function(child) {
				if (parent.datatype) {
					child.type = parent.datatype.toLowerCase().indexOf('var') !== -1 ? 'DATATYPE' : 'COMPONENT';
				} else if (parent.type) {
					child.type = parent.type.toLowerCase().indexOf('var') !== -1 ? 'DATATYPE' : 'COMPONENT';
				}
				child.path = parent.path + "." + child.position;
				child.nodeParent = parent;
				child.selfValueSetBindings = []; //--
				child.selfSingleCodeBindings = [];
				child.selfConformanceStatements = []; //
				child.selfPredicates = [];
				child.selfValueSetBindings = child.selfValueSetBindings.concat(getSegmentLevelValueSetBindings(child));
				child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getSegmentLevelSingleCodeBindings(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getSegmentLevelConfStatements(child));
				child.selfPredicates = child.selfPredicates.concat(getSegmentLevelPredicates(child));
				child.selfValueSetBindings = child.selfValueSetBindings.concat(getDatatypeLevelValueSetBindings(child));
				child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getDatatypeLevelSingleCodeBindings(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getDatatypeLevelConfStatements(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getDatatypeConfStatements(child));
				child.selfPredicates = child.selfPredicates.concat(getDatatypeLevelPredicates(child));
//
//				if ($scope.nodeData.type === 'MESSAGE') {
					child.selfValueSetBindings = child.selfValueSetBindings.concat(getMessageLevelValueSetBindings(child));
					child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getMessageLevelSingleCodeBindings(child));
//					child.selfConformanceStatements = child.selfConformanceStatements.concat(getMessageLevelConfStatements(child));
					child.selfPredicates = child.selfPredicates.concat(getMessageLevelPredicates(child));
					child.selfValueSetBindings = child.selfValueSetBindings.concat(getGroupLevelValueSetBindings(child));
					child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getGroupLevelSingleCodeBindings(child));
//					child.selfConformanceStatements = child.selfConformanceStatements.concat(getGroupLevelConfStatements(child));
					child.selfPredicates = child.selfPredicates.concat(getGroupLevelPredicates(child));
//				}
//				if (!$scope.visible(child)) {
//					removeCandidates.push(child);
//				} else {
//					wantedChildren.push(child);
//				}
//				if (child.selfPredicates.length > 0){
	
					
				child.selfConformanceStatements = $scope.model.datatypes[child.datatype].conformanceStatements.filter(item => !constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
				child.testAssertionsList = $scope.model.datatypes[child.datatype].conformanceStatements.filter(item => constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});

				
					angular.forEach($scope.allElementsModel.datatypeList, function (datatype) {
						if (child.datatype === datatype.id){
							datatype.possiblePredicates = child.selfPredicates;
							if (!datatype.relevant || datatype.relevant === false ){
								if ($scope.isRelevant(child)){
									datatype.relevant = true;					
								}
							}
						}	
				      });
//				}
				

				if ($scope.isRelevant(child)){
					child.relevant = true;					
				}else{
					child.relevant = false;
				}
			});
			return children;
		};

		/**
		 *
		 * @param parent
		 * @param removeCandidates
		 * @returns {*}
		 */
		var processComponentChildrenConstraints = function(parent, removeCandidates, model) {
			var children =  structuredClone(getNodeChildren(parent));//angular.copy(getNodeChildren(parent));
			var wantedChildren = [];
			angular.forEach(children, function(child) {
				if (parent.datatype) {
					child.type = parent.datatype.toLowerCase().indexOf('var') !== -1 ? 'DATATYPE' : 'SUBCOMPONENT';
				} else if (parent.type) {
					child.type = parent.type.toLowerCase().indexOf('var') !== -1 ? 'DATATYPE' : 'SUBCOMPONENT';
				}
				child.path = parent.path + "." + child.position;
				child.nodeParent = parent;
				
				child.selfValueSetBindings = []; //--
				child.selfSingleCodeBindings = [];
				child.selfConformanceStatements = []; //
				child.selfPredicates = [];
				child.selfValueSetBindings = child.selfValueSetBindings.concat(getDatatypeLevelValueSetBindings(child));
				child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getDatatypeLevelSingleCodeBindings(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getDatatypeLevelConfStatements(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getDatatypeConfStatements(child));
				child.selfPredicates = child.selfPredicates.concat(getDatatypeLevelPredicates(child));
//
//				if ($scope.nodeData.type === 'SEGMENT') {
//					child.selfValueSetBindings = child.selfValueSetBindings.concat(getSegmentLevelValueSetBindings(child));
//					child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getSegmentLevelSingleCodeBindings(child));
//					child.selfConformanceStatements = child.selfConformanceStatements.concat(getSegmentLevelConfStatements(child));
//					child.selfPredicates = child.selfPredicates.concat(getSegmentLevelPredicates(child));
//				} else if ($scope.nodeData.type === 'MESSAGE') {
					child.selfValueSetBindings = child.selfValueSetBindings.concat(getSegmentLevelValueSetBindings(child));
					child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getSegmentLevelSingleCodeBindings(child));
//					child.selfConformanceStatements = child.selfConformanceStatements.concat(getSegmentLevelConfStatements(child));
					child.selfPredicates = child.selfPredicates.concat(getSegmentLevelPredicates(child));
					child.selfValueSetBindings = child.selfValueSetBindings.concat(getMessageLevelValueSetBindings(child));
					child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getMessageLevelSingleCodeBindings(child));
//					child.selfConformanceStatements = child.selfConformanceStatements.concat(getMessageLevelConfStatements(child));
					child.selfPredicates = child.selfPredicates.concat(getMessageLevelPredicates(child));
					child.selfValueSetBindings = child.selfValueSetBindings.concat(getGroupLevelValueSetBindings(child));
					child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getGroupLevelSingleCodeBindings(child));
//					child.selfConformanceStatements = child.selfConformanceStatements.concat(getGroupLevelConfStatements(child));
					child.selfPredicates = child.selfPredicates.concat(getGroupLevelPredicates(child));
//				}
//				if (!$scope.visible(child)) {
//					removeCandidates.push(child);
//				} else {
//					wantedChildren.push(child);
//				}

				child.selfConformanceStatements = $scope.model.datatypes[child.datatype].conformanceStatements.filter(item => !constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
				child.testAssertionsList = $scope.model.datatypes[child.datatype].conformanceStatements.filter(item => constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});


				angular.forEach($scope.allElementsModel.datatypeList, function (datatype) {
					if (child.datatype === datatype.id){
						datatype.possiblePredicates = child.selfPredicates;
						if (!datatype.relevant || datatype.relevant === false ){
							if ($scope.isRelevant(child)){
								datatype.relevant = true;	
							}
						}
						
					}	
			      });
				if ($scope.isRelevant(child)){
					child.relevant = true;					
				}else{
					child.relevant = false;
				}
			});
			return children;
		};



		/**
		 *
		 * @param parent
		 * @param removeCandidates
		 * @returns {*}
		 */
		var processDatatypeChildrenConstraints = function(parent, removeCandidates) {
			var children =  structuredClone(getNodeChildren(parent));//angular.copy(getNodeChildren(parent));
			var wantedChildren = [];
			angular.forEach(children, function(child) {
				child.type = 'COMPONENT';
				child.path = child.position;
				
				child.selfValueSetBindings = [];
				child.selfSingleCodeBindings = [];
				child.selfConformanceStatements = [];
				child.selfPredicates = [];
//				//missing something?
				child.selfValueSetBindings = child.selfValueSetBindings.concat(getDatatypeLevelValueSetBindings(child));
				child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getDatatypeLevelSingleCodeBindings(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getDatatypeLevelConfStatements(child));
				child.selfPredicates = child.selfPredicates.concat(getDatatypeLevelPredicates(child));
//				if (!$scope.visible(child)) {
//					removeCandidates.push(child);
//				} else {
//					wantedChildren.push(child);
//				}

				child.selfConformanceStatements = $scope.model.datatypes[child.datatype].conformanceStatements.filter(item => !constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
				child.testAssertionsList = $scope.model.datatypes[child.datatype].conformanceStatements.filter(item => constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});

				
				if ($scope.isRelevant(child)){
					child.relevant = true;					
				}else{
					child.relevant = false;
				}
			});
			return children;
		};

		/**
		 *
		 * @param parent
		 * @param removeCandidates
		 * @returns {*}
		 */
		var processGroupChildrenConstraints = function(parent, removeCandidates) {
			var children =  structuredClone(getNodeChildren(parent));//angular.copy(getNodeChildren(parent));
			var wantedChildren = [];
			angular.forEach(children, function(child) {
				child.nodeParent = parent;
				child.selfValueSetBindings = []; //--
				child.selfSingleCodeBindings = [];
				child.selfConformanceStatements = []; //
				child.selfPredicates = [];
				child.selfValueSetBindings = child.selfValueSetBindings.concat(getGroupLevelValueSetBindings(child));
				child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getGroupLevelSingleCodeBindings(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getGroupLevelConfStatements(child));
				child.selfPredicates = child.selfPredicates.concat(getGroupLevelPredicates(child));
				child.selfValueSetBindings = child.selfValueSetBindings.concat(getMessageLevelValueSetBindings(child));
				child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getMessageLevelSingleCodeBindings(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getMessageLevelConfStatements(child));
				child.selfPredicates = child.selfPredicates.concat(getMessageLevelPredicates(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getSegmentConfStatements(child));
				
//				if (!$scope.visible(child)) {
//					removeCandidates.push(child);
//				} else {
//					wantedChildren.push(child);
//				}

				if (child.type ==="SEGMENT_REF"){
					child.selfConformanceStatements = $scope.model.segments[child.ref].conformanceStatements.filter(item => !constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
				}else if (child.type ==="GROUP"){
					child.testAssertionsList = child.conformanceStatements.filter(item => constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
				}
				if ($scope.isRelevant(child)){
					child.relevant = true;					
				}else{
					child.relevant = false;
				}

			});
			return children;
		};

		/**
		 *
		 * @param parent
		 * @param removeCandidates
		 * @returns {*}
		 */
		var processSegmentRefChildrenConstraints = function(parent, removeCandidates) {
			var children =  structuredClone(getNodeChildren(parent));// angular.copy(getNodeChildren(parent));
			var wantedChildren = [];
			angular.forEach(children, function(child) {
				child.nodeParent = parent;
				child.selfValueSetBindings = []; //--
				child.selfSingleCodeBindings = [];
				child.selfConformanceStatements = []; //
				child.selfPredicates = [];
				child.selfValueSetBindings = child.selfValueSetBindings.concat(getDatatypeLevelValueSetBindings(child));
				child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getDatatypeLevelSingleCodeBindings(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getDatatypeLevelConfStatements(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getDatatypeConfStatements(child));
//
//
				child.selfValueSetBindings = child.selfValueSetBindings.concat(getGroupLevelValueSetBindings(child));
				child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getGroupLevelSingleCodeBindings(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getGroupLevelConfStatements(child));
				child.selfPredicates = child.selfPredicates.concat(getGroupLevelPredicates(child));
				child.selfValueSetBindings = child.selfValueSetBindings.concat(getMessageLevelValueSetBindings(child));
				child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getMessageLevelSingleCodeBindings(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getMessageLevelConfStatements(child));
				child.selfPredicates = child.selfPredicates.concat(getMessageLevelPredicates(child));
				child.selfValueSetBindings = child.selfValueSetBindings.concat(getSegmentLevelValueSetBindings(child));
				child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getSegmentLevelSingleCodeBindings(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getSegmentLevelConfStatements(child));
				child.selfPredicates = child.selfPredicates.concat(getSegmentLevelPredicates(child));
//				if (!$scope.visible(child)) {
//					removeCandidates.push(child);
//				} else {
//					wantedChildren.push(child);
//				}
 				
					child.selfConformanceStatements = $scope.model.datatypes[child.datatype].conformanceStatements.filter(item => !constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
					child.testAssertionsList = $scope.model.datatypes[child.datatype].conformanceStatements.filter(item => constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});

					
					
					
				
				angular.forEach($scope.allElementsModel.datatypeList, function (datatype) {
					if (child.datatype === datatype.id){
						datatype.possiblePredicates = child.selfPredicates;
						if (!datatype.relevant || datatype.relevant === false ){
							if ($scope.isRelevant(child)){
								datatype.relevant = true;					
							}
						}
						
					}	
			      });

				if ($scope.isRelevant(child)){
					child.relevant = true;					
				}else{
					child.relevant = false;
				}
			});
			return children;
		};


		//get conf statement of the datatype (usefull for DTM that can have conf statement and are not complex)
		var getDatatypeConfStatements = function(element) {
			var datatype = findDataTypetById($scope.model.datatypeList, element.datatype);
			var confStatements = [];
			if (datatype && datatype != null && datatype.conformanceStatements.length > 0) {
				for (i = 0; i < datatype.conformanceStatements.length; i++) {
					var targetPath = datatype.conformanceStatements[i].constraintTarget;
					if (targetPath && targetPath === ".") {
						confStatements = confStatements.concat(datatype.conformanceStatements[i]);
						//					  confStatements = confStatements.concat(findConstraintsByTargetPath(datatype.conformanceStatements, "."));
					}
				}

			}
			return confStatements.sort(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
		};


		//TODO done
		var getSegmentConfStatements = function(element) {
			var segment = findSegmentById($scope.model.segmentList, element.ref);
			var confStatements = [];
			if (segment && segment != null && segment.conformanceStatements.length > 0) {
				for (i = 0; i < segment.conformanceStatements.length; i++) {
					var targetPath = segment.conformanceStatements[i].constraintTarget;
					if (targetPath && targetPath === ".") {
						confStatements = confStatements.concat(segment.conformanceStatements[i]);
					}
				}

			}
			return confStatements.sort(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
		};


		/**
		 *
		 * @param nodeData
		 * @param removeCandidates
		 * @returns {*}
		 */
		var processSegmentTabChildrenConstraints = function(nodeData, removeCandidates) {
			var children = structuredClone(nodeData.children);
			var wantedChildren = [];
			angular.forEach(children, function(child) {
				child.selfValueSetBindings = []; //--
				child.selfSingleCodeBindings = [];
				child.selfConformanceStatements = []; //
				child.selfPredicates = [];
				child.selfValueSetBindings = child.selfValueSetBindings.concat(getSegmentLevelValueSetBindings(child));
				child.selfValueSetBindings = child.selfValueSetBindings.concat(getDatatypeLevelValueSetBindings(child));
				child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getSegmentLevelSingleCodeBindings(child));
				child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getDatatypeLevelSingleCodeBindings(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getDatatypeConfStatements(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getSegmentLevelConfStatements(child));
				child.selfPredicates = getSegmentLevelPredicates(child);
//				if (!$scope.visible(child)) {
//					removeCandidates.push(child);
//				} else {
//					wantedChildren.push(child);
//				}

				child.selfConformanceStatements = child.conformanceStatements.filter(item => !constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
				child.testAssertionsList = child.conformanceStatements.filter(item => constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
				
				
				if ($scope.isRelevant(child)){
					child.relevant = true;					
				}else{
					child.relevant = false;
				}
			});
			return children;
		};

		/**
		 *
		 * @param nodeData
		 * @param removeCandidates
		 * @returns {*}
		 */
		var processMessageTabChildrenConstraints = function(nodeData, removeCandidates) {
			var children = structuredClone(nodeData.children);
			var wantedChildren = [];
			angular.forEach(children, function(child) {
				child.selfValueSetBindings = []; //--
				child.selfSingleCodeBindings = [];
				child.selfConformanceStatements = []; //
				child.selfPredicates = [];
				child.selfValueSetBindings = child.selfValueSetBindings.concat(getGroupLevelValueSetBindings(child));
				child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getGroupLevelSingleCodeBindings(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getGroupLevelConfStatements(child));
				child.selfPredicates = child.selfPredicates.concat(getGroupLevelPredicates(child));
				child.selfValueSetBindings = child.selfValueSetBindings.concat(getMessageLevelValueSetBindings(child));
				child.selfSingleCodeBindings = child.selfSingleCodeBindings.concat(getMessageLevelSingleCodeBindings(child));
//				child.selfConformanceStatements = child.selfConformanceStatements.concat(getMessageLevelConfStatements(child));
				child.selfPredicates = child.selfPredicates.concat(getMessageLevelPredicates(child));
//				if (!$scope.visible(child)) {
//					removeCandidates.push(child);
//				} else {
//					wantedChildren.push(child);
//				}

				if (child.type ==="SEGMENT_REF"){
					child.selfConformanceStatements = $scope.model.segments[child.ref].conformanceStatements.filter(item => !constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
					child.testAssertionsList = $scope.model.segments[child.ref].conformanceStatements.filter(item => constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
				}else if (child.type ==="GROUP"){
					child.selfConformanceStatements = child.conformanceStatements.filter(item => !constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
					child.testAssertionsList = child.conformanceStatements.filter(item => constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
				}
				
				if ($scope.isRelevant(child)){
					child.relevant = true;					
				}else{
					child.relevant = false;
				}
			});
			return children;
		};


      /**
       *
       * @param nodeData
       * @param removeCandidates
       * @returns {*}
       */
      var processSegRefOrGroupConstraints = function (segORGroup) {
        segORGroup.selfValueSetBindings = []; //--
        segORGroup.selfSingleCodeBindings = [];
        segORGroup.selfConformanceStatements = []; //
        segORGroup.selfPredicates = [];
        segORGroup.selfValueSetBindings = segORGroup.selfValueSetBindings.concat(getGroupLevelValueSetBindings(segORGroup));
        segORGroup.selfSingleCodeBindings = segORGroup.selfSingleCodeBindings.concat(getGroupLevelSingleCodeBindings(segORGroup)); segORGroup.selfConformanceStatements = segORGroup.selfConformanceStatements.concat(getGroupLevelConfStatements(segORGroup));
        segORGroup.selfPredicates = segORGroup.selfPredicates.concat(getGroupLevelPredicates(segORGroup));
        segORGroup.selfValueSetBindings = segORGroup.selfValueSetBindings.concat(getMessageLevelValueSetBindings(segORGroup));
        segORGroup.selfSingleCodeBindings = segORGroup.selfSingleCodeBindings.concat(getMessageLevelSingleCodeBindings(segORGroup));
//        segORGroup.selfConformanceStatements = segORGroup.selfConformanceStatements.concat(getMessageLevelConfStatements(segORGroup));
        segORGroup.selfPredicates = segORGroup.selfPredicates.concat(getMessageLevelPredicates(segORGroup));
		
		
		segORGroup.selfConformanceStatements = segORGroup.conformanceStatements.filter(item => !constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
		segORGroup.testAssertionsList = segORGroup.conformanceStatements.filter(item => constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
      };


      /**
       *
       * @returns {Array}
       */
      var processDataTypeTabChildrenConstraints = function () {
        var children = $scope.model.datatypeList.toSorted(function(a, b) {
          return a.name.localeCompare(b.name);
        });
		
		//we add the conformence statement at the datatype level: Edit now all target ok
		angular.forEach(children, function (child) {
			var datatype = findDataTypetById($scope.model.datatypeList,child.id);
	         var confStatements = [];
	         if (datatype && datatype != null && datatype.conformanceStatements.length > 0) {
				for( i =0 ; i< datatype.conformanceStatements.length ; i++){
//					var targetPath = datatype.conformanceStatements[i].constraintTarget;
//					if (targetPath && targetPath === ".") {
			          confStatements = confStatements.concat(datatype.conformanceStatements[i]);
//				   }
				}
	         }
			 child.selfConformanceStatements  = confStatements.filter(item => !constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
			 child.testAssertionsList = confStatements.filter(item => constraintIsTestAssertion(item)).toSorted(function(a, b) {return a.constraintId.localeCompare(b.constraintId);});
			
		});
		
        return children;
      };


      /**
       * return children of a node
       * @param parent: node to get the children of
       * @returns {Array}: collection of children nodes
       */
      $scope.getNodes = function (parent) {
        var removeCandidates = [];
        var children = [];
        if (!parent || parent == null) {			
          if ($scope.nodeData.type === 'SEGMENT' || $scope.nodeData.type === 'MESSAGE' || $scope.nodeData.type === 'SEGMENT_REF') {
			if ($scope.nodeData.type === 'SEGMENT_REF') {
				return $scope.nodeData.children;
//				children = processSegmentTabChildrenConstraints($scope.nodeData, removeCandidates);
			} 
			else if ($scope.nodeData.type === 'SEGMENT') {
//              children = processSegmentTabChildrenConstraints($scope.nodeData, removeCandidates);
            } else if ($scope.nodeData.type === 'MESSAGE') {
				return $scope.nodeData.children;
//              children = processMessageTabChildrenConstraints($scope.nodeData, removeCandidates);
            }
          } else if ($scope.nodeData.type === 'DATATYPE') {
			return $scope.nodeData.children;
//            children = processDataTypeTabChildrenConstraints();
          }	else if ($scope.nodeData.type === 'GROUP') {
					return $scope.nodeData.children;
			}
        } else {
			return parent.children;
          if (parent.type === 'FIELD') {
            children = processFieldChildrenConstraints(parent, removeCandidates);
          } else if (parent.type === 'COMPONENT') {
            children = processComponentChildrenConstraints(parent, removeCandidates);
          } else if (parent.type === 'DATATYPE') {
            children = processDatatypeChildrenConstraints(parent, removeCandidates);
          } else if (parent.type === 'GROUP') {
            children = processGroupChildrenConstraints(parent, removeCandidates);
          } else if (parent.type === 'SEGMENT_REF') {
            children = processSegmentRefChildrenConstraints(parent, removeCandidates);
          }
        }
        return children;//removeNotVisibles(removeCandidates, children);
      };

      $scope.params = new PvTreetableParams({
        getNodes: function (parent) {
          return $scope.getNodes(parent);
        },
        shouldExpand: function (node) {
          return $scope.nodeData.type === 'MESSAGE' && (node && node !== null && (node.type === 'SEGMENT_REF' || node.type === 'GROUP'));
        },
        toggleRelevance: function () {
          return $scope.setAllRelevance($scope.options.relevance);
        },
        getRelevance: function () {
          return $scope.options.relevance;
        },
        isRelevant: function (node) {
          return $scope.isRelevant(node);
        },
        getConcise: function () {
          return $scope.options.concise;
        },
        getTemplate: function (node) {
          if ($scope.nodeData && $scope.nodeData.type != undefined) {
            if ($scope.nodeData.type === 'SEGMENT' || $scope.nodeData.type === 'SEGMENT_REF') {
              return node.type === 'SEGMENT' || node.type === 'SEGMENT_REF' ? 'SegmentReadTree.html' : node.type === 'FIELD' ? 'SegmentFieldReadTree.html' : node.type === 'DATATYPE' ? 'SegmentDatatypeReadTree.html' : 'SegmentComponentReadTree.html';
            } else if ($scope.nodeData.type === 'MESSAGE' || $scope.nodeData.type === 'GROUP') {
              if (node.type === 'SEGMENT_REF') {
                return 'MessageSegmentRefReadTree.html';
              } else if (node.type === 'GROUP') {
                return 'MessageGroupReadTree.html';
              } else if (node.type === 'FIELD') {
                return 'MessageFieldViewTree.html';
              } else if (node.type === 'COMPONENT' || node.type === 'SUBCOMPONENT') {
                return 'MessageComponentViewTree.html';
              } else if (node.type === 'DATATYPE') {
                return 'MessageDatatypeViewTree.html';
              }
            } else if ($scope.nodeData.type === 'DATATYPE') {
              return node.type === 'DATATYPE' ? 'DatatypeReadTree.html' : node.type === 'COMPONENT' ? 'DatatypeComponentReadTree.html' : 'DatatypeSubComponentReadTree.html';
            }
          }
        },
        options: {
          initialState: 'collapsed'
        }
      });

      /**
       *
       */
      var refresh = function () {
        $rootScope.pvNodesMap = {};
        $scope.params.refreshWithState(!$scope.options.collapse ? 'expanded' : 'collapse');
      };

      /**
       *
       * @param node
       * @returns {boolean}
       */
      $scope.hasRelevantChild = function (node) {
        if (node != undefined) {
          var children = $scope.getNodes(node);
          if (children && children != null && children.length > 0) {
            return true;
          }
        }
        return false;
      };

      /**
       *
       * @param node
       * @returns {*|boolean}
       */
      $scope.visible = function (node) {
		return node && node != null && node.relevant;
//        return node && node != null && $scope.isRelevant(node);
      };

      /**
       *
       * @param selectedNode
       */
      $scope.getTabContent = function (selectedNode) {
						
        $scope.loadingTabContent = true;
        $timeout(function () {
          if (selectedNode != null) {
            $scope.csWidth = 0;
            $scope.predWidth = 0;
            $scope.confStatementsActive = false;
			$scope.testAssertionsActive = false;
			$scope.nodeData = selectedNode;
//            $scope.nodeData = angular.copy(selectedNode); // copy to not remove segment children when viewing segment tab concise 
            //                    $scope.options.collapse = selectedNode.type !== 'MESSAGE';
            $scope.options.collapse = true;
            refresh();
            $scope.predWidth = null;
            $scope.tableWidth = null;
            $scope.csWidth = null;
            getCsWidth();
            getPredWidth();
          }
          $scope.loadingTabContent = false;
        });
      };

      /**
       *
       * @param name
       * @returns {*}
       */
      var findSegmentByName = function (name) {
        return _.find($scope.model.segmentList, function (segment) {
          return segment.name == name;
        })
      };

      /**
       *
       */
      $scope.getDatatypesNodesContent = function () {
		if ($scope.options.relevance){
			$scope.getTabContent({ children: $scope.onlyRelevantElementsModel.datatypeList, type: 'DATATYPE', name: 'Datatypes' });
		}else{
			$scope.getTabContent({ children: $scope.allElementsModel.datatypeList, type: 'DATATYPE', name: 'Datatypes' });
		}
        
      };

      $scope.getNumberOfVisibleDatatypes = function () {
          if ($scope.options.relevance && $scope.onlyRelevantElementsModel) {
			//could use either model as the dataypeList is the same
            var list = _.filter($scope.onlyRelevantElementsModel.datatypeList, function (item, index) {
              return item.relevant === true;
            })
            return list.length;
          } else if ($scope.allElementsModel){
            return  $scope.allElementsModel.datatypeList.length;
          }
		  return 0;

      };



      /**
       *
       * @param value
       */
      $scope.setAllRelevance = function (value) {
        $scope.options.relevance = value;
        $scope.executeRelevance();
      };
      /**
       *
       * @param value
       */
      $scope.loadContent = function () {						
        if (!$scope.confStatementsActive && !$scope.testAssertionsActive && $scope.nodeData != null) {
          if ($scope.nodeData.name === 'FULL') {
            $scope.getTabContent($scope.model.message);
          } else if ($scope.nodeData.name === 'Datatypes') {
            $scope.getDatatypesNodesContent();
          } else {
            var segment = findSegmentByName($scope.nodeData.name);
            $scope.getTabContent(segment);
          }
        } else if ($scope.confStatementsActive) {
          $scope.showConfStatements();
        }else if ($scope.testAssertionsActive){
			$scope.showTestAssertions();
		}
      };

      /**
       *
       */
      $scope.showConfStatements = function () {
        $scope.loadingTabContent = true;
        $timeout(function () {
          $scope.confStatementsActive = true;
		  $scope.testAssertionsActive = false;
          $scope.loadingTabContent = false;
        });
      };
	  
	  
	  $scope.showTestAssertions = function () {
	        $scope.loadingTabContent = true;
	        $timeout(function () {
	          $scope.testAssertionsActive = true;
			  $scope.confStatementsActive = false;
	          $scope.loadingTabContent = false;
	        });
	      };
	  

      /**
       *
       * @param node
       * @returns {string}
       */
      $scope.getPredicatesAsMultipleLinesString = function (node) {
		if (!node) return;
        var predicates = node.selfPredicates;
        var html = "";
        if (predicates && predicates != null && predicates.length > 0) {
          angular.forEach(predicates, function (predicate) {
            html = html + "<p>" + predicate.description + "</p>";
          });
        }
        return html;
      };

      /**
       *
       * @param node
       * @returns {*}
       */
      $scope.getPredicatesAsOneLineString = function (node) {
        var predicates = node.selfPredicates;
        var html = "";
        if (predicates && predicates != null && predicates.length > 0) {
          angular.forEach(predicates, function (predicate) {
            html = html + predicate.description;
          });
        }
        return $sce.trustAsHtml(html);
      };

      /**
       *
       * @param node
       * @param constraints
       * @returns {*}
       */
      $scope.filterConstraints = function (node, constraints) {
        if (constraints) {
          return _.filter(constraints, function (constraint) {
            return fixPath(constraint.constraintTarget) === fixPath(node.position + '[1]');
          });
        }
        return null;
      };
      /**
       *
       * @param element
       * @returns {string}
       */
      var getMessageChildTargetPath = function (element) {
        if (element == null || element.type === "MESSAGE")
          return "";
        var parent = element.type === 'COMPONENT' || element.type === 'FIELD' ? element.nodeParent : $scope.parentsMap[element.id]; //X
        var pTarget = getMessageChildTargetPath(parent);
        return pTarget === "" ? element.position + "[1]" : pTarget + "."
          + element.position + "[1]";
      };

      /**
       *
       * @param element
       * @returns {string}
       */
      var getSegmentChildTargetPath = function (element) {
        if (element == null || element.type === "SEGMENT")
          return "";
        var parent = element.type === 'COMPONENT' ? element.nodeParent : $scope.parentsMap[element.id]; //X
        var pTarget = getSegmentChildTargetPath(parent);
        return pTarget === "" ? element.position + "[1]" : pTarget + "."
          + element.position + "[1]";
      };

      /**
       *
       * @param element
       * @returns {string}
       */
      var getDatatypeChildTargetPath = function (element) {
        if (element == null || element.type === "DATATYPE")
          return "";
        var parent = $scope.parentsMap[element.id]; //X
        var pTarget = getDatatypeChildTargetPath(parent);
        return pTarget === "" ? element.position + "[1]" : pTarget + "."
          + element.position + "[1]";
      };

      /**
       *
       * @param element
       * @param group
       * @returns {*}
       */
      var getGroupChildTargetPath = function (element, group) {
        if (!element || element == null || (element.type === "GROUP" && group && group != null && element.id === group.id))
          return "";
        if (isDirectParent(element, group)) {
          return getGroupDirectChildTargetPath(element);
        } else {
		  var parent = element.nodeParent;
//          var parent = $scope.parentsMap[element.id];
          var pTarget = getGroupChildTargetPath(parent, group);
          return pTarget === "" ? getGroupDirectChildTargetPath(element) : pTarget + "."
            + getGroupDirectChildTargetPath(element);
        }
      };

      /**
       *
       * @param element
       * @param group
       * @returns {boolean}
       */
      var isDirectParent = function (element, group) {
        return $scope.parentsMap[element.id] != undefined && $scope.parentsMap[element.id].id === group.id;
      };

      /**
       *
       * @param element
       * @returns {string}
       */
      var getGroupDirectChildTargetPath = function (element) {
//		if (element.position === undefined){
//			return  "1[1]";

//		}else{
			return element.position + "[1]";

//		}
      };
	  
	  $scope.getSegmentPath = function(element){
		var  path = getFullPath(element);
		if (path.indexOf('/') !== -1) path = `Path: ${path}`;
		  return (element.ref != null && element.ref !== element.name)
		    ? `<span>${path}</span><br><span>Flavor: ${element.ref}</span>`
		    : path;
	  }
	  
	  function getFullPath(element) {
	    return element.nodeParent
	      ? getFullPath(element.nodeParent) + '/' + element.name
	      : element.name;
	  }
	  
	 

      /**
       *
       * @param element
       * @returns {*}
       */
      var getGroupLevelConfStatements = function (element) {
        if (element.type === 'MESSAGE')
          return [];
        var group = getGroup(element); // element direct group
        var conformanceStatements = getGroupLevelConfStatementsByGroup(element, group);
        while ((group = getGroup(group)) != null) { // go through all the grand parent groups
          conformanceStatements = conformanceStatements.concat(getGroupLevelConfStatementsByGroup(element, group));
        }
        return conformanceStatements;
      };

      /**
       *
       * @param element
       * @returns {*}
       */
      var getGroupLevelValueSetBindings = function (element) {
        if (element.type === 'MESSAGE')
          return [];
        var group = getGroup(element); // element direct group
        var valueSetBindings = getGroupLevelValueSetBindingsByGroup(element, group);
        while ((group = getGroup(group)) != null) { // go through all the grand parent groups
          valueSetBindings = valueSetBindings.concat(getGroupLevelValueSetBindingsByGroup(element, group));
        }
        return valueSetBindings;
      };

      /**
         *
         * @param element
         * @returns {*}
         */
      var getGroupLevelSingleCodeBindings = function (element) {
        if (element.type === 'MESSAGE')
          return [];
        var group = getGroup(element); // element direct group
        var singleCodeBindings = getGroupLevelSingleCodeBindingsByGroup(element, group);
        while ((group = getGroup(group)) != null) { // go through all the grand parent groups
          singleCodeBindings = singleCodeBindings.concat(getGroupLevelSingleCodeBindingsByGroup(element, group));
        }
        return singleCodeBindings;
      };

      /**
       *
       * @param element
       * @param group
       * @returns {Array}
       */
      var getGroupLevelConfStatementsByGroup = function (element, group) {
        var conformanceStatements = [];
        if (group != null) {
          if (group.conformanceStatements != null && group.conformanceStatements.length > 0) {
            var targetPath = getGroupChildTargetPath(element, group);
            if (targetPath !== "") {
              conformanceStatements = conformanceStatements.concat(findConstraintsByTargetPath(group.conformanceStatements, targetPath));
            }
          }
        }
        return conformanceStatements;
      };

      /**
       *
       * @param element
       * @param group
       * @returns {Array}
       */
      var getGroupLevelValueSetBindingsByGroup = function (element, group) {
        var valueSetBindings = [];
        if (group != null) {
          if (group.valueSetBindings != null && group.valueSetBindings.length > 0) {
            var targetPath = getGroupChildTargetPath(element, group);
            if (targetPath !== "") {
              valueSetBindings = valueSetBindings.concat(findValueSetBindingsByTargetPath(group.valueSetBindings, targetPath));
            }
          }
        }
        return valueSetBindings;
      };

      /**
       *
       * @param element
       * @param group
       * @returns {Array}
       */
      var getGroupLevelSingleCodeBindingsByGroup = function (element, group) {
        var singleCodeBindings = [];
        if (group != null) {
          if (group.singlecodebindings != null && group.singlecodebindings.length > 0) {
            var targetPath = getGroupChildTargetPath(element, group);
            if (targetPath !== "") {
              singleCodeBindings = singleCodeBindings.concat(findSingleCodeBindingsByTargetPath(group.singlecodebindings, targetPath));
            }
          }
        }
        return singleCodeBindings;
      };


      /**
       *
       * @param element
       * @returns {*}
       */
      var getGroupLevelPredicates = function (element) {
        if (element.type === 'MESSAGE')
          return [];
        var group = getGroup(element); // element direct group
        if (group != null) {
          var predicates = getGroupLevelPredicatesByGroup(element, group);
          while ((group = getGroup(group)) != null) { // go through all the grand parent groups
            predicates = predicates.concat(getGroupLevelPredicatesByGroup(element, group));
          }
          return predicates;
        }
        return [];
      };

      /**
       *
       * @param element
       * @param group
       * @returns {Array}
       */
      var getDirectGroupLevelPredicatesByGroup = function (element, group) {
        if (group != null && group.predicates != null && group.predicates.length > 0) {
          var targetPath = getGroupDirectChildTargetPath(element, group);
          return findConstraintsByTargetPath(group.predicates, targetPath);
        }
        return [];
      };

      /**
       *
       * @param element
       * @param group
       * @returns {Array}
       */
      var getGroupLevelPredicatesByGroup = function (element, group) {
        if (group != null && group.predicates != null && group.predicates.length > 0) {
          var targetPath = getGroupChildTargetPath(element, group);
          return findConstraintsByTargetPath(group.predicates, targetPath);
        }
        return [];
      };

      /**
       *
       * @param element
       * @returns {Array}
       */
      var getMessageLevelConfStatements = function (element) {
        var conformanceStatements = [];
        if ($scope.model.message.conformanceStatements != null && $scope.model.message.conformanceStatements.length > 0) {
          var targetPath = getMessageChildTargetPath(element);
          if (targetPath !== "") {
            conformanceStatements = conformanceStatements.concat(findConstraintsByTargetPath($scope.model.message.conformanceStatements, targetPath));
          }
        }
        return conformanceStatements;
      };

      /**
       *
       * @param element
       * @returns {Array}
       */
      var getMessageLevelPredicates = function (element) {
        var predicates = [];
        if ($scope.model.message.predicates != null && $scope.model.message.predicates.length > 0) {
          var targetPath = getMessageChildTargetPath(element);
          if (targetPath !== "") {
            predicates = predicates.concat(findConstraintsByTargetPath($scope.model.message.predicates, targetPath));
          }
        }
        return predicates;
      };

      /**
      *
      * @param element
      * @returns {Array}
      */
      var getMessageLevelValueSetBindings = function (element) {
        var valueSetBindings = [];
        if ($scope.model.message.valuesetbindings != null && $scope.model.message.valuesetbindings.length > 0) {
          var targetPath = getMessageChildTargetPath(element);
          if (targetPath !== "") {
            valueSetBindings = valueSetBindings.concat(findValueSetBindingsByTargetPath($scope.model.message.valuesetbindings, targetPath));
          }
        }
        return valueSetBindings;
      };

      /**
      *
      * @param element
      * @returns {Array}
      */
      var getMessageLevelSingleCodeBindings = function (element) {
        var singleCodeBindings = [];
        if ($scope.model.message.singlecodebindings != null && $scope.model.message.singlecodebindings.length > 0) {
          var targetPath = getMessageChildTargetPath(element);
          if (targetPath !== "") {
            singleCodeBindings = singleCodeBindings.concat(findSingleCodeBindingsByTargetPath($scope.model.message.singlecodebindings, targetPath));
          }
        }
        return singleCodeBindings;
      };
      /**
       *
       * @param element
       * @returns {*}
       */
      var getSegment = function (element) {
        if (element.type === 'COMPONENT') {
          return getSegment(element.nodeParent);
        } else if (element.type === 'FIELD') { // find the segment
          return $scope.parentsMap[element.id];
        }
        return null;
      };

      /**
       *
       * @param element
       * @returns {*}
       */
      var getGroup = function (element) {
        if (element != null) {
          if (element.type === 'FIELD') {
            return getGroup(element.nodeParent);
          } else if (element.type === 'COMPONENT') {
            return getGroup(element.nodeParent);
          } else if (element.type === 'SEGMENT_REF') { // find the segment
            return $scope.parentsMap[element.id]; //X
          } else if (element.type === 'GROUP') { // find the segment
            return $scope.parentsMap[element.id]; //X
          }
        }
        return null;
      };


      /**
       *
       * @param element
       * @returns {Array}
       */
      var getSegmentLevelPredicates = function (element) {
        var segment = getSegment(element); // segment
        var predicates = [];
        if (segment != null && segment.predicates && segment.predicates != null && segment.predicates.length > 0) {
          var targetPath = getSegmentChildTargetPath(element);
          if (targetPath !== "") {
            predicates = predicates.concat(findConstraintsByTargetPath(segment.predicates, targetPath));

          }
        }
        return predicates;
      };

      /**
       *
       * @param element
       * @returns {Array}
       */
      var getSegmentLevelConfStatements = function (element) {
        var segment = getSegment(element); // segment
        var confStatements = [];
        if (segment != null && segment.conformanceStatements && segment.conformanceStatements != null && segment.conformanceStatements.length > 0) {
          var targetPath = getSegmentChildTargetPath(element);
          if (targetPath !== "") {
            confStatements = confStatements.concat(findConstraintsByTargetPath(segment.conformanceStatements, targetPath));
          }
        }
        return confStatements;
      };

      /**
         *
         * @param element
         * @returns {Array}
         */
      var getSegmentLevelValueSetBindings = function (element) {
        var segment = getSegment(element); // segment
        var valueSetBindings = [];
        if (segment != null && segment.valuesetbindings && segment.valuesetbindings != null && segment.valuesetbindings.length > 0) {
          var targetPath = getSegmentChildTargetPath(element);
          if (targetPath !== "") {
            valueSetBindings = valueSetBindings.concat(findValueSetBindingsByTargetPath(segment.valuesetbindings, targetPath));
          }
        }
        return valueSetBindings;
      };

      /**
       *
       * @param element
       * @returns {Array}
       */
      var getSegmentLevelSingleCodeBindings = function (element) {
        var segment = getSegment(element); // segment
        var singleCodeBindings = [];
        if (segment != null && segment.singlecodebindings && segment.singlecodebindings != null && segment.singlecodebindings.length > 0) {
          var targetPath = getSegmentChildTargetPath(element);
          if (targetPath !== "") {
            singleCodeBindings = singleCodeBindings.concat(findSingleCodeBindingsByTargetPath(segment.singlecodebindings, targetPath));
          }
        }
        return singleCodeBindings;
      };

      /**
       *
       * @param element
       * @returns {Array}
       */
      var getDatatypeLevelPredicates = function (element) {
        var datatype = $scope.parentsMap[element.id];
        var predicates = [];
        if (datatype && datatype != null && datatype.predicates.length > 0) {
          var targetPath = getDatatypeChildTargetPath(element);
          if (targetPath !== "") {
            predicates = predicates.concat(findConstraintsByTargetPath(datatype.predicates, targetPath));
          }
        }
        return predicates;
      };

      /**
       *
       * @param element
       * @returns {Array}
       */
      var getDatatypeLevelConfStatements = function (element) {
        var datatype = $scope.parentsMap[element.id];
        var confStatements = [];
        if (datatype && datatype != null && datatype.conformanceStatements.length > 0) {
          var targetPath = getDatatypeChildTargetPath(element);
          if (targetPath !== "") {
            confStatements = confStatements.concat(findConstraintsByTargetPath(datatype.conformanceStatements, targetPath));
          }
        }
        return confStatements;
      };

      /**
       *
       * @param element
       * @returns {Array}
       */
      var getDatatypeLevelValueSetBindings = function (element) {
        var datatype = $scope.parentsMap[element.id];
        var valueSetBindings = [];
        if (datatype && datatype.valuesetbindings != null && datatype.valuesetbindings.length > 0) {
          var targetPath = getDatatypeChildTargetPath(element);
          if (targetPath !== "") {
            valueSetBindings = valueSetBindings.concat(findValueSetBindingsByTargetPath(datatype.valuesetbindings, targetPath));
          }
        }
        return valueSetBindings;
      };

      /**
       *
       * @param element
       * @returns {Array}
       */
      var getDatatypeLevelSingleCodeBindings = function (element) {
        var datatype = $scope.parentsMap[element.id];
        var singleCodeBindings = [];
        if (datatype && datatype.singlecodebindings != null && datatype.singlecodebindings.length > 0) {
          var targetPath = getDatatypeChildTargetPath(element);
          if (targetPath !== "") {
            singleCodeBindings = singleCodeBindings.concat(findSingleCodeBindingsByTargetPath(datatype.singlecodebindings, targetPath));
          }
        }
        return singleCodeBindings;
      };

      /**
       *
       * @param node
       * @returns {string}
       */
      $scope.getConfStatementsAsMultipleLinesString = function (node) {
        var confStatements = node.selfConformanceStatements;
        var html = "";
        if (confStatements && confStatements != null && confStatements.length > 0) {
          angular.forEach(confStatements, function (conStatement) {
            html = html + "<p>" + conStatement.constraintId + " : " + conStatement.description + "</p>";
          });
        }
        return html;
      };

      /**
       *
       * @param node
       * @param constraints
       * @returns {*}
       */
      $scope.getConfStatementsAsOneLineString = function (node, constraints) {
        var confStatements = node.selfConformanceStatements;
        var html = "";
        if (confStatements && confStatements != null && confStatements.length > 0) {
          angular.forEach(confStatements, function (conStatement) {
            html = html + conStatement.constraintId + " : " + conStatement.description;
          });
        }
        return $sce.trustAsHtml(html);
      };


      $scope.scrollbarWidth = $rootScope.getScrollbarWidth();


      /**
       *
       * @returns {null|*|$scope.tableWidth}
       */
      var getTableWidth = function () {
        if ($scope.tableWidth === null) {
          $scope.tableWidth = $("#executionPanel").width();
        }
        return $scope.tableWidth;
      };

      /**
       *
       * @returns {null|*|$scope.csWidth}
       */
      var getCsWidth = function () {
        //if ($scope.csWidth === null) {
        var tableWidth = getTableWidth();
        if (tableWidth > 0) {
          var otherColumsWidth = !$scope.nodeData || $scope.nodeData === null || $scope.nodeData.type === 'MESSAGE' ? 800 : 800;
          var left = tableWidth - otherColumsWidth;
          $scope.csWidth = { "width": 2 * parseInt(left / 3) + "px" };
        }
        //}
        return $scope.csWidth;
      };

      var getPredWidth = function () {
        //if ($scope.predWidth === null) {
        var tableWidth = getTableWidth();
        if (tableWidth > 0) {
          //var otherColumsWidth = !$scope.nodeData || $scope.nodeData === null || $scope.nodeData.type === 'MESSAGE' ? 800 : 800;
          var left = tableWidth - 800;
          $scope.predWidth = { "width": parseInt(left / 3) + "px" };
        }
        // }
        return $scope.predWidth;
      };


      /**
       *
       * @param node
       * @returns {string}
       */
      $scope.getSegmentRefNodeName = function (node) {
        return node && $scope.model != null && $scope.model.segments != null && $scope.model.segments[node.ref] ? node.position + "." + $scope.model.segments[node.ref].name + ":" + $scope.model.segments[node.ref].description : '';
      };

      /**
       *
       * @param node
       * @returns {string}
       */
      $scope.getGroupNodeName = function (node) {
        return node.position + "." + node.name;
      };

      /**
       *
       * @param node
       * @returns {string}
       */
      $scope.getFieldNodeName = function (node) {
        return node.path + ":" + node.name;
      };

      /**
       *
       * @param node
       * @returns {string}
       */
      $scope.getComponentNodeName = function (node) {
        return node.path + "." + node.name;
      };

      /**
       *
       * @param node
       * @returns {string}
       */
      $scope.getDatatypeNodeName = function (node) {
        return node.position + "." + node.name;
      };

      /**
       *
       * @param node
       * @returns {*}
       */
      $scope.getDatatypeNodeName2 = function (node) {
        return node.id;
      };

      /**
       *
       * @param node
       * @returns {string}
       */
      $scope.getDatatypeNodeName3 = function (node) {
        return node.id + ":" + node.description;
      };

      $scope.getDatatypeNodeDescription3 = function (node) {
        return node.description;
      };


      /**
       *
       * @param component
       * @returns {boolean|{}|*|$scope.parentsMap}
       */
      $scope.isSubDT = function (component) {
        return component.type === 'COMPONENT' && $scope.parentsMap && $scope.parentsMap[component.id] && $scope.parentsMap[component.id].type === 'COMPONENT';
      };

      /**
       *
       * @param node
       * @returns {string}
       */
      $scope.getComponentNodeName2 = function (node) {
        return node.position + "." + node.name;
      };

      /**
       *
       * @param node
       * @returns {string}
       */
      $scope.getSegmentReadName = function (node) {
        return node.name + "." + node.description;
      };
    }
    ]);


  mod.factory('ProfileService', function ($http, $q, $filter) {
    var ProfileService = function () {
    };

    /**
     *
     * @param segments
     * @param datatypes
     * @returns {Array}
     */
    ProfileService.prototype.getValueSetIds = function (segments, datatypes) {
      var valueSetIds = [];
      angular.forEach(segments, function (segment) {
        angular.forEach(segment.children, function (field) {
          if (field.table && valueSetIds.indexOf(field.table) === -1) {
            valueSetIds.push(field.table);
          }
        });
      });
      angular.forEach(datatypes, function (datatype) {
        angular.forEach(datatype.children, function (component) {
          if (component.table && valueSetIds.indexOf(component.table) === -1) {
            valueSetIds.push(component.table);
          }
          if (component.children && component.children.length > 0) {
            angular.forEach(component.children, function (subcomponent) {
              if (subcomponent.table && valueSetIds.indexOf(subcomponent.table) === -1) {
                valueSetIds.push(subcomponent.table);
              }
              if (subcomponent.children && subcomponent.children.length > 0) {
                angular.forEach(subcomponent.children, function (subcomponent2) {
                  if (subcomponent2.table && valueSetIds.indexOf(subcomponent2.table) === -1) {
                    valueSetIds.push(subcomponent2.table);
                  }
                });
              }
            });
          }
        });
      });
      return valueSetIds;
    };

    /**
     *
     * @param datatypes
     */
    ProfileService.prototype.setDatatypesTypesAndIcons = function (datatypes) {
      if (datatypes !== null) {
        var that = this;
        angular.forEach(datatypes.children, function (datatype) {
          if (datatype.children.length > 0) {
            angular.forEach(datatype.children, function (component) {
              that.setComponentTypesAndIcons(component);
            });
          }
        });
      }
    };

    /**
     *
     * @param component
     */
    ProfileService.prototype.setComponentTypesAndIcons = function (component) {
      component.type = "COMPONENT";
      component.icon = "component.png";
      var that = this;
      if (component.children.length > 0) {
        angular.forEach(component.children, function (subcomponent) {
          that.setSubComponentTypesAndIcons(subcomponent);
        });
      }
    };

    /**
     *
     * @param subComponent
     */
    ProfileService.prototype.setSubComponentTypesAndIcons = function (subComponent) {
      subComponent.type = "SUBCOMPONENT";
      subComponent.icon = "subcomponent.png";
      var that = this;
      if (subComponent.children.length > 0) {
        angular.forEach(subComponent.children, function (child) {
          that.setSubComponentTypesAndIcons(child);
        });
      }
    };

    /**
     *
     * @param id
     * @returns {*}
     */
    ProfileService.prototype.getJson = function (id) {
      var delay = $q.defer();
      $http.get('api/profile/' + id).then(
        function (object) {
          try {
            delay.resolve(angular.fromJson(object.data));
          } catch (e) {
            delay.reject("Invalid character");
          }
        },
        function (response) {
          delay.reject(response.data);
        }
      );

      //            $http.get('../../resources/cf/profile-loi-2.json').then(
      //                function (object) {
      //                    delay.resolve(angular.fromJson(object.data));
      //                },
      //                function (response) {
      //                    delay.reject(response.data);
      //                }
      //            );

      return delay.promise;
    };

    return ProfileService;

  });


  mod.factory('PvTreetableParams', ['$log', function ($log) {
    var params = function (baseConfiguration) {
      var self = this;

      /**
       * @ngdoc method
       * @param {<any>} parent A parent node to fetch children of, or null if fetching root nodes.
       */
      this.getNodes = function (parent) {
      }

      this.getRelevance = function () {
      }

      this.toggleRelevance = function () {
      }

      this.toggleConcise = function () {
      }

      this.isRelevant = function (node) {
      }

      this.shoudlExpand = function (node) {
      }

      /**
       * @ngdoc method
       * @param {<any>} node A node returned from getNodes
       */
      this.getTemplate = function (node) {
      }

      /**
       * @ngdoc property
       */
      this.options = {};

      /**
       * @ngdoc method
       */
      this.refresh = function () {
      }

      if (angular.isObject(baseConfiguration)) {
        angular.forEach(baseConfiguration, function (val, key) {
          if (['getNodes', 'getTemplate', 'options', 'getRelevance', 'toggleRelevance', 'toggleConcise', 'getConcise', 'isRelevant', 'shouldExpand'].indexOf(key) > -1) {
            self[key] = val;
          } else {
            $log.warn('PvTreetableParams - Ignoring unexpected property "' + key + '".');
          }
        });
      }

    }
    return params;
  }]);

  mod.controller('PvTreetableController', ['$scope', '$element', '$compile', '$templateCache', '$q', '$http', '$timeout', function ($scope, $element, $compile, $templateCache, $q, $http, $timeout) {

    var params = $scope.pvParams;
    var table = $element;

    $scope.compileElement = function (node, parentId, parentNode) {
      //var tpl = params.getTemplate(node);

	  
	  var template = $templateCache.get(params.getTemplate(node));
	  var template_scope = $scope.$parent.$new();
	          angular.extend(template_scope, {
	            node: node,
	            parentNode: parentNode
	          });
	          template_scope._ttParentId = parentId;
	  return $compile(template)(template_scope).get(0);
	  
//      var templatePromise = $http.get(params.getTemplate(node), { cache: $templateCache }).then(function (result) {
//        return result.data;
//      });
//
//      return templatePromise.then(function (template) {
//        var template_scope = $scope.$parent.$new();
//        angular.extend(template_scope, {
//          node: node,
//          parentNode: parentNode
//        });
//        template_scope._ttParentId = parentId;
//        return $compile(template)(template_scope).get(0);
//      })

    };

    /**
     * Expands the given node.
     * @param parentElement the parent node element, or null for the root
     * @param shouldExpand whether all descendants of `parentElement` should also be expanded
     */
    $scope.addChildren = function (parentElement, shouldExpand) {
      var parentNode = parentElement && parentElement.scope() ? parentElement.scope().node : null;
      var parentId = parentElement ? parentElement.data('ttId') : null;

      if (parentElement) {
        parentElement.scope().loading = true;
      }

      var data = params.getNodes(parentNode);
	  if (data.length > 0){
		
		var elementPromises = [];
		var elements = [];
		var elements2 = [];
	      angular.forEach(data, function (node) {
//	        elementPromises.push();
			var ele = $scope.compileElement(node, parentId, parentNode);
			elements.push({"node":node, "element":ele});
			elements2.push(ele);
	      });
		  var parentTtNode = parentId != null ? table.treetable("node", parentId) : null;
		  
		  			$element.treetable('loadBranch', parentTtNode, elements2);				
		  	        
						angular.forEach(elements, function (el) {
						if (shouldExpand && ((parentNode === null &&  el.node.type !=="SEGMENT_REF") || el.node.type === "GROUP"  )) {
				            $scope.addChildren($(el.element), shouldExpand);
							}
				          });         		  	        
		  	        if (parentElement && parentElement.scope()) {
		  	          parentElement.scope().loading = false;
		  	        }
		  
		  
	
//		  console.log("start promises "+ elementPromises.length);
//	      $q.all(elementPromises).then(function (newElements) {
//				console.log("done all promises "+ elementPromises.length);
//		        var parentTtNode = parentId != null ? table.treetable("node", parentId) : null;
//		
//		        $element.treetable('loadBranch', parentTtNode, newElements);
//		
//		        if (shouldExpand) {
//					console.log(newElements);
//		          angular.forEach(newElements, function (el) {
//					console.log("add children ",$(el));
//		            $scope.addChildren($(el), shouldExpand);
//		          });
//		        }
//		        if (parentElement && parentElement.scope()) {
//		          parentElement.scope().loading = false;
//		        }
//		     });
	  }
      
	  
	  
    };
 

    /**
     * Callback for onNodeExpand to add nodes.
     */
    $scope.onNodeExpand = function () {
      if (this.row.scope().loading) return; // make sure we're not already loading
      table.treetable('unloadBranch', this); // make sure we don't double-load
      $scope.addChildren(this.row, $scope.shouldExpand());
      var id = this.row ? this.row.data('ttId') : null;
      //$scope.toggleNodeView(id);
    };

    /**
     * Callback for onNodeCollapse to remove nodes.
     */
    $scope.onNodeCollapse = function () {
      if (this.row.scope().loading) return; // make sure we're not already loading
      table.treetable('unloadBranch', this);
    };

    /**
     * Rebuilds the entire table.
     */
    $scope.refresh = function () {		
      if (table && table.data('treetable')) {
        var rootNodes = table.data('treetable').nodes;
        while (rootNodes.length > 0) {
          table.treetable('removeNode', rootNodes[0].id);
        }
        $scope.addChildren(null, $scope.shouldExpand());
		$scope.toggleAllView();
      }
    };

    $scope.toggleAllView = function () {
      $timeout(function () {
        params.toggleRelevance();
        //params.toggleConcise();
      }, 100);
    };


    $scope.setRowConcise = function (rowId) {

    };

    // COntinie work on toggle here
    $scope.toggleNodeView = function (id) {
      //            $timeout(function () {
      //                if (!params.getConcise()) {
      //                    $('table.pvt tr td span span.concise-view').hide();
      //                    $('table.pvt tr td span span.expanded-view').show();
      //                } else {
      //                    $('table.pvt tr td span span.expanded-view').hide();
      //                    $('table.pvt tr  td span span.concise-view').show();
      //                }
      //            }, 100);
    };

    $scope.refreshWithState = function (state) {
      $scope.options.initialState = state;
      $scope.refresh();
    };


    $scope.getNode = function (id) {
      return table.treetable("node", id);
    };


    $scope.toggleExpand = function (id, expand) {
    };

    // attach to params for convenience
    params.refresh = $scope.refresh;
    params.force = true;
    //          params.expand = $scope.expandChildren;
    //          params.collapse = $scope.collapseChildren;

    params.refreshWithState = $scope.refreshWithState;
    params.toggleExpand = $scope.toggleExpand;
    params.getNode = $scope.getNode;

    /**
     * Build options for the internal treetable library.
     */
    $scope.getOptions = function () {
      var opts = angular.extend({
        expandable: true,
        onNodeExpand: $scope.onNodeExpand,
        onNodeCollapse: $scope.onNodeCollapse
      }, params.options);

      if (params.options) {
        // Inject required event handlers before custom ones
        angular.forEach(['onNodeCollapse', 'onNodeExpand'], function (event) {
          if (params.options[event]) {
            opts[event] = function () {
              $scope[event].apply(this, arguments);
              params.options[event].apply(this, arguments);
            }
          }
        });
      }

      return opts;
    };

    $scope.shouldExpand = function () {
      return $scope.options.initialState === 'expanded';
    };

	
			
	
    $scope.options = $scope.getOptions();
    table.treetable($scope.options);
    $scope.addChildren(null, $scope.shouldExpand());
	

  }]);

  mod.directive('pvTable', [function () {
    return {
      restrict: 'AC',
      scope: {
        pvParams: '='
      },
      controller: 'PvTreetableController'
    }
  }]);

  mod.directive('pvNode', ['$cookies', '$rootScope', function ($cookies, $rootScope) {
    var ttNodeCounter = 0;
    return {
      restrict: 'AC',
      scope: {
        isBranch: '=',
        parent: '=',
        node: '='
      },
      link: function (scope, element, attrs) {
        var branch = angular.isDefined(scope.isBranch) ? scope.isBranch : true;

        // Look for a parent set by the tt-tree directive if one isn't explicitly set
        var parent = angular.isDefined(scope.parent) ? scope.parent : scope.$parent._ttParentId;
        var id = ttNodeCounter;
        element.attr('data-tt-id', ttNodeCounter++);
        element.attr('data-tt-branch', branch);
        element.attr('data-tt-parent-id', parent);
        //                var node = angular.isDefined(scope.node) ? scope.node : null;
        //                if (node != null) {
        //                    $rootScope.pvNodesMap[node] = ttNodeCounter;
        //                }
      }
    }
  }]);

  mod.controller('ProfileViewerValueSetDetailsCtrl', function ($scope, $modalInstance, table, $rootScope, $filter) {
    $scope.valueSet = table;
    $scope.scrollbarWidth = $rootScope.getScrollbarWidth();
    //table.valueSetElements=  $filter('orderBy')(table != null ? table.valueSetElements: [], 'bindingIdentifier');
    $scope.tmpValueSetElements = [].concat(table != null ? table.valueSetElements : []);
    $scope.cancel = function () {
      $modalInstance.close();
    };
    $scope.close = function () {
      $modalInstance.close();
    };

  });
  
  mod.controller('ProfileViewerDataTypeDetailsCtrl', function ($scope, $modalInstance, dt, $rootScope, $filter,PvTreetableParams,VocabularyService,$modalStack,$modal) {
		$scope.displayMap = {};
		$scope.dt =  structuredClone(dt); //angular.copy(dt);
	  
	  for (var i = 0; i < dt.children.length; i++) {
		if (dt.children[i].type === "COMPONENT"){
			$scope.displayMap[dt.children[i].id] = false;
		}		
	  }
	  
	  
	  
	  $scope.toggleChilds = function(child){
		if($scope.displayMap[child.id] !== undefined){
			$scope.displayMap[child.id] = !$scope.displayMap[child.id];
		}		
	  };
	  
	  $scope.isDisplayed = function (parent){
		if(parent){
			return $scope.displayMap[parent.id];
		}else{
			return true;
		}
	  };
	  
	  
	  
	  $scope.getConfStatementsAsMultipleLinesString = function(node) {
		  var confStatements = node.selfConformanceStatements;
		  var html = "";
		  if (confStatements && confStatements != null && confStatements.length > 0) {
			  angular.forEach(confStatements, function(conStatement) {
				  html = html + "<p>" + conStatement.constraintId + " : " + conStatement.description + "</p>";
			  });
		  }
		  return html;
	  };
	  
	  $scope.getPredicatesAsOneLineString = function (node) {
	          var predicates = node.selfPredicates;
	          var html = "";
	          if (predicates && predicates != null && predicates.length > 0) {
	            angular.forEach(predicates, function (predicate) {
	              html = html + predicate.description;
	            });
	          }
	          return $sce.trustAsHtml(html);
	        };

	  $scope.getValueSet = function(node) { //older
		  var tables = []
		  if (node.table && node.table != null) {
			  var tables = node.table.split(":");
		  }
		  return tables;
	  };

	  /**
		 *
		 * @param tableStr
		 * @returns {*}
		 */
	  $scope.getValueSetBindings = function(node) {
		  var tables = []
		  if (node.selfValueSetBindings && node.selfValueSetBindings != null && node.selfValueSetBindings.length > 0) {
			  var parser = new DOMParser();
			  for (var j = 0; j < node.selfValueSetBindings.length; j++) {
				  tables.push(node.selfValueSetBindings[j]);
			  }
		  }
		  return tables;
	  };

	  $scope.hasChild = function(node) {
		  if (node != undefined) {
			  var children = node.children;
			  if (children && children != null && children.length > 0) {
				  return true;
			  }
		  }
		  return false;
	  };

	  $scope.getSingleCodes = function(node) {
		  var singleCodes = []
		  if (node.table && node.table != null) {
			  tables = node.table.split(":");
		  }
		  if (node.selfSingleCodeBindings && node.selfSingleCodeBindings != null && node.selfSingleCodeBindings.length > 0) {
			  var parser = new DOMParser();
			  for (var j = 0; j < node.selfSingleCodeBindings.length; j++) {
				  singleCodes.push(node.selfSingleCodeBindings[j]);
			  }
		  }
		  return singleCodes;
	  };
	  
	  $scope.showValueSetDefinition = function (tableId) {
	          var t = VocabularyService.findValueSetDefinition(tableId);
	          $modal.open({
	            templateUrl: 'TableFoundCtrl.html',
	            controller: 'ProfileViewerValueSetDetailsCtrl',
	            windowClass: 'valueset-modal',
	            animation: false,
	            keyboard: true,
	            backdrop: true,
	            resolve: {
	              table: function () {
	                return t;
	              }
	            }
	          });
	        };
		
		$scope.hasContextConfStatement = function(){
			for (var i=0;i <dt.selfConformanceStatements.length; i++){
				if ($scope.isContextConfStatement(dt.selfConformanceStatements[i])){
					return true;
				}
			}	
			return false;
		};
			
		$scope.isContextConfStatement = function(item) {	      
	          if (item.constraintTarget === ".") {
	            return true; 
	          } 	        	      
	      return false; 
	    };
	   
      $scope.scrollbarWidth = $rootScope.getScrollbarWidth();
//      $scope.tmpValueSetElements = [].concat(table != null ? table.valueSetElements : []);
      $scope.cancel = function () {
        $modalInstance.close();
      };
      $scope.close = function () {
        $modalInstance.close();
      };

    });



})
  (angular);
