import React, { useState } from "react";
import axios from "axios";

const ProfileEdit = ({ user, onCancel }) => {
  const [formData, setFormData] = useState({
    profileImage: user?.profileImage || "",
    name: user?.name || "",
    age: user?.age || "",
    description: user?.description || "",
    nationality: user?.nationality || "",
    address: user?.address || "",
    phone: user?.phone || "",
    interest: user?.interest || "",
    profession: user?.profession || ""
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          profileImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        email: user?.email,
      };

      const response = await axios.post("http://localhost:8082/api/update", dataToSend, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 200) {
        alert("Profile updated successfully");
        onCancel();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-base-200 shadow-lg rounded-lg space-y-6">
      <div className="flex items-center space-x-4">
        <div className="avatar">
          <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
            <img src={formData.profileImage || "/default-avatar.png"} alt="Avatar Preview" className="object-cover" />
          </div>
        </div>
        <input
          type="file"
          accept="image/*"
          className="file-input file-input-primary file-input-sm"
          onChange={handleAvatarChange}
        />
      </div>

      {[
        { label: "Name", name: "name", type: "text" },
        { label: "Age", name: "age", type: "number" },
        { label: "Short Description", name: "description", type: "text" },
        { label: "Nationality", name: "nationality", type: "text" },
        { label: "Address", name: "address", type: "text" },
        { label: "Phone", name: "phone", type: "text" },
        { label: "Area of Interest", name: "interest", type: "text" },
        { label: "Current Profession", name: "profession", type: "text" },
      ].map((field) => (
        <div className="form-control" key={field.name}>
          <label className="label">
            <span className="label-text">{field.label}</span>
          </label>
          <input
            type={field.type}
            name={field.name}
            placeholder={`Enter your ${field.label.toLowerCase()}`}
            value={formData[field.name]}
            onChange={handleInputChange}
            className="input input-bordered input-primary w-full"
          />
        </div>
      ))}

      <div className="flex justify-end space-x-4">
        <button type="button" className="btn btn-outline btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={`btn btn-primary ${loading ? "loading" : ""}`}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

export default ProfileEdit;
