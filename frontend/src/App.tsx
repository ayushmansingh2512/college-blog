
// App.tsx (Updated)
import { Route, Routes } from "react-router-dom"
import Blog from "./components/Blog"
import AuthCallBack from "./components/AuthCallBack"
import UserProfile from "./components/UserProfile"
import Signup from "./components/Signup"
import Login from "./components/Login"
import CreatePost from "./components/CreatePost"
import EditPost from "./components/EditPost"
import CategoryManagement from "./components/CategoryManagement"
import Resources from "./components/resources"
import CreateResource from "./components/CreateResource"
import Clubs from "./components/club"
import CreateClub from "./components/CreateClub"
import Navbar from "./components/Navbar"
import ResourceCategoryManagement from "./components/ResourceCategoryManagement"
import ClubCategoryManagement from "./components/ClubCategoryManagement"
import Mobnav from "./components/MobNav"

const App = () => {
  return (
    <div>
      <Navbar />
      <Mobnav/>
      <Routes>
        <Route path="/" element={<Blog/>}/>
        <Route path="/auth/google/callback" element={<AuthCallBack/>} />
        <Route path="/profile" element={<UserProfile/>} />
        <Route path="/signup" element={<Signup />} /> 
        <Route path="/login" element={<Login />} />  
        <Route path="/create-post" element={<CreatePost />} />  
        <Route path="/edit-post/:postId" element={<EditPost />} />
        <Route path="/categories" element={<CategoryManagement />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/create-resource" element={<CreateResource />} />
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/create-club" element={<CreateClub />} />
        <Route path="/resource-categories" element={<ResourceCategoryManagement />} />
        <Route path="/club-categories" element={<ClubCategoryManagement />} />
      </Routes>
    </div>
  )
}

export default App