import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 
import Cookies from "js-cookie"; 

function SignIn({ toggleAuthMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(""); 

    try {
     console.log(email,password)
      const response = await axios.post(
        "http://localhost:8082/auth/login", 
        { email, password },
        { withCredentials: true } 
      );

      console.log("Login successful:", response.data);
      Cookies.set("jwt", response.data.token, { expires: 7 }); 
     
      console.log("JWT Cookie after setting:", Cookies.get("jwt"));
      navigate("/homepage");
    } catch (error) {
     
      const errorMessage = error.response?.data?.message || error.message || "An error occurred. Please try again.";
      console.error("Error during login:", errorMessage);
      setError(errorMessage);
    }
  };

  return (
    <div className="hero bg-base-200 min-h-screen">
      <div className="hero-content flex-col lg:flex-row-reverse">
        <div className="text-center lg:text-left">
          <h1 className="text-5xl font-bold px-20">Login now!</h1>
          <p className="py-6 px-16 text-lg max-w-45">
           Login to your account and start generating courses with ease.
            </p>
        </div>
        <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
          <form className="card-body" onSubmit={handleSignIn}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="email"
                className="input input-bordered" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="password"
                className="input input-bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}
            <div className="form-control mt-6">
              <button type="submit" className="btn btn-primary">
                Login
              </button>
            </div>
          </form>
          <button className="btn btn-link mt-4" onClick={toggleAuthMode}>
            Don't have an account? Sign Up
          </button>
          <button
  className="btn btn-link text-sm mt-2"
  onClick={() => navigate("/forgot-password")}
>
  Forgot Password?
</button>

        </div>
      </div>
    </div>
  );
}

export default SignIn;
