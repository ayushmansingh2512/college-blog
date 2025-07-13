import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface Category {
    id: number;
    name: string;
}

const CreatePost: React.FC = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/post-categories/');
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data);
                } else {
                    console.error('Failed to fetch categories');
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedFile(file);
            
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        } else {
            setSelectedFile(null);
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('You must be logged in to create a post.');
            navigate('/login');
            setIsSubmitting(false);
            return;
        }

        let imageUrl: string | null = null;

        // If a file is selected, upload it first
        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);

            try {
                const uploadResponse = await api.post('/uploadfile/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    imageUrl = uploadData.url;
                } else {
                    const uploadErrorData = uploadResponse.data;
                    alert(`Error uploading image: ${uploadErrorData.detail || 'Unknown error'}`);
                    setIsSubmitting(false);
                    return;
                }
            } catch (error) {
                console.error('Failed to upload image:', error);
                alert('Failed to upload image. See console for details.');
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const response = await api.post('/posts/', {
                title,
                content,
                image_url: imageUrl,
                category_id: selectedCategoryId,
            });

            if (response.status === 200) {
                alert('Post created successfully!');
                navigate('/');
            } else {
                const errorData = response.data;
                alert(`Error creating post: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to create post:', error);
            alert('Failed to create post. See console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#ffffff',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* Header */}
            <header style={{ 
                backgroundColor: "#ffffff",
                padding: '1.5rem 0',
                marginBottom: '2rem',
                borderBottom: '1px solid #e5e7eb'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
                    <h1 style={{ 
                        fontSize: '2rem', 
                        fontWeight: '700',
                        color: '#222222',
                        margin: 0,
                        textAlign: 'center'
                    }}>
                        Create New Post
                    </h1>
                </div>
            </header>

            {/* Main Content */}
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
                <form onSubmit={handleSubmit} style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb'
                }}>
                    {/* Title Field */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="title" style={{ 
                            display: 'block',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#222222',
                            marginBottom: '0.5rem'
                        }}>
                            Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: '1rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                outline: 'none',
                                transition: 'border-color 0.2s ease',
                                fontFamily: 'inherit'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            placeholder="Enter your post title..."
                        />
                    </div>

                    {/* Content Field */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="content" style={{ 
                            display: 'block',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#222222',
                            marginBottom: '0.5rem'
                        }}>
                            Content *
                        </label>
                        <textarea
                            id="content"
                            rows={8}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: '1rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                outline: 'none',
                                transition: 'border-color 0.2s ease',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                minHeight: '150px'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            placeholder="Write your post content..."
                        />
                    </div>

                    {/* Image Upload Field */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="image" style={{ 
                            display: 'block',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#222222',
                            marginBottom: '0.5rem'
                        }}>
                            Upload Image (Optional)
                        </label>
                        
                        <div style={{
                            border: '2px dashed #d1d5db',
                            borderRadius: '8px',
                            padding: '1.5rem',
                            textAlign: 'center',
                            backgroundColor: '#f9fafb',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderColor = '#6366f1';
                            e.currentTarget.style.backgroundColor = '#f0f9ff';
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                        }}
                        onClick={() => document.getElementById('image')?.click()}>
                            <input
                                type="file"
                                id="image"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            
                            {imagePreview ? (
                                <div>
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        style={{
                                            maxWidth: '200px',
                                            maxHeight: '200px',
                                            borderRadius: '8px',
                                            marginBottom: '1rem',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    <p style={{ 
                                        color: '#6b7280',
                                        fontSize: '0.875rem',
                                        margin: 0
                                    }}>
                                        Click to change image
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div style={{
                                        fontSize: '3rem',
                                        color: '#d1d5db',
                                        marginBottom: '1rem'
                                    }}>
                                        📷
                                    </div>
                                    <p style={{ 
                                        color: '#6b7280',
                                        fontSize: '1rem',
                                        margin: 0
                                    }}>
                                        Click to upload or drag and drop an image
                                    </p>
                                    <p style={{ 
                                        color: '#9ca3af',
                                        fontSize: '0.875rem',
                                        margin: '0.5rem 0 0 0'
                                    }}>
                                        PNG, JPG, GIF up to 10MB
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Category Field */}
                    <div style={{ marginBottom: '2rem' }}>
                        <label htmlFor="category" style={{ 
                            display: 'block',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#222222',
                            marginBottom: '0.5rem'
                        }}>
                            Category (Optional)
                        </label>
                        <select
                            id="category"
                            value={selectedCategoryId || ''}
                            onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: '1rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                outline: 'none',
                                transition: 'border-color 0.2s ease',
                                fontFamily: 'inherit',
                                backgroundColor: 'white'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        >
                            <option value="">Select a category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Submit Button */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                fontSize: '1rem',
                                fontWeight: '500',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                backgroundColor: 'white',
                                color: '#374151',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: 'inherit'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                                e.currentTarget.style.borderColor = '#9ca3af';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                                e.currentTarget.style.borderColor = '#d1d5db';
                            }}
                        >
                            Cancel
                        </button>
                        
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                padding: '0.75rem 1.5rem',
                                fontSize: '1rem',
                                fontWeight: '500',
                                border: 'none',
                                borderRadius: '8px',
                                backgroundColor: isSubmitting ? '#9ca3af' : '#6366f1',
                                color: 'white',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.2s ease',
                                fontFamily: 'inherit',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                                if (!isSubmitting) {
                                    e.currentTarget.style.backgroundColor = '#4f46e5';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSubmitting) {
                                    e.currentTarget.style.backgroundColor = '#6366f1';
                                }
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid #ffffff',
                                        borderTop: '2px solid transparent',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    Creating...
                                </>
                            ) : (
                                'Create Post'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Add spinning animation */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default CreatePost;