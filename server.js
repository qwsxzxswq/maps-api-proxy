/**
 * Google Maps API Proxy Server
 * 保护 API Key 不暴露在前端
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mapsApiRoutes = require('./routes/maps-api');
const rateLimiter = require('./middleware/rate-limiter');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:8080').split(',');

app.use(helmet());

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`Blocked CORS request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Token']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

app.use(rateLimiter);
app.use('/api/maps', mapsApiRoutes);

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/', (req, res) => {
    res.json({
        name: 'Google Maps API Proxy',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            geocode: 'POST /api/maps/geocode',
            reverseGeocode: 'POST /api/maps/reverse-geocode',
            streetViewMetadata: 'GET /api/maps/streetview/metadata',
            streetViewImageUrl: 'GET /api/maps/streetview/image-url'
        }
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
});

app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'CORS Error', message: 'Origin not allowed' });
    }
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('Google Maps API Proxy Server');
    console.log('='.repeat(50));
    console.log(`Port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
    console.log(`Server ready at http://localhost:${PORT}`);
});

process.on('SIGTERM', () => { console.log('SIGTERM received'); process.exit(0); });
process.on('SIGINT', () => { console.log('SIGINT received'); process.exit(0); });
