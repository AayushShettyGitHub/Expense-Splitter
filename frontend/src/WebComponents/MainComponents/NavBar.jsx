import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Link, useNavigate } from 'react-router-dom';

function NavBar() {
  const navigate = useNavigate();
  const [updatedUser, setUpdatedUser] = useState(null);

  const decodeJWT = (token) => {
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload);
    return JSON.parse(decodedPayload);
  };

  const handleLogout = () => {
    Cookies.remove("jwt"); 
    console.log("User logged out successfully");
    navigate("/login"); 
  };

  useEffect(() => {
    const token = Cookies.get("jwt");

    if (token) {
      try {
        const decodedToken = decodeJWT(token);
        const userId = decodedToken?.userId;

        if (userId) {
          fetch(`http://localhost:8082/api/getUser?id=${userId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }, 
          })
            .then((response) => response.json())
            .then((data) => {
              if (data) {
                setUpdatedUser(data);
              }
            })
            .catch((error) => {
              console.error("Error fetching user data:", error);
            });
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  return (
    <div className="navbar bg-base-100 z-[50] w-full fixed top-0 shadow-md">
     
      <div className="drawer drawer-end">
        <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex items-center">
       
          <label
            htmlFor="my-drawer-4"
            className="drawer-button btn btn-ghost lg:hidden mr-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </label>
        
          <a className="btn btn-ghost text-xl">CoursiFY</a>

         
          <div className="navbar-center hidden lg:flex flex-1 justify-center">
            <ul className="menu menu-horizontal px-1">
              <li><button onClick={() => navigate("/homepage")}>Home</button></li>
              <li>
              <button onClick={() => navigate("/publish")}>Publish</button>
              </li>
              <li><button onClick={() => navigate("/generatepage")}>Generate</button></li>
            </ul>
          </div>
        </div>

      
        <div className="drawer-side z-[50]">
          <label htmlFor="my-drawer-4" className="drawer-overlay"></label>
          <ul className="menu bg-base-200 text-base-content w-80 p-4">
        
            <li><button onClick={() => navigate("/homepage")}>Home</button></li>
            <li><button onClick={() => navigate("/publish")}>Publish</button></li>
            <li><button onClick={() => navigate("/generatepage")}>Generate</button></li>
          </ul>
        </div>
      </div>

      <div className="flex-none gap-2">
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-10 rounded-full">
              <img
                alt="Tailwind CSS Navbar component"
                src={updatedUser?.profileImage || "/default-avatar.png"}
              />
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[50] mt-3 w-52 p-2 shadow"
          >
            <li>
              <Link to="/profilepage" className="justify-between">
                Profile
                <span className="badge">New</span>
              </Link>
            </li>
            <li><Link to="/viewcourse" className="justify-between">Courses</Link></li>
            <li>
              <button onClick={handleLogout} className="justify-between">
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default NavBar;
