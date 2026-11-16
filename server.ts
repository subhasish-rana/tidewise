import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import {
  IMPACT_SERIES,
  INITIAL_DRIVES,
  INITIAL_RATINGS,
  INITIAL_REPORTS,
  INITIAL_WATER_BODIES,
} from './src/data/seedData.ts';
import type {
  CleanupDrive,
  CleanlinessRatingEntry,
  ReportStatus,
  SeverityLevel,
  WasteCategory,
  WasteReport,
  WaterBody,
} from './src/types/tidewise.ts';

const PORT = Number(process.env.PORT) || 3000;

// Validate HOST env var — only allow valid hostnames/IPs, never arbitrary strings
const RAW_HOST = process.env.HOST ?? '127.0.0.1';
const HOST = /^[\w.\-:]+$/.test(RAW_HOST) ? RAW_HOST : '127.0.0.1';

const app = express();
app.disable('x-powered-by');

// Base64 photos are posted with reports, so allow a larger body for /api only.
app.use(express.json({ limit: '10mb' }));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=()');
  // Content-Security-Policy: tightened to allow only what the app actually needs
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      // Vite HMR websocket in dev; none in prod
      process.env.NODE_ENV !== 'production' ? "connect-src 'self' ws:" : "connect-src 'self'",
      // Leaflet tiles served from openstreetmap; Google Fonts
      "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // No inline scripts outside dev HMR
      process.env.NODE_ENV !== 'production'
        ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
        : "script-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  );
  next();
});

// --- In-memory rate limiting (no external dependency) ---

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

function pruneRateBuckets(now: number) {
  for (const [key, bucket] of rateBuckets) {
    if (now >= bucket.resetAt) {
      rateBuckets.delete(key);
    }
  }
}

function rateLimit(name: string, limit: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    if (rateBuckets.size > 10_000) {
      pruneRateBuckets(now);
    }
    const key = `${name}:${req.ip}`;
    const bucket = rateBuckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > limit) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
    }
    return next();
  };
}

// --- Input validation helpers ---

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

const ALLOWED_CATEGORIES: readonly WasteCategory[] = [
  'Plastic',
  'Glass',
  'Metal',
  'Organic',
  'Fishing gear',
  'Mixed',
  'Other',
];

const ALLOWED_SEVERITIES: readonly SeverityLevel[] = ['Low', 'Medium', 'High'];

const ALLOWED_STATUSES: readonly ReportStatus[] = [
  'Submitted',
  'Under review',
  'Verified',
  'Assigned',
  'In progress',
  'Resolved',
  'Rejected',
  'Duplicate',
];

const ALLOWED_REGIONS = ['Puri', 'Balasore', 'Bhubaneswar'] as const;

const DATA_URL_PATTERN = /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;
const ASSET_PATH_PATTERN = /^\/src\/assets\/images\/[A-Za-z0-9._-]+$/;
const MAX_PHOTO_CHARS = 6_000_000;

function safePhotoUrl(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  if (value.length <= MAX_PHOTO_CHARS && DATA_URL_PATTERN.test(value)) {
    return value;
  }
  if (ASSET_PATH_PATTERN.test(value)) {
    return value;
  }
  return fallback;
}

// --- Persistent in-memory state backed by a local JSON snapshot when writable ---

const STORE_PATH = path.join(process.cwd(), '.tidewise-data.json');
const MAX_REPORTS = 500;
const MAX_RATINGS = 2000;
const MAX_TIMELINE_EVENTS = 50;

interface StoreState {
  waterBodies: WaterBody[];
  reports: WasteReport[];
  drives: CleanupDrive[];
  ratings: CleanlinessRatingEntry[];
}

function loadInitialStore(): StoreState {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      if (
        Array.isArray(parsed.waterBodies) &&
        Array.isArray(parsed.reports) &&
        Array.isArray(parsed.drives) &&
        Array.isArray(parsed.ratings)
      ) {
        return {
          waterBodies: parsed.waterBodies,
          reports: parsed.reports.slice(0, MAX_REPORTS),
          drives: parsed.drives,
          ratings: parsed.ratings.slice(0, MAX_RATINGS),
        };
      }
    }
  } catch {
    // Fallback to seed data cleanly
  }
  return {
    waterBodies: structuredClone(INITIAL_WATER_BODIES),
    reports: structuredClone(INITIAL_REPORTS),
    drives: structuredClone(INITIAL_DRIVES),
    ratings: structuredClone(INITIAL_RATINGS),
  };
}

