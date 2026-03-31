import { Link } from "react-router-dom";

export default function Footer(){

return(

<footer className="bg-slate-950 border-t border-slate-800 mt-20">

<div className="max-w-7xl mx-auto px-10 py-12 grid md:grid-cols-3 gap-10 text-gray-400">

<div>

<h2 className="text-xl font-bold text-white mb-4">
AI Smart Estimator 
</h2>

<p>
AI powered construction estimation platform for civil engineers.
</p>

</div>

<div>

<h3 className="font-semibold text-white mb-4">
Quick Links
</h3>

<div className="flex flex-col gap-2">

<Link to="/" className="hover:text-cyan-400">Home</Link>
<Link to="/calculator" className="hover:text-cyan-400">Calculator</Link>
<Link to="/history" className="hover:text-cyan-400">History</Link>

</div>

</div>

<div>

<h3 className="font-semibold text-white mb-4">
Contact
</h3>

<p>Email: support@aismartestimator.com</p>

</div>

</div>

<div className="text-center text-gray-500 pb-6">
© 2026 AI Smart Estimator
</div>

</footer>

)

}