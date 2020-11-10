

	
angular.module('reports').factory('ReportService',['$rootScope', '$http', '$q', '$filter', 'Notification','FileSaver', function ($rootScope, $http, $q, $filter, Notification,FileSaver) {
	var service = {
	     
	    		downloadTestStepValidationReport: function  (testStepValidationReportId, format) {
	    		      var form = document.createElement("form");
	    		      form.action = "api/tsReport/" + testStepValidationReportId + "/download";
	    		      form.method = "POST";
	    		      form.target = "_target";
	    		      var input = document.createElement("input");
	    		      input.name = "format";
	    		      input.value = format;
	    		      form.appendChild(input);
	    		      form.style.display = 'none';
	    		      document.body.appendChild(form);
	    		      form.submit();
	    		    },

	    		    downloadMessageValidationReport: function  (testStepValidationReportId, format) {
	    		      var form = document.createElement("form");
	    		      form.action = "api/mReport" + testStepValidationReportId + "/download";
	    		      form.method = "POST";
	    		      form.target = "_target";
	    		      var input = document.createElement("input");
	    		      input.name = "format";
	    		      input.value = format;
	    		      form.appendChild(input);
	    		      form.style.display = 'none';
	    		      document.body.appendChild(form);
	    		      form.submit();
	    		    },


	    		    downloadTestCaseReports: function  (testCaseId, format, result, comments, testPlanName, testGroupName) {
	    		      var form = document.createElement("form");
	    		      form.action = "api/tcReport/download";
	    		      form.method = "POST";
	    		      form.target = "_target";

	    		      var input = document.createElement("input");
	    		      input.name = "format";
	    		      input.value = format;
	    		      form.appendChild(input);

	    		      input = document.createElement("input");
	    		      input.name = "testCaseId";
	    		      input.value = testCaseId;
	    		      form.appendChild(input);

	    		      input = document.createElement("input");
	    		      input.name = "result";
	    		      input.value = result;
	    		      form.appendChild(input);

	    		      input = document.createElement("input");
	    		      input.name = "comments";
	    		      input.value = comments;
	    		      form.appendChild(input);

	    		      input = document.createElement("input");
	    		      input.name = "testPlan";
	    		      input.value = testPlanName;
	    		      form.appendChild(input);

	    		      input = document.createElement("input");
	    		      input.name = "testGroup";
	    		      input.value = testGroupName;
	    		      form.appendChild(input);

	    		      form.style.display = 'none';
	    		      document.body.appendChild(form);
	    		      form.submit();
	    		    },


	    		    createMessageValidationReport: function  (testStepId) {
	    		      var delay = $q.defer();
	    		      var data = angular.fromJson({"testStepId": testStepId});
	    		      $http.post("api/tsReport/create", data).then(
	    		        function (object) {
	    		          var res = object.data != null && object.data != "" ? angular.fromJson(object.data) : null;
	    		          delay.resolve(res);
	    		        },
	    		        function (response) {
	    		          delay.reject(response.data);
	    		        }
	    		      );
	    		      return delay.promise;
	    		    },


	    		    initTestStepValidationReport: function  (testStepId) {
	    		      var delay = $q.defer();
	    		      var data = $.param({testStepId: testStepId});
	    		      var config = {
	    		        headers: {
	    		          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
	    		        }
	    		      };
	    		      $http.post("api/tsReport/init", data, config).then(
	    		        function (object) {
	    		          var res = object.data != null && object.data != "" ? angular.fromJson(object.data) : null;
	    		          delay.resolve(res);
	    		        },
	    		        function (response) {
	    		          delay.reject(response.data);
	    		        }
	    		      );
	    		      return delay.promise;
	    		    },

	    		    getJson: function (testStepId, reportId) {
	    		      var delay = $q.defer();
	    		      $http.get('api/tsReport/json', {
	    		        params: {
	    		          testStepId: testStepId,
	    		          testReportId: reportId
	    		        }
	    		      }).then(function (response) {
	    		          delay.resolve(response);
	    		        },
	    		        function (error) {
	    		          delay.reject(error.data);
	    		        }
	    		      );
	    		      return delay.promise;
	    		    },


	    		    
	    		    
	    		    
	    		    updateTestStepValidationReport: function  (testReportId, testStepId, result, comments) {
	    		      var delay = $q.defer();
	    		      var data = angular.fromJson({
	    		        "reportId": testReportId,
	    		        "testStepId": testStepId,
	    		        "result": result,
	    		        "comments": comments
	    		      });
	    		      $http.post("api/tsReport/save", data).then(
	    		        function (object) {
	    		          var res = object.data != null && object.data != "" ? angular.fromJson(object.data) : null;
	    		          delay.resolve(res);
	    		        },
	    		        function (response) {
	    		          delay.reject(response.data);
	    		        }
	    		      );


	    		      return delay.promise;
	    		    },
	    		    
	    		    
	    		    saveValidationReport: function (testStepValidationReportId) {
	    		        var delay = $q.defer();
	    		        var data = angular.fromJson({
	    		          "testStepValidationReportId": testStepValidationReportId
	    		        });
	    		        $http.post("api/userTSReport/savePersistentUserTestStepReport", data).then(
	    		          function (object) {
	    		        	  	var res = object.data != null && object.data != "" ? angular.fromJson(object.data) : null;
	    		        	  delay.resolve(res);
	    		          },
	    		          function (response) {
	    		        	  	console.log("error");
	    		        	  	delay.reject(response.data);
	    		          }
	    		        );
	    		        return delay.promise;
	    		      },
	    		      
	    		      
	    		      saveTestCaseValidationReport: function   (testCaseId,testStepReportIds, result, comments, testPlanName, testGroupName) {
	    		          var delay = $q.defer();
	    		          var data = angular.fromJson({	    		        	
	  	    		        "testCaseId": testCaseId,
	  	    		        "testStepReportIds":testStepReportIds,
	  	    		        "result": result,
							"comments": comments,
							"testPlan": testPlanName,
							"testGroup": testGroupName

	  	    		      });
	    		          $http.post("api/userTCReport/savePersistentUserTestCaseReport", data).then(
	    		            function (object) {
	    		          	  var res = object.data != null && object.data != "" ? angular.fromJson(object.data) : null;
	    		          	  delay.resolve(res);
	    		            },
	    		            function (response) {
	    		          	  	delay.reject(response.data);
	    		            }
	    		          );
	    		          return delay.promise;
	    		        },
	    		        
	    		        downloadUserTestStepValidationReport: function  (testStepValidationReportId, format) {	    		        	
	    		        	return $http.get('api/userTSReport/'+testStepValidationReportId+'/download/'+format, { responseType: 'blob' }).then(function (response) {
	    		        		var contentDisposition = response.headers('Content-Disposition');
	    		        		var filename;
	    		        		if (contentDisposition != null){
	    		        			filename= contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim();
	    		        		}else{
	    		        			filename = 'report';
	    		        		}
	    		        		FileSaver.saveAs(response.data, filename);
	    		            });
	  	    		    },
	  	    		    
	  	    		  downloadUserTestCaseValidationReport: function  (testStepValidationReportId, format) {	    		        	
	    		        	return $http.get('api/userTCReport/'+testStepValidationReportId+'/download/'+format, { responseType: 'blob' }).then(function (response) {
	    		        		var contentDisposition = response.headers('Content-Disposition');
	    		        		var filename;
	    		        		if (contentDisposition != null){
	    		        			filename= contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim();
	    		        		}else{
	    		        			filename = 'report';
	    		        		}
	    		        		FileSaver.saveAs(response.data, filename);
	    		            });
	  	    		    },
	    		      
	    		                
	    		        getAllTSByAccountIdAndDomain: function  (domain) {
	    		            var delay = $q.defer();

	    		            $http.get("api/userTSReport/domain/"+domain, {timeout: 180000} ).then(
	    		              function (object) {
	    		            	  var res = object.data != null && object.data != "" ? angular.fromJson(object.data) : null;
	    		            	  delay.resolve(res);
	    		              },
	    		              function (response) {
	    		            	  	delay.reject(response.data);
	    		              }
	    		            );
	    		            return delay.promise;
	    		          },
	    		          
	    		          	getAllTSByAccountIdAndDomainAndtestStepId: function  (domain,testStepId) {
		    		            var delay = $q.defer();

		    		            $http.get("api/userTSReport/domain/"+domain+"/testStep/"+testStepId, {timeout: 180000} ).then(
		    		              function (object) {
		    		            	  var res = object.data != null && object.data != "" ? angular.fromJson(object.data) : null;
		    		            	  delay.resolve(res);
		    		              },
		    		              function (response) {
		    		            	  	delay.reject(response.data);
		    		              }
		    		            );
		    		            return delay.promise;
		    		          },
		    		          getAllIndependantTSByAccountIdAndDomainAndtestStepId: function  (domain,testStepId) {
			    		            var delay = $q.defer();

			    		            $http.get("api/userTSReport/domain/"+domain+"/testStep/"+testStepId, {timeout: 180000,  params: {onlyIndependant: true}} ).then(
			    		              function (object) {
			    		            	  var res = object.data != null && object.data != "" ? angular.fromJson(object.data) : null;
			    		            	  delay.resolve(res);
			    		              },
			    		              function (response) {
			    		            	  	delay.reject(response.data);
			    		              }
			    		            );
			    		            return delay.promise;
			    		          },
		    		          
		    		          
		    		          getAllTCByAccountIdAndDomainAndtestCaseId: function  (domain,testCaseId) {
			    		            var delay = $q.defer();

			    		            $http.get("api/userTCReport/domain/"+domain+"/testCase/"+testCaseId, {timeout: 180000} ).then(
			    		              function (object) {
			    		            	  var res = object.data != null && object.data != "" ? angular.fromJson(object.data) : null;
			    		            	  delay.resolve(res);
			    		              },
			    		              function (response) {
			    		            	  	delay.reject(response.data);
			    		              }
			    		            );
			    		            return delay.promise;
			    		          },
	    		          
	    		          getAllTCByAccountIdAndDomain: function  (domain) {
		    		            var delay = $q.defer();

		    		            $http.get("api/userTCReport/domain/"+domain, {timeout: 180000} ).then(
		    		              function (object) {
		    		            	  var res = object.data != null && object.data != "" ? angular.fromJson(object.data) : null;
		    		            	  delay.resolve(res);
		    		              },
		    		              function (response) {
		    		            	  	delay.reject(response.data);
		    		              }
		    		            );
		    		            return delay.promise;
		    		          },
		    		          getUserTSReport: function  (id) {
			    		            var delay = $q.defer();

			    		            $http.get("api/userTSReport/"+id, {timeout: 180000} ).then(
			    		              function (object) {
			    		            	  var res = object.data != null && object.data != "" ? angular.fromJson(object.data) : null;
			    		            	  delay.resolve(res);
			    		              },
			    		              function (response) {
			    		            	  	delay.reject(response.data);
			    		              }
			    		            );
			    		            return delay.promise;
			    		          },
			    		          
			    		          getUserTCReport: function  (id) {
				    		            var delay = $q.defer();

				    		            $http.get("api/userTCReport/"+id, {timeout: 180000} ).then(
				    		              function (object) {
				    		            	  var res = object.data != null && object.data != "" ? angular.fromJson(object.data) : null;
				    		            	  delay.resolve(res);
				    		              },
				    		              function (response) {
				    		            	  	delay.reject(response.data);
				    		              }
				    		            );
				    		            return delay.promise;
				    		          },
		    		          
		    		          getAllReportsByAccountIdAndDomain: function  (domain) {
			    		            var delay = $q.defer();

			    		            $http.get("api/reports/"+domain, {timeout: 180000} ).then(
			    		              function (object) {
			    		            	  var res = object.data != null && object.data != "" ? angular.fromJson(object.data) : null;
			    		            	  delay.resolve(res);
			    		              },
			    		              function (response) {
			    		            	  	delay.reject(response.data);
			    		              }
			    		            );
			    		            return delay.promise;
			    		          },
	    		        

	    		          deleteTSReport: function  (reportId) {
	    		              var delay = $q.defer();
	    		              $http.post("api/userTSReport/" + reportId + "/deleteReport").then(
	    		                function (object) {
	    		                  delay.resolve(angular.fromJson(object.data));
	    		                },
	    		                function (response) {
	    		                  delay.reject(response.data);
	    		                }
	    		              );
	    		              return delay.promise;
	    		            },
	    		            deleteTCReport: function  (reportId) {
		    		              var delay = $q.defer();
		    		              $http.post("api/userTCReport/" + reportId + "/deleteReport").then(
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
	
	 return service;
}
]);



