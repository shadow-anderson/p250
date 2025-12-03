/**
 * AI Response Mapping Examples
 * 
 * Shows how AI responses are mapped to UI components in the frontend.
 */

// ============================================
// Example 1: KPI Query
// ============================================

// User Query: "What is the current HQ Operations score?"

// Server Response:
const kpiResponse = {
  answer: "The current HQ Operations score is 85 out of 90 (target), representing a 94% achievement rate. The score has shown an upward trend recently.",
  confidence: 0.95,
  highlights: [
    {
      snippet: "Process optimization efforts led to 85% achievement",
      sourceId: "ev-001"
    }
  ],
  sources: [
    {
      id: "kpi-001",
      type: "kpi",
      title: "HQ Operations Score",
      snippet: "Measures efficiency and effectiveness of headquarters operations",
      link: "/app/division/central",
      score: 0.87
    },
    {
      id: "ev-001",
      type: "evidence",
      title: "Q3 Performance Report",
      snippet: "Achieved 85% score in HQ Operations through process optimization...",
      link: "/app/evidence?id=ev-001",
      score: 0.75
    }
  ],
  actions: [
    {
      type: "drill",
      label: "View Dashboard",
      target: "/app/division/central"
    },
    {
      type: "export",
      label: "Export Report",
      data: { kpiId: "kpi-001" }
    },
    {
      type: "save",
      label: "Save Query",
      query: "What is the current HQ Operations score?"
    }
  ],
  processingTime: 543,
  model: "claude-sonnet-4"
};

// Frontend Mapping:
// ├─ Answer Text → Typography variant="body1"
// ├─ Confidence → LinearProgress with value={confidence * 100}
// ├─ Highlights → Alert severity="info" components
// ├─ Sources → SourceCard components with icons and links
// └─ Actions → Button components with onClick handlers

// ============================================
// Example 2: Project Status Query
// ============================================

// User Query: "Which projects are behind schedule?"

const projectResponse = {
  answer: "One project is currently at risk: Operational Excellence Program (Team Beta, North Division). It has 55% progress but the deadline is November 30, 2025, with only 4 out of 8 milestones completed.",
  confidence: 0.92,
  highlights: [
    {
      snippet: "Progress rate vs. deadline indicates potential delay",
      sourceId: "proj-002"
    }
  ],
  sources: [
    {
      id: "proj-002",
      type: "project",
      title: "Operational Excellence Program",
      snippet: "Status: at-risk, Progress: 55%, Milestones: 4/8",
      link: "/app/project/proj-002",
      score: 0.91
    }
  ],
  actions: [
    {
      type: "drill",
      label: "View Project",
      target: "/app/project/proj-002"
    },
    {
      type: "save",
      label: "Track Progress",
      query: "Projects behind schedule"
    }
  ],
  processingTime: 489,
  model: "claude-sonnet-4"
};

// ============================================
// Example 3: Evidence Query
// ============================================

// User Query: "Show me evidence submitted last week"

const evidenceResponse = {
  answer: "Three evidence items were submitted last week: Q3 Performance Report (HQ Operations) - Approved, Field Visit Documentation (Field Operations) - Approved, Team Meeting Minutes (Team Collaboration) - Pending review.",
  confidence: 0.88,
  highlights: [
    {
      snippet: "Q3 Performance Report - Approved",
      sourceId: "ev-001"
    },
    {
      snippet: "Field Visit Documentation - Approved",
      sourceId: "ev-002"
    },
    {
      snippet: "Team Meeting Minutes - Pending review",
      sourceId: "ev-003"
    }
  ],
  sources: [
    {
      id: "ev-001",
      type: "evidence",
      title: "Q3 Performance Report",
      snippet: "Submitted on 2025-11-25, Status: approved",
      link: "/app/evidence?id=ev-001",
      score: 0.85
    },
    {
      id: "ev-002",
      type: "evidence",
      title: "Field Visit Documentation",
      snippet: "Submitted on 2025-11-28, Status: approved",
      link: "/app/evidence?id=ev-002",
      score: 0.82
    },
    {
      id: "ev-003",
      type: "evidence",
      title: "Team Meeting Minutes",
      snippet: "Submitted on 2025-11-30, Status: pending",
      link: "/app/evidence?id=ev-003",
      score: 0.79
    }
  ],
  actions: [
    {
      type: "drill",
      label: "Review Evidence",
      target: "/app/evidence"
    },
    {
      type: "export",
      label: "Download All",
      data: { evidenceIds: ["ev-001", "ev-002", "ev-003"] }
    }
  ],
  processingTime: 612,
  model: "claude-sonnet-4"
};

// ============================================
// Example 4: Comparative Query
// ============================================

