const express = require('express');
const axios = require('axios');
const router = express.Router();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

if (!GOOGLE_MAPS_API_KEY) {
    console.error('ERROR: GOOGLE_MAPS_API_KEY is not set');
    process.exit(1);
}

router.get('/streetview/metadata', async (req, res) => {
    try {
        const { lat, lng, heading, pitch, fov, radius } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: 'Bad Request', message: 'Missing required parameters', required: ['lat', 'lng'] });
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        if (isNaN(latitude) || latitude < -90 || latitude > 90) return res.status(400).json({ error: 'Invalid latitude' });
        if (isNaN(longitude) || longitude < -180 || longitude > 180) return res.status(400).json({ error: 'Invalid longitude' });
        const params = { location: `${latitude},${longitude}`, key: GOOGLE_MAPS_API_KEY };
        if (heading) params.heading = heading;
        if (pitch) params.pitch = pitch;
        if (fov) params.fov = fov;
        if (radius) params.radius = radius;
        const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/streetview/metadata`, { params, timeout: 10000 });
        res.json(response.data);
    } catch (error) {
        console.error('Street View Metadata Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json({ error: 'Google Maps API Error', message: error.response.data.error_message || error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

router.post('/geocode', async (req, res) => {
    try {
        const { address, components, bounds, region, language } = req.body;
        if (!address || address.trim() === '') return res.status(400).json({ error: 'Bad Request', message: 'Missing required parameter: address' });
        const params = { address: address.trim(), key: GOOGLE_MAPS_API_KEY, language: language || 'zh-TW' };
        if (components) params.components = components;
        if (bounds) params.bounds = bounds;
        if (region) params.region = region;
        const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/geocode/json`, { params, timeout: 10000 });
        console.log(`Geocoding: "${address}" -> ${response.data.results.length} results`);
        res.json(response.data);
    } catch (error) {
        console.error('Geocoding Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json({ error: 'Google Geocoding API Error', message: error.response.data.error_message || error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

router.post('/reverse-geocode', async (req, res) => {
    try {
        const { lat, lng, language, result_type, location_type } = req.body;
        if (!lat || !lng) return res.status(400).json({ error: 'Bad Request', message: 'Missing required parameters', required: ['lat', 'lng'] });
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        if (isNaN(latitude) || isNaN(longitude)) return res.status(400).json({ error: 'Invalid coordinates' });
        const params = { latlng: `${latitude},${longitude}`, key: GOOGLE_MAPS_API_KEY, language: language || 'zh-TW' };
        if (result_type) params.result_type = result_type;
        if (location_type) params.location_type = location_type;
        const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/geocode/json`, { params, timeout: 10000 });
        res.json(response.data);
    } catch (error) {
        console.error('Reverse Geocoding Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/streetview/image-url', (req, res) => {
    try {
        const { lat, lng, heading, pitch, fov, size } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: 'Bad Request', message: 'Missing required parameters' });
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        if (isNaN(latitude) || isNaN(longitude)) return res.status(400).json({ error: 'Invalid coordinates' });
        const params = new URLSearchParams({ location: `${latitude},${longitude}`, size: size || '600x400', key: GOOGLE_MAPS_API_KEY });
        if (heading) params.append('heading', heading);
        if (pitch) params.append('pitch', pitch);
        if (fov) params.append('fov', fov);
        const imageUrl = `${GOOGLE_MAPS_BASE_URL}/streetview?${params.toString()}`;
        res.json({ url: imageUrl, usage: 'Use this URL directly in img tags or fetch for processing', coordinates: { lat: latitude, lng: longitude } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate Street View URL', message: error.message });
    }
});

router.post('/places/autocomplete', async (req, res) => {
    try {
        const { input, location, radius, language } = req.body;
        if (!input || input.trim() === '') return res.status(400).json({ error: 'Bad Request', message: 'Missing required parameter: input' });
        const params = { input: input.trim(), key: GOOGLE_MAPS_API_KEY, language: language || 'zh-TW', components: 'country:tw' };
        if (location) params.location = location;
        if (radius) params.radius = radius;
        const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/place/autocomplete/json`, { params, timeout: 10000 });
        res.json(response.data);
    } catch (error) {
        console.error('Autocomplete Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/stats', (req, res) => {
    res.json({ timestamp: new Date().toISOString() });
});

module.exports = router;
