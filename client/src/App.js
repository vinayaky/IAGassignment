import React from 'react';
import './App.css';
import DragDropFiles from "./components/dropzone";

function App() {
  return (
    <div className="App">
      <header className="App-header">
      <div className='container'>
        <h1 className='title text-3xl font-bold'>Upload Files</h1>
        <DragDropFiles className='p-16 mt-10 border border-neutral-200' />
      </div>
      </header>
    </div>
  );
}

export default App;

