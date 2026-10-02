/**
 * Campus AI Assistant service (/api/ai)
 * Core Philosophy: ANSWER → GUIDE → CONNECT
 *
 * Implements the 4 core situations:
 * A. Simple Academic Doubts (direct, friendly, concise 🌱)
 * B. Complex or Uncertain Doubts (hints, concepts, related questions, mentor suggestions, "Get Human Help")
 * C. Campus Navigation (who to contact, office, venue, working hours, coordinator)
 * D. Task Guidance (action items, checklist, "View Task Details")
 */
import { request } from "./client";
import { db, findUser } from "./store";
import type { CampusResource, CampusTask, Question, ResponseType, TaskStep } from "./types";

export interface AIChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  situation: "simple_academic" | "complex_uncertain" | "campus_navigation" | "task_guidance" | "general";
  responseType: ResponseType;
  badgeLabel: string;
  concepts?: string[];
  hints?: string[];
  relatedQuestions?: Question[];
  recommendedMentor?: {
    id: string;
    name: string;
    department: string;
    expertise: string[];
    availability: string;
  };
  recommendedFaculty?: {
    id: string;
    name: string;
    department: string;
    office: string;
  };
  campusResource?: CampusResource;
  taskGuidance?: {
    task: CampusTask;
    steps: TaskStep[];
  };
  canRequestHumanHelp?: boolean;
  timestamp: string;
}

