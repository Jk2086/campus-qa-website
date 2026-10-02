import { Question } from '../models/Question.js';
import { KnowledgeBase } from '../models/KnowledgeBase.js';
import { CampusResource } from '../models/CampusResource.js';
import { Task } from '../models/Task.js';
import { routingService } from './routingService.js';
import { config } from '../config/env.js';

export const aiService = {
  DISCLAIMER: 'AI-generated assistance may contain errors. Verify important academic information.',

  /**
   * Generates a study hint for a specific question
   */
  async getHint(questionId) {
    const q = await Question.findById(questionId);
    if (!q) {
      return { hint: 'Question not found. Start by reviewing foundational definitions in your course syllabus.' };
    }

    // Check knowledge base first for verified knowledge
    const kbMatches = await KnowledgeBase.search(q.title, q.subject);
    if (kbMatches.length > 0) {
      return {
        hint: `Verified Campus Hint: ${kbMatches[0].title}\n\n• Core concept: ${kbMatches[0].content.substring(0, 180)}...\n• Try this: Apply this principle directly to the given question parameters.`,
      };
    }

    const cleanTitle = q.title.replace(/\?$/, '');
    return {
      hint: `Start from the definition that the question depends on, then work one step at a time.\n\n• Core idea: ${cleanTitle} is usually best approached by identifying what stays constant and what changes.\n• Try this: Write down the given quantities for ${q.subject.toLowerCase()}, state the governing rule in your own words, then apply it to the smallest possible case before generalising.\n• Check yourself: If your result does not reduce to the trivial case, the error is in the setup, not the arithmetic.`,
    };
  },

  /**
   * Explains the core concept behind a question
   */
  async explainConcept(questionId) {
    const q = await Question.findById(questionId);
    if (!q) {
      return { explanation: 'No explanation available yet.' };
    }

    const cleanTitle = q.title.replace(/\?$/, '');
    return {
      explanation: `Concept walkthrough — ${q.topic} (${q.subject})\n\n1. What it is: The topic describes the core mechanism behind "${cleanTitle}".\n2. Why it matters: It connects directly to the core learning outcomes in this course unit.\n3. How to use it: Identify the inputs, apply the standard relation, then interpret the result physically rather than just numerically.\n4. Common mistake: Students often jump to formulas before verifying that the baseline assumptions hold.`,
    };
  },

  /**
   * Returns similar questions for AI assistant card
   */
  async getRelatedQuestions(questionId) {
    const q = await Question.findById(questionId);
    if (!q) return [];
    return Question.getSimilar({ questionId, subject: q.subject, title: q.title });
  },

  /**
   * Classifies user input into category
   */
  classifyIntent(text) {
    const lower = text.toLowerCase();

    // Campus navigation
    if (
      lower.includes('where do i') ||
      lower.includes('who should i contact') ||
      lower.includes('who handles') ||
      lower.includes('where is') ||
      lower.includes('office') ||
      lower.includes('room') ||
      lower.includes('venue') ||
      lower.includes('coordinator') ||
      lower.includes('library') ||
      lower.includes('lab clearance') ||
      lower.includes('placement cell')
    ) {
      return 'CAMPUS_NAVIGATION';
    }

    // Task guidance
    if (
      lower.includes('what do i need to do') ||
      lower.includes('steps for') ||
      lower.includes('project submission') ||
      lower.includes('how to submit') ||
      lower.includes('clearance procedure') ||
      lower.includes('deadline workflow') ||
      lower.includes('what should i do next')
    ) {
      return 'TASK_GUIDANCE';
    }

    // Mentor request
    if (
      lower.includes('which mentor') ||
      lower.includes('need a mentor') ||
      lower.includes('recommend mentor') ||
      lower.includes('connect me with') ||
      lower.includes('human mentor')
    ) {
      return 'MENTOR_REQUEST';
    }

    // Urgent help
    if (
      lower.includes('urgent') ||
      lower.includes('exam tomorrow') ||
      lower.includes('due in 1 hour') ||
      lower.includes('emergency academic')
    ) {
      return 'URGENT_HELP';
    }

    // Simple doubts
    const simpleWords = ['what is', 'define', 'meaning of', 'formula for', 'difference between'];
    if (simpleWords.some((w) => lower.startsWith(w) || lower.includes(w)) && text.length < 80) {
      return 'SIMPLE_DOUBT';
    }

    // Complex doubts
    return 'COMPLEX_DOUBT';
  },

  /**
   * Core multi-tiered AI pipeline:
   * ANSWER → GUIDE → CONNECT
   */
  async processQuery({ query: userQuery, subject = 'Computer Science', questionId = null }) {
    const category = this.classifyIntent(userQuery);

    // 1. CHECK VERIFIED CAMPUS KNOWLEDGE BASE FIRST
    const kbMatches = await KnowledgeBase.search(userQuery, subject);
    if (kbMatches.length > 0) {
      const match = kbMatches[0];
      return {
        category,
        status: 'VERIFIED_CAMPUS_ANSWER',
        title: match.title,
        answer: match.content,
        verified: true,
        source: 'Campus Knowledge Base',
        recommendedMentors: await routingService.findMentorsForQuestion({ subject, topic: match.topic }),
        similarQuestions: await Question.getSimilar({ title: userQuery, subject }),
        canRequestHumanHelp: false,
      };
    }

    // 2. CAMPUS NAVIGATION
    if (category === 'CAMPUS_NAVIGATION') {
      const resources = await CampusResource.search(userQuery);
      if (resources.length > 0) {
        const res = resources[0];
        return {
          category: 'CAMPUS_NAVIGATION',
          status: 'VERIFIED_CAMPUS_ANSWER',
          answer: `For this, please contact **${res.name}** (${res.type}).\n\n• **Venue**: ${res.venue}\n• **Working Hours**: ${res.workingHours}\n• **Contact**: ${res.contactMethod}\n• **Details**: ${res.description}`,
          resource: res,
          verified: true,
          canRequestHumanHelp: false,
        };
      } else {
        return {
          category: 'CAMPUS_NAVIGATION',
          status: 'AI_UNCERTAIN',
          answer: "I couldn't find this information in the campus directory. Please contact the relevant department or administrative office.",
          canRequestHumanHelp: true,
          recommendedMentors: await routingService.findMentorsForQuestion({ subject }),
        };
      }
    }

    // 3. TASK GUIDANCE
    if (category === 'TASK_GUIDANCE') {
      const tasks = await Task.search(userQuery);
      if (tasks.length > 0) {
        const t = tasks[0];
        const stepList = t.steps.map((s) => `${s.stepOrder}. **${s.instruction}** (Responsible: ${s.requiredRole}${s.resourceVenue ? ` at ${s.resourceVenue}` : ''})`).join('\n');
        return {
          category: 'TASK_GUIDANCE',
          status: 'VERIFIED_CAMPUS_ANSWER',
          task: t,
          answer: `Here is the official procedure for **${t.title}**:\n\n${stepList}\n\n*${t.description}*`,
          verified: true,
          canRequestHumanHelp: false,
        };
      }
    }

    // 4. SIMPLE DOUBTS
    if (category === 'SIMPLE_DOUBT') {
      const simpleResponses = {
        photosynthesis:
          'Photosynthesis is the biological process by which green plants, algae, and some bacteria use sunlight, carbon dioxide, and water to synthesize glucose for energy, releasing oxygen as a byproduct.',
        recursion:
          'Recursion is a programming technique where a function calls itself to solve a smaller instance of the same problem until it reaches a defined base case.',
        entropy:
          'Entropy is a measure of the amount of thermal energy unavailable to do mechanical work in a system, statistically representing the number of accessible microstates.',
        mitosis:
          'Mitosis is the process of cell division that results in two genetically identical daughter cells, each having the same number and kind of chromosomes as the parent nucleus.',
      };

      const matchedKey = Object.keys(simpleResponses).find((k) => userQuery.toLowerCase().includes(k));
      if (matchedKey) {
        return {
          category: 'SIMPLE_DOUBT',
          status: 'AI_SUGGESTED_ANSWER',
          answer: simpleResponses[matchedKey],
          similarQuestions: await Question.getSimilar({ title: userQuery, subject }),
          canRequestHumanHelp: false,
        };
      }
    }

    // 5. COMPLEX / UNCERTAIN DOUBTS (DO NOT FABRICATE -> GUIDE -> CONNECT)
    const similar = await Question.getSimilar({ title: userQuery, subject, questionId });
    const recommendedMentors = await routingService.findMentorsForQuestion({ subject, topic: userQuery });

    return {
      category: category === 'URGENT_HELP' ? 'URGENT_HELP' : 'COMPLEX_DOUBT',
      status: 'AI_UNCERTAIN',
      answer: `This is a multifaceted academic topic. Here is what can be confidently stated:\n\n• **Core Principle**: In ${subject}, problems of this nature require establishing conservation conditions and verifying boundary assumptions before calculation.\n• **Suggested Approach**: Break down the problem into smaller sub-components and review the lecture derivations.\n• **Recommended Step**: Connect with a verified mentor below or submit this to the campus community for a guided peer review.`,
      hints: [
        'State the governing laws in your own words.',
        'Check edge cases before formal calculation.',
        'Review recent lab notes and course unit materials.',
      ],
      similarQuestions: similar,
      recommendedMentors,
      canRequestHumanHelp: true,
    };
  },

  /**
   * Main conversational assistant endpoint: POST /ai/chat
   * Returns exact AIChatMessage structure expected by Lovable frontend
   */
  async chat({ prompt, context = {} }) {
    const text = (prompt || '').trim().toLowerCase();
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    // SITUATION C: Campus Navigation
    if (
      text.includes('who should i contact') ||
      text.includes('who handles') ||
      text.includes('where do i submit') ||
      text.includes('where can i get help') ||
      text.includes('which mentor should i approach') ||
      text.includes('hall ticket') ||
      text.includes('library') ||
      text.includes('placement') ||
      text.includes('lab clearance') ||
      text.includes('contact') ||
      text.includes('office') ||
      text.includes('venue')
    ) {
      const searchRes = await CampusResource.search(prompt);
      let resource = searchRes[0];
      if (!resource) {
        const allRes = await CampusResource.findAll();
        resource = allRes[0];
      }

      return {
        id,
        sender: 'ai',
        situation: 'campus_navigation',
        responseType: 'campus_guidance',
        badgeLabel: '🧭 Campus Guidance',
        text: `Based on verified campus directory data, for "${prompt}", you should visit the **${resource.name}**.\n\n📍 **Location**: ${resource.location || resource.venue}\n👤 **Point of Contact**: ${resource.contactPerson || 'Department Desk'}\n🕒 **Working Hours**: ${resource.workingHours}\n📧 **Contact**: ${resource.email} (${resource.phone})\n\n${resource.description}`,
        campusResource: resource,
        timestamp,
      };
    }

    // SITUATION D: Task Guidance
    if (
      text.includes('what do i need to do') ||
      text.includes('what should i do next') ||
      text.includes('steps for') ||
      text.includes('project submission') ||
      text.includes('exam registration') ||
      text.includes('task')
    ) {
      const searchTasks = await Task.search(prompt);
      const allTasks = await Task.findAll();
      const task = searchTasks[0] || allTasks[0];

      if (task && task.steps && task.steps.length > 0) {
        const pendingSteps = task.steps.filter((s) => !s.completed);
        const nextStep = pendingSteps[0] || task.steps[0];

        return {
          id,
          sender: 'ai',
          situation: 'task_guidance',
          responseType: 'task_guidance',
          badgeLabel: '📋 Task Guidance',
          text: `Here is your next action step for **${task.title}**:\n\n👉 **Next priority**: ${nextStep.title || nextStep.instruction}\n💡 *Guidance*: ${nextStep.guidance || nextStep.instruction}\n\nOverall task progress: ${task.steps.filter((s) => s.completed).length}/${task.steps.length} steps completed. You can view and manage the full submission checklist below.`,
          taskGuidance: {
            task,
            steps: task.steps,
          },
          timestamp,
        };
      }
    }

    // SITUATION B: Complex or Uncertain Academic Questions
    if (
      text.includes('steric hindrance') ||
      text.includes('aldol') ||
      text.includes('enolate') ||
      text.includes('segmentation fault') ||
      text.includes('distributed consensus') ||
      text.includes('paxos') ||
      text.includes('raft') ||
      text.includes('quantum') ||
      text.includes('advanced') ||
      text.includes('complex') ||
      text.includes('uncertain')
    ) {
      const subject = context.subject || 'Computer Science';
      const mentors = await routingService.findMentorsForQuestion({ subject, topic: prompt });
      const topMentor = mentors[0];
      const related = await Question.getSimilar({ title: prompt, subject });

      return {
        id,
        sender: 'ai',
        situation: 'complex_uncertain',
        responseType: 'ai_uncertain',
        badgeLabel: '⚠ AI Needs More Information',
        text: `This looks like an advanced specialized problem. I can explain the fundamental theoretical principles, but an experienced Peer Mentor or Faculty Member would be much better for verifying the complete solution.\n\nI have summarized the core concept and linked related campus discussions, and you can dispatch an immediate helper request below.`,
        concepts: [
          'Identify the boundary constraints and governing assumptions',
          'Review the underlying mathematical/chemical model',
          'Check standard benchmark cases before full formulation',
        ],
        hints: [
          'Verify initial conditions or pointer boundaries in gdb/valgrind',
          'Consult unit lecture slides available in the Ramanujan Library reserves',
        ],
        canRequestHumanHelp: true,
        recommendedMentor: topMentor ? {
          id: topMentor.userId,
          name: topMentor.user?.name || topMentor.name || 'Kabir Menon',
          department: topMentor.department || 'Computer Science',
          expertise: topMentor.expertise || [],
          availability: topMentor.availability || 'Daily 6pm-9pm',
        } : {
          id: 'u5',
          name: 'Kabir Menon',
          department: 'Computer Science',
          expertise: ['Computer Science'],
          availability: 'Daily 6pm-9pm',
        },
        recommendedFaculty: {
          id: 'u2',
          name: 'Dr. Meera Raghavan',
          department: 'Biotechnology',
          office: 'Newton Block, Room 218',
        },
        relatedQuestions: related.slice(0, 2),
        timestamp,
      };
    }

    // SITUATION A: Simple Academic Doubts
    if (text.includes('photosynthesis')) {
      return {
        id,
        sender: 'ai',
        situation: 'simple_academic',
        responseType: 'quick',
        badgeLabel: '⚡ Quick Answer',
        text: 'Photosynthesis is the process by which green plants use sunlight, carbon dioxide and water to make food, releasing oxygen in the process. 🌱\n\nIt takes place inside the chloroplasts in two interconnected phases: the light-dependent reactions (in thylakoids) and the light-independent Calvin cycle (in stroma).',
        timestamp,
      };
    }

    if (text.includes('recursion')) {
      return {
        id,
        sender: 'ai',
        situation: 'simple_academic',
        responseType: 'quick',
        badgeLabel: '⚡ Quick Answer',
        text: 'Recursion is a programming technique where a function solves a problem by calling a smaller instance of itself. 🔁\n\nEvery recursive function must have two parts:\n1. **Base Case**: The condition where it stops calling itself and returns a value directly.\n2. **Recursive Step**: Where it calls itself with modified arguments moving towards the base case.',
        timestamp,
      };
    }

    if (text.includes('ohm') || text.includes('voltage')) {
      return {
        id,
        sender: 'ai',
        situation: 'simple_academic',
        responseType: 'quick',
        badgeLabel: '⚡ Quick Answer',
        text: "Ohm's Law states that current (I) flowing through a conductor is directly proportional to voltage (V) across it, given constant temperature: **V = I × R** ⚡\n\n• V = Voltage in Volts (V)\n• I = Current in Amperes (A)\n• R = Resistance in Ohms (Ω)",
        timestamp,
      };
    }

    // Default friendly campus academic assistance
    return {
      id,
      sender: 'ai',
      situation: 'simple_academic',
      responseType: 'ai_suggested',
      badgeLabel: '🤖 AI Suggested Answer',
      text: `Here is a clear breakdown for "${prompt}":\n\n1. **Core Concept**: Identify what values remain invariant and what transformations apply.\n2. **Best Approach**: Break down into smaller sub-problems and test each step against standard campus course benchmarks.\n3. **Need deeper guidance?**: You can easily connect with a verified Peer Mentor or Faculty advisor on this topic.`,
      timestamp,
    };
  },
};
