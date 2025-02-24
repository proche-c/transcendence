import React from "react";
import { userState } from "react";

const App: React.FC = () => {
  const [message, setMessage] = useState<string>("Hello, World!");

  return (
	<div classname="flex flex-col items-center justify-center h-screen">
	<h1 classname="text-4xl font-bold">{message}</h1>
	<button
	  classname="px-4 py-2 mt-4 text-white bg-blue-500 rounded"
	  onClick={() => setMessage("Hello, React!")}
	>
	Click me!
	</button>
	</div>
	);
};
export default App;
