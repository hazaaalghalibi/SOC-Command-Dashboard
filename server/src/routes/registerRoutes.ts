import type { Express } from "express";
import { Router } from "express";
import { healthGet } from "../controllers/healthController.js";
import { metricsGet } from "../controllers/metricsController.js";
import { summaryGet } from "../controllers/summaryController.js";
import { analyticsGet } from "../controllers/analyticsController.js";
import { alertsGet, alertsPatch } from "../controllers/alertsController.js";
import { alertConvertPost } from "../controllers/alertConvertController.js";
import {
  incidentByIdGet,
  incidentsGet,
  incidentPatch,
  incidentStatusPatch,
} from "../controllers/incidentsController.js";
import { activityGet } from "../controllers/activityController.js";
import { logsGet, logsUploadPost } from "../controllers/logsController.js";
import { detectionRunPost } from "../controllers/detectionController.js";
import { tickIngestPost, tickLivePost } from "../controllers/tickController.js";
import { authLoginPost, authMeGet } from "../controllers/authController.js";
import { usersGet } from "../controllers/usersController.js";
import { dashboardGet } from "../controllers/dashboardController.js";
import { simulationRunPost } from "../controllers/simulationController.js";
import { searchGet } from "../controllers/searchController.js";
import { exportAlertsCsvGet, exportIncidentsCsvGet } from "../controllers/exportController.js";
import {
  notificationsGet,
  notificationReadPatch,
  notificationsReadAllPost,
} from "../controllers/notificationsController.js";
import { auditGet } from "../controllers/auditController.js";
import { authMiddleware, requireAnalyst, requireAuth } from "../middleware/auth.js";
import { asyncRoute } from "../middleware/asyncRoute.js";

export function registerRoutes(app: Express) {
  const api = Router();

  api.get("/health", healthGet);
  api.post("/auth/login", authLoginPost);

  api.use(authMiddleware);
  api.use(requireAuth);

  api.get("/auth/me", authMeGet);

  api.get("/dashboard", asyncRoute(dashboardGet));
  api.get("/metrics", asyncRoute(metricsGet));
  api.get("/summary", asyncRoute(summaryGet));
  api.get("/analytics", asyncRoute(analyticsGet));

  api.get("/search", asyncRoute(searchGet));

  api.get("/export/alerts", asyncRoute(exportAlertsCsvGet));
  api.get("/export/incidents", asyncRoute(exportIncidentsCsvGet));

  api.get("/notifications", asyncRoute(notificationsGet));
  api.patch("/notifications/:id/read", asyncRoute(notificationReadPatch));
  api.post("/notifications/read-all", asyncRoute(notificationsReadAllPost));

  api.get("/audit", asyncRoute(auditGet));

  api.get("/users", asyncRoute(usersGet));

  api.get("/alerts", asyncRoute(alertsGet));
  api.post("/alerts/:id/convert", requireAnalyst, asyncRoute(alertConvertPost));
  api.patch("/alerts/:id", requireAnalyst, asyncRoute(alertsPatch));

  api.get("/incidents", asyncRoute(incidentsGet));
  api.get("/incidents/:id", asyncRoute(incidentByIdGet));
  api.patch("/incidents/:id/status", requireAnalyst, asyncRoute(incidentStatusPatch));
  api.patch("/incidents/:id", requireAnalyst, asyncRoute(incidentPatch));

  api.get("/activity", asyncRoute(activityGet));
  api.get("/logs", asyncRoute(logsGet));
  api.post("/logs/upload", requireAnalyst, asyncRoute(logsUploadPost));

  api.post("/detection/run", requireAnalyst, asyncRoute(detectionRunPost));
  api.post("/simulation/run", requireAnalyst, asyncRoute(simulationRunPost));

  api.post("/tick/live", requireAnalyst, asyncRoute(tickLivePost));
  api.post("/tick/ingest", requireAnalyst, asyncRoute(tickIngestPost));

  app.use("/api", api);
}