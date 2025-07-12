import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";


const Mobnav = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const homeLottieRef = useRef<any>(null);
  const resourcesLottieRef = useRef<any>(null);
  const clubLottieRef = useRef<any>(null);
  const profileLottieRef = useRef<any>(null);
  

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

  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem("access_token");
      setIsLoggedIn(!!token);
    };

    checkLoginStatus();

    window.addEventListener("loginEvent", checkLoginStatus);
    window.addEventListener("logoutEvent", checkLoginStatus);

    return () => {
      window.removeEventListener("loginEvent", checkLoginStatus);
      window.removeEventListener("logoutEvent", checkLoginStatus);
    };
  }, []);

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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return (
    <nav
      style={{
        backgroundColor: "#f6f5f5",
        padding: "1rem 0.5rem",
        color: "black",
        position: "fixed",
        bottom: "0",
        left: "0",
        right: "0",
        zIndex: "1000",
        display: isMobile ? "block" : "none",
      }}
      className="mobile-nav"
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          marginBottom: isLoggedIn ? "0" : "10px",
        }}
      >
        <Link
          to="/"
          onClick={() => handleNavClick(homeLottieRef)}
          style={{
            color: "Gray",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
          }}
        >
          {homeAnimation && (
            <Lottie
              lottieRef={homeLottieRef}
              animationData={homeAnimation}
              loop={false}
              autoplay={false}
              style={{ width: 40, height: 40 }}
            />
          )}
          <span style={{ fontSize: "12px", fontWeight: "500" }}>Home</span>
        </Link>

        <Link
          to="/resources"
          onClick={() => handleNavClick(resourcesLottieRef)}
          style={{
            color: "gray",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
          }}
        >
          {resourcesAnimation && (
            <Lottie
              lottieRef={resourcesLottieRef}
              animationData={resourcesAnimation}
              loop={false}
              autoplay={false}
              style={{ width: 40, height: 40 }}
            />
          )}
          <span style={{ fontSize: "12px", fontWeight: "500" }}>Resources</span>
        </Link>

        <Link
          to="/clubs"
          onClick={() => handleNavClick(clubLottieRef)}
          style={{
            color: "gray",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
          }}
        >
          {clubAnimation && (
            <Lottie
              lottieRef={clubLottieRef}
              animationData={clubAnimation}
              loop={false}
              autoplay={false}
              style={{ width: 40, height: 40 }}
            />
          )}
          <span style={{ fontSize: "12px", fontWeight: "500" }}>Clubs</span>
        </Link>

        {isLoggedIn ? (
          <Link
            to="/profile"
            onClick={() => handleNavClick(profileLottieRef)}
            style={{
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
            }}
          >
            {profileAnimation && (
              <Lottie
                lottieRef={profileLottieRef}
                animationData={profileAnimation}
                loop={false}
                autoplay={false}
                style={{ width: 40, height: 40 }}
              />
            )}
            <span style={{ fontSize: "12px", fontWeight: "500", color: "gray" }}>Profile</span>
          </Link>
        ) : (
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              style={{
                backgroundColor: "#c2bcbc88",
                color: "white",
                border: "none",
                padding: "8px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
                transition: "background-color 0.3s ease",
                display: "flex",
                alignItems: "center",
                height: "40px",
                width: "40px",
                justifyContent: "center",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#c2bcbc")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#c2bcbc88")
              }
            >
              <img
                className="burger"
                src="/burger.svg"
                alt=""
                style={{ width: "20px", height: "20px" }}
              />
            </button>
            <span style={{ fontSize: "12px", fontWeight: "500", color: "gray", marginTop: "2px" }}>
              Menu
            </span>
            {isDropdownOpen && (
              <div
                style={{
                  position: "fixed", // Changed from absolute to fixed
                  bottom: "70px", // Position above the navbar
                  right: "10px",
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  zIndex: 1001, // Higher z-index
                  minWidth: "200px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  padding: "10px",
                }}
              >
                <Link
                  to="/login"
                  style={{
                    display: "block",
                    padding: "12px 16px",
                    color: "#333",
                    textDecoration: "none",
                    transition: "background-color 0.3s ease",
                    fontSize: "16px",
                    fontWeight: "bold",
                    textAlign: "center",
                    borderRadius: "8px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8f9fa")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                  onClick={() => {
                    console.log("Login link clicked");
                    setIsDropdownOpen(false);
                  }}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  style={{
                    display: "block",
                    padding: "12px 16px",
                    color: "#333",
                    textDecoration: "none",
                    transition: "background-color 0.3s ease",
                    fontSize: "16px",
                    fontWeight: "bold",
                    textAlign: "center",
                    borderRadius: "8px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8f9fa")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                  onClick={() => {
                    console.log("Signup link clicked");
                    setIsDropdownOpen(false);
                  }}
                >
                  Sign Up
                </Link>
                <a
                  