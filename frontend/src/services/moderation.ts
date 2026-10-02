/**
 * Moderation and reporting service (/api/moderation)
 */
import { request } from "./client";
import { db, uid } from "./store";
import type { Report, ReportReason } from "./types";

export const moderation = {
  /** POST /api/moderation/report */
  createReport: async (payload: {
    reporterId: string;
    contentId: string;
    contentType: "question" | "answer";
    excerpt: string;
    reason: ReportReason;
    customDetails?: string;
  }) =>
    (
      await request<Report>("/moderation/report", { method: "POST", body: payload }, () => {
        const report: Report = {
          id: uid("rep"),
          status: "pending",
          createdAt: new Date().toISOString(),
          ...payload,
        };
        db.reports.unshift(report);
        return report;
      })
    ).data,

  /** GET /api/moderation/reports */
  getReports: async (params?: { status?: string }) =>
    (
      await request<Report[]>("/moderation/reports", { query: params }, () => {
        if (params?.status && params.status !== "all") {
          return db.reports.filter((r) => r.status === params.status);
        }
        return [...db.reports];
      })
    ).data,

  /** PUT /api/moderation/reports/:id */
  updateReportStatus: async (id: string, status: Report["status"], resolvedBy?: string) =>
    (
      await request<Report>(`/moderation/reports/${id}`, { method: "PUT", body: { status, resolvedBy } }, () => {
        const report = db.reports.find((r) => r.id === id);
        if (!report) throw new Error("Report not found");
        report.status = status;
        report.resolvedBy = resolvedBy;

        if (status === "removed") {
          db.questions = db.questions.filter((q) => q.id !== report.contentId);
          db.answers = db.answers.filter((a) => a.id !== report.contentId);
        }
        return report;
      })
    ).data,
};

export const reports = moderation;
