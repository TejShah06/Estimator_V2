import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MainLayout({children}){

return(

<div className="bg-slate-950 text-white min-h-screen flex flex-col">

<Navbar/>

<div className="flex-grow">

{children}

</div>

<Footer/>

</div>

)

}