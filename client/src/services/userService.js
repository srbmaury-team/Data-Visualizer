import apiService from './apiService';

export async function fetchAllUsers() {
    return apiService.request('/user/all');
}

export async function fetchUsersByPrefix(prefix) {
    // Backend should support /user/search?q=prefix
    return apiService.request(`/user/search?q=${encodeURIComponent(prefix)}`);
}