angular.module('hit-settings').factory('SettingsService',['$q','$http','StorageService',function ($q, $http, StorageService) {
        var options = StorageService.get(StorageService.SETTINGS_KEY) == null ? {
            validation: {
                show: {
                    errors: true,
                    alerts: true,
                    warnings: true,
                    affirmatives: false,
                    informational: false,
                    specerrors: false, 
                    ignores: true
                }
            }
        } : angular.fromJson(StorageService.get(StorageService.SETTINGS_KEY));

        var settings = {
            options: options,
            set: function (options) {
                settings.options = options;
                StorageService.set(StorageService.SETTINGS_KEY, angular.toJson(options));
            },
            getValidationClassifications: function (domain) {
                var delay = $q.defer();
                $http.get('api/hl7v2/validationconfig/'+domain.domain+'/getClassifications').then(
                    function (object) {
                        delay.resolve(angular.fromJson(object.data));
                    },
                    function (response) {
                        delay.reject(response.data);
                    }
                );
                return delay.promise;
            },
            saveValidationClassifications: function (classificationsData,domain) {
                var delay = $q.defer();
                var data = angular.fromJson(classificationsData);
                $http.post('api/hl7v2/validationconfig/'+domain.domain+'/saveClassifications', data).then(
                    function (object) {
                        delay.resolve(angular.fromJson(object.data));
                    },
                    function (response) {
                        delay.reject(response.data);
                    }
                );
                return delay.promise;
            },
            resetClassifications: function (domain) {
                var delay = $q.defer();
                $http.get('api/hl7v2/validationconfig/getDefaultClassifications').then(
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
        return settings;
    }]);