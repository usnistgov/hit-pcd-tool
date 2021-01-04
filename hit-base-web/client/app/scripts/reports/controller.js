'use strict';

/* "newcap": false */

angular.module('reports')
.controller('ReportsCtrl', ['$scope', 'ValidationLogService','ReportService', 'Notification', '$modal','$rootScope','$timeout',
  function ($scope, ValidationLogService, ReportService, Notification, $modal,$rootScope,$timeout) {

    $scope.reports = null;
    $scope.tmpReports = null;
    $scope.logDetails = null;
    $scope.error = null;
    $scope.loadingAll = false;
    $scope.loadingOne = false;

    $scope.allReports = [];
    $scope.tmpReports - [];
    $scope.contextType = "*";
    $scope.userType = "*";
    $scope.resultType = "*";
    $scope.expandTCs = true;
    
    $scope.expandTree = true;
    
   

    $scope.initReportsLogs = function () {
        $scope.loadingAll = true;
        $timeout(function() {
            ReportService.getAllReportsByAccountIdAndDomain($rootScope.domain.domain).then(function (reports) {
                $scope.allReports = reports;
                
                $scope.contextType = "*";
                $scope.resultType = "*";
                $scope.filterBy();
				$scope.loadingAll = false;				
            }, function (error) {
                $scope.loadingAll = false;
                $scope.error = "Sorry, Cannot load the reports. Please try again. \n DEBUG:" + error;
            });
        },1000);
    };
    
    $scope.toggleExpand = function () {
    	for (var i = 0, len = $scope.reports.length; i < len; i++) {
        	$scope.reports[i].expanded = $scope.expandTCs;
        }
    	
    };

    $scope.openReportDetails = function (report) {
      var modalInstance = $modal.open({
        templateUrl: 'ReportDetails.html',
        controller: 'ReportDetailsCtrl',
        windowClass: 'valueset-modal',
        animation: false,
        keyboard: true,
        backdrop: true,
        resolve: {
        	report: function () {
            return report;
          }
        }
      });
    };

    $scope.filterBy = function () {
      $scope.reports = $scope.filterByResultType($scope.filterByContextType($scope.allReports));
      $scope.tmpReports = [].concat($scope.reports);
    };


    $scope.filterByContextType = function (inputLogs) {
      return _.filter(inputLogs, function (report) {
        return ($scope.contextType === "*" ) || ($scope.contextType === report.stage);
      });
    };


    $scope.filterByResultType = function (inputLogs) {
      return _.filter(inputLogs, function (report) {
        return ($scope.resultType === "*" ) || ($scope.resultType === "SUCCESS" && (report.result === "PASSED" || report.result === "PASSED_NOTABLE_EXCEPTION")) || ($scope.resultType === "FAILED" && (report.result==="FAILED" || report.result==="FAILED_NOT_SUPPORTED"));
      });
    };
    
   

    $scope.deleteReport = function(report){    	    	    	     
    	      var modalInstance = $modal.open({
    	        templateUrl: 'confirmReportDelete.html',
    	        controller: 'ConfirmDialogCtrl',
    	        size: 'md',
    	        backdrop: true,
    	        keyboard: true
    	      });
    	      modalInstance.result.then(
    	        function (resultDiag) {
    	        	//Delete
    	          if (resultDiag) {
    	        	  if (report.type === 'TESTSTEP'){
    	        		  ReportService.deleteTSReport(report.id).then(function (result) {
    	    	          		var index = $scope.reports.indexOf(report);
    	    	          		if(index > -1){
    	    	          			$scope.reports.splice(index, 1);
    	    	          		}
    	    	          		Notification.success({
    	    	                    message: "Report deleted successfully!",
    	    	                    templateUrl: "NotificationSuccessTemplate.html",
    	    	                    scope: $rootScope,
    	    	                    delay: 5000
    	    	                  });
    	    	          	}, function (error) {
    	    	          		Notification.error({
    	    	                    message: "Report deletion failed! <br>If error persists, please contact the website administrator." ,
    	    	                    templateUrl: "NotificationErrorTemplate.html",
    	    	                    scope: $rootScope,
    	    	                    delay: 10000
    	    	                  });
    	    	          	});
    	        	  }else if (report.type === 'TESTCASE'){
    	        		  ReportService.deleteTCReport(report.id).then(function (result) {
    	    	          		var index = $scope.reports.indexOf(report);
    	    	          		if(index > -1){
    	    	          			$scope.reports.splice(index, 1);
    	    	          		}
    	    	          		Notification.success({
    	    	                    message: "Report deleted successfully!",
    	    	                    templateUrl: "NotificationSuccessTemplate.html",
    	    	                    scope: $rootScope,
    	    	                    delay: 5000
    	    	                  });
    	    	          	}, function (error) {
    	    	          		Notification.error({
    	    	          			 message: "Report deletion failed! <br>If error persists, please contact the website administrator." ,
    	    	                    templateUrl: "NotificationErrorTemplate.html",
    	    	                    scope: $rootScope,
    	    	                    delay: 10000
    	    	                  });
    	    	          	});
    	        	  }
    	        	  
    	        	  	            
    	          }
    	        }, function (resultDiag) {
    	        	//cancel
    	        });

    	    }    	   
  }
]);

angular.module('reports').controller('ReportDetailsCtrl', function ($scope, $modalInstance,report,ReportService) {
	  $scope.report =report;
	  $scope.type = $scope.report.type;
	  $scope.loading = true;
	  if ($scope.report.type === 'TESTSTEP'){
		  ReportService.getUserTSReportHTML($scope.report.id).then(function (fullReport) {			  
			  $scope.reportItem = fullReport;			  
          }, function (error) {
              Notification.error({
       			 message: "Report could not be loaded! <br>If error persists, please contact the website administrator." ,
                 templateUrl: "NotificationErrorTemplate.html",
                 scope: $rootScope,
                 delay: 10000
               });
          }).finally(function () {
  			$scope.loading = false;
      	});
	  }if ($scope.report.type === 'TESTCASE'){
		  ReportService.getUserTCReport($scope.report.id).then(function (fullReport) {
			  $scope.reportItem = fullReport;
          }, function (error) {
              Notification.error({
            	  message: "Report could not be loaded! <br>If error persists, please contact the website administrator." ,
                  templateUrl: "NotificationErrorTemplate.html",
                  scope: $rootScope,
                  delay: 10000
                });
          }).finally(function () {
  			$scope.loading = false;
      	});

	  }

	  $scope.close = function () {
	    $modalInstance.dismiss('cancel');
	  };
	  
	  $scope.downloadAs = function (format) {
		   	 if ($scope.report){
		   		 if($scope.report.type === 'TESTSTEP'){
		   			return ReportService.downloadUserTestStepValidationReport($scope.report.id, format);
		   		 }else if ($scope.report.type === 'TESTCASE'){
		   			return ReportService.downloadUserTestCaseValidationReport($scope.report.id, format);
		   		 }
		   	 }
	  };

	});

