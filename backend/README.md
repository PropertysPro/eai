# Ella AI Backend

This directory contains the backend code for the Ella AI Real Estate Assistant application.

## Backend Architecture

The backend is built with:
- Node.js and Express for the API server
- Database options:
  - MongoDB (document database)
  - PostgreSQL (relational database)
- Socket.IO for real-time communication
- JWT for authentication

## API Endpoints

The backend provides the following API endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh-token` - Refresh authentication token
- `POST /api/auth/logout` - User logout

### Chat
- `POST /api/chat/message` - Send a message
- `GET /api/chat/history` - Get chat history
- `GET /api/chat/session/:id` - Get a specific chat session

### Properties
- `GET /api/properties/matches` - Get property matches
- `GET /api/properties/:id` - Get property details
- `POST /api/properties/save` - Save a property
- `DELETE /api/properties/save/:id` - Unsave a property
- `GET /api/properties/my-properties` - Get user's properties
- `POST /api/properties/add` - Add a new property
- `PUT /api/properties/:id` - Update a property
- `DELETE /api/properties/:id` - Delete a property
- `GET /api/properties/:id/inquiries` - Get property inquiries

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Subscription
- `GET /api/subscription/plans` - Get subscription plans
- `POST /api/subscription/subscribe` - Subscribe to a plan
- `POST /api/subscription/cancel` - Cancel subscription

### Admin
- `GET /api/admin/dashboard` - Get admin dashboard data
- `GET /api/admin/users` - Get all users
- `GET /api/admin/conversations` - Get all conversations
- `GET /api/admin/properties` - Get all properties
- `PUT /api/admin/settings` - Update system settings
- `POST /api/admin/notifications` - Send system notification
- `POST /api/admin/backup` - Backup database
- `POST /api/admin/clear-cache` - Clear system cache

## Database Schema

The application supports both MongoDB and PostgreSQL. See the respective schema definitions:

- MongoDB: See the model files in `src/models/`
- PostgreSQL: See the SQL schema in `sql/schema.sql`

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Database:
  - MongoDB (v4.4 or higher) OR
  - PostgreSQL (v12 or higher)
- Redis (optional, for caching)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/ella-ai.git
cd ella-ai/backend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file to configure your database and other settings.

4. Database setup:
   
   For MongoDB:
   ```bash
   # Make sure MongoDB is running
   # The database will be created automatically when the server starts
   ```
   
   For PostgreSQL:
   ```bash
   # Create the database
   createdb ella_ai
   
   # Run the schema script
   psql -d ella_ai -f sql/schema.sql
   
   # (Optional) Load sample data
   psql -d ella_ai -f sql/sample_data.sql
   ```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

6. For production:
```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Deployment

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t ella-ai-backend .
```

2. Run the container:
```bash
docker run -p 5000:5000 --env-file .env ella-ai-backend
```

### Cloud Deployment

#### AWS Deployment

1. Set up an EC2 instance or Elastic Beanstalk environment
2. Configure environment variables in AWS console
3. Deploy using AWS CodeDeploy or directly via SSH

#### Heroku Deployment

1. Create a Heroku app:
```bash
heroku create ella-ai-backend
```

2. Set environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret
# Set other environment variables as needed
```

3. Deploy to Heroku:
```bash
git push heroku main
```

#### Digital Ocean App Platform

1. Create a new app in Digital Ocean App Platform
2. Connect your GitHub repository
3. Configure environment variables
4. Deploy the app

## Monitoring and Maintenance

### Logging

Logs are written to the console and optionally to files in the `logs` directory. The log level can be configured in the `.env` file.

### Backups

#### MongoDB Backups

```bash
# Create a backup
mongodump --db ella_ai --out /path/to/backup/directory

# Restore from backup
mongorestore --db ella_ai /path/to/backup/directory/ella_ai
```

#### PostgreSQL Backups

```bash
# Create a backup
pg_dump -U postgres -d ella_ai > ella_ai_backup.sql

# Restore from backup
psql -U postgres -d ella_ai < ella_ai_backup.sql
```

### Performance Monitoring

For production environments, consider using:
- PM2 for process management
- New Relic or Datadog for application monitoring
- Prometheus and Grafana for metrics and dashboards

## Integration with Frontend

The backend is designed to work seamlessly with the React Native frontend. The API endpoints match the service functions in the frontend's `api-service.ts` file.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.