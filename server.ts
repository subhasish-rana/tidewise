import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import {
  IMPACT_SERIES,
  INITIAL_DRIVES,
  INITIAL_RATINGS,
  INITIAL_REPORTS,
  INITIAL_WATER_BODIES,
} from './src/data/seedData.ts';
import type {
  AiClassificationResult,
  CleanupDrive,
  CleanlinessRatingEntry,
  ReportStatus,
  SeverityLevel,
  WasteCategory,
  WasteReport,
  WaterBody,
} from './src/types/tidewise.ts';

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json({ limit: '15mb' }));

// Persistent in-memory state backed by a local JSON snapshot when writable
const STORE_PATH = path.join(process.cwd(), '.tidewise-data.json');

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
          reports: parsed.reports,
          drives: parsed.drives,
          ratings: parsed.ratings,
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

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const ALLOWED_CATEGORIES: WasteCategory[] = [
  'Plastic',
  'Glass',
  'Metal',
  'Organic',
  'Fishing gear',
  'Mixed',
  'Other',
];

const ALLOWED_SEVERITIES: SeverityLevel[] = ['Low', 'Medium', 'High'];

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'tidewise-api' });
});

app.get('/api/state', (_req, res) => {
  res.json({
    waterBodies: store.waterBodies,
    reports: store.reports,
    drives: store.drives,
    ratings: store.ratings,
    impactSeries: IMPACT_SERIES,
  });
});

app.post('/api/classify-waste', async (req, res) => {
  try {
    const { imageBase64, mimeType, imageUrl, description, locationName } = req.body as {
      imageBase64?: string;
      mimeType?: string;
      imageUrl?: string;
      description?: string;
      locationName?: string;
    };

    let resolvedBase64 = '';
    let resolvedMimeType = mimeType || 'image/jpeg';

    if (imageBase64) {
      if (imageBase64.startsWith('data:')) {
        const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          resolvedMimeType = match[1];
          resolvedBase64 = match[2];
        }
      } else {
        resolvedBase64 = imageBase64;
      }
    } else if (imageUrl && imageUrl.startsWith('/src/assets/images/')) {
      const safeFile = path.basename(imageUrl);
      const localPath = path.join(process.cwd(), 'src', 'assets', 'images', safeFile);
      if (fs.existsSync(localPath)) {
        resolvedBase64 = fs.readFileSync(localPath).toString('base64');
        resolvedMimeType = 'image/jpeg';
      }
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in server secrets.',
      });
    }

    const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];
    if (resolvedBase64) {
      parts.push({
        inlineData: {
          mimeType: resolvedMimeType,
          data: resolvedBase64,
        },
      });
    }

    parts.push({
      text: `You are Tidewise's coastal and urban lake waste classifier for Odisha, India (Puri Beach, Chandipur Beach, Bhubaneswar lakes/rivers).
Analyze the uploaded waste photo and context to classify the dominant waste type and pickup urgency.
Location context: ${locationName || 'Odisha coast / urban water body'}.
Reporter description: ${description || 'No extra text note provided.'}.

Choose category strictly from: Plastic, Glass, Metal, Organic, Fishing gear, Mixed, Other.
Choose suggestedSeverity strictly from: Low, Medium, High.
Choose municipalUnitHint strictly from: "Puri Municipality Coastal Squad", "BMC Lake Sanitation Unit", "BMC Riverbank Rapid Team", "Balasore Coastal Ward 4", "Odisha Coastal Volunteer Corps".
Provide a concise 1-sentence reasoning citing visible items (e.g. PET bottles, nylon rope, floral waste, broken glass).`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            confidenceScore: { type: Type.INTEGER },
            reasoning: { type: Type.STRING },
            suggestedSeverity: { type: Type.STRING },
            municipalUnitHint: { type: Type.STRING },
          },
          required: ['category', 'confidenceScore', 'reasoning', 'suggestedSeverity', 'municipalUnitHint'],
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText) as {
      category?: string;
      confidenceScore?: number;
      reasoning?: string;
      suggestedSeverity?: string;
      municipalUnitHint?: string;
    };

    const category: WasteCategory = ALLOWED_CATEGORIES.includes(parsed.category as WasteCategory)
      ? (parsed.category as WasteCategory)
      : 'Mixed';
    const suggestedSeverity: SeverityLevel = ALLOWED_SEVERITIES.includes(
      parsed.suggestedSeverity as SeverityLevel,
    )
      ? (parsed.suggestedSeverity as SeverityLevel)
      : 'Medium';

    const score = Math.min(99, Math.max(45, Number(parsed.confidenceScore) || 86));
    const confidenceLabel: AiClassificationResult['confidenceLabel'] =
      score >= 85 ? 'High confidence' : score >= 65 ? 'Moderate confidence' : 'Low confidence';

    const result: AiClassificationResult = {
      category,
      confidenceLabel,
      confidenceScore: score,
      reasoning:
        parsed.reasoning ||
        'Visible shoreline debris detected; please confirm the suggested waste category before submission.',
      suggestedSeverity,
      municipalUnitHint: parsed.municipalUnitHint || 'Puri Municipality Coastal Squad',
    };

    return res.json(result);
  } catch (err) {
    console.error('Waste classification error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unable to classify waste image right now.',
    });
  }
});

