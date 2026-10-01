import { request } from "./client";
import { db, uid } from "./store";
import type { Report } from "./types";

export const reports = {
  /** POST /reports */
  createReport: async (payload: {
    reporterId: string;
    contentId: string;
    contentType: "question" | "answer";
    excerpt: string;
    reason: string;
  }) =>
    (
      await request<Report>("/reports", { method: "POST", body: payload }, () => {
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

  /** GET /admin/reports */
  getReports: async () => (await request<Report[]>("/admin/reports", {}, () => [...db.reports])).data,

  /** PUT /admin/reports/:id */
  updateReport: async (id: string, status: Report["status"]) =>
    (
      await request<Report>(`/admin/reports/${id}`, { method: "PUT", body: { status } }, () => {
        const report = db.reports.find((r) => r.id === id);
        if (!report) throw new Error("Report not found");
        report.status = status;
        if (status === "removed") {
          db.questions = db.questions.filter((q) => q.id !== report.contentId);
          db.answers = db.answers.filter((a) => a.id !== report.contentId);
        }
        return report;
      })
    ).data,
};
