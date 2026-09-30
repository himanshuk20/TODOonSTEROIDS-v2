import { ImportPlanInput } from './validation';

export const CHATGPT_PROMPT_TEMPLATE = `I am preparing for an exam and need a structured study plan formatted as JSON for the TODOonSTEROIDS app.

Please generate a realistic study plan following this EXACT JSON schema:

{
  "examName": "[Exam Name, e.g. UPSC CSE 2027, JEE Advanced 2027, NEET UG 2027]",
  "examDate": "YYYY-MM-DD",
  "monthlyGoals": [
    "Goal 1 description",
    "Goal 2 description"
  ],
  "subjects": [
    {
      "name": "Subject Name",
      "topics": [
        { "name": "Topic 1", "status": "completed" },
        { "name": "Topic 2", "status": "in_progress" },
        { "name": "Topic 3", "status": "pending" }
      ]
    }
  ],
  "tasks": [
    {
      "title": "Task title (e.g. Subject - Specific Chapter or Practice)",
      "subjectName": "Exact matching Subject Name from above",
      "topicName": "Exact matching Topic Name (optional)",
      "scheduledDate": "YYYY-MM-DD",
      "durationMinutes": 45,
      "status": "pending",
      "timeSlot": "09:00 AM - 10:00 AM"
    }
  ]
}

Instructions:
1. Divide my syllabus into 4-6 main subjects.
2. Break each subject down into 8-15 core topics.
3. Schedule realistic daily study blocks (30 to 120 minutes) across the current month and upcoming weeks.
4. Mark a few early completed tasks and in-progress topics to reflect existing momentum.
5. Return ONLY valid JSON, with no surrounding conversational markdown.`;

export const CANONICAL_UPSC_PLAN: ImportPlanInput = {
  examName: "UPSC CSE 2027",
  examDate: "2027-05-30",
  monthlyGoals: [
    "Complete Indian Polity (Laxmikanth) 1st thorough read-through",
    "Master Macroeconomics fundamentals: Inflation, Monetary Policy, National Income",
    "Comprehensive Ancient & Medieval History syllabus mapping",
    "Daily Current Affairs notes from The Hindu and Indian Express",
    "Attempt 4 full-length GS Paper 1 prelims mock tests"
  ],
  subjects: [
    {
      name: "Polity",
      topics: [
        { name: "Historical Background & Preamble", status: "completed" },
        { name: "Fundamental Rights", status: "completed" },
        { name: "Directive Principles of State Policy", status: "completed" },
        { name: "Fundamental Duties", status: "completed" },
        { name: "Parliament & State Legislature", status: "in_progress" },
        { name: "Union & State Executive", status: "in_progress" },
        { name: "Judiciary: Supreme Court & High Courts", status: "pending" },
        { name: "Constitutional & Non-Constitutional Bodies", status: "pending" },
        { name: "Emergency Provisions & Amendments", status: "pending" }
      ]
    },
    {
      name: "Economy",
      topics: [
        { name: "National Income Accounting & GDP", status: "completed" },
        { name: "Inflation: Types, Causes & Control", status: "completed" },
        { name: "Monetary Policy & RBI Framework", status: "in_progress" },
        { name: "Fiscal Policy, Budget & Taxation", status: "in_progress" },
        { name: "Banking System & NPA Management", status: "pending" },
        { name: "Balance of Payments & External Sector", status: "pending" },
        { name: "Agriculture & Food Security Policies", status: "pending" },
        { name: "Infrastructure & Industrial Growth", status: "pending" }
      ]
    },
    {
      name: "History",
      topics: [
        { name: "Indus Valley Civilization & Vedic Age", status: "completed" },
        { name: "Buddhism, Jainism & Mahajanapadas", status: "completed" },
        { name: "Mauryan Empire & Ashokan Inscriptions", status: "in_progress" },
        { name: "Gupta Period & Golden Age of Culture", status: "pending" },
        { name: "Delhi Sultanate & Administration", status: "pending" },
        { name: "Mughal Empire & Architecture", status: "pending" },
        { name: "Bhakti & Sufi Movements", status: "pending" },
        { name: "1857 Revolt & Freedom Struggle Genesis", status: "pending" }
      ]
    },
    {
      name: "Geography",
      topics: [
        { name: "Geomorphology: Plate Tectonics & Earthquakes", status: "completed" },
        { name: "Climatology: Atmospheric Circulation", status: "completed" },
        { name: "Monsoon Mechanism & Rainfall Patterns", status: "in_progress" },
        { name: "Oceanography: Currents, Tides & Salinity", status: "pending" },
        { name: "Drainage Systems & River Basins of India", status: "pending" },
        { name: "Soil Profiles & Agricultural Regions", status: "pending" },
        { name: "Resource Distribution: Minerals & Energy", status: "pending" }
      ]
    },
    {
      name: "Current Affairs",
      topics: [
        { name: "International Relations & Bilateral Summits", status: "in_progress" },
        { name: "Climate Change: COP Resolutions & Renewable Targets", status: "completed" },
        { name: "Science & Tech: AI Governance & Space Missions", status: "in_progress" },
        { name: "National Schemes & Vulnerable Sections Welfare", status: "completed" },
        { name: "Judicial Verdicts & Legal Developments", status: "pending" }
      ]
    }
  ],
  tasks: [
    {
      title: "Polity - Fundamental Rights",
      subjectName: "Polity",
      topicName: "Fundamental Rights",
      scheduledDate: "2026-09-28",
      durationMinutes: 45,
      status: "completed",
      timeSlot: "08:00 AM - 08:45 AM"
    },
    {
      title: "Economy - Inflation",
      subjectName: "Economy",
      topicName: "Inflation: Types, Causes & Control",
      scheduledDate: "2026-09-28",
      durationMinutes: 60,
      status: "completed",
      timeSlot: "09:00 AM - 10:00 AM"
    },
    {
      title: "Current Affairs - The Hindu notes",
      subjectName: "Current Affairs",
      topicName: "International Relations & Bilateral Summits",
      scheduledDate: "2026-09-28",
      durationMinutes: 30,
      status: "completed",
      timeSlot: "10:30 AM - 11:00 AM"
    },
    {
      title: "Mock Test - GS Paper 1 (2024)",
      subjectName: "Polity",
      topicName: "Fundamental Rights",
      scheduledDate: "2026-09-28",
      durationMinutes: 90,
      status: "pending",
      timeSlot: "02:00 PM - 03:30 PM"
    },
    {
      title: "Revision - Laxmikanth Ch. 5",
      subjectName: "Polity",
      topicName: "Historical Background & Preamble",
      scheduledDate: "2026-09-28",
      durationMinutes: 30,
      status: "pending",
      timeSlot: "04:00 PM - 04:30 PM"
    },
    {
      title: "Polity Mock Test",
      subjectName: "Polity",
      topicName: "Parliament & State Legislature",
      scheduledDate: "2026-09-26",
      durationMinutes: 180,
      status: "completed",
      timeSlot: "08:00 AM - 11:00 AM"
    },
    {
      title: "Analysis & Notes",
      subjectName: "Polity",
      topicName: "Parliament & State Legislature",
      scheduledDate: "2026-09-26",
      durationMinutes: 60,
      status: "completed",
      timeSlot: "11:30 AM - 12:30 PM"
    },
    {
      title: "CSAT Practice",
      subjectName: "Economy",
      topicName: "Fiscal Policy, Budget & Taxation",
      scheduledDate: "2026-09-26",
      durationMinutes: 60,
      status: "completed",
      timeSlot: "04:00 PM - 05:00 PM"
    },
    {
      title: "Mock Test - GS Paper 1",
      subjectName: "History",
      topicName: "Indus Valley Civilization & Vedic Age",
      scheduledDate: "2026-09-29",
      durationMinutes: 120,
      status: "pending",
      timeSlot: "09:00 AM - 11:00 AM"
    },
    {
      title: "Current Affairs Revision",
      subjectName: "Current Affairs",
      topicName: "Climate Change: COP Resolutions & Renewable Targets",
      scheduledDate: "2026-09-30",
      durationMinutes: 45,
      status: "pending",
      timeSlot: "11:30 AM - 12:15 PM"
    },
    {
      title: "Monthly Goal Review",
      subjectName: "Polity",
      topicName: "Fundamental Duties",
      scheduledDate: "2026-10-01",
      durationMinutes: 30,
      status: "pending",
      timeSlot: "05:00 PM - 05:30 PM"
    },
    {
      title: "Economy - Budget Notes",
      subjectName: "Economy",
      topicName: "Fiscal Policy, Budget & Taxation",
      scheduledDate: "2026-10-02",
      durationMinutes: 60,
      status: "pending",
      timeSlot: "10:00 AM - 11:00 AM"
    }
  ]
};

