# String Analyzer Service

A RESTful API service that analyzes strings and stores their computed properties including length, palindrome detection, unique characters, word count, SHA-256 hash, and character frequency mapping.

## Features

- ✅ Create and analyze strings with comprehensive property computation
- ✅ Retrieve specific strings by value
- ✅ Filter strings with multiple query parameters
- ✅ Natural language query support
- ✅ Delete strings from the system
- ✅ SHA-256 based unique identification
- ✅ MongoDB for persistent storage

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB
- **Hosting**: Railway / AWS / Heroku

## Prerequisites

- Node.js v18 or higher
- MongoDB Atlas account (or local MongoDB instance)
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/string-analyzer-service.git
cd string-analyzer-service
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/string-analyzer?retryWrites=true&w=majority
PORT=3000
```

### 4. Get MongoDB Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password

## Running Locally

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### 1. Create/Analyze String

**POST** `/strings`

```json
{
  "value": "Hello World"
}
```

**Response (201 Created):**

```json
{
  "id": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
  "value": "Hello World",
  "properties": {
    "length": 11,
    "is_palindrome": false,
    "unique_characters": 8,
    "word_count": 2,
    "sha256_hash": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    "character_frequency_map": {
      "H": 1,
      "e": 1,
      "l": 3,
      "o": 2,
      " ": 1,
      "W": 1,
      "r": 1,
      "d": 1
    }
  },
  "created_at": "2025-10-23T10:00:00.000Z"
}
```

### 2. Get Specific String

**GET** `/strings/{string_value}`

```bash
GET /strings/Hello%20World
```

**Response (200 OK):** Same format as create response

### 3. Get All Strings with Filtering

**GET** `/strings`

Query Parameters:
- `is_palindrome` (boolean): true/false
- `min_length` (integer): Minimum string length
- `max_length` (integer): Maximum string length
- `word_count` (integer): Exact word count
- `contains_character` (string): Single character

**Example:**

```bash
GET /strings?is_palindrome=true&word_count=1
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "hash1",
      "value": "racecar",
      "properties": { ... },
      "created_at": "2025-10-23T10:00:00.000Z"
    }
  ],
  "count": 1,
  "filters_applied": {
    "is_palindrome": true,
    "word_count": 1
  }
}
```

### 4. Natural Language Filtering

**GET** `/strings/filter-by-natural-language?query=<natural_language_query>`

Supported queries:
- "all single word palindromic strings"
- "strings longer than 10 characters"
- "strings containing the letter z"
- "palindromic strings that contain the first vowel"

**Example:**

```bash
GET /strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings
```

**Response (200 OK):**

```json
{
  "data": [ ... ],
  "count": 3,
  "interpreted_query": {
    "original": "all single word palindromic strings",
    "parsed_filters": {
      "word_count": 1,
      "is_palindrome": true
    }
  }
}
```

### 5. Delete String

**DELETE** `/strings/{string_value}`

```bash
DELETE /strings/Hello%20World
```

**Response (204 No Content):** Empty body

## Error Responses

- **400 Bad Request**: Invalid request body or query parameters
- **404 Not Found**: String does not exist
- **409 Conflict**: String already exists
- **422 Unprocessable Entity**: Invalid data type
- **500 Internal Server Error**: Server error

## Testing

You can test the API using curl, Postman, or any HTTP client:

```bash
# Create a string
curl -X POST http://localhost:3000/strings \
  -H "Content-Type: application/json" \
  -d '{"value": "racecar"}'

# Get a string
curl http://localhost:3000/strings/racecar

# Filter strings
curl "http://localhost:3000/strings?is_palindrome=true"

# Natural language query
curl "http://localhost:3000/strings/filter-by-natural-language?query=single%20word%20palindromic%20strings"

# Delete a string
curl -X DELETE http://localhost:3000/strings/racecar
```

## Deployment

### Railway (Recommended)

1. Create account at [Railway.app](https://railway.app)
2. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```
3. Login and deploy:
   ```bash
   railway login
   railway init
   railway add
   railway up
   ```
4. Add MongoDB URI in Railway dashboard environment variables

### Heroku

1. Install Heroku CLI
2. Create app:
   ```bash
   heroku create your-app-name
   ```
3. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI="your-mongodb-uri"
   ```
4. Deploy:
   ```bash
   git push heroku main
   ```

### AWS EC2

1. Launch an EC2 instance (Ubuntu)
2. SSH into instance
3. Install Node.js and Git
4. Clone repo and install dependencies
5. Set environment variables
6. Use PM2 to keep app running:
   ```bash
   npm install -g pm2
   pm2 start server.js
   pm2 startup
   pm2 save
   ```

## Project Structure

```
string-analyzer-service/
├── server.js           # Main application file
├── package.json        # Dependencies and scripts
├── .env               # Environment variables (not in git)
├── .env.example       # Environment template
├── .gitignore         # Git ignore file
└── README.md          # Documentation
```

## Dependencies

- **express**: Web framework for Node.js
- **mongoose**: MongoDB ODM
- **dotenv**: Environment variable management
- **nodemon**: Development auto-reload (dev dependency)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for Backend Wizards Stage 1
