import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', status: 'active' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            if (res.data.success) setProjects(res.data.data.projects);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/projects', newProject);
            if (res.data.success) {
                setShowModal(false);
                setNewProject({ name: '', description: '', status: 'active' });
                fetchProjects();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating project');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="title">Projects</h2>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    + New Project
                </button>
            </div>

            <div className="grid-3">
                {projects.map(project => (
                    <div key={project.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{project.name}</h3>
                            <span className={`badge badge-${project.status}`}>{project.status}</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', flex: 1, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            {project.description || 'No description provided.'}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                            <span>{project.taskCount} tasks</span>
                            <Link to={`/projects/${project.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                                View Details
                            </Link>
                        </div>
                    </div>
                ))}
                {projects.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                        No projects found. Create one to get started.
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="title" style={{ fontSize: '1.5rem' }}>Create New Project</h2>
                        <form onSubmit={handleCreate}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Project Name</label>
                            <input 
                                className="input-field" 
                                required 
                                value={newProject.name} 
                                onChange={e => setNewProject({...newProject, name: e.target.value})} 
                            />
                            
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description</label>
                            <textarea 
                                className="input-field" 
                                rows="3" 
                                value={newProject.description} 
                                onChange={e => setNewProject({...newProject, description: e.target.value})} 
                            />
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
