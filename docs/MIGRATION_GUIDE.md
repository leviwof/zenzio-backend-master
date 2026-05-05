# Database Migration Guide

## Overview

Database migrations have been moved from service constructors to proper TypeORM migrations to prevent:
- Race conditions in multi-instance deployments
- Application crashes on migration failures
- Lack of migration history tracking

---

## Running Migrations

### Development Environment

```bash
# Run pending migrations
npm run migration:run

# Revert last migration (if needed)
npm run migration:revert

# Generate a new migration from entity changes
npm run migration:generate -- -n MigrationName

# Create an empty migration file
npm run typeorm migration:create src/migrations/MigrationName
```

### Production Environment

**IMPORTANT**: Always run migrations BEFORE deploying the new code!

```bash
# 1. Backup database first!
pg_dump your_database > backup_$(date +%Y%m%d).sql

# 2. Run migrations on production database
NODE_ENV=production npm run migration:run

# 3. Verify migration success
NODE_ENV=production npm run typeorm migration:show

# 4. Deploy new application code
pm2 restart all
```

---

## Migration History

### 2026-05-04: AddOrderEnhancements (1777870743526)

**Location**: `src/migrations/1777870743526-AddOrderEnhancements.ts`

**Changes**:
- Added `status_timeline` (jsonb) - Track order status changes
- Added `delivery_proof_photo` (text) - Store delivery proof image URL
- Added `admin_commission` (float) - Track platform commission
- Added `packing_charge` (float) - Default 10
- Added `is_revenue_counted` (boolean) - Revenue tracking flag
- Added `refunded_amount` (float) - Track refund amounts
- Added `payment_status` (varchar 50) - Payment state tracking
- Added `partner_lat` (decimal 10,7) - Delivery partner latitude
- Added `partner_lng` (decimal 10,7) - Delivery partner longitude
- Updated `estimated_time` default from '15 min' to '5 min'
- Updated existing records with '15 min' to '5 min'

**Reason**: Previously running in `orders.service.ts onModuleInit()` causing:
- Startup delays
- Race conditions in multi-instance environments
- No rollback capability
- Lack of audit trail

**Status**: ✅ Ready for deployment

---

## Migration Best Practices

### DO:
✅ Always backup database before running migrations  
✅ Run migrations before deploying new code  
✅ Test migrations on staging environment first  
✅ Use `IF NOT EXISTS` for adding columns to be idempotent  
✅ Write `down()` migrations for rollback capability  
✅ Log migration progress with console.log  
✅ Handle migration errors gracefully  

### DON'T:
❌ Never run migrations from service constructors  
❌ Never skip migrations in production  
❌ Don't use `synchronize: true` in production  
❌ Don't drop columns without data backup  
❌ Don't run migrations simultaneously on multiple instances  
❌ Don't modify committed migration files  

---

## Checking Migration Status

```bash
# Show all migrations and their status
npm run typeorm migration:show

# Output example:
# [X] AddOrderEnhancements1777870743526 - Run
# [ ] SomeOtherMigration1777870800000 - Pending
```

---

## Rollback Procedure

If a migration fails or needs to be rolled back:

```bash
# 1. Check current migration status
npm run typeorm migration:show

# 2. Revert the last migration
npm run migration:revert

# 3. Verify the revert
npm run typeorm migration:show

# 4. Fix the migration file

# 5. Re-run the migration
npm run migration:run
```

---

## Multi-Instance Deployments

When deploying to multiple application instances:

### Option 1: Pre-deployment Migration (Recommended)
```bash
# 1. Run migrations on ONE instance before deployment
ssh app-server-1
npm run migration:run

# 2. Verify success
npm run typeorm migration:show

# 3. Deploy new code to ALL instances
pm2 deploy production update
```

### Option 2: Leader Election
```bash
# Use a distributed lock (Redis) to ensure only one instance runs migrations
# Example implementation in app.module.ts:

async onModuleInit() {
  if (process.env.RUN_MIGRATIONS === 'true') {
    const lock = await redis.set('migration_lock', 'locked', 'NX', 'EX', 300);
    if (lock) {
      await dataSource.runMigrations();
      await redis.del('migration_lock');
    }
  }
}
```

---

## Troubleshooting

### Migration fails with "column already exists"
- **Cause**: Migration was partially run or manually applied
- **Solution**: Use `IF NOT EXISTS` in migrations or manually fix schema

### Migration stuck in "running" state
- **Cause**: Previous migration crashed without cleanup
- **Solution**: 
  ```sql
  -- Check migrations table
  SELECT * FROM migrations;
  
  -- Remove stuck migration record (CAREFUL!)
  DELETE FROM migrations WHERE name = 'MigrationName';
  ```

### Multiple instances running migrations simultaneously
- **Cause**: No distributed lock mechanism
- **Solution**: Implement leader election or run migrations separately

---

## Schema Sync vs Migrations

### TypeORM Synchronize

```typescript
// data-source.ts
{
  synchronize: false  // ✅ MUST be false in production
}
```

**Why synchronize: false?**
- `synchronize: true` auto-modifies schema on startup
- Causes data loss (drops columns/tables)
- Race conditions in multi-instance setups
- No audit trail or version control
- Cannot rollback changes

**Use migrations instead!**

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Run Migrations
        run: |
          npm install
          npm run migration:run
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Deploy Application
        run: |
          pm2 deploy production update
```

---

## Migration Checklist

Before deploying:
- [ ] Backup production database
- [ ] Test migration on staging database
- [ ] Verify migration is idempotent (can run multiple times safely)
- [ ] Check migration has proper `down()` method for rollback
- [ ] Ensure no data loss operations without backup
- [ ] Review migration performance (add indexes if needed)
- [ ] Document migration in this file
- [ ] Communicate downtime window (if any) to team

---

## Additional Resources

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [Database Migration Best Practices](https://www.prisma.io/dataguide/types/relational/migration-strategies)
- Internal Wiki: Database Change Management Process

---

**Last Updated**: 2026-05-04  
**Maintained By**: Development Team
