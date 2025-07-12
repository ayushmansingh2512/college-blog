import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

interface Category {
    id: number;
    name: string;
}

const ResourceCategoryManagement: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<Category[]>('/resource-categories/');
            setCategories(response.data);
        } catch (err: any) {
            console.error('Error fetching resource categories:', err);
            setError(`Failed to load resource categories: ${err.response?.data?.detail || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('You must be logged in to add a category.');
            navigate('/login');
            return;
        }
        if (!newCategoryName.trim()) {
            alert('Category name cannot be empty.');
            return;
        }
        try {
            const response = await api.post<Category>(
                '/resource-categories/',
                { name: newCategoryName },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.status === 200) {
                alert('Resource category added successfully!');
                setNewCategoryName('');
                fetchCategories(); // Refresh the list
            }
        } catch (err: any) {
            console.error('Error adding resource category:', err);
            alert(`Failed to add resource category: ${err.response?.data?.detail || 'Unknown error'}`);
        }
    };

    if (loading) {
        return <div className="container mt-4">Loading resource categories...</div>;
    }

    if (error) {
        return <div className="container mt-4 text-danger">{error}</div>;
    }

    return (
        <div className="container mt-4">
            <h2>Resource Category Management</h2>
            <form onSubmit={handleAddCategory} className="mb-4">
                <div className="mb-3">
                    <label htmlFor="newCategory" className="form-label">Add New Resource Category</label>
                    <input
                        type="text"
                        className="form-control"
                        id="newCategory"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter category name"
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Add Category</button>
            </form>
            <h3>Existing Resource Categories</h3>
            {categories.length > 0 ? (
                <ul className="list-group">
                    {categories.map((category) => (
                        <li key={category.id} className="list-group-item d-flex justify-content-between align-items-center">
                            {category.name}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No resource categories found.</p>
            )}
            <button onClick={() => navigate('/resources')} className="btn btn-secondary mt-3">Back to Resources</button>
        </div>
    );
};

export default ResourceCategoryManagement;
