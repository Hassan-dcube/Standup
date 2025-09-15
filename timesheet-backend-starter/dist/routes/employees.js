import { Router } from 'express';
import { prisma } from '../db.js';
import { z } from 'zod';
const router = Router();
// Get all employees with their projects, tasks, and standups
router.get('/', async (req, res) => {
    try {
        const employees = await prisma.user.findMany({
            where: {
                role: {
                    in: ['EMPLOYEE', 'MANAGER', 'PROGRAMME_MANAGER']
                }
            },
            include: {
                projectMemberships: {
                    include: {
                        project: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                taskAssignments: {
                    include: {
                        task: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                                projectId: true,
                                project: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                },
                sessions: {
                    take: 10,
                    orderBy: {
                        date: 'desc'
                    },
                    include: {
                        project: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Transform the data to match the frontend interface
        const transformedEmployees = employees.map(employee => ({
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            createdAt: employee.createdAt.toISOString(),
            projects: employee.projectMemberships.map((member) => ({
                id: member.project.id,
                name: member.project.name,
                role: member.role
            })),
            tasks: employee.taskAssignments.map((assignment) => ({
                id: assignment.task.id,
                title: assignment.task.title,
                status: assignment.task.status,
                projectId: assignment.task.projectId,
                projectName: assignment.task.project.name
            })),
            standups: employee.sessions.map((session) => ({
                id: session.id,
                date: session.date.toISOString(),
                state: session.state,
                projectName: session.project?.name
            }))
        }));
        res.json({ employees: transformedEmployees });
    }
    catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});
// Add new employee
router.post('/', async (req, res) => {
    try {
        const body = z.object({
            name: z.string().min(1),
            email: z.string().email(),
            role: z.enum(['EMPLOYEE', 'MANAGER', 'PROGRAMME_MANAGER']),
            orgId: z.string()
        }).parse(req.body);
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: body.email }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const employee = await prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                role: body.role,
                orgId: body.orgId
            }
        });
        res.json({ employee });
    }
    catch (error) {
        console.error('Error creating employee:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input data', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to create employee' });
    }
});
// Delete employee
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Check if employee exists
        const employee = await prisma.user.findUnique({
            where: { id }
        });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        // Delete the employee (cascade will handle related records)
        await prisma.user.delete({
            where: { id }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});
// Get employee details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await prisma.user.findUnique({
            where: { id },
            include: {
                projectMemberships: {
                    include: {
                        project: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                taskAssignments: {
                    include: {
                        task: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                                projectId: true,
                                project: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                },
                sessions: {
                    take: 20,
                    orderBy: {
                        date: 'desc'
                    },
                    include: {
                        project: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        // Transform the data
        const transformedEmployee = {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            createdAt: employee.createdAt.toISOString(),
            projects: employee.projectMemberships.map((member) => ({
                id: member.project.id,
                name: member.project.name,
                role: member.role
            })),
            tasks: employee.taskAssignments.map((assignment) => ({
                id: assignment.task.id,
                title: assignment.task.title,
                status: assignment.task.status,
                projectId: assignment.task.projectId,
                projectName: assignment.task.project.name
            })),
            standups: employee.sessions.map((session) => ({
                id: session.id,
                date: session.date.toISOString(),
                state: session.state,
                projectName: session.project?.name
            }))
        };
        res.json({ employee: transformedEmployee });
    }
    catch (error) {
        console.error('Error fetching employee details:', error);
        res.status(500).json({ error: 'Failed to fetch employee details' });
    }
});
export default router;
