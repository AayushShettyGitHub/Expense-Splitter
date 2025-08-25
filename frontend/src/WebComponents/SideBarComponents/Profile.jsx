import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    nationality: "",
    address: "",
    phone: "",
    interest: "",
    profession: "",
  });
  const [profileImage, setProfileImage] = useState(null);

  axios.defaults.withCredentials = true;

  useEffect(() => {
    axios
      .get("http://localhost:3000/auth/getUser", { withCredentials: true })
      .then((res) => {
        setUser(res.data);
        setFormData({
          name: res.data.name || "",
          description: res.data.description || "",
          nationality: res.data.nationality || "",
          address: res.data.address || "",
          phone: res.data.phone || "",
          interest: res.data.interest || "",
          profession: res.data.profession || "",
        });
      })
      .catch((err) => console.error("Error fetching user:", err));
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setProfileImage(e.target.files[0]);
  };

  const handleSave = () => {
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });
    if (profileImage) {
      data.append("profileImage", profileImage);
    }

    axios
      .put("http://localhost:3000/auth/update", data, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        setUser(res.data.user); // backend sends updated user inside { user: ... }
        setEditing(false);
      })
      .catch((err) => console.error("Error updating profile:", err));
  };

  if (!user) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="flex justify-center mt-10">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardHeader>
          <h2 className="text-xl font-bold">Profile</h2>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              {user.profileImage && (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover mb-3"
                />
              )}
              <div>
                <Label>Upload Profile Image</Label>
                <Input type="file" accept="image/*" onChange={handleFileChange} />
              </div>
              <div>
                <Label>Name</Label>
                <Input name="name" value={formData.name} onChange={handleChange} />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label>Nationality</Label>
                <Input
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label>Interest</Label>
                <Input
                  name="interest"
                  value={formData.interest}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label>Profession</Label>
                <Input
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save</Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-center">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover mx-auto"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto flex items-center justify-center">
                  <span className="text-gray-500 text-sm">No Image</span>
                </div>
              )}
              <p><span className="font-semibold">Name:</span> {user.name}</p>
              <p><span className="font-semibold">Email:</span> {user.email}</p>
              <p><span className="font-semibold">Description:</span> {user.description || "-"}</p>
              <p><span className="font-semibold">Nationality:</span> {user.nationality || "-"}</p>
              <p><span className="font-semibold">Address:</span> {user.address || "-"}</p>
              <p><span className="font-semibold">Phone:</span> {user.phone || "-"}</p>
              <p><span className="font-semibold">Interest:</span> {user.interest || "-"}</p>
              <p><span className="font-semibold">Profession:</span> {user.profession || "-"}</p>
              <Button onClick={() => setEditing(true)}>Edit Profile</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
