# Teatro Backend

This is the backend for the Teatro Musicado SP project, a Node.js application for managing the related data.

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- MySql 8.1

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd teatro-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Required Environment Variables

Create a `.env` file in the root directory with the following variables to configure the database connection (refer to `env_example.txt` for a template):

- `TYPEORM_HOST`: Database host (e.g., localhost)
- `TYPEORM_USERNAME`: Database username
- `TYPEORM_PASSWORD`: Database password
- `TYPEORM_DATABASE`: Database name
- `TYPEORM_PORT`: Database port (e.g., 3306 for MySQL)
- `NODE_ENV`: Environment (e.g., development, production)

Example `.env` file:

```
TYPEORM_HOST=localhost
TYPEORM_USERNAME=root
TYPEORM_PASSWORD=password
TYPEORM_DATABASE=teatro
TYPEORM_PORT=3306
NODE_ENV=development
```

## Running the Application

1. Ensure the database is set up and running.
2. Start the server:
   ```
   npm start
   ```
   Or for development:
   ```
   npm run dev
   ```

The server will run on the port specified in the configuration (default is 8089).

## Testing

Run tests with:
```
npm test
```

## API Documentation

Refer to the API files in the `api/` directory for endpoint details.

## Contributing

Please follow standard Git practices and ensure all tests pass before submitting changes.