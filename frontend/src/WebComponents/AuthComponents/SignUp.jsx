import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();


  useEffect(() => {
    console.log("formData:", formData);
  }, [formData]);

  const handleChange = (e) => {
    console.log("handleChange fired:", e.target.name, e.target.value);
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    try {
      const res = await axios.post("/auth/register", formData);
      console.log("Signed up:", res.data);
      setIsSignUp(false);
    } catch (err) {
      console.error(err.response || err);
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    console.log("Submitting login:", formData.email, formData.password);
    try {
      const res = await axios.post(
        "/auth/login",
        { email: formData.email, password: formData.password },
        { withCredentials: true }
      );
      Cookies.set("jwt", res.data.token, { expires: 7 });
      navigate("/homepage");
    } catch (err) {
      console.error("Login error:", err.response || err);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-violet-200 p-6">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-md shadow-xl rounded-xl">
        <CardHeader>
          <CardTitle>{isSignUp ? "Create your account" : "Welcome back"}</CardTitle>
          <CardDescription>
            {isSignUp
              ? "Fill in your details to sign up"
              : "Enter your credentials to sign in"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-5"
            onSubmit={isSignUp ? handleSignUp : handleSignIn}
          >
            {isSignUp && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"             // ← must match formData key
                  value={formData.name}
                  onChange={handleChange} // ← firing?
                  placeholder="Jane Doe"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"              // ← also here
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"           // ← and here
                type="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {isSignUp && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {error && <p className="text-red-600">{error}</p>}

            <Button type="submit" className="w-full bg-indigo-600">
              {isSignUp ? "Sign Up" : "Login"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button variant="outline" className="w-full">
            {isSignUp ? "Sign up with Google" : "Login with Google"}
          </Button>
          <p className="text-center text-sm">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setError("");
                setIsSignUp((p) => !p);
              }}
              className="text-indigo-700 hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
