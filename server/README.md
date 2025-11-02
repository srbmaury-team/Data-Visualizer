# YAML Visualizer Backend

A robust Node.js/Express backend server for the YAML Visualizer application, providing user authentication, file management, and sharing capabilities.

## 🚀 Features

- **User Authentication**: JWT-based registration, login, and user management
- **YAML File Management**: Save, update, delete, and organize YAML files
- **Sharing System**: Generate unique shareable links for YAML files
- **Public/Private Files**: Control file visibility and access
- **Version Control**: Track file versions and changes
- **RESTful API**: Clean, documented API endpoints
- **Security**: Rate limiting, input validation, and secure password hashing

## 📁 Project Structure

```
server/
├── src/
│   ├── controllers/      # Business logic controllers
│   ├── middleware/       # Custom middleware (auth, error handling)
│   ├── models/          # MongoDB schemas (User, YamlFile)
│   └── routes/          # API route definitions
├── server.js            # Main server file
├── package.json         # Dependencies and scripts
├── .env.example        # Environment variables template
└── README.md           # This file
```

## 🛠️ Installation

1. **Install Dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Setup Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install MongoDB**:
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in your `.env` file

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/yaml-visualizer` |
| `JWT_SECRET` | JWT signing secret | Required |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "string (3-30 chars)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)"
}
```

#### POST `/api/auth/login`
Login with username/email and password.

**Request Body:**
```json
{
  "login": "string (username or email)",
  "password": "string"
}
```

#### GET `/api/auth/me`
Get current user profile (requires authentication).

### YAML File Endpoints

#### POST `/api/yaml`
Save a new YAML file (requires authentication).

**Request Body:**
```json
{
  "title": "string",
  "content": "string (YAML content)",
  "description": "string (optional)",
  "isPublic": "boolean (optional)",
  "tags": ["string"] (optional),
  "metadata": {} (optional)
}
```

#### GET `/api/yaml/my`
Get user's YAML files with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term

#### GET `/api/yaml/:id`
Get specific YAML file by ID (owner only).

#### GET `/api/yaml/shared/:shareId`
Get shared YAML file by share ID (public access).

#### PUT `/api/yaml/:id`
Update YAML file (requires authentication).

#### DELETE `/api/yaml/:id`
Delete YAML file (requires authentication).

#### GET `/api/yaml/public/browse`
Browse public YAML files.

### User Management Endpoints

#### GET `/api/user/profile`
Get user profile with statistics.

#### PUT `/api/user/profile`
Update user profile.

#### PUT `/api/user/password`
Change user password.

#### GET `/api/user/dashboard`
Get user dashboard data.

## 🔒 Security Features

- **Password Hashing**: Uses bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Validates all incoming data
- **CORS Protection**: Configurable cross-origin requests
- **Helmet Security**: Additional security headers

## 🗄️ Database Schema

### User Model
```javascript
{
  username: String (unique, 3-30 chars),
  email: String (unique, valid email),
  password: String (hashed),
  yamlFiles: [ObjectId] (references to YamlFile),
  isVerified: Boolean,
  createdAt: Date,
  lastLoginAt: Date
}
```

### YamlFile Model
```javascript
{
  title: String (max 100 chars),
  content: String (max 1MB),
  description: String (max 500 chars),
  shareId: String (unique 10-char ID),
  owner: ObjectId (reference to User),
  isPublic: Boolean,
  views: Number,
  tags: [String] (max 10 tags),
  metadata: {
    nodeCount: Number,
    maxDepth: Number,
    fileSize: Number,
    lastValidated: Date
  },
  versions: [{
    content: String,
    createdAt: Date,
    description: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 🔗 Integration with Frontend

The backend is designed to work seamlessly with the React frontend. Key integration points:

1. **Authentication**: JWT tokens for secure API access
2. **File Sharing**: Unique share IDs for public file access
3. **Real-time Updates**: RESTful API for immediate data sync
4. **Local Storage Migration**: APIs to move from localStorage to database

### Frontend Integration Steps

1. **Authentication Service**: Update frontend to use `/api/auth` endpoints
2. **File Management**: Replace localStorage with `/api/yaml` endpoints
3. **Sharing Features**: Implement sharing using shareId system
4. **User Dashboard**: Add user profile and dashboard features

## 🧪 Testing

```bash
npm test
```

## 📈 Monitoring

- Health check endpoint: `GET /api/health`
- Error logging with detailed stack traces in development
- Performance monitoring via request logging

## 🚧 Production Deployment

1. **Environment Setup**:
   - Set `NODE_ENV=production`
   - Use strong `JWT_SECRET`
   - Configure MongoDB Atlas or production database

2. **Security Checklist**:
   - Enable HTTPS
   - Set secure CORS origins
   - Configure rate limiting appropriately
   - Regular security updates

3. **Performance**:
   - Enable compression
   - Database indexing
   - Connection pooling
   - Caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details