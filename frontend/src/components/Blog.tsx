import { useState, useEffect, useRef } from "react"
import api from '../api';
import { Link } from "react-router-dom";
 
interface Category {
  id: number;
  name: string;
}

interface User {
  id: number;
  email: string;
  username?: string;
}

interface Bookmark {
  id: number;
  user_id: number;
  post_id: number;
  created_at: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  owner_id: number;
  created_at: string;
  image_url?: string;
  category?: Category;
  bookmarks: Bookmark[];
  bookmarked?: boolean;
  truncatedContent?: string;
  owner: User;
}

const Blog = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userBookmarks, setUserBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const dateFilterRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const truncateContent = (text: string, maxLength: number) => {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  };

  const handleCardClick = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (!isDateFilterOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setIsDateFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDateFilterOpen]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);

    let postsUrl = `/posts/`;
    const params = new URLSearchParams();
    if (selectedCategory !== null) {
      params.append('category_id', selectedCategory.toString());
    }
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    if (params.toString()) {
      postsUrl += `?${params.toString()}`;
    }

    const fetchPosts = api.get(postsUrl);
    const fetchBookmarks = token ? api.get('/bookmarks/', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }) : Promise.resolve({ data: [] });
    const fetchCategories = api.get('/post-categories/');

    Promise.all([fetchPosts, fetchBookmarks, fetchCategories])
      .then(([postsResponse, bookmarksResponse, categoriesResponse]) => {
        let fetchedPosts: Post[] = postsResponse.data;
        const fetchedBookmarks: Bookmark[] = bookmarksResponse.data;
        const fetchedCategories: Category[] = categoriesResponse.data;

        setUserBookmarks(fetchedBookmarks);
        setCategories(fetchedCategories);

        // Sort posts by created_at in descending order (latest first)
        const sortedPosts = fetchedPosts.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        const postsWithBookmarkStatus = sortedPosts.map(post => ({
          ...post,
          bookmarked: fetchedBookmarks.some(bookmark => bookmark.post_id === post.id),
          truncatedContent: truncateContent(post.content, 50)
        }));
        setPosts(postsWithBookmarkStatus);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
      });
  }, [isLoggedIn, selectedCategory, startDate, endDate, searchTerm]);

  const handleBookmarkToggle = async (postId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert("Please log in to bookmark posts.");
      return;
    }

    const isBookmarked = userBookmarks.some(bookmark => bookmark.post_id === postId);
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      if (isBookmarked) {
        const bookmarkToRemove = userBookmarks.find(bookmark => bookmark.post_id === postId);
        if (bookmarkToRemove) {
          await api.delete(`/bookmarks/${bookmarkToRemove.id}`, { headers });
          setUserBookmarks(prev => prev.filter(b => b.id !== bookmarkToRemove.id));
          setPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarked: false } : p));
        }
      } else {
        const response = await api.post('/bookmarks/', { post_id: postId }, { headers });
        setUserBookmarks(prev => [...prev, response.data]);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarked: true } : p));
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      alert("Failed to toggle bookmark. Please try again.");
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Mobile Header - Airbnb style */}
        <header style={{ 
          backgroundColor: "#ffffff",
          padding: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid #ebebeb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {/* Search Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f7f7f7',
            borderRadius: '32px',
            padding: '12px 16px',
            border: '1px solid #dddddd',
            marginBottom: '16px'
          }}>
            <img 
              src="/search.svg" 
              alt="Search" 
              style={{
                width: '16px',
                height: '16px',
                marginRight: '12px',
                opacity: 0.6
              }}
            />
            <input
              type="text"
              placeholder="Search Blog by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '16px',
                outline: 'none',
                color: '#222222'
              }}
            />
          </div>

          {/* Category Marquee */}
          <div style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <style>
              {`
                .category-scroll::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: '20px',
                border: selectedCategory === null ? '2px solid #222222' : '1px solid #dddddd',
                backgroundColor: selectedCategory === null ? '#ffffff' : '#ffffff',
                color: selectedCategory === null ? '#222222' : '#717171',
                fontSize: '14px',
                fontWeight: selectedCategory === null ? '600' : '400',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  flexShrink: 0,
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: selectedCategory === category.id ? '2px solid #222222' : '1px solid #dddddd',
                  backgroundColor: '#ffffff',
                  color: selectedCategory === category.id ? '#222222' : '#717171',
                  fontSize: '14px',
                  fontWeight: selectedCategory === category.id ? '600' : '400',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </header>

        {/* Mobile Create Post Button */}
        {isLoggedIn && (
          <Link 
            to="/create-post" 
            style={{
              position: 'fixed',

              bottom: '100px',
              right: '20px',
              backgroundColor: '#3a97e3',
              color: 'white',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '300',
              textDecoration: 'none',
              boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
              zIndex: 1000,
              transition: 'all 0.2s ease'
            }}
          >
            +
          </Link>
        )}

        {/* Mobile Posts Grid */}
        <div style={{ padding: '16px' }}>
          {posts.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {posts.map(post => (
                <div 
                  key={post.id} 
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    position: 'relative'
                  }}
                  onClick={() => handleCardClick(post)}
                >
                  {/* Mobile Image Container */}
                  <div style={{
                    width: '100%',
                    height: '200px',
                    overflow: 'hidden',
                    backgroundColor: '#f7f7f7',
                    borderRadius: '12px',
                    position: 'relative',
                    marginBottom: '12px'
                  }}>
                    {post.image_url ? (
                      <img 
                        src={`${post.image_url}`} 
                        alt={post.title} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover'
                        }} 
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f7f7f7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#c7c7c7',
                        fontSize: '14px'
                      }}>
                        No Image
                      </div>
                    )}

                    {/* Mobile Bookmark Button */}
                    {isLoggedIn && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBookmarkToggle(post.id); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '20px',
                          color: post.bookmarked ? '#ff385c' : '#ffffff',
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          zIndex: 10,
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                        }}
                      >
                        {post.bookmarked ? '♥' : '♡'}
                      </button>
                    )}
                  </div>

                  {/* Mobile Content */}
                  <div style={{ padding: '0' }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600',
                      color: '#222222',
                      marginBottom: '4px',
                      margin: '0 0 4px 0',
                      lineHeight: '1.2',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {post.title}
                    </h3>
                    
                    <p style={{ 
                      fontSize: '14px',
                      color: '#717171',
                      marginBottom: '8px',
                      lineHeight: '1.3',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {post.truncatedContent}
                    </p>
                    
                    <div style={{ 
                      fontSize: '14px',
                      color: '#717171',
                      marginBottom: '8px'
                    }}>
                      {post.owner?.username || `User ID: ${post.owner_id}`}
                    </div>

                    <div style={{
                      fontSize: '14px',
                      color: '#717171',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {post.category && (
                        <>
                          <span>{post.category.name}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              backgroundColor: '#f9f9f9',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#6b7280',
                marginBottom: '1rem',
                margin: '0 0 1rem 0'
              }}>
                No posts yet
              </h3>
              <p style={{
                color: '#9ca3af',
                fontSize: '1rem',
                margin: 0
              }}>
                Add one using the API docs!
              </p>
            </div>
          )}
        </div>

        {/* Mobile Modal */}
        {isModalOpen && selectedPost && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            zIndex: 1000
          }} onClick={handleCloseModal}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px 16px 0 0',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden'
            }} onClick={(e) => e.stopPropagation()}>
              
              {/* Mobile Close Button */}
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #ebebeb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ width: '24px' }}></div>
                <div style={{
                  width: '40px',
                  height: '4px',
                  backgroundColor: '#dddddd',
                  borderRadius: '2px'
                }}></div>
                <button onClick={handleCloseModal} style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#222222',
                  padding: '0',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  ×
                </button>
              </div>

              {/* Mobile Modal Content */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px'
              }}>
                {selectedPost.image_url && (
                  <div style={{
                    width: '100%',
                    height: '250px',
                    overflow: 'hidden',
                    backgroundColor: '#f7f7f7',
                    borderRadius: '12px',
                    marginBottom: '16px'
                  }}>
                    <img
                      src={`${selectedPost.image_url}`}
                      alt={selectedPost.title}
                      style={{ 
                        width: '100%', 
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                )}

                <h1 style={{ 
                  fontSize: '24px', 
                  fontWeight: '700',
                  color: '#222222',
                  marginBottom: '12px',
                  margin: '0 0 12px 0',
                  lineHeight: '1.2'
                }}>
                  {selectedPost.title}
                </h1>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    fontSize: '16px',
                    color: '#717171',
                    fontWeight: '500'
                  }}>
                    By {selectedPost.owner?.username || `User ID: ${selectedPost.owner_id}`}
                  </span>
                  
                  {selectedPost.category && (
                    <>
                      <span style={{ color: '#ddd' }}>•</span>
                      <span style={{
                        backgroundColor: '#f0f0f0',
                        color: '#222222',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {selectedPost.category.name}
                      </span>
                    </>
                  )}
                </div>

                <div style={{
                  fontSize: '14px',
                  color: '#717171',
                  marginBottom: '16px'
                }}>
                  {new Date(selectedPost.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>

                <div style={{
                  height: '1px',
                  backgroundColor: '#e5e7eb',
                  marginBottom: '16px'
                }}></div>

                <div style={{
                  lineHeight: '1.6',
                  color: '#484848',
                  fontSize: '16px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {selectedPost.content}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout (Original - Unchanged)
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: "#f6f5f5",
        display: "flex",
        justifyContent: "center",
        padding: '1rem 0',
        marginBottom: '2rem',
        alignItems:"center",
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div className="filter-bar">
          <select
            className="search-blog"
            onChange={(e) => setSelectedCategory(e.target.value === "all" ? null : Number(e.target.value))}
            value={selectedCategory === null ? "all" : selectedCategory}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <div style={{ position: 'relative' }} ref={dateFilterRef}>
            <button 
              className="search-blog date-filter-button"
              onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
            >
              {startDate && endDate ? `From ${startDate} to ${endDate}` : "Filter by date"}
            </button>
            {isDateFilterOpen && (
              <div className="date-filter-dropdown">
                <div className="date-filter-inputs">
                  <label htmlFor="start-date">From this time</label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <label htmlFor="end-date">To this time</label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Search by title... "
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-blog search-button"
          />
<div className="search-blog ">
  <button className=" search-glass">
  <img className="search-svg" src="/search.svg" alt="Search" />
</button>
</div>

        </div>
      </header>

      {isLoggedIn && (
        <Link to="/create-post" className="create-post-button">
          +
        </Link>
      )}

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        {posts.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {posts.map(post => (
              <div key={post.id} style={{
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                position: 'relative'
              }}
              onClick={() => handleCardClick(post)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                
                {/* Image Container - Airbnb style */}
                <div style={{
                  width: '100%',
                  height: '280px',
                  overflow: 'hidden',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '12px',
                  position: 'relative',
                  marginBottom: '12px'
                }}>
                  {post.image_url ? (
                    <img 
                      src={`${post.image_url}`} 
                      alt={post.title} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }} 
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      fontSize: '1rem'
                    }}>
                      No Image
                    </div>
                  )}

                  {/* Bookmark Button */}
                  {isLoggedIn && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBookmarkToggle(post.id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        color: post.bookmarked ? '#ff385c' : '#ffffff',
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        zIndex: 10,
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                      }}
                    >
                      {post.bookmarked ? '♥' : '♡'}
                    </button>
                  )}
                </div>

                {/* Content - Airbnb style */}
                <div style={{ padding: '0' }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    color: '#222222',
                    marginBottom: '4px',
                    margin: '0 0 4px 0',
                    lineHeight: '1.2',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {post.title}
                  </h3>
                  
                  <p style={{ 
                    fontSize: '0.875rem',
                    color: '#717171',
                    marginBottom: '8px',
                    lineHeight: '1.3',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {post.truncatedContent}
                  </p>
                  
                  <div style={{ 
                    fontSize: '0.875rem',
                    color: '#717171',
                    marginBottom: '8px',
                    lineHeight: '1.3'
                  }}>
                    {post.owner?.username || `User ID: ${post.owner_id}`}
                  </div>

                  {/* Category and Date */}
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#717171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {post.category && (
                      <>
                        <span>{post.category.name}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: '#f9f9f9',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              color: '#6b7280',
              marginBottom: '1rem',
              margin: '0 0 1rem 0'
            }}>
              No posts yet
            </h3>
            <p style={{
              color: '#9ca3af',
              fontSize: '1rem',
              margin: 0
            }}>
              Add one using the API docs!
            </p>
          </div>
        )}
      </div>

      {/* Modern Modal - Airbnb style */}
      {isModalOpen && selectedPost && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={handleCloseModal}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Close Button */}
            <button onClick={handleCloseModal} style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              fontSize: '20px',
              color: '#222222',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}>
              ×
            </button>

            {/* Modal Body - Scrollable */}
            <div style={{
              flex: 1,
              overflowY: 'auto'
            }}>
              {/* Hero Image */}
              {selectedPost.image_url && (
                <div style={{
                  height: '60vh',
                  overflow: 'hidden',
                  backgroundColor: '#f3f4f6'
                }}>
                  <img
                    src={`${selectedPost.image_url}`}
                    alt={selectedPost.title}
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              )}

              {/* Content */}
              <div style={{ padding: '2rem' }}>
                {/* Title and Category */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h1 style={{ 
                    fontSize: '2rem', 
                    fontWeight: '700',
                    color: '#222222',
                    marginBottom: '0.5rem',
                    margin: '0 0 0.5rem 0',
                    lineHeight: '1.2'
                  }}>
                    {selectedPost.title}
                  </h1>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      fontSize: '1rem',
                      color: '#717171',
                      fontWeight: '500'
                    }}>
                      By {selectedPost.owner?.username || `User ID: ${selectedPost.owner_id}`}
                    </span>
                    
                    {selectedPost.category && (
                      <>
                        <span style={{ color: '#ddd' }}>•</span>
                        <span style={{
                          backgroundColor: '#f0f0f0',
                          color: '#222222',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {selectedPost.category.name}
                        </span>
                      </>
                    )}
                    
                    <span style={{ color: '#ddd' }}>•</span>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#717171'
                    }}>
                      {new Date(selectedPost.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{
                  height: '1px',
                  backgroundColor: '#e5e7eb',
                  marginBottom: '1.5rem'
                }}></div>

                {/* Content */}
                <div style={{
                  lineHeight: '1.7',
                  color: '#484848',
                  fontSize: '1.1rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {selectedPost.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blog;