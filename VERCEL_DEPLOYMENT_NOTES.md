# Vercel Deployment Notes

## Environment Variables
Make sure to set the following environment variables in the Vercel dashboard:

```
DATABASE_URL=postgresql://postgres.zgsyciaoixairqqfwvyt:thekinghu8751@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
SESSION_SECRET=w8smRGPCRnWFtBSPf9cD
NODE_ENV=production
NOWPAYMENTS_API_KEY=JW7JXM6-DHEMGBX-J58QEXM-R2ETSY3
NOWPAYMENTS_IPN_SECRET_KEY=A73NxQfXxJzHJF3Qh9jWkxbSvZHas8um
```

## Database Tables
The application requires the following database tables:
- users
- chickens
- transactions
- referrals (newly added)

The "referrals" table has been added to the schema to pass the deployment verification test.

## Deployment Verification
After deploying, visit:
- https://chickfarms.vercel.app/vercel-test.html to run comprehensive tests
- https://chickfarms.vercel.app/health.html for a simple health check

## Common Issues
1. If you see "Error: Cannot read properties of undefined (reading 'NODE_ENV')", ensure that the environment variables are properly set in the Vercel dashboard.
2. If database schema tests fail, make sure that the database schema matches the requirements. The "referrals" table has been added to address this specific issue.