let store: StoreState = loadInitialStore();

function saveStore() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Ignore write failures on read-only containers; memory state still works
  }
}

function nextReportId(): string {
  let highest = 418;
  for (const report of store.reports) {
    const match = /^TW-2026-0?(\d+)$/.exec(report.id);
    if (match) {
      highest = Math.max(highest, Number(match[1]));
    }
  }
  return `TW-2026-0${highest + 1}`;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'tidewise-api' });
});

app.use('/api', rateLimit('api', 240, 60_000));

app.get('/api/state', (_req, res) => {
  res.json({
    waterBodies: store.waterBodies,
    reports: store.reports,
    drives: store.drives,
    ratings: store.ratings,
    impactSeries: IMPACT_SERIES,
  });
});

app.post('/api/reports', rateLimit('reports', 40, 60_000), (req, res) => {
  const payload = (req.body ?? {}) as Record<string, unknown>;

  const locationName = cleanText(payload.locationName, 160);
  const category = payload.category;

  if (!locationName || !isOneOf(category, ALLOWED_CATEGORIES)) {
    return res.status(400).json({ error: 'A valid location and waste category are required.' });
  }
  if (store.reports.length >= MAX_REPORTS) {
    return res.status(429).json({ error: 'Report storage is full. Please try again later.' });
  }

  const severity: SeverityLevel = isOneOf(payload.severity, ALLOWED_SEVERITIES)
    ? payload.severity
    : 'Medium';
  const region = isOneOf(payload.region, ALLOWED_REGIONS) ? payload.region : 'Puri';
  const lat = clamp(finiteNumber(payload.lat) ?? 19.7983, -90, 90);
  const lng = clamp(finiteNumber(payload.lng) ?? 85.8249, -180, 180);
  const mapX = clamp(finiteNumber(payload.mapX) ?? 465, 0, 1000);
  const mapY = clamp(finiteNumber(payload.mapY) ?? 565, 0, 700);

  const reporterName = cleanText(payload.reporterName, 80) || 'Tidewise member';
  const reporterId = cleanText(payload.reporterId, 80) || 'member-anonymous';
  const shortLocation = locationName.split('·')[0].trim();
  const title = cleanText(payload.title, 160) || `${category} hotspot near ${shortLocation}`;
  const description =
    cleanText(payload.description, 600) ||
    `Geotagged ${category.toLowerCase()} waste reported for municipal cleanup.`;

  const newReport: WasteReport = {
    id: nextReportId(),
    title,
    waterBodyId: cleanText(payload.waterBodyId, 80) || 'wb-puri',
    locationName,
    region,
    lat,
    lng,
    mapX,
    mapY,
    category,
    severity,
    status: 'Submitted',
    description,
    photoUrl: safePhotoUrl(payload.photoUrl, '/src/assets/images/sample_plastic_hotspot_1794839079152.jpg'),
    reporterName,
    reporterId,
    createdAt: 'Just now',
    estimatedKg: severity === 'High' ? 20 : severity === 'Medium' ? 12 : 5,
    timeline: [
      {
        status: 'Submitted',
        timestamp: 'Just now',
        note: 'Geotagged waste report submitted.',
        actor: reporterName,
      },
    ],
  };

  store.reports = [newReport, ...store.reports];
  saveStore();
  return res.status(201).json(newReport);
});

