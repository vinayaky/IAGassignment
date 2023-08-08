import { useState, useRef } from "react";
import axios from 'axios';
import '../App.css';
const DragDropFiles = () => {
  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef();

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    console.log(event.dataTransfer.files)
    setFiles(event.dataTransfer.files[0])
  };
  
  // send files to the server // learn from my other video
  const handleUpload = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('video', files);

    try {
      await axios.post('http://localhost:5000/upload', formData);
      // Display captions and allow video download
    } catch (error) {
      console.error('Error uploading video:', error);
    } finally {
      setLoading(false);
    }
  };

  if (files) return (
    <div className="uploads">
        <ul>
            {console.log(files)}
            <li >{files.name}</li>
        </ul>
        <div className="actions">
            <button onClick={() => setFiles(null)}>Cancel</button>
            <button onClick={handleUpload}>Upload</button>
            {loading && <p>Processing...</p>}
        </div>
    </div>
  )

  return (
    <>
        <div 
            className="dropzone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
          <h1>Drag and Drop Files to Upload</h1>
          <h1>Or</h1>
          <input 
            type="file"
            onChange={(event) => setFiles(event.target.files[0])}
            hidden
            accept="video/*"
            ref={inputRef}
          />
          <button onClick={() => inputRef.current.click()}>Select Files</button>
        </div>
    </>
  );
};

export default DragDropFiles;