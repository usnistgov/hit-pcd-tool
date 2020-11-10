angular.module('hit-settings').controller('SettingsCtrl',['$scope', '$modalInstance', 'StorageService', '$rootScope','SettingsService','userInfoService','Notification', function ($scope, $modalInstance, StorageService, $rootScope,SettingsService,userInfoService,Notification) {
        $scope.options = angular.copy(SettingsService.options);
        
        SettingsService.getValidationClassifications($rootScope.domain).then(function (classifications) {
        	$scope.domainClassifications = classifications;
        });

        $scope.onCheckAllValidationOptions = function ($event) {
            var checkbox = $event.target;
            if (checkbox.checked) {
                $scope.selectAllValidationOptions();
            } else {
                $scope.unselectAllValidationOptions();
            }
        };

        $scope.selectAllValidationOptions = function () {
            $scope.options.validation.show.errors = true;
            $scope.options.validation.show.alerts = true;
            $scope.options.validation.show.warnings = true;
            $scope.options.validation.show.affirmatives = true;
            $scope.options.validation.show.informationals = true;
            $scope.options.validation.show.specerrors = true;
            
          };

        $scope.isAllValidationOptionsChecked = function () {
            return
            $scope.options.validation.show.errors &&
            $scope.options.validation.show.alerts &&
            $scope.options.validation.show.warnings &&
            $scope.options.validation.show.affirmatives &&
            $scope.options.validation.show.informationals &&
            $scope.options.validation.show.specerrors
          };

        $scope.unselectAllValidationOptions = function () {
            $scope.options.validation.show.errors = true;
            $scope.options.validation.show.alerts = false;
            $scope.options.validation.show.warnings = false;
            $scope.options.validation.show.affirmatives = false;
            $scope.options.validation.show.informationals = false;
            $scope.options.validation.show.specerrors = false;
          };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
        
        $scope.isAdmin = function () {
            return userInfoService.isAdmin();
        };
        
        
        $rootScope.isDomainOwner = function(){
        	return $rootScope.domain != null && $rootScope.domain.owner === userInfoService.getUsername();        
        };

        $scope.save = function () {
        	SettingsService.set($scope.options);
        	
        	SettingsService.saveValidationClassifications($scope.domainClassifications,$rootScope.domain).then(function (result) {
        		Notification.success({
                    message: "Validation parameters save successfully!",
                    templateUrl: "NotificationSuccessTemplate.html",
                    scope: $rootScope,
                    delay: 3000
                  });
            }, function (error) {
            });
        	
            $modalInstance.close($scope.options);
        };
        
        $scope.resetClassifications = function () {
        	  SettingsService.resetClassifications().then(function (classifications) {
              	$scope.domainClassifications = classifications;
        });
        	
   };
        
        

    }]);
