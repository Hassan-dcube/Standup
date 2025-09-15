# StandupFlow System Architecture - DiagramGPT Prompt

## Complete System Flow Diagram

Create a comprehensive system architecture diagram for StandupFlow, an AI-powered project management platform. Show the complete data flow from user input to AI analysis to dashboard insights.

### System Components:

**Frontend Layer (React/TypeScript):**
- User Authentication (Login/Logout)
- Role-Based Dashboards (Manager/Employee views)
- Standup Submission Interface (4 questions: yesterday's work, today's plan, blockers, help needed)
- Project Management Interface (create projects, add tasks, assign members)
- Calendar View (standup history, clickable days)
- Real-time Progress Bars and Charts
- Proposal Upload Interface (PDF/Word document upload)
- Task Management (create, edit, delete tasks)
- Member Management (add/remove project members)

**Backend API Layer (Node.js/Express):**
- Authentication Service (JWT tokens, role-based access)
- Standup API (/api/standups - submit, history, calendar)
- Project API (/api/projects - CRUD operations, member management)
- Task API (/api/tasks - CRUD operations, assignment)
- Proposal API (/api/proposals - upload, extract details)
- Progress API (/api/progress - LLM assessment, aggregation)
- User API (/api/users - user management)

**AI/ML Processing Layer:**
- LLM Assessor Engine (analyzes standup responses)
- Progress Calculation Engine (weighted averages, smoothing)
- Document Processing Engine (extract tasks/milestones from proposals)
- RAG (Retrieval-Augmented Generation) System
- Confidence Scoring System
- Risk Detection Engine (blockers, stale progress)

**Database Layer (PostgreSQL/Prisma):**
- Users Table (id, name, email, role, orgId)
- Projects Table (id, name, description, status, ownerId, progressCached, settings)
- ProjectMembers Table (projectId, userId, role)
- Tasks Table (id, title, description, status, estimatePoints, projectId)
- TaskAssignees Table (taskId, userId)
- TaskProgress Table (id, taskId, source, percent, status, confidence, summary)
- StandupSessions Table (id, userId, date, state)
- StandupResponses Table (id, sessionId, questionId, answerText)
- ProjectProposals Table (id, projectId, fileName, filePath, extracted, extractedData)
- ActivityLog Table (id, actorId, action, details)

**External Services:**
- File Storage (local filesystem for proposals)
- Multer (file upload handling)
- JWT Authentication
- Cron Jobs (nightly batch processing)

### Data Flow Sequence:

1. **User Authentication Flow:**
   - User logs in → JWT token generated → Role-based access granted
   - Manager sees Projects page first, Employee sees Standup page first

2. **Standup Submission Flow:**
   - Employee submits standup (4 questions) → StandupSession created → StandupResponses stored
   - Trigger: LLM Assessor analyzes responses → TaskProgress records created
   - Trigger: Project aggregation recalculates → Project.progressCached updated
   - Real-time dashboard updates

3. **Project Management Flow:**
   - Manager creates project → Project record created → Members added
   - Tasks created and assigned → TaskAssignee records created
   - Progress tracking begins

4. **Proposal Processing Flow:**
   - User uploads PDF/Word proposal → File stored → ProjectProposal record created
   - "Extract Details" clicked → AI processes document → Tasks and milestones extracted
   - Extracted data stored in ProjectProposal.extractedData

5. **Progress Calculation Flow:**
   - Standup responses → RAG system retrieves relevant context
   - LLM Assessor analyzes text → Progress percentage calculated
   - Confidence scoring applied → TaskProgress record created
   - Project aggregation (weighted average) → Smoothing applied → Project progress updated

6. **Dashboard Updates:**
   - Real-time progress bars
   - Risk indicators (blockers, stale progress)
   - Historical charts and trends
   - Calendar view with standup status

### Key Features to Highlight:

- **AI-Powered Analysis**: Show LLM processing standup text
- **Real-time Updates**: Show data flowing to dashboards
- **Role-Based Access**: Different views for managers vs employees
- **Document Intelligence**: Proposal upload and extraction
- **Progress Tracking**: From standup to project progress
- **Risk Management**: Blocker detection and alerts
- **Historical Analysis**: Trend tracking and forecasting

### Visual Elements:

- Use different colors for different layers (Frontend=Blue, Backend=Green, AI=Purple, Database=Orange)
- Show data flow arrows with labels
- Include user personas (Manager, Employee)
- Show real-time vs batch processing
- Highlight AI/ML components prominently
- Include sample data examples
- Show the complete user journey from login to insights

### Technical Details to Include:

- Database relationships and foreign keys
- API endpoint structure
- Authentication flow
- File upload process
- AI processing pipeline
- Real-time vs scheduled updates
- Error handling and logging
- Scalability considerations

Create a detailed, professional diagram that shows how StandupFlow transforms daily standups into intelligent project insights through AI automation.
