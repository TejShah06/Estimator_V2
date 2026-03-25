import { useState } from "react";
import API from "../../services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Register(){

const navigate = useNavigate();

//const [name,setName] = useState("");
const [email,setEmail] = useState("");
const [password,setPassword] = useState("");
const [username,setUsername] = useState("");
const [loading,setLoading] = useState(false);
const [error,setError] = useState("");

const handleRegister = async ()=>{

try{

setLoading(true);
setError("");

await API.post("/auth/register",{
  username,
  email,
  password
});
navigate("/login");

}catch(err){

if(err.response){
console.error(err.response.data);
setError(err.response.data.detail);
}else{
setError("Registration failed");
}

}finally{
setLoading(false);
}

};

return(

<div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black">

<motion.div
initial={{opacity:0,y:50}}
animate={{opacity:1,y:0}}
transition={{duration:0.5}}
>

<Card className="w-[400px] bg-gray-900 border-gray-700 shadow-2xl">

<CardContent className="p-8 space-y-5">

<h2 className="text-3xl text-white text-center font-bold">
Register
</h2>

{error && (
<p className="text-red-400 text-center text-sm">
{error}
</p>
)}

<Input
className="text-white bg-gray-800 border-gray-700 placeholder-gray-400"
placeholder="Username"
value={username}
onChange={(e)=>setUsername(e.target.value)}
/>

<Input
className="text-white bg-gray-800 border-gray-700 placeholder-gray-400"
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

<Input
type="password"
className="text-white bg-gray-800 border-gray-700 placeholder-gray-400"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
/>

<Button
className="w-full bg-purple-600 hover:bg-purple-700"
onClick={handleRegister}
disabled={loading}
>

{loading ? "Creating account..." : "Register"}

</Button>

<p className="text-gray-400 text-sm text-center">

Already have an account?{" "}

<span
className="text-purple-400 cursor-pointer hover:underline"
onClick={()=>navigate("/login")}
>

Sign In

</span>

</p>

</CardContent>

</Card>

</motion.div>

</div>

);

}