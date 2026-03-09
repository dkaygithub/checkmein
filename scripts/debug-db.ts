import { config } from 'dotenv';
config({ path: '.env.local' });
config(); // Fallback to .env

const url = process.env.DATABASE_URL;

if (!url) {
    console.error("❌ DATABASE_URL is completely missing or empty.");
    process.exit(1);
}

try {
    const parsedUrl = new URL(url);
    const maskedPassword = parsedUrl.password ? "********" : "(no password)";
    
    console.log(`✅ Loaded DATABASE_URL:`);
    console.log(`  Protocol: ${parsedUrl.protocol}`);
    console.log(`  Username: ${parsedUrl.username}`);
    console.log(`  Password: ${maskedPassword}`);
    console.log(`  Host:     ${parsedUrl.host}`);
    console.log(`  Port:     ${parsedUrl.port}`);
    console.log(`  Path:     ${parsedUrl.pathname}`);
    
    if (parsedUrl.host === 'base' || url.includes('base')) {
        console.error("\n❌ WARNING: Your hostname or URL contains the word 'base'. This is likely a placeholder from a Vercel/Supabase config script that wasn't properly replaced.");
    }
} catch (e: unknown) {
    console.error("❌ DATABASE_URL is not a valid URL format:");
    console.error(url);
    if (e instanceof Error) {
        console.error(e.message);
    }
}
