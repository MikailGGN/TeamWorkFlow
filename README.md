# FieldForce Pro - Advanced Field Operations Management Platform

A comprehensive field operations management platform featuring enhanced activity planning, SIM inventory tracking, advanced analytics, and team coordination with GPS verification and professional photo capture capabilities.

## Latest Features (v2.2.0)

### Campaign Management System
- **Campaign Creation** - Complete campaign setup with name, description, type, and objectives
- **Location-Based Photo Capture** - GPS-enabled photo documentation with metadata overlay
- **Interactive Maps** - Location selection with coordinate capture for campaign sites
- **Budget Tracking** - Financial planning and budget allocation management
- **Team Assignment** - Multi-team campaign coordination and resource allocation
- **Status Management** - Draft, active, paused, and completed campaign workflows
- **KPI Tracking** - Key Performance Indicator setup and monitoring

### Enhanced Activity Planning System
- **Interactive Calendar View** - Monthly calendar with click-to-plan functionality
- **Color-Coded Activity Types** - Visual identification for Mega Activation, Mini Activation, New Site Activation, New Site Launch, and Service Camp
- **Dual View Modes** - Switch between calendar and list views for activity management
- **Smart Filtering** - Search and filter activities by type, location, and date ranges
- **Real-time Synchronization** - Instant updates across team members

### SIM Card Inventory Management
- **Collection Tracking** - Record SIM cards from vendors, customers, red shops, ASMs, and MDs
- **Allocation Management** - Track distributions, returns, and transfers with detailed categorization
- **Real-time Balance** - Current inventory calculated from collections minus allocations
- **Transaction History** - Complete audit trails with timestamps and user tracking
- **Structured Categories** - Organized source and allocation type management

### Advanced Analytics & Reporting
- **OKR Management** - Set targets and track actual performance metrics with visual indicators
- **Engagement Heatmaps** - Geographic visualization of canvasser activity levels
- **Performance Metrics** - Daily productivity tracking with inline editing capabilities
- **Sales Analytics** - Revenue tracking, conversion rates, and customer acquisition costs
- **Comprehensive Reporting** - CSV export capabilities for all modules

### Core Management
- **Team Creation & Management** - Create field teams with location-based ID generation and multi-KIT ID equipment tracking
- **Canvasser Registration** - Professional registration with enhanced camera capture, GPS verification, and MDNL watermarking
- **Role-Based Authentication** - Secure access for Admin, FAE (Field Area Executive), and Canvasser roles
- **Real-time Dashboard** - Live metrics and performance tracking with enhanced visualizations

### Field Operations
- **Time Tracking** - Clock-in/clock-out with GPS location verification and audit trails
- **Territory Management** - Interactive turf mapping with polygon drawing and geographic boundaries
- **Attendance Logging** - Complete attendance tracking with employee integration
- **Task Management** - Priority-based task assignment with status tracking and workflow management

### Enhanced User Experience
- **Dark Mode Support** - Full application theming with user preferences
- **Mobile Optimization** - Responsive design optimized for field operations on mobile devices
- **Progressive Loading** - Skeleton screens and loading states for better user experience
- **Real-time Notifications** - Toast notifications for actions and updates
- **Accessibility Compliance** - WCAG compliant interface with proper ARIA labels

### Administrative Tools
- **Admin Control Panel** - Complete database management interface with advanced controls
- **Canvasser Approval Workflow** - Streamlined process for reviewing and approving new registrations
- **User Management** - Comprehensive user administration with role management
- **Data Export Suite** - Enhanced CSV export capabilities for reporting and analysis
- **Equipment Accountability** - KIT ID and SIM card tracking with complete audit trails

## Technology Stack

- **Frontend**: React.js with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Shadcn/ui with Radix UI primitives
- **Maps**: Leaflet with drawing capabilities
- **Charts**: Recharts for analytics visualization

