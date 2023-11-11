# Database backup and import

```bash
# Connect to the database: psql.exe -U postgres -d postgres -h localhost -p 5432
# Drop tables with double quotes...
DROP TABLE "Items";
# Run this command after dropping the tables. On Windows 10 use forward slashes and single quotes...
\i 'C:/path-to-file/db.dump'
```

# Setup

```bash
cp .env.example .env
pnpm i
pnpm dev
```

# Prisma

```bash
# The client
npx prisma client

# Generate the client files
npx prisma generate

# Push migration changes
npx prisma db push

# Wipe out all the data to start over
npx prisma db push --force-reset

# Create the GlobalConfig table and the default Payment Methods
npx prisma db seed
```