export const ai = {
  /**
   * Main conversational assistant pipeline: POST /api/ai/chat
   */
  askAssistant: async (prompt: string, context?: { subject?: string; questionId?: string }): Promise<AIChatMessage> => {
    return (
      await request<AIChatMessage>("/ai/chat", { method: "POST", body: { prompt, context } }, () => {
        const text = prompt.trim().toLowerCase();

        // --- SITUATION C: Campus Navigation ---
        if (
          text.includes("who should i contact") ||
          text.includes("who handles") ||
          text.includes("where do i submit") ||
          text.includes("where can i get help") ||
          text.includes("which mentor should i approach") ||
          text.includes("hall ticket") ||
          text.includes("library") ||
          text.includes("placement") ||
          text.includes("lab clearance") ||
          text.includes("contact") ||
          text.includes("office") ||
          text.includes("venue")
        ) {
          let resource = db.resources[0]; // Academic coordinator default
          if (text.includes("capstone") || text.includes("project") || text.includes("proposal")) {
            resource = db.resources[2]; // Capstone coordinator
          } else if (text.includes("library") || text.includes("book") || text.includes("ieee")) {
            resource = db.resources[3]; // Central Library
          } else if (text.includes("gpu") || text.includes("ai lab") || text.includes("cluster") || text.includes("server")) {
            resource = db.resources[4]; // HPC Lab
          } else if (text.includes("internship") || text.includes("noc") || text.includes("placement") || text.includes("job")) {
            resource = db.resources[5]; // Placement cell
          } else if (text.includes("cse") || text.includes("computer science") || text.includes("hod")) {
            resource = db.resources[1]; // CSE dept office
          } else if (text.includes("hostel") || text.includes("scholarship") || text.includes("welfare")) {
            resource = db.resources[6]; // Student affairs
          }

          return {
            id: `msg_${Date.now()}`,
            sender: "ai",
            situation: "campus_navigation",
            responseType: "campus_guidance",
            badgeLabel: "🧭 Campus Guidance",
            text: `Based on verified campus directory data, for "${prompt}", you should visit the **${resource.name}**.\n\n📍 **Location**: ${resource.location}\n👤 **Point of Contact**: ${resource.contactPerson}\n🕒 **Working Hours**: ${resource.workingHours}\n📧 **Contact**: ${resource.email} (${resource.phone})\n\n${resource.description}`,
            campusResource: resource,
            timestamp: new Date().toISOString(),
          };
        }

        // --- SITUATION D: Task Guidance ---
        if (
          text.includes("what do i need to do") ||
          text.includes("what should i do next") ||
          text.includes("steps for") ||
          text.includes("project submission") ||
          text.includes("exam registration") ||
          text.includes("task")
        ) {
          const task = db.tasks[0]; // Capstone Project task
          const pendingSteps = task.steps.filter((s) => !s.completed);
          const nextStep = pendingSteps[0] ?? task.steps[0];

          return {
            id: `msg_${Date.now()}`,
            sender: "ai",
            situation: "task_guidance",
            responseType: "task_guidance",
            badgeLabel: "📋 Task Guidance",
            text: `Here is your next action step for **${task.title}**:\n\n👉 **Next priority**: ${nextStep.title}\n💡 *Guidance*: ${nextStep.guidance}\n\nOverall task progress: ${task.steps.filter((s) => s.completed).length}/${task.steps.length} steps completed. You can view and manage the full submission checklist below.`,
            taskGuidance: {
              task,
              steps: task.steps,
            },
            timestamp: new Date().toISOString(),
          };
        }

        // --- SITUATION B: Complex or Uncertain Academic Questions ---
        if (
          text.includes("steric hindrance") ||
          text.includes("aldol") ||
          text.includes("enolate") ||
          text.includes("segmentation fault") ||
          text.includes("distributed consensus") ||
          text.includes("paxos") ||
          text.includes("raft") ||
          text.includes("quantum") ||
          text.includes("advanced") ||
          text.includes("complex") ||
          text.includes("uncertain")
        ) {
          const mentor = db.mentors[0];
          const mentorUser = findUser(mentor.userId);
          const facultyUser = findUser("u2"); // Dr. Meera

          return {
            id: `msg_${Date.now()}`,
            sender: "ai",
            situation: "complex_uncertain",
            responseType: "ai_uncertain",
            badgeLabel: "⚠ AI Needs More Information",
            text: `This looks like an advanced specialized problem. I can explain the fundamental theoretical principles, but an experienced Peer Mentor or Faculty Member would be much better for verifying the complete solution.\n\nI have summarized the core concept and linked related campus discussions, and you can dispatch an immediate helper request below.`,
            concepts: [
              "Identify the boundary constraints and governing assumptions",
              "Review the underlying mathematical/chemical model",
              "Check standard benchmark cases before full formulation",
            ],
            hints: [
              "Verify initial conditions or pointer boundaries in gdb/valgrind",
              "Consult unit lecture slides available in the Ramanujan Library reserves",
            ],
            canRequestHumanHelp: true,
            recommendedMentor: {
              id: mentor.userId,
              name: mentorUser?.name ?? "Kabir Menon",
              department: mentorUser?.department ?? "Computer Science",
              expertise: mentor.expertise,
              availability: mentor.availability,
            },
            recommendedFaculty: {
              id: "u2",
              name: facultyUser?.name ?? "Dr. Meera Raghavan",
              department: facultyUser?.department ?? "Biotechnology",
              office: "Newton Block, Room 218",
            },
            relatedQuestions: db.questions.slice(0, 2),
            timestamp: new Date().toISOString(),
          };
        }

        // --- SITUATION A: Simple Academic Doubts ---
        if (text.includes("photosynthesis")) {
          return {
            id: `msg_${Date.now()}`,
            sender: "ai",
            situation: "simple_academic",
            responseType: "quick",
            badgeLabel: "⚡ Quick Answer",
            text: "Photosynthesis is the process by which green plants use sunlight, carbon dioxide and water to make food, releasing oxygen in the process. 🌱\n\nIt takes place inside the chloroplasts in two interconnected phases: the light-dependent reactions (in thylakoids) and the light-independent Calvin cycle (in stroma).",
            timestamp: new Date().toISOString(),
          };
        }

        if (text.includes("recursion")) {
          return {
            id: `msg_${Date.now()}`,
            sender: "ai",
            situation: "simple_academic",
            responseType: "quick",
            badgeLabel: "⚡ Quick Answer",
            text: "Recursion is a programming technique where a function solves a problem by calling a smaller instance of itself. 🔁\n\nEvery recursive function must have two parts:\n1. **Base Case**: The condition where it stops calling itself and returns a value directly.\n2. **Recursive Step**: Where it calls itself with modified arguments moving towards the base case.",
            timestamp: new Date().toISOString(),
          };
        }

        if (text.includes("ohm") || text.includes("voltage")) {
          return {
            id: `msg_${Date.now()}`,
            sender: "ai",
            situation: "simple_academic",
            responseType: "quick",
            badgeLabel: "⚡ Quick Answer",
            text: "Ohm's Law states that current (I) flowing through a conductor is directly proportional to voltage (V) across it, given constant temperature: **V = I × R** ⚡\n\n• V = Voltage in Volts (V)\n• I = Current in Amperes (A)\n• R = Resistance in Ohms (Ω)",
            timestamp: new Date().toISOString(),
          };
        }

        // Default friendly campus academic assistance
        return {
          id: `msg_${Date.now()}`,
          sender: "ai",
          situation: "simple_academic",
          responseType: "ai_suggested",
          badgeLabel: "🤖 AI Suggested Answer",
          text: `Here is a clear breakdown for "${prompt}":\n\n1. **Core Concept**: Identify what values remain invariant and what transformations apply.\n2. **Best Approach**: Break down into smaller sub-problems and test each step against standard campus course benchmarks.\n3. **Need deeper guidance?**: You can easily connect with a verified Peer Mentor or Faculty advisor on this topic.`,
          timestamp: new Date().toISOString(),
        };
      })
    ).data;
  },

  /** POST /api/ai/hint */
  getHint: async (questionId: string) =>
    (
      await request<{ hint: string }>("/ai/hint", { method: "POST", body: { questionId } }, () => {
        const q = db.questions.find((item) => item.id === questionId);
        if (q?.instantAssistance?.hints?.length) {
          return { hint: q.instantAssistance.hints.join("\n\n• ") };
        }
        return {
          hint: `Start by isolating the given quantities for ${q?.subject ?? "this problem"}. State the governing rule in your own words, then apply it to the smallest possible boundary case before generalising.`,
        };
      })
    ).data,

  /** POST /api/ai/explain */
  explainConcept: async (questionId: string) =>
    (
      await request<{ explanation: string }>("/ai/explain", { method: "POST", body: { questionId } }, () => {
        const q = db.questions.find((item) => item.id === questionId);
        if (q?.instantAssistance?.content) {
          return { explanation: q.instantAssistance.content };
        }
        return {
          explanation: `Concept Walkthrough — ${q?.topic ?? "Subject"} (${q?.subject ?? "Curriculum"})\n\n1. What it is: describes the foundational mechanism.\n2. Why it matters: connects directly to assessment criteria.\n3. Practical tip: verify constraints before applying the formula.`,
        };
      })
    ).data,

  /** POST /api/ai/similar-questions */
  relatedQuestions: async (questionId: string) =>
    (
      await request<Question[]>("/ai/similar-questions", { method: "POST", body: { questionId } }, () => {
        const q = db.questions.find((item) => item.id === questionId);
        return db.questions.filter((item) => item.id !== questionId && item.subject === q?.subject).slice(0, 3);
      })
    ).data,

  DISCLAIMER:
    "AI-generated assistance — verify with a peer, mentor or faculty member when needed.",
  UNAVAILABLE_NOTICE:
    "Campus AI is temporarily unavailable. You can still search verified campus answers or request help from peers and mentors.",
};
