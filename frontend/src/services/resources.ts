/**
 * Campus Resource Directory service (/api/resources)
 */
import { request } from "./client";
import { db } from "./store";
import type { CampusResource } from "./types";

export const resources = {
  /** GET /api/resources */
  getResources: async (params?: { search?: string; type?: string; department?: string }) =>
    (
      await request<CampusResource[]>("/resources", { query: params }, () => {
        let list = [...db.resources];
        if (params?.search) {
          const q = params.search.toLowerCase();
          list = list.filter(
            (r) =>
              r.name.toLowerCase().includes(q) ||
              r.description.toLowerCase().includes(q) ||
              r.location.toLowerCase().includes(q) ||
              r.tags.some((t) => t.toLowerCase().includes(q)),
          );
        }
        if (params?.type && params.type !== "all") {
          list = list.filter((r) => r.type === params.type);
        }
        if (params?.department && params.department !== "all") {
          list = list.filter((r) => r.department === params.department);
        }
        return list;
      })
    ).data,

  /** GET /api/resources/:id */
  getResourceById: async (id: string) =>
    (
      await request<CampusResource | undefined>(`/resources/${id}`, {}, () =>
        db.resources.find((r) => r.id === id),
      )
    ).data,
};
