# Testing Checklist

## Environment Setup
- [ ] `.env` file configured with all required variables
- [ ] All View IDs populated
- [ ] Dependencies installed (`npm install`)

## Airtable Connection
- [ ] Can fetch Prompt Ideas (Today's Ideas page loads)
- [ ] Can create new idea manually (Add New page works)
- [ ] Can update idea status (Approve/Decline buttons work)
- [ ] Settings page loads current settings

## Batch Generation
- [ ] Manual batch generation runs successfully
- [ ] Creates exactly {batchSize} ideas
- [ ] Ideas have Status = "Proposed"
- [ ] Ideas have Proposed By = "LLM"
- [ ] Ideas have reward estimates
- [ ] Ideas link to parent structures

## Approval Workflow
- [ ] Approving idea creates new structure
- [ ] New structure gets unique Structure ID
- [ ] Idea status updates to "Approved"
- [ ] Structure ID links back to idea
- [ ] Approved idea appears in History

## Decline Workflow
- [ ] Declining idea updates status
- [ ] Declined idea appears in History
- [ ] Feedback is saved if provided

## Email Notifications (if configured)
- [ ] Email sent when batch completes
- [ ] Email contains correct number of ideas
- [ ] Email has link to app