export const SECOND_PLAN_EXAMPLE: ImportPlanInput = {
  examName: "7th Semester Exams",
  examDate: "2026-12-15",
  monthlyGoals: [
    "Complete Distributed Systems assignments & lab projects",
    "Study Cloud Computing architectures and AWS services",
    "Revise Machine Learning neural networks and transformers",
    "Prepare project presentation & documentation"
  ],
  subjects: [
    {
      name: "Distributed Systems",
      topics: [
        { name: "Consensus: Raft & Paxos", status: "completed" },
        { name: "RPC & Message Queues", status: "in_progress" },
        { name: "Vector Clocks & Synchronization", status: "pending" }
      ]
    },
    {
      name: "Cloud Computing",
      topics: [
        { name: "Kubernetes & Containers", status: "completed" },
        { name: "Serverless & Microservices", status: "in_progress" },
        { name: "Cloud Storage Architectures", status: "pending" }
      ]
    },
    {
      name: "Machine Learning",
      topics: [
        { name: "Backpropagation & Optimizers", status: "completed" },
        { name: "Attention Mechanisms & Transformers", status: "in_progress" },
        { name: "Model Evaluation & Metrics", status: "pending" }
      ]
    }
  ],
  tasks: [
    {
      title: "Read Raft Consensus Paper",
      subjectName: "Distributed Systems",
      topicName: "Consensus: Raft & Paxos",
      scheduledDate: "2026-09-28",
      durationMinutes: 60,
      status: "completed",
      timeSlot: "09:00 AM - 10:00 AM"
    },
    {
      title: "Build Dockerized Microservice Lab",
      subjectName: "Cloud Computing",
      topicName: "Kubernetes & Containers",
      scheduledDate: "2026-09-28",
      durationMinutes: 90,
      status: "pending",
      timeSlot: "02:00 PM - 03:30 PM"
    }
  ]
};
