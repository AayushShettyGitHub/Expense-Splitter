import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api"; // Assuming '@/lib/api' provides the 'api' instance

function ResetPass() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      // The original code already uses 'api.post'.
      // The instruction implies ensuring 'api' is from '@/lib/api'.
      const res = await api.post("/reset-password", {
        email,
        newPassword,
      });
      setMessage(res.data.message);
      setTimeout(() => navigate("/signin"), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="card w-full max-w-sm bg-base-100 shadow-2xl p-5">
        <h2 className="text-2xl font-bold text-center mb-4">Reset Password</h2>
        <form onSubmit={handleReset}>
          <input
            type="email"
            placeholder="Email"
            className="input input-bordered w-full mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="New Password"
            className="input input-bordered w-full mb-3"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary w-full">
            Reset Password
          </button>
        </form>
        {message && <p className="text-green-500 text-sm mt-3">{message}</p>}
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>
    </div>
  );
}

export default ResetPass;
