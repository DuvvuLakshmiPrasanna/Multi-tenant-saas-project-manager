import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '' });
    const [editingTask, setEditingTask] = useState(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [projRes, taskRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/projects/${id}/tasks`)
            ]);
            if (projRes.data.success) setProject(projRes.data.data);
            if (taskRes.data.success) setTasks(taskRes.data.data.tasks);
        } catch (err) {
            console.error(err);
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newTask };
            if (editingTask) {
                await api.put(`/tasks/${editingTask.id}`, payload);
            } else {
                await api.post(`/projects/${id}/tasks`, payload);
            }
            setShowTaskModal(false);
            setEditingTask(null);
            setNewTask({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '' });
            fetchData();
        } catch (err) {
            alert('Error saving task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            fetchData();
        } catch (err) {
            alert('Error deleting task');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
            // Optimistic update
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        } catch (err) {
            alert('Error updating status');
        }
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setNewTask({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            status: task.status,
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
        });
        setShowTaskModal(true);
    };

    if (loading) return <div>Loading...</div>;

    const StatusColumn = ({ title, status, color }) => (
        <div style={{ flex: 1, minWidth: '300px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: color, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', fontWeight: 700 }}>{title} ({tasks.filter(t => t.status === status).length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tasks.filter(t => t.status === status).map(task => (
                    <div key={task.id} className="card" style={{ padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                            <div style={{ gap: '0.5rem' }}>
                                <button onClick={() => openEditModal(task)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }} className="btn-icon">✎</button>
                                <button onClick={() => handleDeleteTask(task.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginLeft: '0.5rem' }} className="btn-icon">×</button>
                            </div>
                        </div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{task.title}</h4>
                        {task.assignedTo && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                Assigned: {task.assignedTo.fullName}
                            </div>
                        )}
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {status !== 'todo' && <button onClick={() => handleStatusChange(task.id, 'todo')} className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>← Todo</button>}
                            {status !== 'in_progress' && <button onClick={() => handleStatusChange(task.id, 'in_progress')} className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>In Progress</button>}
                            {status !== 'completed' && <button onClick={() => handleStatusChange(task.id, 'completed')} className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>Done →</button>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '0.5rem', padding: 0 }} className="btn-link">← Back to Projects</button>
                        <h2 className="title">{project?.name}</h2>
                    </div>
                    <button onClick={() => { setEditingTask(null); setNewTask({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '' }); setShowTaskModal(true); }} className="btn btn-primary">
                        + Add Task
                    </button>
                </div>
                <p className="subtitle">{project?.description}</p>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                <StatusColumn title="To Do" status="todo" color="#8b949e" />
                <StatusColumn title="In Progress" status="in_progress" color="#d29922" />
                <StatusColumn title="Completed" status="completed" color="#238636" />
            </div>

            {/* Task Modal */}
            {showTaskModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="title" style={{ fontSize: '1.5rem' }}>{editingTask ? 'Edit Task' : 'New Task'}</h2>
                        <form onSubmit={handleCreateTask}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Title</label>
                            <input className="input-field" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                            
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description</label>
                            <textarea className="input-field" rows="3" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Priority</label>
                                    <select className="input-field" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Due Date</label>
                                    <input type="date" className="input-field" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowTaskModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;
