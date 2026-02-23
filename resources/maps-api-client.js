/**
 * Google Maps API 客户端
 * 通过后端代理调用 Google Maps API，保护 API Key
 * 
 * 使用方法:
 * 1. 在 index.html 中引入此文件（在其他脚本之前）
 * 2. 使用全局对象 window.mapsApiClient 调用 API
 */

class MapsAPIClient {
    constructor(backendUrl) {
        this.baseUrl = backendUrl;
        console.log(`🗺️ Maps API Client initialized with backend: ${this.baseUrl}`);
    }

    /**
     * Geocoding - 地址转坐标
     * @param {string} address - 要搜索的地址
     * @param {object} options - 可选参数
     * @returns {Promise} - Google Maps Geocoding API 响应
     */
    async geocode(address, options = {}) {
        try {
            const body = {
                address,
                language: 'zh-TW'
            };

            // 处理 componentRestrictions (兼容 Google Maps API 格式)
            if (options.componentRestrictions) {
                const restrictions = [];
                for (const [key, value] of Object.entries(options.componentRestrictions)) {
                    restrictions.push(`${key}:${value}`);
                }
                body.components = restrictions.join('|');
            }

            if (options.bounds) body.bounds = options.bounds;
            if (options.region) body.region = options.region;

            const response = await fetch(`${this.baseUrl}/api/maps/geocode`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Geocoding failed: ${response.statusText}`);
            }

            const data = await response.json();
            
            console.log(`✅ Geocoding: "${address}" → ${data.results?.length || 0} results`);

            // 返回格式与 Google Maps API 一致
            return {
                results: data.results || [],
                status: data.status
            };
        } catch (error) {
            console.error('❌ Geocoding error:', error);
            return { 
                results: [], 
                status: 'ERROR',
                error_message: error.message
            };
        }
    }

    /**
     * Reverse Geocoding - 坐标转地址
     * @param {number} lat - 纬度
     * @param {number} lng - 经度
     * @returns {Promise}
     */
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(`${this.baseUrl}/api/maps/reverse-geocode`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    lat, 
                    lng,
                    language: 'zh-TW'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Reverse geocoding failed: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ Reverse Geocoding: (${lat}, ${lng}) → ${data.results?.length || 0} results`);

            return data;
        } catch (error) {
            console.error('❌ Reverse geocoding error:', error);
            return { 
                results: [], 
                status: 'ERROR',
                error_message: error.message
            };
        }
    }

    /**
     * Street View Metadata - 获取街景元数据
     * @param {number} lat - 纬度
     * @param {number} lng - 经度
     * @param {object} options - 可选参数 (heading, pitch, fov, radius)
     * @returns {Promise}
     */
    async getStreetViewMetadata(lat, lng, options = {}) {
        try {
            const params = new URLSearchParams({ lat, lng });
            
            if (options.heading) params.append('heading', options.heading);
            if (options.pitch) params.append('pitch', options.pitch);
            if (options.fov) params.append('fov', options.fov);
            if (options.radius) params.append('radius', options.radius);

            const response = await fetch(
                `${this.baseUrl}/api/maps/streetview/metadata?${params.toString()}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Street View metadata failed: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ Street View Metadata: (${lat}, ${lng}) → ${data.status}`);

            return data;
        } catch (error) {
            console.error('❌ Street View metadata error:', error);
            return { 
                status: 'NOT_FOUND',
                error_message: error.message
            };
        }
    }

    /**
     * 获取 Street View 静态图片 URL
     * @param {number} lat - 纬度
     * @param {number} lng - 经度
     * @param {object} options - 可选参数
     * @returns {Promise<string>} - 图片 URL
     */
    async getStreetViewImageUrl(lat, lng, options = {}) {
        try {
            const params = new URLSearchParams({ lat, lng });
            
            if (options.heading) params.append('heading', options.heading);
            if (options.pitch) params.append('pitch', options.pitch);
            if (options.fov) params.append('fov', options.fov);
            if (options.size) params.append('size', options.size);

            const response = await fetch(
                `${this.baseUrl}/api/maps/streetview/image-url?${params.toString()}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Failed to get Street View URL: ${response.statusText}`);
            }

            const data = await response.json();
            return data.url;
        } catch (error) {
            console.error('❌ Street View URL error:', error);
            return null;
        }
    }

    /**
     * Places Autocomplete - 地址自动完成
     * @param {string} input - 用户输入
     * @param {object} options - 可选参数
     * @returns {Promise}
     */
    async autocomplete(input, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/api/maps/places/autocomplete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    input,
                    location: options.location,
                    radius: options.radius,
                    language: 'zh-TW'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Autocomplete failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Autocomplete error:', error);
            return { 
                predictions: [], 
                status: 'ERROR',
                error_message: error.message
            };
        }
    }

    /**
     * 检查后端健康状态
     * @returns {Promise<boolean>}
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            const data = await response.json();
            console.log('✅ Backend health check:', data);
            return data.status === 'ok';
        } catch (error) {
            console.error('❌ Backend health check failed:', error);
            return false;
        }
    }
}

// ============================================
// 自动初始化全局实例
// ============================================

// 根据环境自动选择后端 URL
const getBackendUrl = () => {
    const hostname = window.location.hostname;
    
    // 本地开发环境
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    
    // 生产环境 - 请修改为你的后端域名
    // 选项 1: 使用环境变量（需要构建工具支持）
    // return process.env.BACKEND_URL || 'https://your-backend.vercel.app';
    
    // 选项 2: 直接写死（部署后修改此处）
    return 'https://maps-api-proxy-qwsxzxswqs-projects.vercel.app';
    
    // 选项 3: 使用相同域名的子路径（需要反向代理配置）
    // return window.location.origin + '/api-proxy';
};

// 创建全局实例
window.mapsApiClient = new MapsAPIClient(getBackendUrl());

// 健康检查（可选）
window.mapsApiClient.checkHealth().then(isHealthy => {
    if (!isHealthy) {
        console.warn('⚠️ Backend API is not responding. Maps features may not work.');
    }
});

// ============================================
// 兼容层：模拟 google.maps 对象
// ============================================

// 为了兼容旧代码，提供最小化的 google.maps 模拟
window.google = window.google || {};
window.google.maps = window.google.maps || {};

// 模拟 GeocoderStatus 枚举
window.google.maps.GeocoderStatus = {
    OK: 'OK',
    ERROR: 'ERROR',
    INVALID_REQUEST: 'INVALID_REQUEST',
    OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
    REQUEST_DENIED: 'REQUEST_DENIED',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    ZERO_RESULTS: 'ZERO_RESULTS'
};

// 模拟 Geocoder 类（兼容旧代码）
window.google.maps.Geocoder = class Geocoder {
    constructor() {
        console.log('🔄 Using proxy-based Geocoder (compatible mode)');
    }

    geocode(request, callback) {
        if (request.address) {
            // 地址搜索
            window.mapsApiClient.geocode(request.address, {
                componentRestrictions: request.componentRestrictions,
                bounds: request.bounds,
                region: request.region
            }).then(result => {
                callback(result.results, result.status);
            });
        } else if (request.location) {
            // 反向地理编码
            const lat = typeof request.location.lat === 'function' 
                ? request.location.lat() 
                : request.location.lat;
            const lng = typeof request.location.lng === 'function' 
                ? request.location.lng() 
                : request.location.lng;
                
            window.mapsApiClient.reverseGeocode(lat, lng).then(result => {
                callback(result.results, result.status);
            });
        } else {
            callback([], 'INVALID_REQUEST');
        }
    }
};

console.log('✅ Google Maps API Client loaded successfully');
