# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `pc-parts-checklist`
   - Database Password: (choose a strong password)
   - Region: (choose closest to your location)
6. Click "Create new project"

## 2. Get Your Project Credentials

1. Go to your project dashboard
2. Click on "Settings" in the sidebar
3. Click on "API" in the settings menu
4. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## 3. Set Up Environment Variables

1. Create a `.env.local` file in your project root
2. Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Set Up the Database Schema

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase-schema.sql` into the editor
5. Click "Run" to execute the SQL

## 5. Configure Row Level Security (Optional)

The current setup allows anyone to read/write data. For production use, you should:

1. Go to "Authentication" → "Policies" in your Supabase dashboard
2. Create user-specific policies
3. Implement user authentication in your app

## 6. Test the Integration

1. Start your development server: `npm run dev`
2. Open your browser to `http://localhost:3000`
3. Check items and enter prices
4. Refresh the page - your data should persist!

## Features Included

- ✅ **Auto-save**: Data saves automatically after 1 second of inactivity
- ✅ **Session persistence**: Data persists across browser sessions
- ✅ **Loading states**: Shows loading spinner while fetching data
- ✅ **Save indicators**: Shows when data was last saved
- ✅ **Error handling**: Graceful fallbacks if database is unavailable
- ✅ **Reset functionality**: Clears both local state and database

## Database Schema

The app uses a single table `pc_checklist` with the following structure:

- `id`: Unique session identifier (TEXT)
- `checklist_data`: JSON object storing checkbox states (JSONB)
- `prices_data`: JSON object storing item prices (JSONB)
- `created_at`: Timestamp when record was created
- `updated_at`: Timestamp when record was last updated

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Check your environment variables
2. **"Failed to load data"**: Verify your Supabase URL is correct
3. **"Permission denied"**: Check your RLS policies in Supabase dashboard

### Debug Mode:

Add this to your `.env.local` for detailed logging:

```env
NEXT_PUBLIC_DEBUG=true
```

## Next Steps

- Add user authentication for multi-user support
- Implement data export/import functionality
- Add data analytics and insights
- Create backup/restore features
