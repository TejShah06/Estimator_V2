import { useState } from "react";
import API from "../../services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Login() {

  const navigate = useNavigate();

  const [identifier,setIdentifier] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");

  const handleLogin = async () => {

    try{

      const res = await API.post("/auth/login",{

        identifier,
        password

      });

      localStorage.setItem("token",res.data.access_token);

      navigate("/");

    }catch(err){
      console.error(err);
      setError("Invalid email/username or password");

    }

  };

  return(

<div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black">

<motion.div
initial={{opacity:0,scale:0.8}}
animate={{opacity:1,scale:1}}
transition={{duration:0.5}}
>

<Card className="w-[400px] bg-gray-900 border-gray-700 shadow-2xl">

<CardContent className="p-8 space-y-5">

<h2 className="text-3xl text-white text-center font-bold">
Login
</h2>

{error && (
<p className="text-red-400 text-center text-sm">
{error}
</p>
)}

<Input
className="text-white bg-gray-800 border-gray-700 placeholder-gray-400"
placeholder="Email or Username"
value={identifier}
onChange={(e)=>setIdentifier(e.target.value)}
/>

<Input
type="password"
className="text-white bg-gray-800 border-gray-700 placeholder-gray-400"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
/>

<Button
className="w-full bg-blue-600 hover:bg-blue-700"
onClick={handleLogin}
>
Login
</Button>

<p className="text-gray-400 text-sm text-center">

Don't have an account?{" "}

<span
className="text-blue-400 cursor-pointer hover:underline"
onClick={()=>navigate("/register")}
>

Register

</span>

</p>
<p
className="text-sm text-cyan-400 cursor-pointer mt-2"
onClick={()=>navigate("/forgot-password")}
>
Forgot Password?
</p>

</CardContent>

</Card>

</motion.div>

</div>

  );
}