import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  created_at: string;
  image_url?: string;
  category?: Category;
}

interface Bookmark {
  id: number;
  user_id: number;
  post_id: number;
  created_at: string;
  post: Post;  
}

interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  posts: Post[];
  bookmarks: Bookmark[];  
  username?: string;
}

const UserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState<string>(''); 
  const [activeTab, setActiveTab] = useState<'profile' | 'posts' | 'bookmarks'>('profile');
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    console.log("Logout button clicked in UserProfile.tsx");
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    console.log("Tokens removed from localStorage.");
    window.dispatchEvent(new Event('logoutEvent'));
    navigate("/");
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/auth/google/login");
        return;
      }
      try {
        const response = await api.get("/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
      } catch (err: any) {
        console.error("Error fetching user profile:", err);
        if (err.response?.status === 401) {
          setError("Unauthorized. Please log in again.");
          localStorage.removeItem("access_token");
          navigate("/auth/google/login");
        } else {
          setError("Failed to load user profile.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [navigate]);

  const handleUsernameUpdate = async () => {
    if (!newUsername.trim()) {
      alert("Please enter a username");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("You must be logged in to update username.");
      navigate("/login");
      return;
    }

    try {
      const response = await api.put(
        "/users/me/username",  
        { username: newUsername },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.status === 200) {
        alert("Username updated successfully!");
        setUser((prevUser) => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            username: newUsername
          };
        });
        setNewUsername('');
      }
    } catch (error: any) {
      console.error("Error updating username:", error);
      alert(`Failed to update username: ${error.response?.data?.detail || "Unknown error"}`);
    }
  };

  const handleDelete = async (postId: number) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("You must be logged in to delete a post.");
        navigate("/login");
        return;
      }
      try {
        const response = await api.delete(`/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 200) {
          alert("Post deleted successfully!");
          setUser((prevUser) => {
            if (!prevUser) return null;
            return {
              ...prevUser,
              posts: prevUser.posts.filter((post) => post.id !== postId),
            };
          });
        }
      } catch (error: any) {
        console.error("Error deleting post:", error);
        alert(`Failed to delete post: ${error.response?.data?.detail || "Unknown error"}`);
      }
    }
  };

  const handleEdit = (postId: number) => {
    navigate(`/edit-post/${postId}`);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button style={styles.primaryButton} onClick={() => navigate("/")}>
          Go Home
        </button>
      </div>
    );
  }

  if (!user) {
    return <div style={styles.loadingContainer}>No user data found.</div>;
  }

  return (
    <div style={styles.dashboard}>
      {/* Header */}
      <header style={isMobile ? styles.headerMobile : styles.header}>
        <div style={isMobile ? styles.headerContentMobile : styles.headerContent}>
          <h1 style={isMobile ? styles.logoMobile : styles.logo}>Dashboard</h1>
          <button onClick={handleLogout} style={isMobile ? styles.logoutButtonMobile : styles.logoutButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!isMobile && "Logout"}
          </button>
        </div>
      </header>

      {/* Mobile Tab Navigation */}
      {isMobile && (
        <div style={styles.mobileTabNav}>
          <button 
            style={activeTab === 'profile' ? styles.mobileTabActive : styles.mobileTab}
            onClick={() => setActiveTab('profile')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Profile
          </button>
          <button 
            style={activeTab === 'posts' ? styles.mobileTabActive : styles.mobileTab}
            onClick={() => setActiveTab('posts')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            Posts
          </button>
          <button 
            style={activeTab === 'bookmarks' ? styles.mobileTabActive : styles.mobileTab}
            onClick={() => setActiveTab('bookmarks')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            Bookmarks
          </button>
        </div>
      )}

      {/* Main Content */}
      <div style={isMobile ? styles.mainContentMobile : styles.mainContent}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside style={styles.sidebar}>
            <div style={styles.profileSection}>
              <div style={styles.avatar}>
                {user.username ? user.username.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <h3 style={styles.username}>{user.username || "User"}</h3>
              <p style={styles.email}>{user.email}</p>
              <div style={styles.badges}>
                {user.is_verified && <span style={styles.badge}>✓ Verified</span>}
                {user.is_active && <span style={styles.badgeActive}>Active</span>}
              </div>
            </div>

            <nav style={styles.nav}>
              <button 
                style={activeTab === 'profile' ? styles.navItemActive : styles.navItem}
                onClick={() => setActiveTab('profile')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Profile
              </button>
              <button 
                style={activeTab === 'posts' ? styles.navItemActive : styles.navItem}
                onClick={() => setActiveTab('posts')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                Your Posts ({user.posts.length})
              </button>
              <button 
                style={activeTab === 'bookmarks' ? styles.navItemActive : styles.navItem}
                onClick={() => setActiveTab('bookmarks')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                Bookmarks ({user.bookmarks.length})
              </button>
            </nav>
          </aside>
        )}

        {/* Content Area */}
        <main style={isMobile ? styles.contentAreaMobile : styles.contentArea}>
          {/* Mobile Profile Header */}
          {isMobile && activeTab === 'profile' && (
            <div style={styles.mobileProfileHeader}>
              <div style={styles.mobileAvatar}>
                {user.username ? user.username.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <h2 style={styles.mobileUsername}>{user.username || "User"}</h2>
              <p style={styles.mobileEmail}>{user.email}</p>
              <div style={styles.mobileBadges}>
                {user.is_verified && <span style={styles.badge}>✓ Verified</span>}
                {user.is_active && <span style={styles.badgeActive}>Active</span>}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div style={isMobile ? styles.profileContentMobile : styles.profileContent}>
              <div style={isMobile ? styles.cardMobile : styles.card}>
                <h2 style={styles.cardTitle}>Account Information</h2>
                <div style={isMobile ? styles.infoGridMobile : styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <label>User ID</label>
                    <span>#{user.id}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <label>Email</label>
                    <span>{user.email}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <label>Username</label>
                    <span>{user.username || "Not set"}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <label>Status</label>
                    <span style={user.is_active ? styles.statusActive : styles.statusInactive}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div style={isMobile ? styles.cardMobile : styles.card}>
                <h2 style={styles.cardTitle}>Update Username</h2>
                <div style={isMobile ? styles.updateSectionMobile : styles.updateSection}>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username"
                    style={isMobile ? styles.inputMobile : styles.input}
                  />
                  <button onClick={handleUsernameUpdate} style={styles.primaryButton}>
                    Update Username
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div style={isMobile ? styles.postsContentMobile : styles.postsContent}>
              <h2 style={isMobile ? styles.sectionTitleMobile : styles.sectionTitle}>Your Posts</h2>
              {user.posts.length > 0 ? (
                <div style={isMobile ? styles.postsGridMobile : styles.postsGrid}>
                  {user.posts.map((post) => (
                    <div key={post.id} style={isMobile ? styles.postCardMobile : styles.postCard}>
                      {post.image_url && (
                        <img
                          src={`${import.meta.env.VITE_API_URL}${post.image_url}`}
                          alt={post.title}
                          style={isMobile ? styles.postCardImageMobile : styles.postCardImage}
                        />
                      )}
                      <div style={isMobile ? styles.postCardContentMobile : styles.postCardContent}>
                        <h3 style={styles.postCardTitle}>{post.title}</h3>
                        <p style={styles.postCardText}>{post.content}</p>
                        <div style={styles.postCardMeta}>
                          <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                          {post.category && <span>Category: {post.category.name}</span>}
                        </div>
                        <div style={styles.postCardActions}>
                          <button style={styles.editButton} onClick={() => handleEdit(post.id)}>
                            Edit
                          </button>
                          <button style={styles.deleteButton} onClick={() => handleDelete(post.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                  <h3>No posts yet</h3>
                  <p>You haven't created any posts yet. Start sharing your thoughts!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div style={isMobile ? styles.bookmarksContentMobile : styles.bookmarksContent}>
              <h2 style={isMobile ? styles.sectionTitleMobile : styles.sectionTitle}>Bookmarked Posts</h2>
              {user.bookmarks.length > 0 ? (
                <div style={isMobile ? styles.postsGridMobile : styles.postsGrid}>
                  {user.bookmarks.map((bookmark) => (
                    <div key={bookmark.id} style={isMobile ? styles.postCardMobile : styles.postCard}>
                      {bookmark.post.image_url && (
                        <img
                          src={`${import.meta.env.VITE_API_URL}${bookmark.post.image_url}`}
                          alt={bookmark.post.title}
                          style={isMobile ? styles.postCardImageMobile : styles.postCardImage}
                        />
                      )}
                      <div style={isMobile ? styles.postCardContentMobile : styles.postCardContent}>
                        <h3 style={styles.postCardTitle}>{bookmark.post.title}</h3>
                        <p style={styles.postCardText}>{bookmark.post.content}</p>
                        <div style={styles.postCardMeta}>
                          <span>Created: {new Date(bookmark.post.created_at).toLocaleDateString()}</span>
                          {bookmark.post.category && <span>Category: {bookmark.post.category.name}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                  <h3>No bookmarks yet</h3>
                  <p>You haven't bookmarked any posts yet. Save interesting posts to read later!</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserProfile;

const styles = {
  dashboard: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    fontFamily: 'Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e0e0e0',
    padding: '16px 24px',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  headerMobile: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e0e0e0',
    padding: '12px 16px',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  headerContentMobile: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#3a97e3',
    margin: 0,
  },
  logoMobile: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#3a97e3',
    margin: 0,
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    transition: 'all 0.2s ease',
  },
  logoutButtonMobile: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    backgroundColor: 'transparent',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    transition: 'all 0.2s ease',
    minWidth: '40px',
    minHeight: '40px',
  },
  mobileTabNav: {
    display: 'flex',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e0e0e0',
    position: 'sticky' as const,
    top: '60px',
    zIndex: 99,
  },
  mobileTab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    padding: '12px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    color: '#666',
    transition: 'all 0.2s ease',
  },
  mobileTabActive: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    padding: '12px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid #3a97e3',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    color: '#3a97e3',
    transition: 'all 0.2s ease',
  },
  mainContent: {
    display: 'flex',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    gap: '24px',
  },
  mainContentMobile: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '16px',
    paddingBottom: '80px',
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    height: 'fit-content',
    position: 'sticky' as const,
    top: '100px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
  profileSection: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  mobileProfileHeader: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '16px',
    textAlign: 'center' as const,
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#3a97e3',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: '600',
    margin: '0 auto 16px',
  },
  mobileAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#3a97e3',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: '600',
    margin: '0 auto 16px',
  },
  username: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 8px',
  },
  mobileUsername: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 8px',
  },
  email: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 16px',
  },
  mobileEmail: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 16px',
  },
  badges: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  mobileBadges: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  badge: {
    padding: '4px 8px',
    backgroundColor: '#00a699',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  badgeActive: {
    padding: '4px 8px',
    backgroundColor: '#3a97e3',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    color: '#666',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
  },
  navItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#3a97e3',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    color: 'white',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
  },
  contentArea: {
    flex: 1,
  },
  contentAreaMobile: {
    flex: 1,
  },
  profileContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  profileContentMobile: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
  cardMobile: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 20px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  infoGridMobile: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  updateSection: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  updateSectionMobile: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    minWidth: '200px',
    flex: 1,
  },
  inputMobile: {
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    width: '100%',
  },
  primaryButton: {
    padding: '12px 24px',
    backgroundColor: '#3a97e3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 24px',
  },
  sectionTitleMobile: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 16px',
  },
  postsContent: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
  postsContentMobile: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
  bookmarksContent: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
  bookmarksContentMobile: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
  postsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  postsGridMobile: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  postCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e0e0e0',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  postCardMobile: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e0e0e0',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
  },
  postCardImage: {
    width: '100%',
    height: '180px',
    objectFit: 'cover' as const,
  },
  postCardImageMobile: {
    width: '100%',
    height: '200px',
    objectFit: 'cover' as const,
  },
  postCardContent: {
    padding: '16px',
  },
  postCardContentMobile: {
    padding: '16px',
  },
  postCardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 8px',
  },
  postCardText: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
    margin: '0 0 12px',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  postCardMeta: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    fontSize: '12px',
    color: '#999',
    marginBottom: '12px',
  },
  postCardActions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: '#00a699',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#ff5a5f',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#999',
  },
  statusActive: {
    color: '#00a699',
    fontWeight: '500',
  },
  statusInactive: {
    color: '#ff5a5f',
    fontWeight: '500',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e0e0e0',
    borderTop: '4px solid #3a97e3',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    textAlign: 'center' as const,
    padding: '20px',
  }};