// User Query: "Compare Team Alpha vs Team Beta performance"

const comparisonResponse = {
  answer: "Team Alpha (Digital Transformation): 75% progress, on track, 7/10 milestones. Team Beta (Operational Excellence): 55% progress, at risk, 4/8 milestones. Team Alpha leads in both progress and completion rate. Team Beta needs support.",
  confidence: 0.91,
  highlights: [
    {
      snippet: "Team Alpha: 75% progress, on track",
      sourceId: "proj-001"
    },
    {
      snippet: "Team Beta: 55% progress, at risk",
      sourceId: "proj-002"
    }
  ],
  sources: [
    {
      id: "proj-001",
      type: "project",
      title: "Digital Transformation Initiative",
      snippet: "Team: Team Alpha, Progress: 75%, Milestones: 7/10",
      link: "/app/project/proj-001",
      score: 0.88
    },
    {
      id: "proj-002",
      type: "project",
      title: "Operational Excellence Program",
      snippet: "Team: Team Beta, Progress: 55%, Milestones: 4/8",
      link: "/app/project/proj-002",
      score: 0.87
    }
  ],
  actions: [
    {
      type: "drill",
      label: "Team Dashboard",
      target: "/app/dashboard/teams"
    },
    {
      type: "export",
      label: "Export Comparison",
      data: { type: "team-comparison" }
    }
  ],
  processingTime: 701,
  model: "claude-sonnet-4"
};

// ============================================
// Example 5: Uncertain Query
// ============================================

// User Query: "What is the weather today?"

const uncertainResponse = {
  answer: "I don't have enough information to answer that question with confidence. This query is outside the scope of the Prabhaav system, which focuses on KPIs, projects, and evidence.",
  confidence: 0.0,
  highlights: [],
  sources: [],
  actions: [
    {
      type: "drill",
      label: "Go to Dashboard",
      target: "/app/dashboard"
    }
  ],
  processingTime: 234,
  model: "claude-sonnet-4"
};

// ============================================
// Frontend Component Usage
// ============================================

/*
// In AskPrabhaavModal.jsx

const MessageCard = ({ message }) => {
  const { metadata } = message;
  
  return (
    <Paper>
      {/* Answer *\/}
      <Typography variant="body1">
        {message.content}
      </Typography>
      
      {/* Confidence Score *\/}
      {metadata?.confidence && (
        <Box>
          <Typography variant="caption">
            Confidence: {Math.round(metadata.confidence * 100)}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={metadata.confidence * 100} 
          />
        </Box>
      )}
      
      {/* Sources *\/}
      {metadata?.sources?.map(source => (
        <SourceCard 
          key={source.id}
          source={source}
        />
      ))}
      
      {/* Highlights *\/}
      {metadata?.highlights?.map(highlight => (
        <Alert severity="info" key={highlight.snippet}>
          {highlight.snippet}
        </Alert>
      ))}
      
      {/* Actions *\/}
      {metadata?.actions?.map(action => (
        <Button 
          key={action.label}
          onClick={() => handleAction(action)}
        >
          {action.label}
        </Button>
      ))}
    </Paper>
  );
};
*/

// ============================================
// Action Handler Examples
// ============================================

const handleAction = (action) => {
  switch (action.type) {
    case 'drill':
      // Navigate to target page
      navigate(action.target);
      onClose(); // Close modal
      break;
      
    case 'export':
      // Export data
      const exportData = action.data;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prabhaav-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      break;
      
    case 'save':
      // Save query to favorites
      saveQueryMutation.mutate({ query: action.query });
      break;
      
    default:
      console.warn('Unknown action type:', action.type);
  }
};

// ============================================
// Conversation History Example
// ============================================

const conversationExample = [
  {
    id: 1,
    type: 'user',
    content: 'What is the HQ Operations score?',
    timestamp: '2025-12-04T10:30:00Z',
  },
  {
    id: 2,
    type: 'ai',
    content: 'The current HQ Operations score is 85...',
    metadata: kpiResponse,
    timestamp: '2025-12-04T10:30:02Z',
  },
  {
    id: 3,
    type: 'user',
    content: 'Show me the trend over time',
    timestamp: '2025-12-04T10:31:00Z',
  },
  {
    id: 4,
    type: 'ai',
    content: 'The HQ Operations score has shown an upward trend...',
    metadata: {
      // Follow-up response with context from previous query
      answer: "The HQ Operations score has shown an upward trend...",
      confidence: 0.89,
      sources: [],
      actions: [],
    },
    timestamp: '2025-12-04T10:31:03Z',
  },
];

export {
  kpiResponse,
  projectResponse,
  evidenceResponse,
  comparisonResponse,
  uncertainResponse,
  conversationExample,
  handleAction,
};
