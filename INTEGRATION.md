# FLAPI Response Comparator - Integration Guide

כלי לבדיקת השוואת תגובות API בין סביבת Production ל-Prep.

## ארכיטקטורה

המערכת מורכבת משלושה חלקים:

1. **Frontend Dashboard** - ממשק להצגת בקשות והשוואות
2. **Backend Edge Functions** - עיבוד תורים והשוואת תגובות
3. **Database** - אחסון בקשות ותוצאות

## אינטגרציה עם FLAPI

### שלב 1: Capture Requests

בקוד ה-FLAPI שלך, הוסף middleware או interceptor שישלח בקשות לכלי ההשוואה:

```typescript
import { supabase } from './supabase-client';

// Middleware לכידת בקשות
async function captureRequest(req, res, next) {
  const requestData = {
    endpoint: req.path,
    method: req.method,
    headers: req.headers,
    body: req.body,
  };

  try {
    // שלח לכלי ההשוואה
    const response = await fetch('YOUR_EDGE_FUNCTION_URL/capture-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();
    console.log('Request captured:', result.requestId);

    // המשך עם הבקשה המקורית
    next();
  } catch (error) {
    console.error('Failed to capture request:', error);
    // המשך גם במקרה של שגיאה
    next();
  }
}
```

### שלב 2: Process Comparisons

אחרי שהבקשות נשמרות, קרא ל-Edge Function לעיבוד ההשוואה:

```typescript
async function processComparison(requestId: string) {
  const response = await fetch('YOUR_EDGE_FUNCTION_URL/process-comparison', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requestId: requestId,
      prodUrl: 'https://your-production-api.com',
      prepUrl: 'https://your-prep-api.com',
    }),
  });

  return await response.json();
}
```

### שלב 3: Automated Processing

ניתן להגדיר Cron Job לעיבוד אוטומטי של בקשות ממתינות:

```typescript
// כל דקה, עבד בקשות ממתינות
async function processQueue() {
  const { data: pendingRequests } = await supabase
    .from('requests')
    .select('id')
    .eq('status', 'pending')
    .limit(10);

  for (const req of pendingRequests || []) {
    await processComparison(req.id);
  }
}
```

## שימוש עם BullMQ (אופציונלי)

אם תרצה להשתמש ב-BullMQ לניהול תורים מתקדם:

```typescript
import { Queue, Worker } from 'bullmq';

// יצירת תור
const comparisonQueue = new Queue('api-comparisons', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

// הוספת בקשה לתור
await comparisonQueue.add('compare', {
  requestId: 'uuid',
  prodUrl: 'https://prod.com',
  prepUrl: 'https://prep.com',
});

// Worker לעיבוד
const worker = new Worker('api-comparisons', async (job) => {
  const { requestId, prodUrl, prepUrl } = job.data;
  return await processComparison(requestId);
});
```

## Edge Functions URLs

Edge Functions נגישות ב:
- **Capture Request**: `https://YOUR_PROJECT.supabase.co/functions/v1/capture-request`
- **Process Comparison**: `https://YOUR_PROJECT.supabase.co/functions/v1/process-comparison`

## Database Schema

```sql
CREATE TABLE requests (
  id UUID PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  headers JSONB,
  body JSONB,
  prod_response JSONB,
  prep_response JSONB,
  status TEXT, -- 'pending', 'processing', 'completed', 'error'
  diff_status TEXT, -- 'identical', 'different', 'error'
  error_message TEXT,
  created_at TIMESTAMP,
  processed_at TIMESTAMP,
  processing_duration_ms INTEGER
);
```

## Best Practices

1. **Rate Limiting** - הוסף rate limiting למניעת עומס
2. **Selective Capture** - לכוד רק endpoints חשובים
3. **Error Handling** - טיפול נכון בשגיאות
4. **Monitoring** - עקוב אחרי ביצועים ושגיאות
5. **Cleanup** - נקה בקשות ישנות מעבר לתקופה מסוימת

## תמיכה

לשאלות או בעיות, פנה למפתח המערכת.
