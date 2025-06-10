'use strict';


angular.module('cache').factory('CachingService', ['$q', '$http', '$rootScope', 'CacheFactory','CBTestPlanListLoader','CBTestPlanLoader','CFTestPlanExecutioner',
	function ($q, $http, $rootScope, CacheFactory,CBTestPlanListLoader,CBTestPlanLoader,CFTestPlanExecutioner) {
	var manager = {
			cacheCBTestPlans:  function (scope,domain) {
				 var tcGlobalLoader = new CBTestPlanListLoader(scope, $rootScope.domain.domain);
                 tcGlobalLoader.then(function (testPlans) {
                   for (var i = 0; i < testPlans.length; i++) {
                	   var tcLoader = new CBTestPlanLoader(testPlans[i].id,$rootScope.domain);
                       tcLoader.then(function (testPlan) {
                       }, function (error) {                                                                                
                       });
                     }
                 }, function (error) {
                   $scope.error = "Sorry, Cannot load the test plans. Please try again";
                 });				
			},
			
			cacheCFTestPlans: function (scope,domain) {
				CFTestPlanExecutioner.getTestPlans(scope, domain).then(function (testPlans) {
                  for (var i = 0; i < testPlans.length; i++) {
                	  CFTestPlanExecutioner.getTestPlan(testPlans[i].id,$rootScope.domain).then(function (testPlan) {
                      }, function (error) { 
                    	  
                      });
                    }
                }, function (error) {
                  $scope.error = "Sorry, Cannot load the test plans. Please try again";
                });				
			}
	};
	return manager;
}
]);