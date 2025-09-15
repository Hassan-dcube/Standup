import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
const router = Router();
const prisma = new PrismaClient();
// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'proposals');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow PDF and DOC/DOCX files
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF and Word documents are allowed'));
        }
    }
});
// GET /api/projects/:id/proposals - Get all proposals for a project
router.get('/:projectId/proposals', async (req, res) => {
    try {
        // Demo mode: use hardcoded values
        const userId = 'hassan-manager';
        const orgId = 'demo-org';
        const projectId = req.params.projectId;
        const proposals = await prisma.projectProposal.findMany({
            where: { projectId },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ proposals });
    }
    catch (error) {
        console.error('Error fetching proposals:', error);
        res.status(500).json({ error: 'Failed to fetch proposals' });
    }
});
// POST /api/projects/:id/proposals - Upload a new proposal
router.post('/:projectId/proposals', upload.single('proposal'), async (req, res) => {
    try {
        // Demo mode: use hardcoded values
        const userId = 'hassan-manager';
        const orgId = 'demo-org';
        const projectId = req.params.projectId;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Verify project exists and user has access
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId } } }
                ]
            }
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found or access denied' });
        }
        const proposal = await prisma.projectProposal.create({
            data: {
                projectId,
                uploadedBy: userId,
                fileName: req.file.originalname,
                filePath: req.file.path,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.status(201).json({ proposal });
    }
    catch (error) {
        console.error('Error uploading proposal:', error);
        res.status(500).json({ error: 'Failed to upload proposal' });
    }
});
// POST /api/proposals/:id/extract - Extract details from a proposal
router.post('/:id/extract', async (req, res) => {
    try {
        // Demo mode: use hardcoded values
        const userId = 'hassan-manager';
        const orgId = 'demo-org';
        const proposalId = req.params.id;
        const proposal = await prisma.projectProposal.findFirst({
            where: {
                id: proposalId,
                project: {
                    OR: [
                        { ownerId: userId },
                        { members: { some: { userId } } }
                    ]
                }
            },
            include: {
                project: true
            }
        });
        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found or access denied' });
        }
        if (proposal.extracted) {
            return res.status(400).json({ error: 'Proposal already processed' });
        }
        // Mock extraction logic - in a real implementation, this would use AI/ML
        // to extract tasks and milestones from the document
        const mockExtractedData = {
            tasks: [
                {
                    title: "Research and Analysis",
                    description: "Conduct thorough research on the project requirements and analyze existing solutions",
                    estimatePoints: 8,
                    priority: "HIGH"
                },
                {
                    title: "Design and Planning",
                    description: "Create detailed design documents and project timeline",
                    estimatePoints: 5,
                    priority: "HIGH"
                },
                {
                    title: "Implementation Phase 1",
                    description: "Implement core functionality and basic features",
                    estimatePoints: 13,
                    priority: "MEDIUM"
                },
                {
                    title: "Testing and Quality Assurance",
                    description: "Comprehensive testing of all features and bug fixes",
                    estimatePoints: 8,
                    priority: "MEDIUM"
                },
                {
                    title: "Documentation and Deployment",
                    description: "Create user documentation and deploy to production",
                    estimatePoints: 5,
                    priority: "LOW"
                }
            ],
            milestones: [
                {
                    title: "Project Kickoff",
                    description: "Project initiation and team setup",
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
                },
                {
                    title: "Design Review",
                    description: "Review and approve design documents",
                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks from now
                },
                {
                    title: "Development Complete",
                    description: "All development work completed",
                    dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000) // 5 weeks from now
                },
                {
                    title: "Testing Complete",
                    description: "All testing and QA completed",
                    dueDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000) // 6 weeks from now
                },
                {
                    title: "Project Delivery",
                    description: "Final delivery and deployment",
                    dueDate: new Date(Date.now() + 49 * 24 * 60 * 60 * 1000) // 7 weeks from now
                }
            ],
            summary: "Extracted 5 tasks and 5 milestones from the project proposal. Tasks cover research, design, implementation, testing, and documentation phases.",
            confidence: 0.85
        };
        // Update the proposal with extracted data
        const updatedProposal = await prisma.projectProposal.update({
            where: { id: proposalId },
            data: {
                extracted: true,
                extractedAt: new Date(),
                extractedData: mockExtractedData
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.json({
            proposal: updatedProposal,
            extractedData: mockExtractedData
        });
    }
    catch (error) {
        console.error('Error extracting proposal details:', error);
        res.status(500).json({ error: 'Failed to extract proposal details' });
    }
});
// DELETE /api/proposals/:id - Delete a proposal
router.delete('/:id', async (req, res) => {
    try {
        // Demo mode: use hardcoded values
        const userId = 'hassan-manager';
        const orgId = 'demo-org';
        const proposalId = req.params.id;
        const proposal = await prisma.projectProposal.findFirst({
            where: {
                id: proposalId,
                project: {
                    OR: [
                        { ownerId: userId },
                        { members: { some: { userId } } }
                    ]
                }
            }
        });
        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found or access denied' });
        }
        // Delete the file from filesystem
        if (fs.existsSync(proposal.filePath)) {
            fs.unlinkSync(proposal.filePath);
        }
        // Delete from database
        await prisma.projectProposal.delete({
            where: { id: proposalId }
        });
        res.json({ message: 'Proposal deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting proposal:', error);
        res.status(500).json({ error: 'Failed to delete proposal' });
    }
});
export default router;
