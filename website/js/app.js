angular.module('myApp', [])
	.controller("listAccountControl", ['$scope', '$http', function ($scope, $http) {

		$scope.accounts = []
		$scope.getList = function () {
			$http({
				method: 'GET',
				url: '/listaccount'
			}).then(function successCallback(response) {
				if (response && response.data) {
					$scope.accounts = response.data;
				}
				else {
					alert('Error when getting accounts');
				}
			}, function errorCallback(response) {
				alert('Error when get accounts');
			});
		}
		$scope.getList();

		$scope.save = function (account) {
			$http({
				method: 'GET',
				url: '/saveaccount/?hyipurl=' + account.hyipUrl + '&loginurl=' + account.loginUrl + '&username=' + account.username + '&password=' + account.password + '&time=' + account.time + '&email=' + account.email
			}).then(function successCallback(response) {
				if (response && response.data && response.data.hyipUrl) {
					alert('Saved successfully');
				}
				else {
					alert('Error when saving account');
				}
			}, function errorCallback(response) {
				alert('Error when saving account');
			});
		}

		$scope.add = function () {
			$scope.accounts.push({});
		}

		$scope.delete = function (hyip) {
			if (hyip.hyipUrl && confirm('Do you want to delete: ' + hyip.hyipUrl)) {
				$http({
					method: 'GET',
					url: '/deleteaccount/?hyipurl=' + hyip.hyipUrl + '&username=' + hyip.username,
				}).then(function successCallback(response) {
					if (response && response.data && response.data.hyipUrl) {
						alert('Deleted successfully');
						$scope.getList();
					}
					else {
						alert('Error when deleting account');
					}
				}, function errorCallback(response) {
					alert('Error when deleting account');
				});
			}
		}
	}]);