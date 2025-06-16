import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ForgotPass() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email"); 
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8082/auth/forgot-password", { email });
      setMessage(res.data.message);
      setStep("otp");
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8082/auth/verify-otp", { email, otp });
      setMessage(res.data.message);
      setError("");
      
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP");
    }
  };

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="card w-full max-w-sm bg-base-100 shadow-2xl p-5">
        <h2 className="text-2xl font-bold text-center mb-4">Forgot Password</h2>

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              className="input input-bordered w-full mb-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn btn-primary w-full" type="submit">
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpVerify}>
            <input
              type="text"
              placeholder="Enter OTP"
              className="input input-bordered w-full mb-3"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <button className="btn btn-success w-full" type="submit">
              Verify OTP
            </button>
          </form>
        )}

        {message && <p className="text-green-500 text-sm mt-3">{message}</p>}
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <button onClick={() => navigate("/signin")} className="btn btn-link mt-4 text-sm">
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPass;