app.post('/api/reports', (req, res) => {
  const payload = req.body as Partial<WasteReport>;
  if (!payload.locationName || !payload.category) {
    return res.status(400).json({ error: 'Location and waste category are required.' });
  }

  const nextNum = 419 + store.reports.length;
  const id = `TW-2026-0${nextNum}`;
  const nowLabel = 'Just now';

  const newReport: WasteReport = {
    id,
    title:
      payload.title ||
      `${payload.category} hotspot near ${payload.locationName.split('·')[0].trim()}`,
    waterBodyId: payload.waterBodyId || 'wb-puri',
    locationName: payload.locationName,
    region: payload.region || 'Puri',
    lat: typeof payload.lat === 'number' ? payload.lat : 19.7983,
    lng: typeof payload.lng === 'number' ? payload.lng : 85.8249,
    mapX: typeof payload.mapX === 'number' ? payload.mapX : 465,
    mapY: typeof payload.mapY === 'number' ? payload.mapY : 565,
    category: payload.category,
    aiSuggestedCategory: payload.aiSuggestedCategory || payload.category,
    aiConfidence: typeof payload.aiConfidence === 'number' ? payload.aiConfidence : 88,
    aiReasoning:
      payload.aiReasoning || 'Confirmed by reporter after AI category suggestion.',
    severity: payload.severity || 'Medium',
    status: 'Submitted',
    description:
      payload.description || 'Reported via Tidewise mobile app for municipal review.',
    photoUrl: payload.photoUrl || '/src/assets/images/sample_plastic_hotspot_1794839079152.jpg',
    reporterName: payload.reporterName || 'Aarav Mohanty',
    reporterId: payload.reporterId || 'member-aarav',
    createdAt: nowLabel,
    estimatedKg: payload.severity === 'High' ? 20 : payload.severity === 'Medium' ? 12 : 5,
    timeline: [
      {
        status: 'Submitted',
        timestamp: 'Just now',
        note: 'Geotagged waste report submitted with confirmed AI classification.',
        actor: payload.reporterName || 'Aarav Mohanty',
      },
    ],
  };

  store.reports = [newReport, ...store.reports];
  saveStore();
  res.status(201).json(newReport);
});

app.patch('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const { status, assignedUnit, note, actor } = req.body as {
    status?: ReportStatus;
    assignedUnit?: string;
    note?: string;
    actor?: string;
  };

  const idx = store.reports.findIndex((r) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  const current = store.reports[idx];
  const updatedStatus = status || current.status;
  const updatedUnit = assignedUnit !== undefined ? assignedUnit : current.assignedUnit;

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
        actor: actor || 'Municipal Coordinator',
      },
    ],
  };

  store.reports[idx] = updated;
  saveStore();
  res.json(updated);
});

app.post('/api/ratings', (req, res) => {
  const { waterBodyId, authorName, score, observations, comment } = req.body as {
    waterBodyId?: string;
    authorName?: string;
    score?: number;
    observations?: string[];
    comment?: string;
  };

  if (!waterBodyId || typeof score !== 'number' || score < 1 || score > 5) {
    return res.status(400).json({ error: 'Valid water body and rating (1-5) are required.' });
  }

  const wbIdx = store.waterBodies.findIndex((w) => w.id === waterBodyId);
  if (wbIdx === -1) {
    return res.status(404).json({ error: 'Water body not found.' });
  }

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
    authorName: authorName || 'Member',
    score,
    observations: Array.isArray(observations) ? observations : [],
    comment: comment || '',
    createdAt: 'Just now',
  };
  store.ratings = [entry, ...store.ratings];
  saveStore();

  res.status(201).json({ waterBody: updatedWb, ratingEntry: entry });
});

app.post('/api/drives/:id/toggle', (req, res) => {
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
  res.json(updated);
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
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tidewise server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
