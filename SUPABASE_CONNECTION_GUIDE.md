# FieldForce Pro - Supabase Connection Configuration Guide

The application now supports both Supabase client API and direct database connections. You can choose your preferred method based on your setup.

## Option 1: Supabase Client API (Recommended)

This method uses Supabase's REST API with authentication and built-in security features.

### Environment Variables Required:
```env
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
DATABASE_URL="postgresql://postgres:password@db.your-project-ref.supabase.co:5432/postgres"
```

### Getting Your Supabase Credentials:
1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **URL** (SUPABASE_URL)
5. Copy the **anon/public** key (SUPABASE_ANON_KEY)
6. Go to **Settings** → **Database**
7. Copy the **Connection string** for DATABASE_URL

### Benefits:
- ✅ Built-in authentication and RLS policies
- ✅ Automatic API rate limiting
- ✅ Real-time subscriptions support
- ✅ Edge functions integration
- ✅ Better security with Row Level Security

## Option 2: Direct Database Connection

This method connects directly to PostgreSQL using the connection string.

### Environment Variables Required:
```env
DATABASE_URL="postgresql://postgres:password@db.your-project-ref.supabase.co:5432/postgres"
```

### Benefits:
- ✅ Direct SQL access with full PostgreSQL features
- ✅ Lower latency for complex queries
- ✅ Full Drizzle ORM capabilities
- ✅ Works without Supabase API limits

## Current Application Behavior

The application automatically detects which method to use:

1. **If both SUPABASE_URL and SUPABASE_ANON_KEY are set**: Uses Supabase client with DATABASE_URL fallback
2. **If only DATABASE_URL is set**: Uses direct database connection only

## Connection Status Logging

When the application starts, you'll see one of these messages:

```
[FieldForce Pro] Using Supabase client connection
```
or
```
[FieldForce Pro] Using direct database connection
```

## Updated .env.example

Your environment file should look like this:

```env
# Supabase Configuration (Optional - for client API access)
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"

# Database URL (Required - for direct database access)
DATABASE_URL="postgresql://postgres:password@db.your-project-ref.supabase.co:5432/postgres"

# Application Environment
NODE_ENV=development
PORT=5000

# Security Keys
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
SESSION_SECRET="your-session-secret-key-change-this-in-production"

# Optional: External APIs
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
OPENAI_API_KEY="your-openai-api-key"
```

## Database Setup Status

- ✅ getFAE function updated to fetch exclusively from public.employees table
- ✅ Hybrid storage implementation with Supabase client + Drizzle ORM fallback
- ✅ Support for both connection methods
- ✅ Automatic connection method detection
- ✅ Complete SQL table setup scripts provided

## Next Steps

1. **Choose your connection method** based on your needs
2. **Set the appropriate environment variables** in your .env file
3. **Run the database setup SQL script** from SUPABASE_SETUP.md in your Supabase dashboard
4. **Restart the application** to see the connection status

The application will work with either configuration method and automatically use the best available connection option.