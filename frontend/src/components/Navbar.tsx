import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import Lottie from "lottie-react";


const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const homeLottieRef = useRef<any>(null);
  const resourcesLottieRef = useRef<any>(null);
  const clubLottieRef = useRef<any>(null);
  const profileLottieRef = useRef<any>(null);
  const location = useLocation();

  const [homeAnimation, setHomeAnimation] = useState<any>(null);
  const [resourcesAnimation, setResourcesAnimation] = useState<any>(null);
  const [clubAnimation, setClubAnimation] = useState<any>(null);
  const [profileAnimation, setProfileAnimation] = useState<any>(null);

  useEffect(() => {
    const fetchAnimations = async () => {
      try {
        const [homeRes, resourcesRes, clubRes, profileRes] = await Promise.all([
          fetch("/home.json"),
          fetch("/resources.json"),
          fetch("/club.json"),
          fetch("/profile.json"),
        ]);
        const homeData = await homeRes.json();
        const resourcesData = await resourcesRes.json();
        const clubData = await clubRes.json();
        const profileData = await profileRes.json();
        setHomeAnimation(homeData);
        setResourcesAnimation(resourcesData);
        setClubAnimation(clubData);
        setProfileAnimation(profileData);
      } catch (error) {
        console.error("Error fetching Lottie animations:", error);
      }
    };
    fetchAnimations();
  }, []);

  // Check login status on component mount and listen for login events
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem("access_token");
      setIsLoggedIn(!!token);
    };

    checkLoginStatus(); // Initial check

    window.addEventListener("loginEvent", checkLoginStatus);
    window.addEventListener("logoutEvent", checkLoginStatus);

    return () => {
      window.removeEventListener("loginEvent", checkLoginStatus);
      window.removeEventListener("logoutEvent", checkLoginStatus);
    };
  }, []);

  // Close dropdown when clicking outside (only needed when not logged in)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  

  

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleNavClick = (ref: React.RefObject<any>) => {
    ref.current?.goToAndPlay(0, true);
  };

  return (
    <nav
      style={{
        backgroundColor: "#f6f5f5",
        padding: "1rem",
        color: "black",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
       className="desktop-nav"
    >
      <style>{`
    .desktop-nav {
      display: flex;
    }
    
    @media (max-width: 768px) {
      .desktop-nav {
        display: none !important;
      }
    }
  `}</style>
      {/* Left side - Navigation Links */}
      <Link
        to="/"
        style={{
          color: "#3a97e3",
          textDecoration: "None",
          fontFamily: "rejoy",
          fontSize: "32px",
        }}
      >
        UNIBlog
      </Link>
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <Link
          to="/"
          onClick={() => handleNavClick(homeLottieRef)}
          style={{
            color: "Gray",
            textDecoration: "none",
            marginRight:"12px",
            
 
             
            transition: "background-color 0.3s ease",
            display: "flex",
            alignItems: "center",
          }}
        >
          {homeAnimation && (
            <Lottie
              lottieRef={homeLottieRef}
              animationData={homeAnimation}
              loop={false}
              autoplay={false}
              style={{ width: 60, height: 60 }}
            />
          )}
          Home
        </Link>
        <Link
          to="/resources"
          onClick={() => handleNavClick(resourcesLottieRef)}
          style={{
            color: "gray",
            textDecoration: "none",
          
            display: "flex",
            alignItems: "center",
          }}
        >
          {resourcesAnimation && (
            <Lottie
              lottieRef={resourcesLottieRef}
              animationData={resourcesAnimation}
              loop={false}
              autoplay={false}
              style={{ width: 50, height: 50 }}
            />
          )}
          Resources
        </Link>
        <Link
          to="/clubs"
          onClick={() => handleNavClick(clubLottieRef)}
          className={
            location.pathname === "/" ? "nav-link active" : "nav-link"
          }
          style={{
            color: "gray",
            textDecoration: "none",
          
        
           
            display: "flex",
            alignItems: "center",
          }}
    
        >
          {clubAnimation && (
            <Lottie
              lottieRef={clubLottieRef}
              animationData={clubAnimation}
              loop={false}
              autoplay={false}
              style={{ width: 50, height: 50 }}
            />
          )}
          Clubs
        </Link>
      </div>

      {/* Right side - Auth Section */}
      <div style={{ position: "relative" }} ref={dropdownRef}>
        {isLoggedIn ? (
          <Link
            to="/profile"
            onClick={() => handleNavClick(profileLottieRef)}
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              overflow: "hidden",
              backgroundColor: "transparent",
            }}
          >
            {profileAnimation && (
              <Lottie
                lottieRef={profileLottieRef}
                animationData={profileAnimation}
                loop={false}
                autoplay={false}
                style={{ width: 50, height: 50 }}
              />
            )}
          </Link>
        ) : (
          <>
            <button
              onClick={toggleDropdown}
              style={{
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                padding: "0 1.2rem",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
                transition: "background-color 0.3s ease",
                display: "flex",
                alignItems: "center",
                height:"45px",
                width:"45px",
                justifyContent:"center",
                marginRight:"10px"
              
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = " #c2bcbc ")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "  #c2bcbc88")
              }
            >
              <img className="burger" src="/burger.svg" alt="" />
              <span
                style={{
                  fontSize: "0.8rem",
                  transform: isDropdownOpen
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              >
            
              </span>
            </button>

            {/* Dropdown Menu for Not Logged In */}
            {isDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: "0",
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                  minWidth: "240px",
                  marginTop: "0.5rem",
                  overflow: "hidden",
                  gap:"10px", 
                  height:"280px",
                  display:"flex",
                  flexDirection:"column",
                  justifyContent:"space-around",
                  alignItems:"center"
                }}
              >
                <Link
                  to="/login"
                  style={{
                    display: "block",
                    padding: "0.75rem 1rem",
                    color: "#333",
                    textDecoration: "none",
                    transition: "background-color 0.3s ease",
                   
                    fontSize:"20px",
                    fontWeight:"bold",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8f9fa")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                  onClick={() => setIsDropdownOpen(false)}
                >
                   Login
                </Link>
                <Link
                  to="/signup"
                  style={{
                    display: "block",
                    padding: "0.75rem 1rem",
                    color: "#333",
                    textDecoration: "none",
                    transition: "background-color 0.3s ease",
                  
                     fontSize:"20px",
                    fontWeight:"bold",

                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8f9fa")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                  onClick={() => setIsDropdownOpen(false)}
                >
               Sign Up
                </Link>
                {/* Login with Google */}
                 <button
                  onClick={handleGoogleLogin}
                  style={{
                    
                    display: "block",
                    width: "100%",
                    padding: "0.75rem 1rem",
                    margin:"10px",
                    
                    color: "#ffffff",
                    textAlign:"center",
                    border: "none",
                     
                    cursor: "pointer",
                    transition: "background-color 0.3s ease",
                   
                    backgroundColor: "#5a5353",
                    fontSize:"20px",
                    fontWeight:"bold",
                  }}
                 
                   
                >
                Login with Google
                </button> 
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;