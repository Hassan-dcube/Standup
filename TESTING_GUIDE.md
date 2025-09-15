# Testing Guide for New Features

## 🎯 Overview
This guide shows you how to test the three major features we implemented:

1. **Data Model** (Prompt 1) - New database tables for project tracking
2. **CRUD + RBAC** (Prompt 2) - REST endpoints with role-based access
3. **LLM Progress Engine** (Prompt 3) - AI-powered task progress analysis

## 🚀 Quick Start

### 1. Access the Application
- **Frontend**: http://localhost:4174
- **Backend**: http://localhost:4000
- **Prisma Studio**: http://localhost:5555 (if running)

### 2. Login as Manager
- Use Hassan's credentials to get manager access
- This gives you full CRUD permissions

## 📊 Testing the Data Model (Prompt 1)

### Option A: Prisma Studio (Visual)
```bash
cd timesheet-backend-starter
npx prisma studio
```
Then visit http://localhost:5555 to see:
- ✅ `Project` table
- ✅ `Sprint` table  
- ✅ `Task` table
- ✅ `ProjectMember` table
- ✅ `TaskAssignee` table
- ✅ `TaskProgress` table

### Option B: Database Query
```bash
psql postgres://postgres:password@localhost:5432/your_db_name
\dt
```

## 🔧 Testing CRUD Endpoints (Prompt 2)

### Get Authentication Token
1. Login through the frontend
2. Open browser dev tools → Network tab
3. Find any API request and copy the `Authorization: Bearer <token>`

### Test with curl (replace YOUR_TOKEN)
```bash
# List Projects
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/projects

# Create Project
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"Testing"}' \
  http://localhost:4000/api/projects

# List Sprints
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/sprints

# Create Sprint
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sprint 1","projectId":"PROJECT_ID","startDate":"2025-01-01","endDate":"2025-01-14"}' \
  http://localhost:4000/api/sprints

# List Tasks
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/tasks

# Create Task
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","description":"Testing task","sprintId":"SPRINT_ID","status":"TODO"}' \
  http://localhost:4000/api/tasks
```

### Test RBAC (Role-Based Access Control)
```bash
# Without token (should fail)
curl http://localhost:4000/api/projects
# Expected: {"error":"missing token"}

# With employee token (should have limited access)
curl -H "Authorization: Bearer EMPLOYEE_TOKEN" http://localhost:4000/api/projects
# Expected: Limited to read-only access
```

## 🤖 Testing LLM Progress Engine (Prompt 3)

### Prerequisites
1. **Ollama must be running** with Llama 3B model:
```bash
ollama serve
ollama pull llama3.2:3b
```

2. **Database must have**:
   - Tasks with assignees
   - Standup data from the last 7-10 days
   - pgvector extension enabled

### Test Progress Analysis
```bash
# Analyze specific task
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"taskId":"TASK_ID"}' \
  http://localhost:4000/api/progress/analyze

# Analyze all tasks in a project
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"PROJECT_ID"}' \
  http://localhost:4000/api/progress/analyze
```

### Expected Response
```json
{
  "taskId": "task_123",
  "progress": {
    "percent": 0.75,
    "status": "DOING",
    "confidence": 0.8,
    "summary": "Task is progressing well based on standup updates mentioning 'completed the API integration' and 'working on frontend components'"
  }
}
```

## 🧪 Automated Testing

### Run the Test Script
```bash
cd timesheet-backend-starter
node test-new-features.js
```

This will test:
- ✅ All endpoints exist and are protected
- ✅ RBAC is working
- ✅ Progress engine endpoint is accessible

## 🔍 Frontend Testing

### 1. Project Management
- Navigate to Dashboard
- Look for new project-related UI elements
- Test creating/editing projects (manager only)

### 2. Task Tracking
- Check if tasks appear in the UI
- Verify task status updates
- Test progress indicators

### 3. AI Progress Analysis
- Look for progress analysis features
- Test the "Analyze Progress" buttons
- Verify AI-generated summaries

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Backend needs to be rebuilt: `npm run build`

2. **Database connection errors**
   - Check if PostgreSQL is running
   - Verify DATABASE_URL in environment

3. **Ollama not responding**
   - Start Ollama: `ollama serve`
   - Pull model: `ollama pull llama3.2:3b`

4. **Authentication errors**
   - Make sure you're logged in
   - Check if token is expired
   - Verify user has correct role

### Debug Commands
```bash
# Check backend logs
cd timesheet-backend-starter
npm start

# Check database connection
npx prisma db push

# Test Ollama
curl http://localhost:11434/api/tags
```

## 📈 Success Criteria

### ✅ Data Model (Prompt 1)
- [ ] All 6 new tables exist in database
- [ ] Relationships are properly set up
- [ ] Enums are working (ProjectStatus, TaskStatus, etc.)

### ✅ CRUD + RBAC (Prompt 2)
- [ ] All endpoints respond correctly
- [ ] Manager can create/update/delete
- [ ] Students can only read and update their tasks
- [ ] Proper validation and error handling

### ✅ LLM Progress Engine (Prompt 3)
- [ ] Progress analysis returns valid JSON
- [ ] Confidence scores are reasonable (0-1)
- [ ] Status updates are accurate
- [ ] Summaries cite actual standup evidence

## 🎉 Next Steps

Once testing is complete:
1. **Seed more realistic data** for better testing
2. **Add frontend UI** for the new features
3. **Implement progress visualization** charts
4. **Add notification system** for progress updates
5. **Create project dashboards** with task tracking
