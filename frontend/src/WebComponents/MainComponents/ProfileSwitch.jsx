import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import ProfilePage from './ProfilePage';  
import ProfileEdit from './ProfileEdit'; 
import NavBar from './NavBar'; 

const ProfileSwitch = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [updatedUser, setUpdatedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const decodeJWT = (token) => {
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload);
    return JSON.parse(decodedPayload);
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
                setIsLoading(false);
              } else {
                setIsLoading(false);
              }
            })
            .catch((error) => {
              console.error("Error fetching user data:", error);
              setIsLoading(false);
            });
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        setIsLoading(false);
      }
    }
  }, [isEditing]);

 
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isEditing ? (
    <ProfileEdit
      user={updatedUser}
      onCancel={() => setIsEditing(false)} 
    />
  ) : (
    <>
    <NavBar />
    <ProfilePage
      user={updatedUser}
      onEdit={() => setIsEditing(true)} 
    />
    </>
  );
};

export default ProfileSwitch;
