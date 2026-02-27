import { useState, useEffect, useRef } from "react";
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

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // NEW STATE
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // NEW STATE
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (window.google && googleBtnRef.current) {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleGoogleSuccess,
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: "100%",
      });
    }
  }, []);

  const handleChange = (e) => {
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
      const res = await axios.post(
        "http://localhost:3000/api/register",
        formData
      );
      console.log("Signed up:", res.data);
      setIsSignUp(false);
      setFormData({ name: "", email: "", password: "" });
      setConfirmPassword("");
    } catch (err) {
      console.error(err.response || err);
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(
        "http://localhost:3000/api/login",
        {
          email: formData.email,
          password: formData.password,
        },
      
      );
      Cookies.set("jwt", res.data.token, { expires: 7 });
      navigate("/homepage");
    } catch (err) {
      console.error("Login error:", err.response || err);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      const res = await axios.post("http://localhost:3000/api/google", {
        googleToken: response.credential,
      });
      Cookies.set("jwt", res.data.token, { expires: 7 });
      navigate("/homepage");
    } catch (err) {
      console.error("Google login failed:", err);
      setError("Google login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-violet-200 p-6">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-md shadow-xl rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-indigo-800">
            {isSignUp ? "Create your account" : "Welcome back"}
          </CardTitle>
          <CardDescription className="text-sm text-indigo-500">
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
                <Label htmlFor="name" className="text-indigo-700">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-indigo-700">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-indigo-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"} // TOGGLE TYPE
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-3 text-sm text-indigo-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <Label htmlFor="confirmPassword" className="text-indigo-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"} // TOGGLE TYPE
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute inset-y-0 right-3 text-sm text-indigo-600"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {isSignUp ? "Sign Up" : "Login"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <div ref={googleBtnRef} className="w-full flex justify-center" />

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
