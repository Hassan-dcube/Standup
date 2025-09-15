# QA Scenarios & Acceptance Tests Guide

## 🎯 Overview
This guide provides step-by-step instructions to test all critical scenarios and ensure quality before scaling.

## 🔧 Prerequisites
1. **Backend running** on http://localhost:4000
2. **Frontend running** on http://localhost:4174
3. **Ollama running** with Llama 3B model
4. **Database seeded** with test data
5. **Manager and student accounts** available

## 📋 Test Scenarios

### Scenario 1: No Task Mentions → percent=0, low confidence

**Objective**: Verify that tasks not mentioned in standups get 0% progress with low confidence.

**Steps**:
1. Login as a student (e.g., Fawad or Hira)
2. Go to Standup page
3. Submit a standup with generic text like: "Working on various tasks today, no specific progress to report"
4. **Expected Result**: 
   - Task progress should remain at 0%
   - Confidence should be low (< 0.5)
   - Status should remain TODO

**Verification**:
- Check project progress bar doesn't increase
- Check task details show 0% progress
- Check AI summary indicates no specific task mentions

---

### Scenario 2: Clear Completion Mention → percent=1, status=DONE

**Objective**: Verify that clear completion mentions result in 100% progress and DONE status.

**Steps**:
1. Login as a student assigned to a specific task
2. Go to Standup page
3. Submit a standup with clear completion language:
   ```
   "Completed the [Task Name] today. All requirements are done and tested. 
   Ready for review and deployment."
   ```
4. **Expected Result**:
   - Task progress should jump to 100%
   - Status should change to DONE
   - Confidence should be high (> 0.8)
   - AI summary should cite completion evidence

**Verification**:
- Check task status changed to DONE
- Check project progress bar increased significantly
- Check AI summary mentions completion keywords

---

### Scenario 3: Blocker Mention → status=BLOCKED, limited growth

**Objective**: Verify that blocker mentions result in BLOCKED status with limited progress growth.

**Steps**:
1. Login as a student assigned to a task
2. Go to Standup page
3. Submit a standup with blocker language:
   ```
   "Blocked on [Task Name]. Waiting for API access from the backend team. 
   Cannot proceed until this dependency is resolved."
   ```
4. **Expected Result**:
   - Task status should change to BLOCKED
   - Progress should be limited (< 30%)
   - Confidence should be moderate
   - AI summary should identify blocker evidence

**Verification**:
- Check task status changed to BLOCKED
- Check project progress growth is limited
- Check blocker appears in "Top Blockers" analytics
- Check blocker quotes are captured

---

### Scenario 4: Vague Mentions → small increases with low confidence

**Objective**: Verify that vague mentions result in small progress increases with low confidence.

**Steps**:
1. Login as a student assigned to a task
2. Go to Standup page
3. Submit a standup with vague language:
   ```
   "Made some progress on [Task Name]. Still working on it, should be done soon."
   ```
4. **Expected Result**:
   - Progress should increase slightly (0-50%)
   - Confidence should be low (< 0.7)
   - Status should remain DOING
   - AI summary should indicate uncertainty

**Verification**:
- Check progress increased but not dramatically
- Check confidence is appropriately low
- Check AI summary reflects uncertainty

---

### Scenario 5: Manual Override → UI shows override, aggregation respects it

**Objective**: Verify that manual overrides are properly displayed and respected in aggregation.

**Steps**:
1. Login as a manager (Hassan)
2. Go to Projects page
3. Click on a project to view details
4. Find a task and click the edit (pencil) icon
5. In the Manual Override dialog:
   - Set progress to 75%
   - Set status to DOING
   - Add reason: "Manual override for testing"
6. Save the override
7. **Expected Result**:
   - Task card should show "MANUAL" badge
   - Progress should show 75%
   - Project progress bar should update
   - Override should be visible in task details

**Verification**:
- Check task card shows MANUAL source badge
- Check project progress bar reflects the override
- Check task details show override information
- Check override appears in analytics

---

### Scenario 6: Aggregation Weights by Changing Estimate Points

**Objective**: Verify that changing estimate points affects project progress aggregation.

