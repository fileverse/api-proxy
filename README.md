# API Proxy Server

A caching proxy server with rate limiting and usage tracking.

## Features

- Request caching with Redis
- Rate limiting per user
- Usage tracking
- Bearer token authentication
- Configurable cache TTL

## Prerequisites

- Node.js (v14 or higher)
- Redis server

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your environment variables:
   ```bash
   cp .env.example .env
   ```

## Configuration

Edit the `.env` file to configure:

- `REDIS_URL`: Redis connection URL
- `CACHE_TTL`: Cache time-to-live in seconds
- `RATE_LIMIT_WINDOW`: Rate limit window in seconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window
- `PORT`: Server port

## Usage

Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### API Endpoints

#### POST /proxy
Forwards requests to target APIs with caching.

Headers:
- `Authorization`: Bearer token for authentication
- `Target-URL`: The URL to forward the request to

Example:
```bash
curl -X POST http://localhost:3000/proxy \
  -H "Authorization: Bearer your-token" \
  -H "Target-URL: https://api.example.com/data" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

#### GET /usage
Get current usage statistics.

Headers:
- `Authorization`: Bearer token for authentication

Example:
```bash
curl http://localhost:3000/usage \
  -H "Authorization: Bearer your-token"
```

Response:
```json
{
  "usage": 42,
  "rateLimit": 100,
  "remaining": 58
}
```

## Error Handling

The server returns appropriate HTTP status codes:

- 400: Bad Request (missing required headers)
- 401: Unauthorized (invalid or missing token)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error

## License

ISC 