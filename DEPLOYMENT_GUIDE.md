# FieldForce Pro - Deployment Guide

## Overview

FieldForce Pro is a comprehensive field operations management platform featuring advanced team management, activity planning, canvasser tracking, SIM inventory management, OKR performance dashboards, interactive territory mapping, engagement analytics, and comprehensive reporting capabilities.

## System Requirements

### Server Requirements
- Node.js 18+ with npm
- PostgreSQL 12+ or Supabase account
- Minimum 2GB RAM, 20GB storage
- SSL certificate for HTTPS (recommended)

### Client Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- GPS/location services enabled
- Camera access for photo capture
- Stable internet connection

## Database Setup

### Option 1: Supabase (Recommended)

1. **Create Supabase Project**
   - Visit [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Configure Database**
   - Run the provided `supabase-setup.sql` script in SQL Editor
   - This creates all 17 required tables with proper relationships
   - Enables Row Level Security (RLS) for data protection

3. **Get Connection String**
   - Go to Project Settings → Database
   - Copy the Connection String (Transaction mode)
   - Replace `[YOUR-PASSWORD]` with your database password

### Option 2: Self-Hosted PostgreSQL

1. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   ```

2. **Create Database**
   ```sql
   CREATE DATABASE fieldforce_pro;
   CREATE USER fieldforce_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE fieldforce_pro TO fieldforce_user;
   ```

3. **Run Setup Script**
   ```bash
   psql -d fieldforce_pro -f supabase-setup.sql
   ```

## Application Deployment

### Environment Configuration

Create `.env` file with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@host:5432/database"

# Application Settings
NODE_ENV=production
PORT=3000

# Security Keys (generate strong random strings)
JWT_SECRET="your-super-secure-jwt-secret-key-here"
SESSION_SECRET="your-session-secret-key-here"

# Optional: External Services
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd fieldforce-pro
   ```

2. **Install Dependencies**
   ```bash
   npm install --production
   ```

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Database Migration**
   ```bash
   npm run db:push
   ```

5. **Start Application**
   ```bash
   npm start
   ```

## Production Deployment Options

### Option 1: Replit Deployment

1. **Prepare for Deployment**
   - Ensure all environment variables are set in Replit Secrets
   - Verify database connection works
   - Test all core functionality

2. **Deploy**
   - Click "Deploy" button in Replit
   - Configure custom domain if needed
   - Monitor deployment logs

### Option 2: VPS Deployment

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Application Setup**
   ```bash
   # Clone and setup
   git clone <repository-url> /var/www/fieldforce-pro
   cd /var/www/fieldforce-pro
   npm install --production
   npm run build
   ```

3. **Process Management**
   ```bash
   # Create PM2 ecosystem file
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'fieldforce-pro',
       script: 'server/index.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   };
   EOF
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

4. **Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 3: Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

2. **Docker Compose**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=${DATABASE_URL}
         - NODE_ENV=production
       depends_on:
         - postgres
     
     postgres:
       image: postgres:14
       environment:
         POSTGRES_DB: fieldforce_pro
         POSTGRES_USER: fieldforce_user
         POSTGRES_PASSWORD: ${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

## Core Features Verification

After deployment, verify these key features work correctly:

### Authentication System
- [ ] FAE login with employee email authentication
- [ ] Admin user access and permissions
- [ ] Role-based access control functioning
- [ ] JWT token authentication and session management

### Team Management
- [ ] Create teams with location-based ID generation
- [ ] Add multiple KIT IDs per team
- [ ] Team member management and assignments
- [ ] Team hierarchy and role assignments

### Canvasser Registration & Management
- [ ] Professional photo capture with MDNL watermarking
- [ ] GPS location verification during registration
- [ ] NIN validation (11 digits exactly)
- [ ] Phone format validation (0000-000-0000)
- [ ] Canvasser approval workflow by FAEs
- [ ] Profile status management (pending, approved, rejected)

### Enhanced Activity Planning
- [ ] Interactive calendar view with monthly navigation
- [ ] Color-coded activity types (Mega Activation, Mini Activation, etc.)
- [ ] Click-to-plan functionality on calendar dates
- [ ] Activity filtering and search capabilities
- [ ] List and calendar view modes
- [ ] Activity creation, editing, and deletion

### Time Tracking
- [ ] Clock-in/clock-out with GPS verification
- [ ] Location accuracy and coordinate capture
- [ ] Time logging with audit trails
- [ ] Attendance reporting and analytics

### Performance Tracking & Analytics
- [ ] Daily performance recording (GADs, SmartPhone, Others)
- [ ] Inline editing of canvasser productivity metrics
- [ ] FAE reporting with data aggregation
- [ ] Performance rating and incentive calculations
- [ ] CSV export functionality
- [ ] OKR dashboard with targets and actuals

### SIM Card Inventory Management
- [ ] Collection tracking from multiple sources (vendors, customers, red shops)
- [ ] Allocation tracking for returns and distributions
- [ ] Real-time balance calculations
- [ ] Transaction history with complete audit trails
- [ ] Source and allocation type categorization

### Territory Management
- [ ] Interactive turf mapping with polygon drawing
- [ ] Geographic boundary creation and editing
- [ ] Territory assignment to teams
- [ ] Heatmap visualization for engagement analytics
- [ ] Location-based canvasser tracking

### Task Management
- [ ] Task creation with priority levels and status tracking
- [ ] Assignment to teams and individuals
- [ ] Due date management and notifications
- [ ] Task completion workflow
- [ ] Integration with activity planning

## Security Configuration

### Database Security
- Row Level Security (RLS) enabled on sensitive tables
- Proper user permissions and access controls
- Connection encryption enforced

### Application Security
- JWT token authentication
- Input validation and sanitization
- HTTPS enforcement in production
- CORS configuration for allowed origins

### Data Protection
- Professional photo watermarking
- GPS coordinate validation
- Secure file storage for captured images
- Audit trails for all critical operations

## Monitoring and Maintenance

### Application Monitoring
```bash
# Check application status
pm2 status

# View logs
pm2 logs fieldforce-pro

# Monitor resources
pm2 monit
```

### Database Monitoring
```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor active connections
SELECT count(*) FROM pg_stat_activity;
```

### Backup Strategy
```bash
# Database backup
pg_dump -U username -h hostname -p port database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/fieldforce-pro"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$DATE.sql"
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

## Performance Optimization

### Database Optimization
- Proper indexes on frequently queried columns
- Regular VACUUM and ANALYZE operations
- Connection pooling configuration

### Application Optimization
- Static asset caching
- Gzip compression enabled
- Image optimization for photo captures
- Efficient query patterns

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify DATABASE_URL format
- Check network connectivity
- Confirm database credentials

**GPS Location Issues**
- Ensure HTTPS for location services
- Check browser permissions
- Verify location accuracy settings

**Photo Capture Problems**
- Confirm camera permissions
- Check device compatibility
- Verify image processing pipeline

**Performance Issues**
- Monitor database query performance
- Check server resource usage
- Optimize slow queries with EXPLAIN

### Support Contacts

For deployment assistance:
- Technical issues: Check application logs and database connectivity
- Performance problems: Monitor resource usage and optimize queries
- Feature questions: Refer to user documentation and API endpoints

## Enhanced Feature Set (Latest Updates)

### Activity Planning System
- **Calendar Interface**: Interactive monthly calendar with click-to-plan functionality
- **Activity Types**: Color-coded system (Mega Activation, Mini Activation, New Site Activation, New Site Launch, Service Camp)
- **Dual Views**: Switch between calendar and list views for activity management
- **Smart Filtering**: Search and filter activities by type, location, and date ranges
- **Real-time Updates**: Instant synchronization across team members

### SIM Card Inventory Management
- **Collection Tracking**: Record SIM cards from vendors, customers, red shops, ASMs, MDs
- **Allocation Management**: Track distributions, returns, and transfers
- **Balance Calculations**: Real-time inventory balance with transaction history
- **Audit Trails**: Complete transaction logs with timestamps and user tracking
- **Structured Categories**: Organized source and allocation type management

### Advanced Analytics Dashboard
- **OKR Management**: Set targets and track actual performance metrics
- **Engagement Heatmaps**: Visual representation of canvasser activity levels
- **Performance Metrics**: Daily productivity tracking with inline editing capabilities
- **Sales Analytics**: Revenue tracking, conversion rates, and customer acquisition costs
- **Reporting Suite**: Comprehensive CSV export capabilities for all modules

### Enhanced User Experience
- **Dark Mode Support**: Full application theming with user preferences
- **Mobile Optimization**: Responsive design for field operations on mobile devices
- **Progressive Loading**: Skeleton screens and loading states for better UX
- **Real-time Notifications**: Toast notifications for actions and updates
- **Accessibility**: WCAG compliant interface with proper ARIA labels

## Post-Deployment Checklist

### Core System Verification
- [ ] All environment variables configured correctly
- [ ] Database schema deployed with latest tables and relationships
- [ ] Default admin users (admin@company.com) and FAE accounts created
- [ ] SSL certificate installed and HTTPS enforced
- [ ] CORS configuration allows proper client-server communication

### Authentication & Security
- [ ] JWT token authentication functioning
- [ ] Role-based access control (Admin, FAE, Canvasser) working
- [ ] Session management and token refresh operational
- [ ] Input validation and sanitization active
- [ ] Row Level Security (RLS) enabled on sensitive tables

### Core Features Testing
- [ ] GPS location services functional across all modules
- [ ] Camera capture working with MDNL watermarking
- [ ] Time tracking with GPS verification operational
- [ ] Enhanced activity planner with calendar interface working
- [ ] SIM inventory management with collection/allocation tracking
- [ ] Team creation and KIT ID management functional

### Advanced Features Verification
- [ ] OKR dashboard displaying targets and actuals correctly
- [ ] Engagement heatmap visualization working
- [ ] Performance analytics with inline editing operational
- [ ] Territory mapping with polygon drawing tools functional
- [ ] Task management with priority and status tracking working
- [ ] FAE reporting and CSV export capabilities functioning

### API Endpoints Verification
- [ ] All authentication endpoints responding (login, profile, logout)
- [ ] Team management APIs working (create, read, update, delete)
- [ ] Activity planner endpoints functional (CRUD operations)
- [ ] SIM collection APIs operational (collection and allocation tracking)
- [ ] Performance tracking endpoints responding correctly
- [ ] Reporting APIs generating proper data exports

### User Interface Testing
- [ ] Mobile responsiveness verified on various device sizes
- [ ] Dark mode toggle functioning properly
- [ ] Navigation between modules working seamlessly
- [ ] Form validation providing appropriate feedback
- [ ] Real-time updates reflecting across user sessions
- [ ] Loading states and error handling working correctly

### Data Integrity & Performance
- [ ] Database indexes optimized for query performance
- [ ] Backup strategy implemented and tested
- [ ] Monitoring and alerting configured for critical metrics
- [ ] Connection pooling configured for database efficiency
- [ ] Image processing pipeline working for photo captures
- [ ] GPS coordinate validation and accuracy checks functional

### Production Readiness
- [ ] Environment-specific configurations applied
- [ ] Logging levels set appropriately for production
- [ ] Error tracking and monitoring systems active
- [ ] Performance metrics collection operational
- [ ] Security headers and protective measures in place
- [ ] Data retention policies implemented where applicable

This comprehensive deployment guide ensures a complete, secure, and feature-rich FieldForce Pro installation ready for advanced field operations management with enhanced activity planning, inventory tracking, and analytics capabilities.