**Steps**:
1. Login as a manager
2. Go to Projects page
3. Select a project with multiple tasks
4. Note the current project progress percentage
5. Edit a task and change its estimate points (e.g., from 5 to 10)
6. Save the change
7. Check project progress again
8. **Expected Result**:
   - Project progress should change based on new weights
   - Higher estimate point tasks should have more influence
   - Progress bar should reflect the weighted average

**Verification**:
- Check project progress percentage changed
- Verify the change makes sense with new weights
- Check that higher-point tasks have more influence

---

### Scenario 7: RBAC - Students Cannot Modify Unrelated Tasks

**Objective**: Verify that students cannot modify tasks they're not assigned to.

**Steps**:
1. Login as a student (e.g., Fawad)
2. Try to access a task assigned to another student (e.g., Hira's task)
3. Try to edit the task or change its status
4. **Expected Result**:
   - Access should be denied (403 Forbidden)
   - Student should only see their own assigned tasks
   - No unauthorized modifications should be possible

**Verification**:
- Check that unauthorized access is blocked
- Verify students only see their assigned tasks
- Confirm no unauthorized changes are possible

---

### Scenario 8: Manager Override Permissions

**Objective**: Verify that managers can override any task.

**Steps**:
1. Login as a manager (Hassan)
2. Go to Projects page
3. Try to override tasks assigned to different students
4. **Expected Result**:
   - Manager should be able to override any task
   - All override options should be available
   - Changes should be applied successfully

**Verification**:
- Check manager can access all tasks
- Verify override functionality works for all tasks
- Confirm changes are applied and visible

---

## 🔍 Analytics Verification

### What Moved Yesterday
1. Submit standups with positive progress mentions
2. Check "What Moved Yesterday" card on dashboard
3. Verify tasks with biggest positive changes appear
4. Check evidence is cited correctly

### Top Blockers
1. Submit standups with blocker mentions
2. Check "Top Blockers" card on dashboard
3. Verify blocked tasks appear with quotes
4. Check days blocked calculation

### At Risk This Week
1. Create tasks due within 7 days with low progress
2. Check "At Risk This Week" card on dashboard
3. Verify risk level calculation (HIGH/MEDIUM/LOW)
4. Check days until due calculation

---

## ✅ Acceptance Criteria

All scenarios must pass with:

1. **Visible Outcomes**: All changes should be visible in the UI
2. **Auditable Results**: All actions should be logged and traceable
3. **No Unauthorized Actions**: RBAC should prevent unauthorized access
4. **Correct Aggregation**: Project progress should reflect task weights
5. **Manual Override Respect**: Manual overrides should take precedence
6. **AI Analysis Accuracy**: LLM analysis should match expected patterns
7. **Circuit Breaker Function**: System should handle failures gracefully
8. **Logging Completeness**: All operations should be properly logged

---

## 🚨 Failure Scenarios

If any test fails:

1. **Check Logs**: Review server logs for errors
2. **Verify Data**: Ensure test data is properly seeded
3. **Check Services**: Verify Ollama and database are running
4. **Review Permissions**: Check JWT tokens and RBAC setup
5. **Test Manually**: Try the scenario manually in the UI

---

## 📊 Test Results Template

```
QA Test Results - [Date]

Scenario 1 - No Mentions: ✅ PASS / ❌ FAIL
Scenario 2 - Completion: ✅ PASS / ❌ FAIL  
Scenario 3 - Blockers: ✅ PASS / ❌ FAIL
Scenario 4 - Vague: ✅ PASS / ❌ FAIL
Scenario 5 - Manual Override: ✅ PASS / ❌ FAIL
Scenario 6 - Aggregation Weights: ✅ PASS / ❌ FAIL
Scenario 7 - RBAC Protection: ✅ PASS / ❌ FAIL
Scenario 8 - Manager Override: ✅ PASS / ❌ FAIL

Overall: X/8 tests passed

Notes:
- [Any issues found]
- [Any recommendations]
- [Ready for scaling: Yes/No]
```

---

## 🎯 Success Criteria

The system is ready for scaling when:
- ✅ All 8 scenarios pass
- ✅ No unauthorized actions are possible
- ✅ All outcomes are visible and auditable
- ✅ Performance is acceptable
- ✅ Error handling works correctly
- ✅ Logging is comprehensive
