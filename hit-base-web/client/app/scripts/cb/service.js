'use strict';


angular.module('cb').factory('CB',
    ['Message', 'ValidationSettings', 'Tree', 'StorageService', 'Transport', 'Logger', 'User', function (Message, ValidationSettings, Tree, StorageService, Transport, Logger, User) {
        var CB = {
            testCase: null,
            selectedTestCase: null,
            selectedTestPlan: null,
            editor: null,
            tree: new Tree(),
            cursor: null,
            message: new Message(),
            logger: new Logger(),
            validationSettings: new ValidationSettings(),
            setContent: function (value) {
                CB.message.content = value;
                CB.editor.instance.doc.setValue(value);
                CB.message.notifyChange();
            },
            getContent: function () {
                return  CB.message.content;
            }
        };
        return CB;
    }]);

angular.module('cb').factory('CBTestPlanListLoader', ['$q', '$http','StorageService',
    function ($q, $http,StorageService) {
        return function (scope,domain) {
            var delay = $q.defer();
            $http.get("api/cb/testplans", {timeout: 180000, params: {"scope": scope,"domain": domain}}).then(
                function (object) {
                    delay.resolve(angular.fromJson(object.data));
                },
                function (response) {
                    delay.reject(response.data);
                }
            );


            return delay.promise;
        };
    }
]);


angular.module('cb').factory('CBTestPlanLoader', ['$q', '$http', '$rootScope','CacheFactory',
	function ($q, $http, $rootScope,CacheFactory) {
	return function (id,domain) {
		var delay = $q.defer();

		if (!CacheFactory.get($rootScope.appInfo.name)) {
			CacheFactory.createCache($rootScope.appInfo.name, {
				storageMode: 'localStorage'
			});
		}				
		var cache = CacheFactory.get($rootScope.appInfo.name);

		$http.get("api/cb/testplans/" + id+"/updateDate", { timeout: 180000}).then(
				function (date) {	
					var cacheData = cache.get("api/cb/testplans/" + id);
					if (cacheData && cacheData.updateDate === date.data) {
						delay.resolve(cache.get("api/cb/testplans/" + id));
					} else {
						$http.get("api/cb/testplans/" + id, { timeout: 180000}).then(
								function (object) {	
									cache.put("api/cb/testplans/" + id,angular.fromJson(object.data)),
									delay.resolve(angular.fromJson(object.data));
								},
								function (response) {
									delay.reject(response.data);
								}
						);
					}					
				},
				function (error) {
					delay.reject(error.data);
				}
		);
		return delay.promise;
	};
}
]);
		
		




angular.module('cb').factory('CBTestPlanManager', ['$q', '$http',
  function ($q, $http) {
    var manager = {
      getTestPlan:  function (testPlanId) {
        var delay = $q.defer();
        $http.get("api/cb/management/testPlans/" + testPlanId, {timeout: 180000}).then(
          function (object) {
            delay.resolve(angular.fromJson(object.data));
          },
          function (response) {
            delay.reject(response.data);
          }
        );

        return delay.promise;
      },

      getTestPlans: function (scope,domain) {
        var delay = $q.defer();
        $http.get("api/cb/management/testPlans", {timeout: 180000, params: {"scope": scope,"domain":domain}}).then(
          function (object) {
            delay.resolve(angular.fromJson(object.data));
          },
          function (response) {
            delay.reject(response.data);
          }
        );
        return delay.promise;
      },
      publishTestPlan:  function (testPlanId) {
        var delay = $q.defer();
        $http.post('api/cb/management/testPlans/'+ testPlanId + '/publish').then(
          function (object) {
            delay.resolve(angular.fromJson(object.data));
          },
          function (response) {
            delay.reject(response.data);
          }
        );
        return delay.promise;
      },
      deleteTestStep:  function (testStep) {
        var delay = $q.defer();
        $http.post('api/cb/management/testCases/'+ testStep.parent.id + '/testSteps/'+ testStep.id + '/delete').then(
          function (object) {
            delay.resolve(angular.fromJson(object.data));
          },
          function (response) {
            delay.reject(response.data);
          }
        );
        return delay.promise;
      },

      deleteTestCase:  function (testCase) {
        var delay = $q.defer();
        var context = testCase.parent.type === 'TestPlan' ? 'testPlans/' : 'testCaseGroups/';
        $http.post('api/cb/management/' + context + testCase.parent.id + '/testCases/'+ testCase.id + '/delete').then(
          function (object) {
            delay.resolve(angular.fromJson(object.data));
          },
          function (response) {
            delay.reject(response.data);
          }
        );
        return delay.promise;
      },

      deleteTestPlan:  function (testPlan) {
        var delay = $q.defer();
        $http.post('api/cb/management/testPlans/'+ testPlan.id + '/delete').then(
          function (object) {
            delay.resolve(angular.fromJson(object.data));
          },
          function (response) {
            delay.reject(response.data);
          }
        );
        return delay.promise;
      },

      deleteTestCaseGroup:  function (testCaseGroup) {
        var delay = $q.defer();
        var context = testCaseGroup.parent.type === 'TestPlan' ? 'testPlans/' : 'testCaseGroups/';

        $http.post('api/cb/management/' + context + testCaseGroup.parent.id + '/testCaseGroups/'+ testCaseGroup.id + '/delete').then(
          function (object) {
            delay.resolve(angular.fromJson(object.data));
          },
          function (response) {
            delay.reject(response.data);
          }
        );
        return delay.promise;
      },

      updateTestCaseGroupName:  function (node) {
    	  console.log("coucouddd");
        var delay = $q.defer();
        $http.post('api/cb/management/testCaseGroups/'+ node.id + '/name', {"name":node.editName}).then(
          function (object) {
            delay.resolve(angular.fromJson(object.data));
          },
          function (response) {
            delay.reject(response.data);
          }
        );
        return delay.promise;
      },

      updateTestCaseName:  function (node) {
        var delay = $q.defer();
        $http.post('api/cb/management/testCases/'+ node.id + '/name',  {"name":node.editName}).then(
          function (object) {
            delay.resolve(angular.fromJson(object.data));
          },
          function (response) {
            delay.reject(response.data);
          }
        );
        return delay.promise;
      },
      updateTestStepName:  function (node) {
        var delay = $q.defer();
        $http.post('api/cb/management/testSteps/'+ node.id + '/name',  {"name":node.editName}).then(
          function (object) {
            delay.resolve(angular.fromJson(object.data));
          },
          function (response) {
            delay.reject(response.data);
          }
        );
        return delay.promise;
      },
      updateTestPlanName:  function (node) {
    	  console.log("coucou");
        var delay = $q.defer();
        $http.post('api/cb/management/testPlans/'+ node.id + '/name',  {"name":node.editName}).then(
          function (object) {
            delay.resolve(angular.fromJson(object.data));
          },
          function (response) {
            delay.reject(response.data);
          }
        );
        return delay.promise;
      },
      saveZip:  function (token,domain) {
          var delay = $q.defer();
          $http.post("api/cb/management/saveZip/", {"token": token,"domain":domain}).then(
            function (object) {
              delay.resolve(angular.fromJson(object.data));
            },
            function (response) {
              delay.reject(response.data);
            }
          );

          return delay.promise;
        },
        unpublishTestPlan:  function (testPlanId) {
            var delay = $q.defer();
            $http.post('api/cb/management/testPlans/'+ testPlanId + '/unpublish').then(
                function (object) {
                    delay.resolve(angular.fromJson(object.data));
                },
                function (response) {
                    delay.reject(response.data);
                }
            );
            return delay.promise;
        }




    };
    return manager;
  }
]);








