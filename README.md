# Portfolio Website

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![React](https://img.shields.io/badge/React-19.0.0-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)

A modern, responsive full-stack portfolio website built with the MERN stack (MongoDB, Express.js, React, and Node.js). This application showcases projects, skills, and provides administrative features for content management.

![Image](https://github.com/user-attachments/assets/4b2a0e78-67c4-481d-abe9-75d6f44b4616)

## Features

- **Responsive Design**: Optimized for all device sizes
- **Project Showcase**: Filterable gallery of projects with details
- **Admin Dashboard**: Secure admin panel to manage content
  - Project management (create, read, update, delete)
  - Message management
  - Resume upload and management
- **Contact Form**: Allow visitors to send messages
- **Authentication**: Secure JWT-based authentication system
- **Image Management**: Cloud-based image storage with Cloudinary
- **Animations**: Smooth page transitions and UI animations with Framer Motion

## Technologies Used

### Frontend

- React 19
- React Router v7
- Framer Motion
- Tailwind CSS
- Axios
- React Toastify
- React Query

### Backend

- Node.js
- Express.js
- MongoDB (Mongoose)
- JSON Web Token (JWT) for authentication
- Bcrypt.js for password hashing
- Multer for file uploads
- Cloudinary for image storage
- Nodemailer for email functionality
- Express Rate Limit for API protection

## Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Cloudinary account for image storage

### Setup Instructions

1. **Clone the repository**

   ```
   git clone https://github.com/yourusername/portfolio.git
   cd portfolio
   ```

2. **Set up environment variables**

   Create a `.env` file in the server directory with the following variables:

   ```
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB
   MONGO_URI=your_mongodb_connection_string

   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=24h

   # Admin User
   ADMIN_USERNAME=your_admin_username
   ADMIN_PASSWORD=your_secure_password

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Email
   EMAIL_SERVICE=your_email_service
   EMAIL_USER=your_email_username
   EMAIL_PASS=your_email_password
   ```

3. **Install server dependencies**

   ```
   cd server
   npm install
   ```

4. **Install client dependencies**
   ```
   cd ../client
   npm install
   ```

## Usage

### Development Mode

1. **Start the server**

   ```
   cd server
   npm run dev
   ```

2. **Start the client (in a new terminal)**

   ```
   cd client
   npm run dev
   ```

3. Access the application at `http://localhost:5173`
4. Access the API at `http://localhost:5000`

### Production Mode

1. **Build the client**

   ```
   cd client
   npm run build
   ```

2. **Start the server in production mode**
   ```
   cd ../server
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

### Projects

- `GET /api/projects` - Get all projects
- `GET /api/projects/featured` - Get featured projects
- `GET /api/projects/:id` - Get a single project
- `POST /api/projects` - Create a new project (auth required)
- `PUT /api/projects/:id` - Update a project (auth required)
- `DELETE /api/projects/:id` - Delete a project (auth required)

### Messages

- `POST /api/messages` - Send a message
- `GET /api/messages` - Get all messages (auth required)
- `PUT /api/messages/:id/read` - Mark a message as read (auth required)
- `DELETE /api/messages/:id` - Delete a message (auth required)

### Resume

- `GET /api/resume` - Get resume info
- `POST /api/resume/upload` - Upload resume (auth required)

### Uploads

- `POST /api/uploads/image` - Upload an image (auth required)
- `DELETE /api/uploads/image` - Delete an image (auth required)

## Scripts

### Server

- `npm start` - Start the server
- `npm run dev` - Start the server with nodemon
- `npm run generate-jwt-secret` - Generate a new JWT secret
- `npm run setup-backups` - Set up database backup cron jobs
- `npm run cleanup-images` - Clean up orphaned images
- `npm run migrate-export` - Export data for migration
- `npm run migrate-import` - Import data for migration
- `npm run migrate-full` - Full migration process

### Client

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Ali Akbar

- GitHub: [https://github.com/sayaliakbar](https://github.com/sayaliakbar)
- LinkedIn: [https://www.linkedin.com/in/sayaliakbar](https://www.linkedin.com/in/sayaliakbar)
- Email: sayaliakbar@gmail.com

---

Made with ❤️ using the MERN Stack.
