import { useNavigate } from "react-router-dom";
import HeroImage from "../../assets/HeroImage.png";
function Hero() {
  const navigate = useNavigate(); 

  return (
    <div className="hero bg-base-200 min-h-screen">
      <div className="hero-content flex-col lg:flex-row-reverse">
        <img
          src={HeroImage}
          className="max-w-sm rounded-lg shadow-2xl"
          alt=""
        />
        <div>
          <h1 className="text-5xl font-bold">Welcome Curious Learner!</h1>
          <p className="py-6">
            Welcome to Coursify lets get started with your course generation and explore the infinite possibilities to learn using the power of AI.

          </p>
          <button className="btn btn-primary" onClick={() => navigate("/generatepage")}>
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

export default Hero;
