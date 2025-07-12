import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
 

interface Category {
    id: number;
    name: string;
}

interface Post {
    id: number;
    title: string;
    content: string;
    owner_id: number;
    image_url?: string;
    category_id?: number;
    category?: Category;
}

const EditPost: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                alert('You must be logged in to edit a post.');
                navigate('/login');
                return;
            }

            try {
                const categoriesResponse = await api.get<Category[]>('/post-categories/');
                setCategories(categoriesResponse.data);

                const postResponse = await api.get<Post>(`/posts/${postId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setTitle(postResponse.data.title);
                setContent(postResponse.data.content);
                setCurrentImageUrl(postResponse.data.image_url || null);
                setSelectedCategoryId(postResponse.data.category_id || null);
            } catch (err: any) {
                console.error('Error fetching data for editing:', err);
                setError(`Failed to load data: ${err.response?.data?.detail || 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [postId, navigate]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        } else {
            setSelectedFile(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('You must be logged in to update a post.');
            navigate('/login');
            return;
        }

        let imageUrlToSave: string | null = currentImageUrl;

        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);

            try {
                const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/uploadfile/`, {
                    method: 'POST',
                    body: formData,
                });

                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    imageUrlToSave = uploadData.url;
                } else {
                    const errorData = await uploadResponse.json();
                    alert(`Error uploading new image: ${errorData.detail || 'Unknown error'}`);
                    return;
                }
            } catch (error) {
                console.error('Failed to upload new image:', error);
                alert('Failed to upload new image. See console for details.');
                return;
            }
        }

        try {
            const response = await api.put(
                `/posts/${postId}/`,
                { title, content, image_url: imageUrlToSave, category_id: selectedCategoryId },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                alert('Post updated successfully!');
                navigate('/profile');
            } else {
                const errorData = response.data;
                alert(`Error updating post: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error: any) {
            console.error('Failed to update post:', error);
            alert(`Failed to update post. ${error.response?.data?.detail || 'See console for details.'}`);
        }
    };

    if (loading) {
        return <div className="loading">Loading post...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="edit-post-container">
            <h2>Edit Post</h2>
            <form onSubmit={handleSubmit} className="edit-post-form">
                <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input
                        type="text"
                        className="form-input"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="content">Content</label>
                    <textarea
                        className="form-textarea"
                        id="content"
                        rows={5}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="image">Change Image (Optional)</label>
                    {currentImageUrl && (
                        <div className="image-preview">
                            <p>Current Image:</p>
                            <img src={`${import.meta.env.VITE_API_URL}${currentImageUrl}`} alt="Current Post" />
                        </div>
                    )}
                    <input
                        type="file"
                        className="form-file"
                        id="image"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="category">Category (Optional)</label>
                    <select
                        className="form-select"
                        id="category"
                        value={selectedCategoryId || ''}
                        onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                    >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-buttons">
                    <button type="submit" className="btn btn-primary">Update Post</button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/profile')}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default EditPost;