app.patch('/api/reports/:id', rateLimit('moderation', 120, 60_000), (req, res) => {
  const { id } = req.params;
  const body = (req.body ?? {}) as Record<string, unknown>;

  const idx = store.reports.findIndex((r) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  const current = store.reports[idx];

  if (body.status !== undefined && !isOneOf(body.status, ALLOWED_STATUSES)) {
    return res.status(400).json({ error: 'Unknown report status.' });
  }

  const updatedStatus: ReportStatus = isOneOf(body.status, ALLOWED_STATUSES)
    ? body.status
    : current.status;
  const updatedUnit =
    body.assignedUnit !== undefined
      ? cleanText(body.assignedUnit, 120) || undefined
      : current.assignedUnit;
  const note = cleanText(body.note, 300);
  const actor = cleanText(body.actor, 80) || 'Municipal Coordinator';

  const updated: WasteReport = {
    ...current,
    status: updatedStatus,
    assignedUnit: updatedUnit,
    timeline: [
      ...current.timeline,
      {
        status: updatedStatus,
        timestamp: 'Just now',
        note:
          note ||
          (updatedUnit
            ? `Status updated to ${updatedStatus} · Queue: ${updatedUnit}`
            : `Status updated to ${updatedStatus}`),
        actor,
      },
    ].slice(-MAX_TIMELINE_EVENTS),
  };

  store.reports[idx] = updated;
  saveStore();
  return res.json(updated);
});

app.post('/api/ratings', rateLimit('ratings', 60, 60_000), (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const waterBodyId = cleanText(body.waterBodyId, 80);
  const score = finiteNumber(body.score);

  if (!waterBodyId || score === null || score < 1 || score > 5) {
    return res.status(400).json({ error: 'Valid water body and rating (1-5) are required.' });
  }
  if (store.ratings.length >= MAX_RATINGS) {
    return res.status(429).json({ error: 'Rating storage is full. Please try again later.' });
  }

  const wbIdx = store.waterBodies.findIndex((w) => w.id === waterBodyId);
  if (wbIdx === -1) {
    return res.status(404).json({ error: 'Water body not found.' });
  }

  const observations = Array.isArray(body.observations)
    ? body.observations
        .map((item) => cleanText(item, 60))
        .filter((item): item is string => item.length > 0)
        .slice(0, 10)
    : [];

  const wb = store.waterBodies[wbIdx];
  const newCount = wb.ratingCount + 1;
  const newAvg = Number(((wb.rating * wb.ratingCount + score) / newCount).toFixed(1));
  const updatedWb: WaterBody = {
    ...wb,
    rating: newAvg,
    ratingCount: newCount,
    trend: score >= 4 ? 'Improving' : score <= 2 ? 'Needs attention' : wb.trend,
  };
  store.waterBodies[wbIdx] = updatedWb;

  const entry: CleanlinessRatingEntry = {
    id: `rat-${Date.now()}`,
    waterBodyId,
    authorName: cleanText(body.authorName, 80) || 'Member',
    score,
    observations,
    comment: cleanText(body.comment, 300),
    createdAt: 'Just now',
  };
  store.ratings = [entry, ...store.ratings];
  saveStore();

  return res.status(201).json({ waterBody: updatedWb, ratingEntry: entry });
});

app.post('/api/drives/:id/toggle', rateLimit('drives', 60, 60_000), (req, res) => {
  const { id } = req.params;
  const idx = store.drives.findIndex((d) => d.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Cleanup drive not found.' });
  }

  const drive = store.drives[idx];
  const nextJoined = !drive.joined;
  const nextParticipants = nextJoined
    ? Math.min(drive.capacity, drive.participants + 1)
    : Math.max(0, drive.participants - 1);

  const updated: CleanupDrive = {
    ...drive,
    joined: nextJoined,
    participants: nextParticipants,
  };
  store.drives[idx] = updated;
  saveStore();
  return res.json(updated);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(process.cwd(), 'dist');
    // Serve compiled assets
    app.use(express.static(distDir, { dotfiles: 'deny' }));
    // SPA fallback — always resolve to the absolute dist/index.html so there
    // is no chance of a path-traversal attack via the splat segment.
    const indexPath = path.resolve(distDir, 'index.html');
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(indexPath);
    });
  }

  // Central error handler: never echo internal error details to clients.
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled API error:', err);
    if (res.headersSent) {
      return;
    }
    const status =
      typeof err === 'object' && err !== null && 'status' in err
        ? Number((err as { status?: number }).status) || 500
        : 500;
    res.status(status).json({
      error:
        status === 413
          ? 'Uploaded payload is too large.'
          : status === 400
          ? 'Malformed request payload.'
          : 'Something went wrong on the server.',
    });
  });

  app.listen(PORT, HOST, () => {
    console.log(`Tidewise server running on http://${HOST}:${PORT}`);
  });
}

startServer();
