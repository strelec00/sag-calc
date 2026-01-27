import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import LineSagCalculator from "./components/LineSagCalculator.jsx";

export default function App() {
  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-black">
      <LineSagCalculator />
    </div>
  );
}