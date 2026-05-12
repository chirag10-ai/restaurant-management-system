# Restaurant Management System 🍽️

A comprehensive full-stack restaurant management system built with modern web technologies. This system provides complete functionality for managing restaurant operations including bookings, orders, menu management, user authentication, and payment processing.

## 🚀 Features

### Core Features
- **User Management**: Customer registration, login, and profile management
- **Admin Dashboard**: Complete administrative control over all system aspects
- **Table Booking**: Online table reservation system with availability checking
- **Menu Management**: Dynamic menu creation, editing, and categorization
- **Order Management**: Real-time order tracking and status updates
- **Payment Integration**: Secure payment processing with multiple payment options
- **Revenue Analytics**: Comprehensive reporting and analytics dashboard
- **Contact Management**: Customer inquiries and feedback system

### Technical Features
- **Responsive Design**: Mobile-first approach with adaptive UI
- **Real-time Updates**: Live status updates for orders and bookings
- **Authentication & Authorization**: Role-based access control
- **Data Validation**: Comprehensive input validation and error handling
- **RESTful API**: Well-structured API endpoints
- **Database Integration**: MongoDB with proper data modeling

## 🛠️ Tech Stack

### Frontend
- **Angular 18**: Modern TypeScript-based framework
- **Angular Material**: UI component library
- **RxJS**: Reactive programming for asynchronous operations
- **HTML5/CSS3**: Modern markup and styling
- **TypeScript**: Type-safe JavaScript

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing
- **Multer**: File upload handling

### Development Tools
- **Angular CLI**: Command-line interface for Angular
- **Nodemon**: Auto-restart for development
- **Concurrently**: Run multiple scripts simultaneously
- **dotenv**: Environment variable management

## 📁 Project Structure

```
restaurant-management-system/
├── backend/                    # Node.js/Express API
│   ├── controllers/           # Business logic controllers
│   ├── models/               # MongoDB data models
│   ├── routes/               # API route definitions
│   ├── middleware/           # Custom middleware functions
│   ├── uploads/              # File upload directory
│   └── server.js             # Main server entry point
├── frontend/                  # Angular application
│   ├── client/               # Main Angular app
│   │   ├── src/
│   │   │   ├── app/          # Application source code
│   │   │   │   ├── components/ # Angular components
│   │   │   │   ├── services/   # Service classes
│   │   │   │   ├── models/     # Data models
│   │   │   │   └── guards/     # Route guards
│   │   │   └── assets/       # Static assets
│   │   └── package.json      # Dependencies
│   └── package.json          # Root frontend dependencies
├── docs/                     # Documentation
│   └── dfd/                  # Data Flow Diagrams
├── mongodb_backup/           # Database backups
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB (v6 or higher)
- Angular CLI (v18 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/chirag10-ai/restaurant-management-system.git
   cd restaurant-management-system
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   cd client
   npm install
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/restaurant_management
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```

5. **Database Setup**
   - Ensure MongoDB is running on your system
   - The database will be automatically created on first run
   - Optional: Import sample data from `mongodb_backup/` directory

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   The API will be available at `http://localhost:5000`

2. **Start the Frontend Application**
   ```bash
   cd frontend/client
   ng serve
   ```
   The application will be available at `http://localhost:4200`

3. **Start Both Services Simultaneously**
   ```bash
   npm run dev
   ```
   (from the project root directory)

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Menu
- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Add new menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status

### Payments
- `POST /api/payments/process` - Process payment
- `GET /api/payments/:id` - Get payment details

## 🔐 Authentication & Authorization

The system uses JWT (JSON Web Tokens) for authentication:

1. **User Roles**:
   - **Customer**: Can book tables, place orders, manage profile
   - **Admin**: Full access to all system features

2. **Token-based Authentication**:
   - Tokens are generated upon successful login
   - Tokens are included in the Authorization header
   - Tokens expire after 24 hours

## 🎨 UI Components

### Customer Interface
- **Home Page**: Restaurant overview and featured items
- **Menu Page**: Browse and search menu items
- **Booking Page**: Make table reservations
- **Order Page**: Place and track orders
- **Profile Page**: Manage personal information

### Admin Interface
- **Dashboard**: Overview of all system metrics
- **Menu Management**: Add, edit, delete menu items
- **Order Management**: View and manage customer orders
- **Booking Management**: Handle table reservations
- **User Management**: Manage customer accounts
- **Revenue Analytics**: View financial reports

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- **Desktop**: Full-featured experience
- **Tablet**: Optimized touch interface
- **Mobile**: Streamlined mobile experience

## 🔧 Configuration

### Environment Variables
```env
PORT=5000                    # Server port
MONGODB_URI=mongodb://localhost:27017/restaurant_management
JWT_SECRET=your_secret_key   # JWT signing secret
NODE_ENV=development         # Environment mode
```

### Angular Configuration
The Angular application is configured in `angular.json` with:
- Build optimizations
- Development server settings
- Testing configurations
- Asset management

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend/client
ng test
```

### End-to-End Testing
```bash
cd frontend/client
ng e2e
```

## 📈 Performance

### Optimization Features
- **Lazy Loading**: Modules are loaded on demand
- **Image Optimization**: Compressed and optimized images
- **Code Splitting**: Reduced bundle sizes
- **Caching Strategy**: Efficient data caching
- **Database Indexing**: Optimized database queries

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend/client
ng build --prod

# Backend
cd backend
npm start
```

### Docker Deployment
```bash
# Build Docker images
docker-compose build

# Run containers
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **Email**: support@restaurant-management.com
- **GitHub Issues**: [Create an issue](https://github.com/chirag10-ai/restaurant-management-system/issues)
- **Documentation**: Check the `docs/` directory for detailed documentation

## 🎯 Future Enhancements

- **Real-time Notifications**: WebSocket integration for live updates
- **Mobile App**: React Native mobile application
- **Advanced Analytics**: Machine learning for customer insights
- **Multi-restaurant Support**: Chain restaurant management
- **Third-party Integrations**: Food delivery services
- **Advanced Search**: Full-text search with filters
- **Loyalty Program**: Customer rewards system

## 📊 System Architecture

The system follows a **3-tier architecture**:
1. **Presentation Layer**: Angular frontend application
2. **Business Logic Layer**: Node.js/Express API
3. **Data Layer**: MongoDB database

### Data Flow
- Client requests flow through Angular services
- API endpoints handle business logic
- Data is persisted in MongoDB collections
- Real-time updates are pushed back to clients

---

**Built with ❤️ by [Chirag](https://github.com/chirag10-ai)**

**Version**: 1.0.0  
**Last Updated**: May 2024

 **Username/Email**: `admin@gmail.com`
- **Password**: `admin@123`


