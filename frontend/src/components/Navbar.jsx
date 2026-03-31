import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {

const navigate = useNavigate();
const [loggedIn,setLoggedIn] = useState(false);

useEffect(()=>{
const token = localStorage.getItem("token");
setLoggedIn(!!token);
},[])

const logout = ()=>{

localStorage.removeItem("token");

alert("Logged out");

navigate("/");
window.location.reload();

}

return(

<nav className="flex justify-between items-center px-10 py-6 backdrop-blur-md bg-slate-900/60 sticky top-0 z-40 border-b border-slate-800">

<h1 className="text-2xl font-bold tracking-wide">
<span className="text-cyan-400">AI</span> Smart Estimator
</h1>

<div className="flex gap-8 text-gray-300">

<Link to="/" className="hover:text-cyan-400">
Home
</Link>

<Link to="/calculator" className="hover:text-cyan-400">
Calculator
</Link>

<Link to="/dashboard" className="hover:text-cyan-400">
Dashboard
</Link>

</div>

{loggedIn ? (

<Button
onClick={logout}
className="bg-red-500 hover:bg-red-600"
>
Logout
</Button>

) : (

<Button
onClick={()=>navigate("/login")}
className="bg-cyan-500 hover:bg-cyan-600"
>
Login
</Button>

)}

</nav>

)

}