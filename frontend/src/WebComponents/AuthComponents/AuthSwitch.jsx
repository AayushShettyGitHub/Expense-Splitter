import SignUp from './SignUp'
import SignIn from './SignIn'
import { useState } from 'react'

function AuthSwitch() {
  const [isSigningIn, setIsSigningIn] = useState(true)

  const toggleAuthMode = () => {
    setIsSigningIn(!isSigningIn);
  };
  return (
    <div>
    {isSigningIn ? (
      <SignIn toggleAuthMode={toggleAuthMode} />
    ) : (
      <SignUp toggleAuthMode={toggleAuthMode} />
    )}
  </div>
  )
}
export default AuthSwitch