## Local Development

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd fieldforce-pro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```
DATABASE_URL="postgresql://username:password@localhost:5432/fieldforce_pro"
NODE_ENV=development
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Deployment to cPanel Shared Hosting

### Prerequisites

- cPanel shared hosting with Node.js support
- SSH/Terminal access (if available)
- File Manager access via cPanel

### Method 1: Using Terminal (Recommended)

If your shared hosting provider supports SSH access:

1. **Connect via SSH:**
```bash
ssh username@your-domain.com
```

2. **Navigate to your domain's directory:**
```bash
cd public_html  # or your domain folder
```

3. **Clone or upload your project:**
```bash
git clone <your-repo-url> .
# OR upload via File Manager and extract
```

4. **Install dependencies:**
```bash
npm install --production
```

5. **Set up environment variables:**
```bash
nano .env
```

Add your production environment variables:
```
DATABASE_URL="your_production_database_url"
NODE_ENV=production
PORT=3000
```

6. **Build the application:**
```bash
npm run build
```

7. **Configure Node.js in cPanel:**
   - Go to cPanel → "Node.js Apps" or "Setup Node.js App"
   - Create a new Node.js application
   - Set Node.js version to 18+ 
   - Set Application Root to your domain folder
   - Set Startup File to `server/index.js`
   - Set Environment Variables from your `.env` file

8. **Start the application:**
   - Click "Start App" in cPanel Node.js interface
   - Or run: `npm start`

### Method 2: Using File Manager

If SSH is not available:

1. **Prepare your files locally:**
```bash
npm run build
npm prune --production
```

2. **Create a deployment package:**
```bash
zip -r fieldforce-pro.zip . -x "node_modules/*" ".git/*" "*.log"
```

3. **Upload via cPanel File Manager:**
   - Login to cPanel
   - Open File Manager
   - Navigate to `public_html` or your domain folder
   - Upload `fieldforce-pro.zip`
   - Extract the files

4. **Install dependencies via cPanel Terminal:**
   - Open "Terminal" in cPanel
   - Navigate to your app directory
   - Run: `npm install --production`

5. **Configure Node.js App:**
   - Follow steps 7-8 from Method 1

### Database Setup

For shared hosting with PostgreSQL:

1. **Create database in cPanel:**
   - Go to "PostgreSQL Databases"
   - Create new database and user
   - Note the connection details

2. **Update DATABASE_URL:**
```
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

3. **Run migrations:**
```bash
npm run db:push
```

### Domain Configuration

1. **Set up subdomain (optional):**
   - Create subdomain in cPanel (e.g., `app.yourdomain.com`)
   - Point it to your Node.js application folder

2. **Configure main domain:**
   - If using main domain, ensure your Node.js app is in the correct folder
   - Update cPanel redirects if necessary

### Environment Variables for Production

Create `.env` file with production values:

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"

# Application
NODE_ENV=production
PORT=3000

# Security (generate strong secrets)
JWT_SECRET="your-super-secret-jwt-key"
SESSION_SECRET="your-session-secret-key"

# Optional: External APIs
GOOGLE_MAPS_API_KEY="your-google-maps-key"
```

### Troubleshooting Common Issues

**Port Conflicts:**
- Most shared hosts assign specific ports
- Check cPanel Node.js settings for assigned port
- Update your app configuration accordingly

**Memory Limits:**
- Shared hosting has memory restrictions
- Monitor app performance in cPanel
- Consider upgrading hosting plan if needed

**File Permissions:**
```bash
chmod -R 755 public_html
chmod -R 644 public_html/*.js
```

**Database Connection Issues:**
- Verify database credentials in cPanel
- Check if remote connections are allowed
- Ensure DATABASE_URL format is correct

**Node.js Version:**
- Ensure your hosting supports Node.js 18+
- Update package.json engines if needed:
```json
"engines": {
  "node": ">=18.0.0",
  "npm": ">=8.0.0"
}
```

### Performance Optimization

1. **Enable compression:**
```javascript
// Add to server/index.ts
import compression from 'compression';
app.use(compression());
```

2. **Static file caching:**
```javascript
app.use(express.static('dist', {
  maxAge: '1d',
  etag: false
}));
```

3. **Database connection pooling:**
```javascript
// Configure in your database connection
{
  max: 10,
  min: 2,
  idle: 10000
}
```

### Monitoring and Maintenance

- Monitor application logs in cPanel
- Set up automated backups for database
- Regular dependency updates: `npm audit fix`
- Monitor disk space and memory usage

### Security Considerations

- Use strong JWT and session secrets
- Enable HTTPS in cPanel
- Regular security updates
- Implement rate limiting for APIs
- Validate all user inputs

## Support

For deployment issues:
1. Check cPanel error logs
2. Verify Node.js version compatibility
3. Ensure all environment variables are set
4. Contact your hosting provider for Node.js specific support

## License

This project is proprietary software for field operations management.